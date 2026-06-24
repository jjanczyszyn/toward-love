import { mutation } from "./_generated/server";
import { v } from "convex/values";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const add = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    birthYear: v.number(),
    gender: v.union(
      v.literal("male"),
      v.literal("female"),
      v.literal("non-binary"),
      v.literal("other"),
    ),
    genderOther: v.optional(v.string()),
    orientation: v.union(
      v.literal("heterosexual"),
      v.literal("homosexual"),
      v.literal("bisexual"),
      v.literal("pansexual"),
      v.literal("asexual"),
      v.literal("other"),
    ),
    orientationOther: v.optional(v.string()),
    relationship: v.union(
      v.literal("monogamous"),
      v.literal("non-monogamous"),
      v.literal("other"),
    ),
    relationshipOther: v.optional(v.string()),
    haveKids: v.union(v.literal("yes"), v.literal("no")),
    wantKids: v.union(
      v.literal("yes"),
      v.literal("no"),
      v.literal("maybe"),
      v.literal("open"),
    ),
    message: v.optional(v.string()),
    // Honeypot: real clients leave this empty. If set, silently drop.
    hp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Spam honeypot — pretend success, store nothing.
    if (args.hp && args.hp.trim()) {
      return { ok: true, updated: false };
    }

    const email = args.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      throw new Error("Please enter a valid email address.");
    }

    const currentYear = new Date().getFullYear();
    if (
      !Number.isInteger(args.birthYear) ||
      args.birthYear < 1900 ||
      args.birthYear > currentYear - 18
    ) {
      throw new Error("Please enter a valid birth year (you must be 18+).");
    }

    const firstName = args.firstName.trim();
    const lastName = args.lastName.trim();
    if (!firstName) throw new Error("Please enter your first name.");
    if (!lastName) throw new Error("Please enter your last name.");

    const genderOther =
      args.gender === "other" ? args.genderOther?.trim() || undefined : undefined;
    const orientationOther =
      args.orientation === "other"
        ? args.orientationOther?.trim() || undefined
        : undefined;
    const relationshipOther =
      args.relationship === "other"
        ? args.relationshipOther?.trim() || undefined
        : undefined;
    const message = args.message?.trim() || undefined;

    // Upsert: re-submitting with the same email updates the answers.
    const existing = await ctx.db
      .query("signups")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    const record = {
      email,
      firstName,
      lastName,
      birthYear: args.birthYear,
      gender: args.gender,
      genderOther,
      orientation: args.orientation,
      orientationOther,
      relationship: args.relationship,
      relationshipOther,
      haveKids: args.haveKids,
      wantKids: args.wantKids,
      message,
      createdAt: existing?.createdAt ?? Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, record);
      return { ok: true, updated: true };
    }
    await ctx.db.insert("signups", record);
    return { ok: true, updated: false };
  },
});
