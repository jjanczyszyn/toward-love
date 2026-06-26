#!/usr/bin/env node
// Parse content/scripts/*.md → a single JSON the Lambda embeds (private; gitignored).
// Usage: node scripts/build-scripts-json.mjs [outPath]
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outPath = process.argv[2] || join(root, "infra", "lambda", "scripts.json");

const SECTION_RE = /^##\s+\[([a-z0-9-]+)\]\s+(.+?)(?:\s+—\s+(\d{1,2}:\d{2}))?\s*$/;

function parseScript(filename, raw) {
  const lines = raw.split("\n");
  const slug = filename.replace(/\.md$/, "");
  const order = parseInt(slug.match(/^(\d+)/)?.[1] ?? "999", 10);
  let title = slug, theme = slug, tone = "";
  const titleLine = lines.find((l) => /^#\s+/.test(l));
  if (titleLine) {
    const rest = titleLine.replace(/^#\s+/, "").trim();
    const quoted = rest.match(/["“](.+?)["”]/);
    if (quoted) theme = quoted[1];
    title = rest.split("—")[0].replace(/["“”]/g, "").trim() || theme;
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
    } else if (cur) cur.body.push(line);
  }
  if (cur) sections.push(cur);
  return {
    slug, order, title, theme, tone,
    sections: sections.map((s) => ({
      id: s.id, title: s.title, duration: s.duration || undefined,
      markdown: s.body.join("\n").trim(),
    })),
  };
}

const dir = join(root, "content", "scripts");
const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
const scripts = files.map((f) => parseScript(f, readFileSync(join(dir, f), "utf8")));
scripts.sort((a, b) => a.order - b.order);
writeFileSync(outPath, JSON.stringify(scripts));
console.log(`Wrote ${scripts.length} scripts (${files.length} files) → ${outPath}`);
for (const s of scripts)
  console.log(`  ${s.slug.padEnd(22)} ${s.sections.length} sections`);
