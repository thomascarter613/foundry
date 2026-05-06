#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

echo "verify:init-provider-plugins: checking built-in provider plugin contracts"

bun run packages/cli/src/init/database/verify-plugin-contracts.ts
