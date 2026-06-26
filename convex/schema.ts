import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Mailing-list signups with the dating questionnaire.
export default defineSchema({
  signups: defineTable({
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    // Optional in the schema only to tolerate one pre-existing signup from
    // before this field existed; the mutation requires it for all new signups.
    birthYear: v.optional(v.number()),

    // Gender for dating purposes. "other" carries free text in genderOther.
    gender: v.union(
      v.literal("male"),
      v.literal("female"),
      v.literal("non-binary"),
      v.literal("other"),
    ),
    genderOther: v.optional(v.string()),

    // Sexual orientation. "other" carries a free-text value in orientationOther.
    orientation: v.union(
      v.literal("heterosexual"),
      v.literal("homosexual"),
      v.literal("bisexual"),
      v.literal("pansexual"),
      v.literal("asexual"),
      v.literal("other"),
    ),
    orientationOther: v.optional(v.string()),

    // Relationship agreement preference. "other" carries free text in relationshipOther.
    relationship: v.union(
      v.literal("monogamous"),
      v.literal("non-monogamous"),
      v.literal("other"),
    ),
    relationshipOther: v.optional(v.string()),

    // Kids: two independent questions so any combination is possible
    // (e.g. "I have kids" + "yes, want more").
    haveKids: v.union(v.literal("yes"), v.literal("no")),
    wantKids: v.union(
      v.literal("yes"),
      v.literal("no"),
      v.literal("maybe"),
      v.literal("open"),
    ),

    // Optional free-text: special requests or desires for future events.
    message: v.optional(v.string()),

    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // ── script.toward.love : private facilitation scripts (NEVER in the public repo) ──
  // The script content lives only here in the database, returned only to an
  // authenticated session. Seeded from local gitignored files via scripts/seed-scripts.mjs.
  scriptDocs: defineTable({
    slug: v.string(), // e.g. "01-simmer"
    order: v.number(),
    title: v.string(), // e.g. 'Simmer'
    theme: v.string(),
    tone: v.optional(v.string()),
    // Ordered sections, each independently selectable in the picker UI.
    sections: v.array(
      v.object({
        id: v.string(), // stable section id, e.g. "opening-circle"
        title: v.string(),
        duration: v.optional(v.string()), // "10:00"
        markdown: v.string(), // the section body (facilitator script)
      }),
    ),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  // Login codes emailed to the single allowed address (hello@toward.love).
  loginCodes: defineTable({
    email: v.string(),
    codeHash: v.string(),
    expiresAt: v.number(),
    consumed: v.boolean(),
  }).index("by_email", ["email"]),

  // Active browser sessions (opaque bearer token kept in localStorage).
  sessions: defineTable({
    token: v.string(),
    email: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),
});
