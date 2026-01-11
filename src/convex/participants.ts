import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, { tournamentId }) => {
    return await ctx.db
      .query("participants")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("participants").collect();
  },
});

export const listByGroup = query({
  args: { 
    tournamentId: v.id("tournaments"),
    groupId: v.string(),
  },
  handler: async (ctx, { tournamentId, groupId }) => {
    return await ctx.db
      .query("participants")
      .withIndex("by_tournament_group", (q) => 
        q.eq("tournamentId", tournamentId).eq("groupId", groupId)
      )
      .collect();
  },
});

export const add = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    memberId: v.id("members"),
    groupId: v.string(),
  },
  handler: async (ctx, { tournamentId, memberId, groupId }) => {
    // Use compound index for efficient lookup
    const existing = await ctx.db
      .query("participants")
      .withIndex("by_tournament_member", (q) => 
        q.eq("tournamentId", tournamentId).eq("memberId", memberId)
      )
      .first();
    
    if (existing) {
      throw new Error("Member is already participating in this tournament");
    }
    
    return await ctx.db.insert("participants", {
      tournamentId,
      memberId,
      groupId,
    });
  },
});

// Add selected members by their IDs
export const addMembers = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    memberIds: v.array(v.id("members")),
  },
  handler: async (ctx, { tournamentId, memberIds }) => {
    // Get existing participants
    const existing = await ctx.db
      .query("participants")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    const existingMemberIds = new Set(existing.map(p => p.memberId));
    
    let addedCount = 0;
    for (const memberId of memberIds) {
      if (!existingMemberIds.has(memberId)) {
        // Get member to find their groupId
        const member = await ctx.db.get(memberId);
        if (member) {
          await ctx.db.insert("participants", {
            tournamentId,
            memberId,
            groupId: member.groupId,
          });
          addedCount++;
        }
      }
    }
    
    return { addedCount };
  },
});

export const addBulk = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    participants: v.array(v.object({
      memberId: v.id("members"),
      groupId: v.string(),
    })),
  },
  handler: async (ctx, { tournamentId, participants }) => {
    const existing = await ctx.db
      .query("participants")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    const existingMemberIds = new Set(existing.map(p => p.memberId));
    
    let addedCount = 0;
    for (const p of participants) {
      if (existingMemberIds.has(p.memberId)) continue;
      await ctx.db.insert("participants", {
        tournamentId,
        memberId: p.memberId,
        groupId: p.groupId,
      });
      existingMemberIds.add(p.memberId);
      addedCount++;
    }
    return { addedCount };
  },
});

export const remove = mutation({
  args: { id: v.id("participants") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const removeByMember = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    memberId: v.id("members"),
  },
  handler: async (ctx, { tournamentId, memberId }) => {
    // Use compound index for efficient lookup
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_tournament_member", (q) =>
        q.eq("tournamentId", tournamentId).eq("memberId", memberId)
      )
      .first();
    
    if (participant) {
      await ctx.db.delete(participant._id);
    }
  },
});

export const updateGroup = mutation({
  args: {
    id: v.id("participants"),
    groupId: v.string(),
  },
  handler: async (ctx, { id, groupId }) => {
    await ctx.db.patch(id, { groupId });
  },
});

export const addAllMembers = mutation({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, { tournamentId }) => {
    const members = await ctx.db.query("members").collect();
    
    const existing = await ctx.db
      .query("participants")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    const existingMemberIds = new Set(existing.map(p => p.memberId));
    
    let addedCount = 0;
    for (const member of members) {
      if (!existingMemberIds.has(member._id)) {
        await ctx.db.insert("participants", {
          tournamentId,
          memberId: member._id,
          groupId: member.groupId,
        });
        addedCount++;
      }
    }
    
    return { addedCount };
  },
});

export const clearAll = mutation({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, { tournamentId }) => {
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    
    for (const p of participants) {
      await ctx.db.delete(p._id);
    }
    
    return { removedCount: participants.length };
  },
});

export const registerGroupMembers = mutation({
  args: { 
    tournamentId: v.id("tournaments"),
    groupId: v.string(),
  },
  handler: async (ctx, { tournamentId, groupId }) => {
    // Get all non-archived members in this group
    const members = await ctx.db.query("members").collect();
    const groupMembers = members.filter(m => m.groupId === groupId && !m.archived);
    
    // Get existing participants
    const existing = await ctx.db
      .query("participants")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    const existingMemberIds = new Set(existing.map(p => p.memberId));
    
    let addedCount = 0;
    for (const member of groupMembers) {
      if (!existingMemberIds.has(member._id)) {
        await ctx.db.insert("participants", {
          tournamentId,
          memberId: member._id,
          groupId: member.groupId,
        });
        addedCount++;
      }
    }
    
    return { addedCount, totalInGroup: groupMembers.length };
  },
});
