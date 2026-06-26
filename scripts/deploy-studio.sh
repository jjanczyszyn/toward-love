#!/usr/bin/env bash
# Build the Script Studio frontend and deploy it to the GitHub Pages repo that
# serves https://script.toward.love (jjanczyszyn/toward-love-script).
#
# The frontend is just the login gate + UI — no script content (that's served by
# the AWS Lambda). Usage:  bash scripts/deploy-studio.sh
set -euo pipefail
cd "$(dirname "$0")/.."

: "${VITE_SCRIPTS_API:=https://y3jayphrrf.execute-api.us-east-1.amazonaws.com/}"
PAGES_REPO="${PAGES_REPO:-jjanczyszyn/toward-love-script}"
export VITE_SCRIPTS_API

echo "→ Building studio (API: $VITE_SCRIPTS_API)"
npx vite build --config vite.studio.config.ts

TMP="$(mktemp -d)"
echo "→ Cloning $PAGES_REPO"
git clone --depth 1 "https://github.com/$PAGES_REPO" "$TMP" >/dev/null 2>&1

rm -rf "$TMP/assets" "$TMP/index.html"
cp dist-studio/scripts.html "$TMP/index.html"
cp -r dist-studio/assets "$TMP/assets"
printf 'script.toward.love\n' > "$TMP/CNAME"
touch "$TMP/.nojekyll"

cd "$TMP"
git add -A
if git diff --cached --quiet; then
  echo "→ No changes to deploy."
else
  git commit -q -m "Deploy Script Studio $(date -u +%Y-%m-%dT%H:%MZ)"
  git push -q origin HEAD
  echo "✓ Deployed to https://script.toward.love"
fi
rm -rf "$TMP"
