#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "==> Verifying OpenAPI contracts"

if [[ ! -d "contracts/openapi" ]]; then
  echo "No contracts/openapi directory found; skipping OpenAPI contract verification"
  exit 0
fi

contract_count=0

while IFS= read -r contract_file; do
  contract_count=$((contract_count + 1))
  echo "==> Linting $contract_file"
  bunx @redocly/cli lint "$contract_file"
done < <(find contracts/openapi -type f \( -name '*.yaml' -o -name '*.yml' -o -name '*.json' \) -print | sort)

if [[ "$contract_count" -eq 0 ]]; then
  echo "No OpenAPI contracts found under contracts/openapi" >&2
  exit 1
fi

echo "==> OpenAPI contracts verified"
