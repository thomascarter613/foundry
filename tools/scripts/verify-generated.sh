#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "==> Verifying generated artifact hygiene"

if [[ ! -f "generated/README.md" ]]; then
  echo "Missing generated/README.md" >&2
  exit 1
fi

if [[ ! -f "generated/clients/README.md" ]]; then
  echo "Missing generated/clients/README.md" >&2
  exit 1
fi

tracked_artifacts="$(git ls-files .artifacts || true)"
if [[ -n "$tracked_artifacts" ]]; then
  echo "Local .artifacts files must not be tracked:" >&2
  echo "$tracked_artifacts" >&2
  exit 1
fi

if [[ -d "generated/clients" ]]; then
  for client_dir in generated/clients/*; do
    [[ -d "$client_dir" ]] || continue

    client_name="$(basename "$client_dir")"

    if [[ "$client_name" == "README.md" ]]; then
      continue
    fi

    echo "==> Checking generated client: $client_name"

    if [[ ! -f "$client_dir/index.ts" ]]; then
      echo "Generated client is missing index.ts: $client_dir" >&2
      exit 1
    fi

    if [[ ! -d "$client_dir/model" ]]; then
      echo "Generated client is missing model directory: $client_dir" >&2
      exit 1
    fi
  done
fi

echo "==> Generated artifact hygiene verified"
