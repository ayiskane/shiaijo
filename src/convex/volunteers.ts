import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ----- Volunteers -----

export const list = query({
  args: {},
  handler: async (ctx) => {
    const volunteers = await ctx.db.query("volunteers").collect();
    return volunteers.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    relatedMemberIds: v.optional(v.array(v.id("members"))),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("volunteers", {
      ...args,
      relatedMemberIds: args.relatedMemberIds ?? [],
      createdAt: now,
    });
  },
});

// ----- Signups for a tournament -----

export const signUp = mutation({
  args: {
    volunteerId: v.id("volunteers"),
    tournamentId: v.id("tournaments"),
    role: v.union(v.literal("courtkeeper"), v.literal("general")),
  },
  handler: async (ctx, { volunteerId, tournamentId, role }) => {
    // upsert: avoid duplicate signups for same volunteer/tournament/role
    const existing = await ctx.db
      .query("volunteerSignups")
      .withIndex("by_volunteer", (q) => q.eq("volunteerId", volunteerId))
      .filter((q) => q.eq(q.field("tournamentId"), tournamentId))
      .filter((q) => q.eq(q.field("role"), role))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("volunteerSignups", {
      volunteerId,
      tournamentId,
      role,
      createdAt: Date.now(),
    });
  },
});

export const listSignupsByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, { tournamentId }) => {
    return await ctx.db
      .query("volunteerSignups")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
  },
});
