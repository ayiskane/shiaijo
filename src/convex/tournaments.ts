import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tournaments").collect();
  },
});

export const get = query({
  args: { id: v.id("tournaments") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    // Use .first() instead of .collect()[0] for efficiency
    return await ctx.db
      .query("tournaments")
      .withIndex("by_status", (q) => q.eq("status", "in_progress"))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    date: v.string(),
  },
  handler: async (ctx, { name, date }) => {
    return await ctx.db.insert("tournaments", {
      name,
      date,
      status: "setup",
      hanteiConfig: { round1: "M-M", round2: "K-M" },
      timerOptions: [60, 120, 180, 240, 300],
      defaultTimerDuration: 180,
      timerDisplayMode: "up",
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tournaments"),
    name: v.optional(v.string()),
    date: v.optional(v.string()),
    hanteiConfig: v.optional(v.object({
      round1: v.string(),
      round2: v.string(),
    })),
    timerOptions: v.optional(v.array(v.number())),
    defaultTimerDuration: v.optional(v.number()),
    timerDisplayMode: v.optional(v.union(v.literal("up"), v.literal("down"))),
  },
  handler: async (ctx, { id, ...updates }) => {
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const start = mutation({
  args: { id: v.id("tournaments") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { status: "in_progress" });
  },
});

export const complete = mutation({
  args: { id: v.id("tournaments") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { status: "completed" });
  },
});

export const remove = mutation({
  args: { id: v.id("tournaments") },
  handler: async (ctx, { id }) => {
    // Delete matches in chunks to avoid large reads/writes in one mutation
    let deletedMatches = 0;
    while (true) {
      const batch = await ctx.db
        .query("matches")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", id))
        .take(200);
      if (batch.length === 0) break;
      for (const match of batch) {
        await ctx.db.delete(match._id);
      }
      deletedMatches += batch.length;
    }
    
    // Delete participants in chunks
    let deletedParticipants = 0;
    while (true) {
      const batch = await ctx.db
        .query("participants")
        .withIndex("by_tournament", (q) => q.eq("tournamentId", id))
        .take(200);
      if (batch.length === 0) break;
      for (const participant of batch) {
        await ctx.db.delete(participant._id);
      }
      deletedParticipants += batch.length;
    }
    
    // Delete the tournament
    await ctx.db.delete(id);
    
    return { 
      deletedMatches, 
      deletedParticipants 
    };
  },
});

export const generateMatches = mutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, { tournamentId }) => {
    const tournament = await ctx.db.get(tournamentId);
    if (!tournament) throw new Error("Tournament not found");
    
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    
    const byGroup = new Map<string, typeof participants>();
    for (const p of participants) {
      const list = byGroup.get(p.groupId) || [];
      list.push(p);
      byGroup.set(p.groupId, list);
    }
    
    const groups = await ctx.db.query("groups").withIndex("by_order").collect();
    let orderIndex = 0;
    const now = Date.now();
    
    // Sort groups: hantei first (Court B), then regular (Court A)
    const sortedGroupIds: string[] = [];
    const hanteiGroups = groups.filter(g => byGroup.has(g.groupId) && g.isHantei);
    const regularGroups = groups.filter(g => byGroup.has(g.groupId) && !g.isHantei);
    
    // Interleave: hantei first (Court B), then regular (Court A)
    const maxLen = Math.max(hanteiGroups.length, regularGroups.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < hanteiGroups.length) sortedGroupIds.push(hanteiGroups[i].groupId);
      if (i < regularGroups.length) sortedGroupIds.push(regularGroups[i].groupId);
    }
    
    for (let groupIdx = 0; groupIdx < sortedGroupIds.length; groupIdx++) {
      const groupId = sortedGroupIds[groupIdx];
      const groupParticipants = byGroup.get(groupId);
      if (!groupParticipants || groupParticipants.length < 2) continue;
      
      const group = groups.find(g => g.groupId === groupId);
      const isHantei = group?.isHantei || false;
      const court = groupIdx % 2 === 0 ? "B" : "A";
      
      const playerIds = groupParticipants.map(p => p.memberId);
      
      // Generate round-robin matches with rest optimization
      const matchPairs = generateRoundRobinWithRest(playerIds);
      
      for (const pair of matchPairs) {
        // Skip byes generated for odd counts
        if (pair[0] === "BYE" || pair[1] === "BYE") continue;
        const player1Id = pair[0] as Id<"members">;
        const player2Id = pair[1] as Id<"members">;
        await ctx.db.insert("matches", {
          tournamentId,
          groupId,
          player1Id,
          player2Id,
          court: court as "A" | "B",
          status: "pending",
          player1Score: [],
          player2Score: [],
          player1ScoreTimes: [],
          player2ScoreTimes: [],
          player1Hansoku: 0,
          player2Hansoku: 0,
          matchType: isHantei ? "hantei" : "sanbon",
          timerDuration: isHantei ? 0 : tournament.defaultTimerDuration,
          round: 1,
          orderIndex: orderIndex++,
          isSuddenDeath: false,
          updatedAt: now,
        });
      }
    }
    
    return { matchCount: orderIndex };
  },
});

// Generate round-robin with rest optimization
type PlayerId = Id<"members"> | "BYE";

function generateRoundRobinWithRest(playerIds: Id<"members">[]): [PlayerId, PlayerId][] {
  if (playerIds.length < 2) return [];
  
  const players: PlayerId[] = [...playerIds];
  if (players.length % 2 !== 0) {
    players.push("BYE");
  }
  
  const n = players.length;
  const rounds: [PlayerId, PlayerId][][] = [];
  
  // Standard round-robin generation
  for (let round = 0; round < n - 1; round++) {
    const roundMatches: [PlayerId, PlayerId][] = [];
    for (let i = 0; i < n / 2; i++) {
      const p1 = players[i];
      const p2 = players[n - 1 - i];
      if (p1 !== "BYE" && p2 !== "BYE") {
        roundMatches.push([p1, p2]);
      }
    }
    rounds.push(roundMatches);
    const last = players.pop()!;
    players.splice(1, 0, last);
  }
  
  // Flatten and reorder for rest optimization
  const allMatches: [PlayerId, PlayerId][] = [];
  const lastPlayed: Map<PlayerId, number> = new Map();
  const flatMatches: [PlayerId, PlayerId][] = rounds.flat();
  const used = new Set<number>();
  
  while (allMatches.length < flatMatches.length) {
    let bestIdx = -1;
    let bestScore = -Infinity;
    
    for (let i = 0; i < flatMatches.length; i++) {
      if (used.has(i)) continue;
      
      const [p1, p2] = flatMatches[i];
      const p1Last = lastPlayed.get(p1) ?? -2;
      const p2Last = lastPlayed.get(p2) ?? -2;
      const matchIdx = allMatches.length;
      
      // Score based on rest time (higher is better)
      const restScore = Math.min(matchIdx - p1Last, matchIdx - p2Last);
      
      if (restScore > bestScore) {
        bestScore = restScore;
        bestIdx = i;
      }
    }
    
    if (bestIdx === -1) break;
    
    const [p1, p2] = flatMatches[bestIdx];
    allMatches.push([p1, p2]);
    lastPlayed.set(p1, allMatches.length - 1);
    lastPlayed.set(p2, allMatches.length - 1);
    used.add(bestIdx);
  }
  
  return allMatches;
}

export const refreshParticipants = mutation({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, { tournamentId }) => {
    const tournament = await ctx.db.get(tournamentId);
    if (!tournament) throw new Error("Tournament not found");
    
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    
    const existingMatches = await ctx.db
      .query("matches")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    
    const byGroup = new Map<string, typeof participants>();
    for (const p of participants) {
      const list = byGroup.get(p.groupId) || [];
      list.push(p);
      byGroup.set(p.groupId, list);
    }
    
    const groups = await ctx.db.query("groups").withIndex("by_order").collect();
    let addedCount = 0;
    const maxOrderIndex = existingMatches.length > 0 ? Math.max(...existingMatches.map(m => m.orderIndex)) : -1;
    let orderIndex = maxOrderIndex + 1;
    const now = Date.now();
    
    for (const [groupId, groupParticipants] of byGroup) {
      const group = groups.find(g => g.groupId === groupId);
      const isHantei = group?.isHantei || false;
      const groupIdx = groups.findIndex(g => g.groupId === groupId);
      const court = groupIdx % 2 === 0 ? "B" : "A";
      const playerIds = groupParticipants.map(p => p.memberId);
      
      const existingPairs = new Set(
        existingMatches
          .filter(m => m.groupId === groupId)
          .map(m => `${m.player1Id}-${m.player2Id}`)
      );
      
      for (let i = 0; i < playerIds.length; i++) {
        for (let j = i + 1; j < playerIds.length; j++) {
          const p1 = playerIds[i];
          const p2 = playerIds[j];
          const key1 = `${p1}-${p2}`;
          const key2 = `${p2}-${p1}`;
          
          if (!existingPairs.has(key1) && !existingPairs.has(key2)) {
            await ctx.db.insert("matches", {
              tournamentId,
              groupId,
              player1Id: p1,
              player2Id: p2,
              court: court as "A" | "B",
              status: "pending",
              player1Score: [],
              player2Score: [],
              player1ScoreTimes: [],
              player2ScoreTimes: [],
              player1Hansoku: 0,
              player2Hansoku: 0,
              matchType: isHantei ? "hantei" : "sanbon",
              timerDuration: isHantei ? 0 : tournament.defaultTimerDuration,
              round: 1,
              orderIndex: orderIndex++,
              isSuddenDeath: false,
              updatedAt: now,
            });
            addedCount++;
          }
        }
      }
    }
    
    return { addedCount };
  },
});

export const reset = mutation({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, { tournamentId }) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    
    const now = Date.now();
    let resetCount = 0;
    let deletedSuddenDeath = 0;
    for (const match of matches) {
      if (match.isSuddenDeath) {
        await ctx.db.delete(match._id);
        deletedSuddenDeath++;
        continue;
      }
      await ctx.db.patch(match._id, {
        status: "pending",
        player1Score: [],
        player2Score: [],
        player1ScoreTimes: [],
        player2ScoreTimes: [],
        player1Hansoku: 0,
        player2Hansoku: 0,
        winner: undefined,
        timerStartedAt: undefined,
        timerPausedAt: undefined,
        actualDuration: undefined,
        updatedAt: now,
      });
      resetCount++;
    }
    
    return { resetCount, deletedSuddenDeath };
  },
});

// Debug: Clear all tournaments, matches, and participants
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete matches first (references tournaments)
    const matches = await ctx.db.query("matches").collect();
    for (const match of matches) {
      await ctx.db.delete(match._id);
    }

    // Delete participants (references tournaments)
    const participants = await ctx.db.query("participants").collect();
    for (const participant of participants) {
      await ctx.db.delete(participant._id);
    }

    // Delete court state (references tournaments)
    const courtStates = await ctx.db.query("courtState").collect();
    for (const state of courtStates) {
      await ctx.db.delete(state._id);
    }

    // Finally delete tournaments
    const tournaments = await ctx.db.query("tournaments").collect();
    for (const tournament of tournaments) {
      await ctx.db.delete(tournament._id);
    }

    return { 
      deletedTournaments: tournaments.length,
      deletedMatches: matches.length,
      deletedParticipants: participants.length,
      deletedCourtStates: courtStates.length,
    };
  },
});
