# toward.love

Dark-theme landing page for the **toward.love** dating event & community.

Two things on the page:
1. **The next event** — a clickable card (cover image + details) linking to the Luma event.
2. **Mailing list** — a short dating questionnaire whose submissions are stored in **Convex**.

## Stack

- **Vite + React + TypeScript** — static frontend, hosted on **GitHub Pages** at the `toward.love` root.
- **Convex** — backend/database for mailing-list signups (`convex/`). Project: `toward-love` (separate from other projects).
- **Google Analytics (GA4)** — optional; activates when the `VITE_GA_ID` build variable is set.

## Questionnaire fields (stored per signup)

| Field | Notes |
|---|---|
| Email | required, lowercased; re-submitting the same email updates the row |
| First / last name | both required |
| Gender | Male · Female · Non-binary · Other (free text) |
| Sexual orientation | Heterosexual · Homosexual · Bisexual · Pansexual · Asexual · Other (free text) |
| Relationship preference | Monogamous · Non-monogamous · Other (free text) |
| Have kids? | Yes · No |
| Want (more) kids? | Yes · No · Maybe · Open to it (independent of the above) |
| Message | optional free text for requests/desires for future events |

Schema: `convex/schema.ts`. Signup mutation (validation + upsert-by-email): `convex/signups.ts`.

## Run locally

Convex runs a **local, anonymous** dev backend — no login needed to test.

```sh
npm install
npm run dev:all      # Vite (http://localhost:5173) + Convex dev together
```

`npx convex dev` writes `.env.local` with `VITE_CONVEX_URL`. Without it, the form shows a
"backend not connected" notice. Inspect signups with `npx convex data signups`.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which:
1. `npx convex deploy --cmd "npm run build"` — pushes the backend to the production Convex
   deployment and builds the frontend with the production `VITE_CONVEX_URL` baked in, and
2. publishes `dist/` to GitHub Pages (custom domain `toward.love`, set via `public/CNAME`).

Repo configuration:
- **Settings → Pages → Source: GitHub Actions**
- Secret **`CONVEX_DEPLOY_KEY`** — production Convex deploy key.
- Optional variable **`VITE_GA_ID`** (`G-XXXXXXXXXX`) — enables Google Analytics.

### Enable Google Analytics later

Create a GA4 property, then add a repo **variable** `VITE_GA_ID` with the Measurement ID and
re-run the deploy. The snippet in `src/main.tsx` loads gtag only when that variable is set.
