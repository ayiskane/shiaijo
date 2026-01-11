import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { TableNames } from "./_generated/dataModel";

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return existing?.value ?? null;
  },
});

export const getMany = query({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, { keys }) => {
    const results: Record<string, string | null> = {};
    for (const key of keys) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();
      results[key] = existing?.value ?? null;
    }
    return results;
  },
});

export const set = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const trimmed = value.trim();
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (!trimmed) {
      if (existing) await ctx.db.delete(existing._id);
      return { cleared: true };
    }
    if (existing) {
      await ctx.db.patch(existing._id, { value: trimmed });
      return { updated: true };
    }
    await ctx.db.insert("settings", { key, value: trimmed });
    return { created: true };
  },
});

// Danger zone: wipe all operational data (keeps settings)
export const resetAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Order matters because of references
    const tables: TableNames[] = [
      "matches",
      "participants",
      "courtState",
      "tournaments",
      "volunteerSignups",
      "volunteerHours",
      "volunteers",
      "members",
      "groups",
    ];

    for (const table of tables) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        await ctx.db.delete(row._id as any);
      }
    }

    return { cleared: true, tables };
  },
});
