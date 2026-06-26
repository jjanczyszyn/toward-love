# script.toward.love — the private Script Studio

A login-gated tool to read the 10 facilitation scripts, mix-and-match their
sections into one final script, and download/email it as a PDF.

**The script content never lives in this (public) repo.** It is authored in the
gitignored `content/scripts/*.md` files and stored only in the Convex database,
returned exclusively to an authenticated session. The web bundle ships only the
login gate + UI shell — no scripts.

## What's where

| Piece | Path |
|---|---|
| The 10 scripts (private, gitignored) | `content/scripts/*.md` |
| Authoring brief | `content/SPEC.md` |
| Page entry | `scripts.html` → `src/scripts/main.tsx` |
| UI (login, compose, browse, PDF) | `src/scripts/ScriptsApp.tsx`, `src/scripts/pdf.ts`, `src/scripts/scripts.css` |
| Auth backend | `convex/scriptsAuth.ts` |
| Content query + admin seed | `convex/scriptsContent.ts` |
| Email-the-PDF action | `convex/scriptsEmail.ts` |
| DB tables | `convex/schema.ts` (`scriptDocs`, `sessions`, `loginCodes`) |
| Seeder (reads local files → Convex) | `scripts/seed-scripts.mjs` (`npm run seed:scripts`) |

## Run it locally (fully working today)

```sh
npm install
npm run dev:all          # Vite + local Convex
npx convex env set SCRIPTS_PASSWORD "choose-a-password"   # one time
npm run seed:scripts     # loads content/scripts/*.md into Convex
# open http://localhost:5173/scripts.html
```

Sign in with email **hello@toward.love** + that password. (The current local
deployment already has `SCRIPTS_PASSWORD=toward-love-2026` set and the scripts
seeded.) Pick a version per section, then **Download PDF** or **Email the PDF to
me**.

## Login: how it works

Two ways in, both enforced **server-side** (content is never returned without a
valid session token):

1. **Emailed code** — "Email me a login code" sends a 6-digit code to
   `hello@toward.love` (requires `RESEND_API_KEY`, below). Enter it to sign in.
2. **Password** — `SCRIPTS_PASSWORD` (a Convex env var). Works with no email setup,
   so you're never locked out.

Only `hello@toward.love` is ever accepted. Sessions last 30 days (localStorage).

## Environment variables (set on the Convex deployment)

| Var | Purpose | Required? |
|---|---|---|
| `SCRIPTS_PASSWORD` | Master password + seed auth | Yes |
| `RESEND_API_KEY` | Send login codes + email the PDF (https://resend.com) | Optional |
| `SCRIPTS_FROM_EMAIL` | From address, e.g. `toward.love <hello@toward.love>` | Optional |
| `SCRIPTS_PDF_TO` | Where "Email the PDF" sends (default `justynajanczyszyn@gmail.com`) | Optional |

Set with `npx convex env set NAME value` (add `--prod` for production).
Until `RESEND_API_KEY` is set, "Email the PDF" gracefully **downloads** instead.

## Go live (the steps that need your credentials / DNS)

1. **Push the backend to production Convex** (needs the prod deploy key, already a
   GitHub secret): merging to `main` runs `.github/workflows/deploy.yml`, which does
   `npx convex deploy` + builds the site. Or run `npm run deploy:convex` locally if
   you have the key.
2. **Set prod env**: `npx convex env set SCRIPTS_PASSWORD "…" --prod` (and the
   Resend vars if you want emailed codes / emailed PDFs).
3. **Seed prod**: `VITE_CONVEX_URL=<prod-url> SCRIPTS_PASSWORD=<same> npm run seed:scripts`.
4. **Serve the subdomain `script.toward.love`.** GitHub Pages serves one custom
   domain per repo (this repo's is `toward.love`), so the studio is reachable at
   **`toward.love/scripts.html`** as soon as `main` deploys. To use the
   `script.toward.love` subdomain, pick one:
   - **Redirect (simplest):** at your DNS/registrar (or Cloudflare), add a CNAME
     `script → jjanczyszyn.github.io` and a redirect rule
     `script.toward.love/*` → `https://toward.love/scripts.html`.
   - **Dedicated Pages site:** create a second repo whose Pages `CNAME` is
     `script.toward.love`, publish the same `dist/scripts.html` as its `index.html`,
     and add the `script` CNAME DNS record.

## Re-generating / editing scripts

Edit the files in `content/scripts/`, then `npm run seed:scripts` (re-run with the
prod URL to update production). The seeder replaces the whole library each run.
Section boundaries are the `## [id] Title — MM:SS` headers — keep those intact.

## Security notes

- Repo is **public**; scripts/transcripts are **gitignored** and live only in
  Convex (private). Never commit `content/`.
- The page is `noindex,nofollow`. Content requires a session token to fetch.
- The `seedReplace` mutation requires `SCRIPTS_PASSWORD`.
