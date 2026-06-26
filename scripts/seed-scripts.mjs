#!/usr/bin/env node
// Seed the private script library into Convex from the local (gitignored) files
// in content/scripts/*.md. The content NEVER lives in git — only in the database.
//
// Usage:
//   node scripts/seed-scripts.mjs
// Env:
//   VITE_CONVEX_URL   (defaults to value in .env.local)
//   SCRIPTS_PASSWORD  (must match the Convex env var; defaults to "toward-love-2026")
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function readEnvLocal() {
  try {
    const txt = readFileSync(join(root, ".env.local"), "utf8");
    const out = {};
    for (const line of txt.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim();
    }
    return out;
  } catch {
    return {};
  }
}

const envLocal = readEnvLocal();
const CONVEX_URL =
  process.env.VITE_CONVEX_URL || envLocal.VITE_CONVEX_URL || "http://127.0.0.1:3212";
const ADMIN_PASSWORD = process.env.SCRIPTS_PASSWORD || "toward-love-2026";

const SECTION_RE = /^##\s+\[([a-z0-9-]+)\]\s+(.+?)(?:\s+—\s+(\d{1,2}:\d{2}))?\s*$/;

function parseScript(filename, raw) {
  const lines = raw.split("\n");
  const slug = filename.replace(/\.md$/, "");
  const order = parseInt(slug.match(/^(\d+)/)?.[1] ?? "999", 10);

  // Title line: "# <Title> — \"<Theme>\""
  let title = slug,
    theme = slug,
    tone = "";
  const titleLine = lines.find((l) => /^#\s+/.test(l));
  if (titleLine) {
    const rest = titleLine.replace(/^#\s+/, "").trim();
    const quoted = rest.match(/["“](.+?)["”]/);
    if (quoted) theme = quoted[1];
    title = rest.split("—")[0].replace(/["“”]/g, "").trim() || theme;
    // Tone: first non-empty, non-heading line after the title.
    const idx = lines.indexOf(titleLine);
    for (let i = idx + 1; i < lines.length; i++) {
      const t = lines[i].trim();
      if (!t) continue;
      if (t.startsWith("#")) break;
      tone = t.replace(/^[*_>\s]+|[*_\s]+$/g, "");
      break;
    }
  }

  const sections = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(SECTION_RE);
    if (m) {
      if (cur) sections.push(cur);
      cur = { id: m[1], title: m[2].trim(), duration: m[3] || "", body: [] };
    } else if (cur) {
      cur.body.push(line);
    }
  }
  if (cur) sections.push(cur);

  return {
    slug,
    order,
    title,
    theme,
    tone,
    sections: sections.map((s) => ({
      id: s.id,
      title: s.title,
      duration: s.duration || undefined,
      markdown: s.body.join("\n").trim(),
    })),
  };
}

async function main() {
  const dir = join(root, "content", "scripts");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();
  if (!files.length) {
    console.error("No scripts found in content/scripts/");
    process.exit(1);
  }
  const scripts = files.map((f) => parseScript(f, readFileSync(join(dir, f), "utf8")));

  for (const s of scripts) {
    const missing = s.sections.length !== 12;
    console.log(
      `  ${s.slug.padEnd(22)} "${s.theme}" — ${s.sections.length} sections${missing ? "  ⚠️ expected 12" : ""}`,
    );
  }

  const client = new ConvexHttpClient(CONVEX_URL);
  const res = await client.mutation(api.scriptsContent.seedReplace, {
    adminPassword: ADMIN_PASSWORD,
    scripts,
  });
  console.log(`\n✓ Seeded ${res.count} scripts into Convex at ${CONVEX_URL}`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message || e);
  process.exit(1);
});
