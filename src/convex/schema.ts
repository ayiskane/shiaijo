import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Dojos/Clubs - for guest management
  dojos: defineTable({
    name: v.string(),
    location: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  // Members - the dojo roster
  members: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    groupId: v.string(), // Reference to group by custom ID (e.g., "YUD", "MUD")
    dojoId: v.optional(v.id("dojos")), // Reference to dojo for guests
    isGuest: v.boolean(),
    isAdmin: v.optional(v.boolean()),
    archived: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_lastName", ["lastName"])
    .index("by_groupId", ["groupId"])
    .index("by_dojoId", ["dojoId"]),

  // Groups - divisions for tournaments
  groups: defineTable({
    groupId: v.string(), // Custom ID for CSV imports (e.g., "YUD", "MUD", "G1")
    name: v.string(),
    isHantei: v.boolean(),
    order: v.number(),
    createdAt: v.number(),
  }).index("by_order", ["order"])
    .index("by_groupId", ["groupId"]),

  // Tournaments
  tournaments: defineTable({
    name: v.string(),
    date: v.string(),
    status: v.union(
      v.literal("setup"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    // Hantei round configuration (per tournament)
    hanteiConfig: v.optional(v.object({
      round1: v.string(), // e.g., "K-M", "M-K-D"
      round2: v.string(),
    })),
    timerOptions: v.array(v.number()),
    defaultTimerDuration: v.number(),
    timerDisplayMode: v.optional(v.union(v.literal("up"), v.literal("down"))),
    createdAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_date", ["date"]),

  // Tournament participants
  participants: defineTable({
    tournamentId: v.id("tournaments"),
    memberId: v.id("members"),
    groupId: v.string(),
  }).index("by_tournament", ["tournamentId"])
    .index("by_tournament_group", ["tournamentId", "groupId"])
    .index("by_tournament_member", ["tournamentId", "memberId"])
    .index("by_member", ["memberId"]),

  // Matches - individual bouts
  matches: defineTable({
    tournamentId: v.id("tournaments"),
    groupId: v.string(),
    player1Id: v.id("members"),
    player2Id: v.id("members"),
    court: v.union(v.literal("A"), v.literal("B"), v.literal("A+B")),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    // Bogu match scores
    player1Score: v.array(v.number()),
    player2Score: v.array(v.number()),
    player1ScoreTimes: v.optional(v.array(v.number())),
    player2ScoreTimes: v.optional(v.array(v.number())),
    player1Hansoku: v.number(),
    player2Hansoku: v.number(),
    // Hantei match rounds (for non-bogu)
    hanteiRounds: v.optional(v.array(v.object({
      round: v.number(),
      combo: v.string(),
      akaFlags: v.number(),
      shiroFlags: v.number(),
    }))),
    winner: v.optional(v.id("members")),
    matchType: v.union(v.literal("sanbon"), v.literal("ippon"), v.literal("hantei")),
    timerDuration: v.number(),
    timerStartedAt: v.optional(v.number()),
    timerPausedAt: v.optional(v.number()),
    actualDuration: v.optional(v.number()),
    // Control locking (per court/match)
    controlOwnerId: v.optional(v.string()),
    controlLockExpiresAt: v.optional(v.number()),
    round: v.number(),
    orderIndex: v.number(),
    isSuddenDeath: v.optional(v.boolean()),
    updatedAt: v.number(),
  }).index("by_tournament", ["tournamentId"])
    .index("by_tournament_court", ["tournamentId", "court"])
    .index("by_tournament_group", ["tournamentId", "groupId"])
    .index("by_tournament_status", ["tournamentId", "status"]),

  // Court state
  courtState: defineTable({
    tournamentId: v.id("tournaments"),
    court: v.union(v.literal("A"), v.literal("B")),
    currentMatchId: v.optional(v.id("matches")),
    selectedMatchId: v.optional(v.id("matches")),
    groupOrder: v.array(v.string()),
    sharedGroups: v.array(v.string()),
  }).index("by_tournament_court", ["tournamentId", "court"]),

  // Volunteers
  volunteers: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    relatedMemberIds: v.array(v.id("members")),
    createdAt: v.number(),
  }),

  // Volunteer hours log
  volunteerHours: defineTable({
    volunteerId: v.id("volunteers"),
    date: v.string(),
    hours: v.number(),
    minutes: v.number(),
    description: v.string(),
    createdAt: v.number(),
  }).index("by_volunteer", ["volunteerId"]),

  // Volunteer tournament signups
  volunteerSignups: defineTable({
    volunteerId: v.id("volunteers"),
    tournamentId: v.id("tournaments"),
    role: v.union(v.literal("courtkeeper"), v.literal("general")),
    createdAt: v.number(),
  }).index("by_tournament", ["tournamentId"])
    .index("by_volunteer", ["volunteerId"]),

  // Settings
  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});
