import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List all dojos
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("dojos").order("asc").collect();
  },
});

// Get a single dojo by ID
export const get = query({
  args: { id: v.id("dojos") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new dojo
export const create = mutation({
  args: {
    name: v.string(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dojos", {
      name: args.name,
      location: args.location,
      createdAt: Date.now(),
    });
  },
});

// Update an existing dojo
export const update = mutation({
  args: {
    id: v.id("dojos"),
    name: v.string(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      location: args.location,
    });
  },
});

// Delete a dojo
export const remove = mutation({
  args: { id: v.id("dojos") },
  handler: async (ctx, args) => {
    // First, update all guests from this dojo to have no dojo
    const guests = await ctx.db
      .query("members")
      .withIndex("by_dojoId", (q) => q.eq("dojoId", args.id))
      .collect();
    
    for (const guest of guests) {
      await ctx.db.patch(guest._id, { dojoId: undefined });
    }
    
    // Then delete the dojo
    await ctx.db.delete(args.id);
  },
});

// Get guest count by dojo
export const getGuestCounts = query({
  args: {},
  handler: async (ctx) => {
    const dojos = await ctx.db.query("dojos").collect();
    const guests = await ctx.db
      .query("members")
      .filter((q) => q.eq(q.field("isGuest"), true))
      .collect();
    
    const counts: Record<string, number> = {};
    
    for (const dojo of dojos) {
      counts[dojo._id] = guests.filter(g => g.dojoId === dojo._id && !g.archived).length;
    }
    
    // Count guests with no dojo
    counts["none"] = guests.filter(g => !g.dojoId && !g.archived).length;
    
    return counts;
  },
});

// Clear all dojos
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const dojos = await ctx.db.query("dojos").collect();
    for (const dojo of dojos) {
      await ctx.db.delete(dojo._id);
    }
    return { deleted: dojos.length };
  },
});
