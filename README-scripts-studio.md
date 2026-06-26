# script.toward.love — the private Script Studio

A login-gated tool to read the 10 facilitation scripts, mix-and-match their
sections into one final script, and download or email it as a PDF.

**Live:** https://script.toward.love (login by email code to `hello@toward.love`).

## Architecture (all AWS)

```
Browser ── https://script.toward.love (S3 + CloudFront + ACM TLS)
   │         static login gate + UI only — NO script content in the bundle
   │
   └── POST ─► API Gateway HTTP API ─► Lambda  (toward-love-scripts)
                                         │  • request_code  → SES emails a 6-digit code to hello@toward.love
                                         │  • verify_code   → issues a 30-day session token (DynamoDB)
                                         │  • list_scripts  → returns the 10 scripts (only with a valid token)
                                         │  • email_pdf     → SES emails the finalized PDF
                                         ▼
                              DynamoDB  toward-love-scripts-auth  (codes + sessions, TTL)
```

- **Login:** email code only. The only accepted address is `hello@toward.love`.
  The code is sent there via **SES**, and your existing `multi-domain-email-forwarder`
  forwards `hello@toward.love` to your real inbox — so the code lands with you.
- **Script content** is embedded in the **Lambda deployment package** (private) and
  returned only to an authenticated session. It is **never** in this public repo nor
  in the web bundle (the markdown lives only in gitignored `content/scripts/*.md`).
- **Email** (login codes + the PDF) uses **SES** — no Resend, no passwords.

## AWS resources (account 038979314594, us-east-1)

| Resource | Name |
|---|---|
| Lambda | `toward-love-scripts` |
| API Gateway HTTP API | `toward-love-scripts` → `https://y3jayphrrf.execute-api.us-east-1.amazonaws.com/` |
| DynamoDB | `toward-love-scripts-auth` (PK `pk`, TTL `ttl`) |
| IAM role | `toward-love-scripts-lambda` (SES send, DynamoDB RW, logs) |
| Static host | S3 `toward-love-script-site` (private) + CloudFront `E1CYBN1WGUVCHO` (`d44uhn5xf8780.cloudfront.net`) |
| TLS | ACM cert for `script.toward.love` (us-east-1) |
| DNS (Route53 `toward.love`) | `script.toward.love` A/AAAA alias → CloudFront; CAA permits Amazon |

> Note: GitHub Pages was the first attempt but its custom-domain cert was unreliable,
> and the `*.toward.love` wildcard CNAME made ACM CAA checks fail. Resolved by hosting
> on S3+CloudFront with a dedicated ACM cert and a CAA record at `script.toward.love`.
> The unused `jjanczyszyn/toward-love-script` Pages repo can be deleted.

Lambda env: `ALLOWED_EMAIL=hello@toward.love`, `FROM_EMAIL=toward.love <no-reply@toward.love>`,
`PDF_TO=justynajanczyszyn@gmail.com`, `TABLE`, `SALT`.

## Repo layout

| Piece | Path |
|---|---|
| The 10 scripts (private, gitignored) | `content/scripts/*.md` (+ `content/SPEC.md`) |
| Studio page | `scripts.html` → `src/scripts/main.tsx` |
| UI (login, compose, browse, PDF) | `src/scripts/{ScriptsApp.tsx,api.ts,pdf.ts,scripts.css}` |
| Studio-only build | `vite.studio.config.ts` → `dist-studio/` |
| Lambda backend | `infra/lambda/index.mjs` (+ generated `scripts.json`, gitignored) |
| Build scripts.json from md | `scripts/build-scripts-json.mjs` |
| Deploy frontend | `scripts/deploy-studio.sh` (`npm run deploy:studio`) |
| Deploy backend | `scripts/deploy-lambda.sh` (`npm run deploy:lambda`) |

## Editing scripts / redeploying

```sh
# 1) edit content/scripts/*.md   (keep the "## [id] Title — MM:SS" headers intact)
npm run deploy:lambda     # rebuild scripts.json + push the Lambda (content update)
npm run deploy:studio     # rebuild + push the frontend to script.toward.love (UI update)
```

`deploy:lambda` regenerates `infra/lambda/scripts.json` from the markdown and updates
the function code. `deploy:studio` builds the gate/UI and pushes to the Pages repo.

## Run locally

```sh
npm install
VITE_SCRIPTS_API="https://y3jayphrrf.execute-api.us-east-1.amazonaws.com/" \
  npm run build:studio && npx vite preview --config vite.studio.config.ts
# open the printed URL → /scripts.html
```

## Notes / security

- This repo is **public**. Scripts/transcripts are **gitignored**; they live only in
  the Lambda package (private) and your local `content/`. Never commit `content/`.
- The page is `noindex,nofollow`; script content requires a session token.
- HTTPS: GitHub provisions the TLS cert for `script.toward.love` automatically a few
  minutes after the DNS record resolves. If "Enforce HTTPS" isn't on yet in the
  `toward-love-script` repo's Pages settings, toggle it once the cert is ready.
- The API Gateway endpoint is public but only ever sends codes to `hello@toward.love`
  and returns content to a valid session.
