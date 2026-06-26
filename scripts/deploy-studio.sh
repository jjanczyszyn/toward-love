#!/usr/bin/env bash
# Build the Script Studio frontend and deploy it to https://script.toward.love
# (S3 origin + CloudFront, ACM TLS). The frontend is just the login gate + UI —
# no script content (that's served by the AWS Lambda).
#
# Usage:  bash scripts/deploy-studio.sh
set -euo pipefail
cd "$(dirname "$0")/.."

: "${VITE_SCRIPTS_API:=https://y3jayphrrf.execute-api.us-east-1.amazonaws.com/}"
BUCKET="${STUDIO_BUCKET:-toward-love-script-site}"
DIST_ID="${STUDIO_CF_ID:-E1CYBN1WGUVCHO}"
export VITE_SCRIPTS_API

echo "→ Building studio (API: $VITE_SCRIPTS_API)"
npx vite build --config vite.studio.config.ts

echo "→ Uploading to s3://$BUCKET"
aws s3 cp dist-studio/scripts.html "s3://$BUCKET/index.html" \
  --content-type text/html --cache-control "no-cache"
aws s3 sync dist-studio/assets "s3://$BUCKET/assets" \
  --cache-control "public,max-age=31536000,immutable" --delete

echo "→ Invalidating CloudFront $DIST_ID"
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" \
  --query 'Invalidation.Status' --output text

echo "✓ Deployed to https://script.toward.love"
