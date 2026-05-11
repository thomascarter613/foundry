#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

echo "verify:manifest-command: checking manifest validate command"

bun run packages/cli/src/manifest/verify-command.ts
