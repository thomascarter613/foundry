#!/usr/bin/env bash
set -euo pipefail

export FOUNDRY_INVOCATION_CWD="${FOUNDRY_INVOCATION_CWD:-$PWD}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CLI_DIR="$ROOT_DIR/packages/cli"

if [[ ! -d "$CLI_DIR" ]]; then
  echo "Missing Foundry CLI package: $CLI_DIR" >&2
  exit 1
fi

if [[ ! -f "$CLI_DIR/package.json" ]]; then
  echo "Missing Foundry CLI package.json: $CLI_DIR/package.json" >&2
  exit 1
fi

cd "$CLI_DIR"

bun run build >/dev/null

exec node ./bin/run.js "$@"
