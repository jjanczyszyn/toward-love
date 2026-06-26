#!/usr/bin/env bash
# Rebuild the private scripts.json from content/scripts/*.md and push the Lambda
# backend code that serves them. Usage:  bash scripts/deploy-lambda.sh
set -euo pipefail
cd "$(dirname "$0")/.."

FN="${FN:-toward-love-scripts}"
REGION="${AWS_REGION:-us-east-1}"

echo "→ Building private scripts.json"
node scripts/build-scripts-json.mjs infra/lambda/scripts.json

echo "→ Zipping function"
( cd infra/lambda && rm -f function.zip && zip -q function.zip index.mjs scripts.json )

echo "→ Updating Lambda $FN"
aws lambda update-function-code --region "$REGION" \
  --function-name "$FN" \
  --zip-file fileb://infra/lambda/function.zip \
  --query '{Fn:FunctionName,State:State,Updated:LastUpdateStatus}' --output json

echo "✓ Lambda updated. (Scripts live only in the Lambda package — never in git/web bundle.)"
