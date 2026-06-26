import {
  action,
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Access to script.toward.love is restricted to this single address.
const ALLOWED_EMAIL = "hello@toward.love";
const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalize(email: string) {
  return email.trim().toLowerCase();
}

// ── internal: persist a freshly generated login code ──────────────────────────
export const storeCode = internalMutation({
  args: { email: v.string(), codeHash: v.string(), expiresAt: v.number() },
  handler: async (ctx, args) => {
    // Drop any previous codes for this email so only the newest works.
    const old = await ctx.db
      .query("loginCodes")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    for (const row of old) await ctx.db.delete(row._id);
    await ctx.db.insert("loginCodes", { ...args, consumed: false });
  },
});

// ── action: email a 6-digit login code to the allowed address ─────────────────
export const requestCode = action({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean; emailed: boolean }> => {
    const email = normalize(args.email);
    if (email !== ALLOWED_EMAIL) {
      // Don't reveal which addresses are allowed — pretend success, send nothing.
      return { ok: true, emailed: false };
    }
    // 6-digit numeric code.
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
    const codeHash = await sha256(`${email}:${code}`);
    await ctx.runMutation(internal.scriptsAuth.storeCode, {
      email,
      codeHash,
      expiresAt: Date.now() + CODE_TTL_MS,
    });

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.SCRIPTS_FROM_EMAIL || "toward.love <onboarding@resend.dev>";
    if (!apiKey) return { ok: true, emailed: false };

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: "Your script.toward.love login code",
          text: `Your login code is ${code}\n\nIt expires in 15 minutes. If you didn't request this, you can ignore this email.`,
        }),
      });
      return { ok: true, emailed: res.ok };
    } catch {
      return { ok: true, emailed: false };
    }
  },
});

async function createSession(
  ctx: { db: any },
  email: string,
): Promise<{ token: string; expiresAt: number }> {
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await ctx.db.insert("sessions", { token, email, expiresAt });
  return { token, expiresAt };
}

// ── mutation: exchange a code for a session token ─────────────────────────────
export const verifyCode = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const email = normalize(args.email);
    if (email !== ALLOWED_EMAIL) throw new Error("Invalid code.");
    const codeHash = await sha256(`${email}:${args.code.trim()}`);
    const row = await ctx.db
      .query("loginCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .order("desc")
      .first();
    if (
      !row ||
      row.consumed ||
      row.expiresAt < Date.now() ||
      row.codeHash !== codeHash
    ) {
      throw new Error("That code is invalid or expired.");
    }
    await ctx.db.patch(row._id, { consumed: true });
    return await createSession(ctx, email);
  },
});

// ── mutation: master-password fallback (works before email is configured) ─────
export const loginWithPassword = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const email = normalize(args.email);
    const expected = process.env.SCRIPTS_PASSWORD;
    if (!expected) throw new Error("Password login is not configured.");
    if (email !== ALLOWED_EMAIL || args.password !== expected) {
      throw new Error("Wrong email or password.");
    }
    return await createSession(ctx, email);
  },
});

// ── query: is this token still valid? ─────────────────────────────────────────
export const validate = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!session || session.expiresAt < Date.now()) return null;
    return { email: session.email };
  },
});

// Internal helper used by content queries/actions to gate access.
export const requireSession = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!session || session.expiresAt < Date.now()) return null;
    return { email: session.email };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (session) await ctx.db.delete(session._id);
    return { ok: true };
  },
});
