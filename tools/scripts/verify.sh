#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "==> Checking git diff whitespace"
git diff --check

echo "==> Verifying Foundry CLI"
if [[ -d "packages/cli" ]]; then
  (
    cd packages/cli
    bun run typecheck
    bun run build
  )
fi

echo "==> Verifying workspace packages"
if [[ -d "packages" ]]; then
  for package_dir in packages/*; do
    [[ -d "$package_dir" ]] || continue
    [[ -f "$package_dir/package.json" ]] || continue

    package_name="$(basename "$package_dir")"

    if [[ "$package_name" == "cli" ]]; then
      continue
    fi

    echo "==> Verifying packages/$package_name"

    (
      cd "$package_dir"

      if bun run | grep -q "typecheck"; then
        bun run typecheck
      fi

      if bun run | grep -q "test"; then
        bun run test
      fi

      if bun run | grep -q "build"; then
        bun run build
      fi
    )
  done
fi

echo "==> Verifying workspace services"
if [[ -d "services" ]]; then
  for service_dir in services/*; do
    [[ -d "$service_dir" ]] || continue
    [[ -f "$service_dir/package.json" ]] || continue

    service_name="$(basename "$service_dir")"
    echo "==> Verifying services/$service_name"

    (
      cd "$service_dir"

      if bun run | grep -q "typecheck"; then
        bun run typecheck
      fi

      if bun run | grep -q "test"; then
        bun run test
      fi

      if bun run | grep -q "build"; then
        bun run build
      fi
    )
  done
fi

echo "==> Verification complete"
