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
    dojo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("members", {
      ...args,
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
    dojo: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const nextUpdates: Record<string, unknown> = { ...updates };
    if (updates.groupId !== undefined) {
      nextUpdates.isAdmin = updates.groupId === SENSEI_GROUP_ID;
    }
    await ctx.db.patch(id, nextUpdates);
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
      dojo: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { members }) => {
    const ids = [];
    for (const member of members) {
      const id = await ctx.db.insert("members", {
        ...member,
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
      dojo: v.optional(v.string()),
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


