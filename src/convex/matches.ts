import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Score type constants
export const SCORE_TYPES = {
  MEN: 1,
  KOTE: 2,
  DO: 3,
  TSUKI: 4,
  HANSOKU_POINT: 5,
  FORFEIT: 6,
} as const;

function getTotalPoints(scores: number[]): number {
  return scores.length;
}

function checkWinner(
  p1Scores: number[],
  p2Scores: number[],
  matchType: "sanbon" | "ippon" | "hantei"
): "player1" | "player2" | null {
  if (matchType === "hantei") return null; // Hantei matches are decided by judges
  const target = matchType === "sanbon" ? 2 : 1;
  if (getTotalPoints(p1Scores) >= target) return "player1";
  if (getTotalPoints(p2Scores) >= target) return "player2";
  return null;
}

function getElapsedSeconds(match: { timerStartedAt?: number; timerPausedAt?: number }, now = Date.now()): number {
  if (match.timerPausedAt !== undefined) return match.timerPausedAt;
  if (match.timerStartedAt !== undefined) {
    return Math.floor((now - match.timerStartedAt) / 1000);
  }
  return 0;
}

const LOCK_WINDOW_MS = 15_000;

function lockIsActive(match: any, now: number) {
  return (
    match.controlOwnerId &&
    typeof match.controlLockExpiresAt === "number" &&
    match.controlLockExpiresAt > now
  );
}

async function ensureControl(
  ctx: any,
  match: any,
  matchId: string,
  deviceId: string,
  now: number
) {
  const active = lockIsActive(match, now);
  if (active && match.controlOwnerId !== deviceId) {
    throw new Error("Court controls are locked by another facilitator");
  }
  if (!active || match.controlOwnerId !== deviceId) {
    await ctx.db.patch(matchId, {
      controlOwnerId: deviceId,
      controlLockExpiresAt: now + LOCK_WINDOW_MS,
      updatedAt: now,
    });
    match.controlOwnerId = deviceId;
    match.controlLockExpiresAt = now + LOCK_WINDOW_MS;
  } else {
    await ctx.db.patch(matchId, {
      controlLockExpiresAt: now + LOCK_WINDOW_MS,
      updatedAt: now,
    });
    match.controlLockExpiresAt = now + LOCK_WINDOW_MS;
  }
}

async function releaseControl(ctx: any, matchId: string) {
  await ctx.db.patch(matchId, {
    controlOwnerId: undefined,
    controlLockExpiresAt: undefined,
    updatedAt: Date.now(),
  });
}

export const getByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, { tournamentId }) => {
    return await ctx.db
      .query("matches")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
  },
});

export const getByCourt = query({
  args: { 
    tournamentId: v.id("tournaments"),
    court: v.union(v.literal("A"), v.literal("B"))
  },
  handler: async (ctx, { tournamentId, court }) => {
    // Use indexed queries instead of filtering all matches
    // Query 1: Get matches specifically for this court
    const courtMatches = await ctx.db
      .query("matches")
      .withIndex("by_tournament_court", (q) => 
        q.eq("tournamentId", tournamentId).eq("court", court)
      )
      .collect();
    
    // Query 2: Get shared matches (A+B)
    const sharedMatches = await ctx.db
      .query("matches")
      .withIndex("by_tournament_court", (q) => 
        q.eq("tournamentId", tournamentId).eq("court", "A+B")
      )
      .collect();
    
    // Combine and sort by orderIndex
    return [...courtMatches, ...sharedMatches].sort((a, b) => a.orderIndex - b.orderIndex);
  },
});

export const getActiveMatches = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, { tournamentId }) => {
    return await ctx.db
      .query("matches")
      .withIndex("by_tournament_status", (q) => 
        q.eq("tournamentId", tournamentId).eq("status", "in_progress")
      )
      .collect();
  },
});

// Set court assignment for all matches in a group
export const setGroupCourt = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    groupId: v.string(),
    court: v.union(v.literal("A"), v.literal("B"), v.literal("A+B")),
  },
  handler: async (ctx, { tournamentId, groupId, court }) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_tournament_group", (q) => 
        q.eq("tournamentId", tournamentId).eq("groupId", groupId)
      )
      .collect();
    
    const now = Date.now();
    for (const match of matches) {
      // Only update pending matches
      if (match.status === "pending") {
        await ctx.db.patch(match._id, { court, updatedAt: now });
      }
    }
    
    return { updatedCount: matches.filter(m => m.status === "pending").length };
  },
});

// Set match type for all matches in a group
export const setGroupMatchType = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    groupId: v.string(),
    matchType: v.union(v.literal("sanbon"), v.literal("ippon")),
  },
  handler: async (ctx, { tournamentId, groupId, matchType }) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_tournament_group", (q) => 
        q.eq("tournamentId", tournamentId).eq("groupId", groupId)
      )
      .collect();
    
    const now = Date.now();
    for (const match of matches) {
      // Only update pending matches
      if (match.status === "pending") {
        await ctx.db.patch(match._id, { matchType, updatedAt: now });
      }
    }
    
    return { updatedCount: matches.filter(m => m.status === "pending").length };
  },
});

// Set timer duration for all matches in a group
export const setGroupTimer = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    groupId: v.string(),
    timerDuration: v.number(),
  },
  handler: async (ctx, { tournamentId, groupId, timerDuration }) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_tournament_group", (q) => 
        q.eq("tournamentId", tournamentId).eq("groupId", groupId)
      )
      .collect();
    
    const now = Date.now();
    for (const match of matches) {
      // Only update pending matches
      if (match.status === "pending") {
        await ctx.db.patch(match._id, { timerDuration, updatedAt: now });
      }
    }
    
    return { updatedCount: matches.filter(m => m.status === "pending").length };
  },
});

export const addScore = mutation({
  args: {
    matchId: v.id("matches"),
    player: v.union(v.literal("player1"), v.literal("player2")),
    scoreType: v.number(),
    elapsedSeconds: v.optional(v.number()),
    deviceId: v.string(),
  },
  handler: async (ctx, { matchId, player, scoreType, elapsedSeconds, deviceId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");
    if (match.status === "completed") throw new Error("Match already completed");
    
    const now = Date.now();
    await ensureControl(ctx, match, matchId, deviceId, now);
    
    const p1Scores = [...match.player1Score];
    const p2Scores = [...match.player2Score];
    const p1Times = [...(match.player1ScoreTimes ?? [])];
    const p2Times = [...(match.player2ScoreTimes ?? [])];
    const elapsed = typeof elapsedSeconds === "number" ? elapsedSeconds : getElapsedSeconds(match);
    
    if (player === "player1") {
      p1Scores.push(scoreType);
      p1Times.push(elapsed);
    } else {
      p2Scores.push(scoreType);
      p2Times.push(elapsed);
    }
    
    const winner = checkWinner(p1Scores, p2Scores, match.matchType);
    
    await ctx.db.patch(matchId, {
      player1Score: p1Scores,
      player2Score: p2Scores,
      player1ScoreTimes: p1Times,
      player2ScoreTimes: p2Times,
      ...(winner && {
        winner: winner === "player1" ? match.player1Id : match.player2Id,
        status: "completed" as const,
        actualDuration: match.timerPausedAt || 0,
        controlOwnerId: undefined,
        controlLockExpiresAt: undefined,
      }),
      updatedAt: now,
    });
    
    if (winner) {
      await ensureSuddenDeathMatches(ctx, match);
    }
    
    return { winner, p1Scores, p2Scores };
  },
});

export const addHansoku = mutation({
  args: {
    matchId: v.id("matches"),
    player: v.union(v.literal("player1"), v.literal("player2")),
    elapsedSeconds: v.optional(v.number()),
    deviceId: v.string(),
  },
  handler: async (ctx, { matchId, player, elapsedSeconds, deviceId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");
    if (match.status === "completed") throw new Error("Match already completed");
    
    const now = Date.now();
    await ensureControl(ctx, match, matchId, deviceId, now);
    
    let p1Hansoku = match.player1Hansoku;
    let p2Hansoku = match.player2Hansoku;
    const p1Scores = [...match.player1Score];
    const p2Scores = [...match.player2Score];
    const p1Times = [...(match.player1ScoreTimes ?? [])];
    const p2Times = [...(match.player2ScoreTimes ?? [])];
    const elapsed = typeof elapsedSeconds === "number" ? elapsedSeconds : getElapsedSeconds(match);
    
    if (player === "player1") {
      p1Hansoku++;
      if (p1Hansoku % 2 === 0) {
        p2Scores.push(SCORE_TYPES.HANSOKU_POINT);
        p2Times.push(elapsed);
      }
    } else {
      p2Hansoku++;
      if (p2Hansoku % 2 === 0) {
        p1Scores.push(SCORE_TYPES.HANSOKU_POINT);
        p1Times.push(elapsed);
      }
    }
    
    const winner = checkWinner(p1Scores, p2Scores, match.matchType);
    
    await ctx.db.patch(matchId, {
      player1Hansoku: p1Hansoku,
      player2Hansoku: p2Hansoku,
      player1Score: p1Scores,
      player2Score: p2Scores,
      player1ScoreTimes: p1Times,
      player2ScoreTimes: p2Times,
      ...(winner && {
        winner: winner === "player1" ? match.player1Id : match.player2Id,
        status: "completed" as const,
        actualDuration: match.timerPausedAt || 0,
        controlOwnerId: undefined,
        controlLockExpiresAt: undefined,
      }),
      updatedAt: now,
    });
    
    if (winner) {
      await ensureSuddenDeathMatches(ctx, match);
    }
    
    return { winner, p1Hansoku, p2Hansoku };
  },
});

export const undoScore = mutation({
  args: {
    matchId: v.id("matches"),
    player: v.union(v.literal("player1"), v.literal("player2")),
    deviceId: v.string(),
  },
  handler: async (ctx, { matchId, player, deviceId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");
    
    const now = Date.now();
    await ensureControl(ctx, match, matchId, deviceId, now);

    const p1Scores = [...match.player1Score];
    const p2Scores = [...match.player2Score];
    const p1Times = [...(match.player1ScoreTimes ?? [])];
    const p2Times = [...(match.player2ScoreTimes ?? [])];
    
    if (player === "player1" && p1Scores.length > 0) {
      p1Scores.pop();
      if (p1Times.length > 0) p1Times.pop();
    } else if (player === "player2" && p2Scores.length > 0) {
      p2Scores.pop();
      if (p2Times.length > 0) p2Times.pop();
    }
    
    const wasCompleted = match.status === "completed";
    
    await ctx.db.patch(matchId, {
      player1Score: p1Scores,
      player2Score: p2Scores,
      player1ScoreTimes: p1Times,
      player2ScoreTimes: p2Times,
      ...(wasCompleted && { winner: undefined, status: "in_progress" as const }),
      updatedAt: now,
    });
    
    return { p1Scores, p2Scores, reopened: wasCompleted };
  },
});

export const undoHansoku = mutation({
  args: {
    matchId: v.id("matches"),
    player: v.union(v.literal("player1"), v.literal("player2")),
    deviceId: v.string(),
  },
  handler: async (ctx, { matchId, player, deviceId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");
    
    const now = Date.now();
    await ensureControl(ctx, match, matchId, deviceId, now);

    let p1Hansoku = match.player1Hansoku;
    let p2Hansoku = match.player2Hansoku;
    const p1Scores = [...match.player1Score];
    const p2Scores = [...match.player2Score];
    const p1Times = [...(match.player1ScoreTimes ?? [])];
    const p2Times = [...(match.player2ScoreTimes ?? [])];
    
    if (player === "player1" && p1Hansoku > 0) {
      if (p1Hansoku % 2 === 0) {
        const idx = p2Scores.lastIndexOf(SCORE_TYPES.HANSOKU_POINT);
        if (idx >= 0) {
          p2Scores.splice(idx, 1);
          if (p2Times.length > idx) p2Times.splice(idx, 1);
        }
      }
      p1Hansoku--;
    } else if (player === "player2" && p2Hansoku > 0) {
      if (p2Hansoku % 2 === 0) {
        const idx = p1Scores.lastIndexOf(SCORE_TYPES.HANSOKU_POINT);
        if (idx >= 0) {
          p1Scores.splice(idx, 1);
          if (p1Times.length > idx) p1Times.splice(idx, 1);
        }
      }
      p2Hansoku--;
    }
    
    await ctx.db.patch(matchId, {
      player1Hansoku: p1Hansoku,
      player2Hansoku: p2Hansoku,
      player1Score: p1Scores,
      player2Score: p2Scores,
      player1ScoreTimes: p1Times,
      player2ScoreTimes: p2Times,
      updatedAt: now,
    });
    
    return { p1Hansoku, p2Hansoku };
  },
});

export const startMatch = mutation({
  args: { matchId: v.id("matches"), deviceId: v.string() },
  handler: async (ctx, { matchId, deviceId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");
    
    const now = Date.now();
    await ensureControl(ctx, match, matchId, deviceId, now);

    await ctx.db.patch(matchId, {
      status: "in_progress",
      timerStartedAt: Date.now(),
      updatedAt: now,
    });
  },
});

export const toggleTimer = mutation({
  args: { matchId: v.id("matches"), deviceId: v.string() },
  handler: async (ctx, { matchId, deviceId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");
    
    const now = Date.now();
    
    if (match.timerStartedAt && !match.timerPausedAt) {
      const elapsed = Math.floor((now - match.timerStartedAt) / 1000);
      await ctx.db.patch(matchId, {
        timerPausedAt: elapsed,
        timerStartedAt: undefined,
        controlOwnerId: undefined,
        controlLockExpiresAt: undefined,
        updatedAt: now,
      });
    } else if (match.timerPausedAt) {
      await ensureControl(ctx, match, matchId, deviceId, now);
      await ctx.db.patch(matchId, {
        timerStartedAt: now - (match.timerPausedAt * 1000),
        timerPausedAt: undefined,
        updatedAt: now,
      });
    } else if (!match.timerStartedAt && match.status === "pending") {
      // Allow starting timer from a stopped state (unlikely here)
      await ensureControl(ctx, match, matchId, deviceId, now);
      await ctx.db.patch(matchId, {
        timerStartedAt: now,
        updatedAt: now,
      });
    }
  },
});

export const resetTimer = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");
    if (match.status === "completed") throw new Error("Match already completed");

    await ctx.db.patch(matchId, {
      timerStartedAt: undefined,
      timerPausedAt: 0,
      controlOwnerId: undefined,
      controlLockExpiresAt: undefined,
      updatedAt: Date.now(),
    });

    return { timerPausedAt: 0 };
  },
});

export const addTimerTime = mutation({
  args: {
    matchId: v.id("matches"),
    seconds: v.number(),
    deviceId: v.string(),
  },
  handler: async (ctx, { matchId, seconds, deviceId }) => {
    if (seconds !== 30 && seconds !== 60) {
      throw new Error("Invalid timer extension");
    }
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");
    if (match.status === "completed") throw new Error("Match already completed");

    const now = Date.now();
    await ensureControl(ctx, match, matchId, deviceId, now);

    const nextDuration = match.timerDuration + seconds;

    await ctx.db.patch(matchId, {
      timerDuration: nextDuration,
      updatedAt: now,
    });

    return { timerDuration: nextDuration };
  },
});

export const keepAliveControl = mutation({
  args: { matchId: v.id("matches"), deviceId: v.string() },
  handler: async (ctx, { matchId, deviceId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");

    const now = Date.now();
    if (match.controlOwnerId !== deviceId) {
      // If lock expired, allow caller to acquire it (only matters while timer running)
      const active = lockIsActive(match, now);
      if (active) return { refreshed: false };
      await ensureControl(ctx, match, matchId, deviceId, now);
      return { refreshed: true };
    }

    if (!lockIsActive(match, now)) {
      await ensureControl(ctx, match, matchId, deviceId, now);
      return { refreshed: true };
    }

    await ctx.db.patch(matchId, {
      controlLockExpiresAt: now + LOCK_WINDOW_MS,
      updatedAt: now,
    });
    return { refreshed: true };
  },
});

export const declareWinner = mutation({
  args: {
    matchId: v.id("matches"),
    winner: v.union(v.literal("player1"), v.literal("player2")),
    deviceId: v.string(),
  },
  handler: async (ctx, { matchId, winner, deviceId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");
    
    const now = Date.now();
    await ensureControl(ctx, match, matchId, deviceId, now);

    const winnerId = winner === "player1" ? match.player1Id : match.player2Id;
    
    await ctx.db.patch(matchId, {
      winner: winnerId,
      status: "completed",
      actualDuration: match.timerPausedAt || 
        (match.timerStartedAt ? Math.floor((Date.now() - match.timerStartedAt) / 1000) : 0),
      controlOwnerId: undefined,
      controlLockExpiresAt: undefined,
      updatedAt: now,
    });

    await ensureSuddenDeathMatches(ctx, match);
  },
});

export const declareTie = mutation({
  args: {
    matchId: v.id("matches"),
    deviceId: v.string(),
  },
  handler: async (ctx, { matchId, deviceId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");
    if (match.status === "completed") throw new Error("Match already completed");

    const now = Date.now();
    await ensureControl(ctx, match, matchId, deviceId, now);

    await ctx.db.patch(matchId, {
      winner: undefined,
      status: "completed",
      actualDuration: match.timerPausedAt ||
        (match.timerStartedAt ? Math.floor((Date.now() - match.timerStartedAt) / 1000) : 0),
      controlOwnerId: undefined,
      controlLockExpiresAt: undefined,
      updatedAt: now,
    });

    await ensureSuddenDeathMatches(ctx, match);
  },
});

export const declareForfeit = mutation({
  args: {
    matchId: v.id("matches"),
    forfeitingPlayer: v.union(v.literal("player1"), v.literal("player2")),
    elapsedSeconds: v.optional(v.number()),
    deviceId: v.string(),
  },
  handler: async (ctx, { matchId, forfeitingPlayer, elapsedSeconds, deviceId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");
    
    const now = Date.now();
    await ensureControl(ctx, match, matchId, deviceId, now);

    const winnerId = forfeitingPlayer === "player1" ? match.player2Id : match.player1Id;
    const p1Scores = [...match.player1Score];
    const p2Scores = [...match.player2Score];
    const p1Times = [...(match.player1ScoreTimes ?? [])];
    const p2Times = [...(match.player2ScoreTimes ?? [])];
    const elapsed = typeof elapsedSeconds === "number" ? elapsedSeconds : getElapsedSeconds(match);
    
    if (forfeitingPlayer === "player1") {
      p2Scores.push(SCORE_TYPES.FORFEIT);
      p2Times.push(elapsed);
    } else {
      p1Scores.push(SCORE_TYPES.FORFEIT);
      p1Times.push(elapsed);
    }
    
    await ctx.db.patch(matchId, {
      player1Score: p1Scores,
      player2Score: p2Scores,
      player1ScoreTimes: p1Times,
      player2ScoreTimes: p2Times,
      winner: winnerId,
      status: "completed",
      actualDuration: match.timerPausedAt || 0,
      controlOwnerId: undefined,
      controlLockExpiresAt: undefined,
      updatedAt: now,
    });

    await ensureSuddenDeathMatches(ctx, match);
  },
});

/**
 * Hantei (Judges Decision) Scoring
 * 
 * For non-bogu matches, scoring is done by flag counts from 3 referees.
 * Each referee raises a flag for aka (red/player1) or shiro (white/player2).
 * 
 * A hantei match typically has 2 rounds:
 * - Round 1: 2 kihon-waza combos (e.g., K-M = Kote then Men)
 * - Round 2: 3 kihon-waza combos (e.g., M-K-D = Men then Kote then Do)
 * 
 * Winner is determined by:
 * - Most round wins (best of 2)
 * - If tied, total flag count across all rounds
 */

export const addHanteiRound = mutation({
  args: {
    matchId: v.id("matches"),
    round: v.number(),
    combo: v.string(),
    akaFlags: v.number(), // 0-3 flags for player1 (aka/red)
    shiroFlags: v.number(), // 0-3 flags for player2 (shiro/white)
  },
  handler: async (ctx, { matchId, round, combo, akaFlags, shiroFlags }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");
    if (match.status === "completed") throw new Error("Match already completed");
    if (match.matchType !== "hantei") throw new Error("Not a hantei match");
    
    // Validate flag counts (0-3 from 3 judges)
    if (akaFlags < 0 || akaFlags > 3 || shiroFlags < 0 || shiroFlags > 3) {
      throw new Error("Invalid flag count");
    }
    if (akaFlags + shiroFlags > 3) {
      throw new Error("Total flags cannot exceed 3");
    }
    
    const rounds = match.hanteiRounds || [];
    
    // Check if this round already exists, replace it
    const existingIdx = rounds.findIndex(r => r.round === round);
    if (existingIdx >= 0) {
      rounds[existingIdx] = { round, combo, akaFlags, shiroFlags };
    } else {
      rounds.push({ round, combo, akaFlags, shiroFlags });
    }
    
    // Sort by round number
    rounds.sort((a, b) => a.round - b.round);
    
    // Determine winner if we have both rounds
    let winner: typeof match.player1Id | undefined = undefined;
    let status: "pending" | "in_progress" | "completed" = "in_progress";
    
    if (rounds.length >= 2) {
      // Count round wins
      let akaWins = 0;
      let shiroWins = 0;
      let totalAkaFlags = 0;
      let totalShiroFlags = 0;
      
      for (const r of rounds) {
        totalAkaFlags += r.akaFlags;
        totalShiroFlags += r.shiroFlags;
        
        if (r.akaFlags > r.shiroFlags) akaWins++;
        else if (r.shiroFlags > r.akaFlags) shiroWins++;
        // Tied rounds don't count for either
      }
      
      // Determine winner: most round wins, then total flags
      if (akaWins > shiroWins) {
        winner = match.player1Id;
        status = "completed";
      } else if (shiroWins > akaWins) {
        winner = match.player2Id;
        status = "completed";
      } else if (totalAkaFlags > totalShiroFlags) {
        // Tiebreaker: total flags
        winner = match.player1Id;
        status = "completed";
      } else if (totalShiroFlags > totalAkaFlags) {
        winner = match.player2Id;
        status = "completed";
      }
      // If still tied, match continues (or needs manual decision)
    }
    
    await ctx.db.patch(matchId, {
      hanteiRounds: rounds,
      winner,
      status,
      actualDuration: winner ? (match.timerPausedAt || 
        (match.timerStartedAt ? Math.floor((Date.now() - match.timerStartedAt) / 1000) : 0)) : undefined,
      updatedAt: Date.now(),
    });

    if (status === "completed") {
      await ensureSuddenDeathMatches(ctx, match);
    }
    
    return { 
      rounds, 
      winner: winner ? (winner === match.player1Id ? "player1" : "player2") : null,
      completed: status === "completed"
    };
  },
});

export const undoHanteiRound = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, { matchId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");
    
    const rounds = match.hanteiRounds || [];
    if (rounds.length === 0) throw new Error("No rounds to undo");
    
    // Remove the last round
    rounds.pop();
    
    // If we were completed, reopen the match
    const wasCompleted = match.status === "completed";
    
    await ctx.db.patch(matchId, {
      hanteiRounds: rounds,
      winner: undefined,
      status: rounds.length > 0 ? "in_progress" : "pending",
      actualDuration: undefined,
      updatedAt: Date.now(),
    });
    
    return { rounds, reopened: wasCompleted };
  },
});

export const declareHanteiWinner = mutation({
  args: {
    matchId: v.id("matches"),
    winner: v.union(v.literal("player1"), v.literal("player2")),
  },
  handler: async (ctx, { matchId, winner }) => {
    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");
    if (match.matchType !== "hantei") throw new Error("Not a hantei match");
    
    const winnerId = winner === "player1" ? match.player1Id : match.player2Id;
    
    await ctx.db.patch(matchId, {
      winner: winnerId,
      status: "completed",
      actualDuration: match.timerPausedAt ||
        (match.timerStartedAt ? Math.floor((Date.now() - match.timerStartedAt) / 1000) : 0),
      updatedAt: Date.now(),
    });

    await ensureSuddenDeathMatches(ctx, match);
  },
});

async function ensureSuddenDeathMatches(
  ctx: { db: any },
  match: { tournamentId: string; groupId: string; isSuddenDeath?: boolean }
) {
  if (match.isSuddenDeath) return;

  const groupMatches = await ctx.db
    .query("matches")
    .withIndex("by_tournament_group", (q: any) =>
      q.eq("tournamentId", match.tournamentId).eq("groupId", match.groupId)
    )
    .collect();

  const regularMatches = groupMatches.filter((m: any) => !m.isSuddenDeath);
  if (regularMatches.some((m: any) => m.status !== "completed")) return;

  const participants = await ctx.db
    .query("participants")
    .withIndex("by_tournament_group", (q: any) =>
      q.eq("tournamentId", match.tournamentId).eq("groupId", match.groupId)
    )
    .collect();
  if (participants.length === 0) return;

  const stats = new Map<string, { memberId: string; wins: number; ties: number; ippons: number; points: number }>();
  for (const p of participants) {
    stats.set(p.memberId, { memberId: p.memberId, wins: 0, ties: 0, ippons: 0, points: 0 });
  }

  for (const m of regularMatches) {
    const p1 = stats.get(m.player1Id);
    const p2 = stats.get(m.player2Id);
    if (!p1 || !p2) continue;
    const p1Ippons = m.player1Score?.length || 0;
    const p2Ippons = m.player2Score?.length || 0;
    p1.ippons += p1Ippons;
    p2.ippons += p2Ippons;
    if (m.winner === m.player1Id) {
      p1.wins += 1;
    } else if (m.winner === m.player2Id) {
      p2.wins += 1;
    } else {
      p1.ties += 1;
      p2.ties += 1;
    }
  }

  const rows = Array.from(stats.values());
  for (const row of rows) {
    row.points = (row.wins * 2) + row.ties;
  }
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.ippons !== a.ippons) return b.ippons - a.ippons;
    return a.memberId.localeCompare(b.memberId);
  });

  const top3 = rows.slice(0, 3);
  const keyCounts = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.points}-${row.wins}-${row.ippons}`;
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  }

  const tiedKeys = new Set<string>();
  for (const row of top3) {
    const key = `${row.points}-${row.wins}-${row.ippons}`;
    if ((keyCounts.get(key) ?? 0) > 1) tiedKeys.add(key);
  }
  if (tiedKeys.size === 0) return;

  const tiedMemberIds = rows
    .filter(row => tiedKeys.has(`${row.points}-${row.wins}-${row.ippons}`))
    .map(row => row.memberId);
  if (tiedMemberIds.length < 2) return;

  const existingPairs = new Set<string>();
  for (const m of groupMatches) {
    if (!m.isSuddenDeath) continue;
    const key = [m.player1Id, m.player2Id].sort().join("|");
    existingPairs.add(key);
  }

  const group = await ctx.db
    .query("groups")
    .withIndex("by_groupId", (q: any) => q.eq("groupId", match.groupId))
    .first();
  const tournament = await ctx.db.get(match.tournamentId);
  if (!tournament) return;

  const isHantei = group?.isHantei || false;
  const court = regularMatches[0]?.court ?? "A";
  const allMatches = await ctx.db
    .query("matches")
    .withIndex("by_tournament", (q: any) => q.eq("tournamentId", match.tournamentId))
    .collect();
  let orderIndex = allMatches.length > 0
    ? Math.max(...allMatches.map((m: any) => m.orderIndex)) + 1
    : 0;
  const now = Date.now();

  for (let i = 0; i < tiedMemberIds.length; i++) {
    for (let j = i + 1; j < tiedMemberIds.length; j++) {
      const p1 = tiedMemberIds[i];
      const p2 = tiedMemberIds[j];
      const key = [p1, p2].sort().join("|");
      if (existingPairs.has(key)) continue;
      await ctx.db.insert("matches", {
        tournamentId: match.tournamentId,
        groupId: match.groupId,
        player1Id: p1,
        player2Id: p2,
        court,
        status: "pending",
        player1Score: [],
        player2Score: [],
        player1ScoreTimes: [],
        player2ScoreTimes: [],
        player1Hansoku: 0,
        player2Hansoku: 0,
        matchType: isHantei ? "hantei" : "ippon",
        timerDuration: isHantei ? 0 : tournament.defaultTimerDuration,
        round: 2,
        orderIndex: orderIndex++,
        isSuddenDeath: true,
        updatedAt: now,
      });
      existingPairs.add(key);
    }
  }
}
