import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function sessionEmail(ctx: any, token: string): Promise<string | null> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .unique();
  if (!session || session.expiresAt < Date.now()) return null;
  return session.email;
}

const sectionValidator = v.object({
  id: v.string(),
  title: v.string(),
  duration: v.optional(v.string()),
  markdown: v.string(),
});

// ── query: return all scripts — ONLY for an authenticated session ─────────────
export const list = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const email = await sessionEmail(ctx, args.token);
    if (!email) throw new Error("Not authorized. Please log in again.");
    const docs = await ctx.db.query("scriptDocs").collect();
    docs.sort((a, b) => a.order - b.order);
    return docs.map((d) => ({
      slug: d.slug,
      order: d.order,
      title: d.title,
      theme: d.theme,
      tone: d.tone ?? "",
      sections: d.sections,
    }));
  },
});

// ── mutation: replace the whole script library (admin-only) ───────────────────
// Called by scripts/seed-scripts.mjs which reads the local gitignored files.
export const seedReplace = mutation({
  args: {
    adminPassword: v.string(),
    scripts: v.array(
      v.object({
        slug: v.string(),
        order: v.number(),
        title: v.string(),
        theme: v.string(),
        tone: v.optional(v.string()),
        sections: v.array(sectionValidator),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const expected = process.env.SCRIPTS_PASSWORD;
    if (!expected || args.adminPassword !== expected) {
      throw new Error("Not authorized to seed.");
    }
    const existing = await ctx.db.query("scriptDocs").collect();
    for (const row of existing) await ctx.db.delete(row._id);
    const now = Date.now();
    for (const s of args.scripts) {
      await ctx.db.insert("scriptDocs", { ...s, updatedAt: now });
    }
    return { ok: true, count: args.scripts.length };
  },
});
