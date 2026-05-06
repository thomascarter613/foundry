#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

echo "verify:init-external-provider-plugins: checking external provider plugin loading"

bun run packages/cli/src/init/database/verify-external-plugin-loading.ts
