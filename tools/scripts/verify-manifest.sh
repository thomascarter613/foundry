#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

TMP_DIRS=(
  "tmp-foundry-manifest-no-db-test"
  "tmp-foundry-manifest-db-test"
)

cleanup() {
  for dir in "${TMP_DIRS[@]}"; do
    rm -rf "$ROOT_DIR/$dir"
    rm -rf "$ROOT_DIR/packages/cli/$dir"
  done
}

trap cleanup EXIT

cleanup

echo "verify:manifest: validating default manifest examples"

bun run packages/cli/src/manifest/verify-manifest-contract.ts

echo "verify:manifest: validating generated no-database workspace manifest"

bun run foundry -- init tmp-foundry-manifest-no-db-test \
  --no-database \
  --yes \
  --no-install

bun run packages/cli/src/manifest/verify-manifest-contract.ts \
  tmp-foundry-manifest-no-db-test/.foundry/manifest.json

echo "verify:manifest: validating generated database workspace manifest"

bun run foundry -- init tmp-foundry-manifest-db-test \
  --database-provider supabase:client \
  --yes \
  --no-install

bun run packages/cli/src/manifest/verify-manifest-contract.ts \
  tmp-foundry-manifest-db-test/.foundry/manifest.json

cleanup

echo "verify:manifest: ok"
