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

bash tools/scripts/verify-generator-manifest.sh

echo "==> Verifying root Foundry command"
bun run foundry -- generate --list >/dev/null

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

bash tools/scripts/verify-contracts.sh
bash tools/scripts/verify-generated.sh
bash tools/scripts/verify-generators.sh

echo "==> Verification complete"

# BEGIN foundry init smoke verification
if [[ "${FOUNDRY_SKIP_INIT_VERIFY:-0}" != "1" ]]; then
  echo "verify: init smoke tests"
  bash "$ROOT_DIR/tools/scripts/verify-init.sh"
else
  echo "verify: init smoke tests skipped because FOUNDRY_SKIP_INIT_VERIFY=1"
fi
# END foundry init smoke verification

bash "$ROOT_DIR/tools/scripts/verify-init-provider-plugins.sh"

bash "$ROOT_DIR/tools/scripts/verify-init-external-provider-plugins.sh"

bash "$ROOT_DIR/tools/scripts/verify-init-upgrade.sh"

bash "$ROOT_DIR/tools/scripts/verify-manifest.sh"
