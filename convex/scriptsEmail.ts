import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Email the finalized script PDF to the organizer. The PDF is generated in the
// browser; here we just attach the base64 and send it via Resend.
export const sendPdf = action({
  args: {
    token: v.string(),
    filename: v.string(),
    base64: v.string(), // PDF bytes, base64 (no data: prefix)
    subject: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ ok: boolean; emailed: boolean; reason?: string }> => {
    const session = await ctx.runQuery(internal.scriptsAuth.requireSession, {
      token: args.token,
    });
    if (!session) return { ok: false, emailed: false, reason: "not-authorized" };

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.SCRIPTS_FROM_EMAIL || "toward.love <onboarding@resend.dev>";
    const to = process.env.SCRIPTS_PDF_TO || "justynajanczyszyn@gmail.com";
    if (!apiKey) return { ok: false, emailed: false, reason: "email-not-configured" };

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: args.subject || "Your finalized toward.love event script",
          text:
            (args.note ? args.note + "\n\n" : "") +
            "Your finalized script is attached as a PDF.\n\n— script.toward.love",
          attachments: [{ filename: args.filename, content: args.base64 }],
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false, emailed: false, reason: `resend-${res.status}: ${body.slice(0, 200)}` };
      }
      return { ok: true, emailed: true };
    } catch (e) {
      return { ok: false, emailed: false, reason: String(e).slice(0, 200) };
    }
  },
});
