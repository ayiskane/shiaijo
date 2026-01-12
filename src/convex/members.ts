import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const SENSEI_GROUP_ID = "SEN";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("members")
      .withIndex("by_lastName")
      .collect();
  },
});

// List only guests
export const listGuests = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db
      .query("members")
      .collect();
    return members.filter(m => m.isGuest);
  },
});

// List only non-guests (regular members)
export const listMembers = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db
      .query("members")
      .collect();
    return members.filter(m => !m.isGuest);
  },
});

export const get = query({
  args: { id: v.id("members") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    groupId: v.string(),
    isGuest: v.boolean(),
    dojoId: v.optional(v.id("dojos")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("members", {
      firstName: args.firstName,
      lastName: args.lastName,
      groupId: args.groupId,
      isGuest: args.isGuest,
      dojoId: args.dojoId,
      isAdmin: args.groupId === SENSEI_GROUP_ID,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("members"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    groupId: v.optional(v.string()),
    archived: v.optional(v.boolean()),
    dojoId: v.optional(v.id("dojos")),
  },
  handler: async (ctx, { id, ...updates }) => {
    const nextUpdates: Record<string, unknown> = { ...updates };
    if (updates.groupId !== undefined) {
      nextUpdates.isAdmin = updates.groupId === SENSEI_GROUP_ID;
    }
    await ctx.db.patch(id, nextUpdates);
  },
});

// Clear dojoId from a member
export const clearDojoId = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { dojoId: undefined });
  },
});

export const remove = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const bulkCreate = mutation({
  args: {
    members: v.array(v.object({
      firstName: v.string(),
      lastName: v.string(),
      groupId: v.string(),
      isGuest: v.boolean(),
      archived: v.optional(v.boolean()),
      dojoId: v.optional(v.id("dojos")),
    })),
  },
  handler: async (ctx, { members }) => {
    const ids = [];
    for (const member of members) {
      const id = await ctx.db.insert("members", {
        firstName: member.firstName,
        lastName: member.lastName,
        groupId: member.groupId,
        isGuest: member.isGuest,
        dojoId: member.dojoId,
        archived: member.archived,
        isAdmin: member.groupId === SENSEI_GROUP_ID,
        createdAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

export const bulkUpdate = mutation({
  args: {
    members: v.array(v.object({
      id: v.id("members"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      groupId: v.optional(v.string()),
      archived: v.optional(v.boolean()),
      dojoId: v.optional(v.id("dojos")),
    })),
  },
  handler: async (ctx, { members }) => {
    for (const member of members) {
      const { id, groupId, ...rest } = member;
      const updates: Record<string, unknown> = { ...rest };
      if (groupId !== undefined) {
        updates.groupId = groupId;
        updates.isAdmin = groupId === SENSEI_GROUP_ID;
      }
      await ctx.db.patch(id, updates);
    }
    return { updatedCount: members.length };
  },
});

// Debug: Clear all members
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query("members").collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }
    return { deletedCount: members.length };
  },
});

// Debug: Clear all guests only
export const clearAllGuests = mutation({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query("members").collect();
    const guests = members.filter(m => m.isGuest);
    for (const guest of guests) {
      await ctx.db.delete(guest._id);
    }
    return { deletedCount: guests.length };
  },
});
