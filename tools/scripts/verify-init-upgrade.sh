#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

echo "verify:init-upgrade: checking upgrade planner detection"

bun run packages/cli/src/init/verify-upgrade-detection.ts

echo "verify:init-upgrade: checking command behavior"

rm -rf \
  tmp-foundry-init-upgrade-current \
  tmp-foundry-init-upgrade-not-foundry

bun run foundry -- init tmp-foundry-init-upgrade-current \
  --no-database \
  --yes \
  --no-install

bash tools/scripts/foundry.sh init upgrade tmp-foundry-init-upgrade-current --check

mkdir -p tmp-foundry-init-upgrade-not-foundry

if bash tools/scripts/foundry.sh init upgrade tmp-foundry-init-upgrade-not-foundry --check; then
  echo "Expected init upgrade --check to fail for a non-Foundry workspace." >&2
  exit 1
fi

rm -rf \
  tmp-foundry-init-upgrade-current \
  tmp-foundry-init-upgrade-not-foundry

echo "verify:init-upgrade: ok"
