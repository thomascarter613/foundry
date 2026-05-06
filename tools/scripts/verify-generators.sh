#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

CLI_BIN="packages/cli/bin/run.js"

if [[ ! -f "$CLI_BIN" ]]; then
  echo "Missing Foundry CLI executable: $CLI_BIN" >&2
  exit 1
fi

SMOKE_STAMP="$(date +%s)-$$"
SMOKE_PACKAGE_NAME="smoke-package-$SMOKE_STAMP"
SMOKE_SERVICE_NAME="smoke-service-$SMOKE_STAMP"
SMOKE_CLIENT_NAME="smoke-client-$SMOKE_STAMP"

SMOKE_PACKAGE_DIR="packages/$SMOKE_PACKAGE_NAME"
SMOKE_SERVICE_DIR="services/$SMOKE_SERVICE_NAME"
SMOKE_CLIENT_DIR="generated/clients/$SMOKE_CLIENT_NAME"
SMOKE_ORVAL_CONFIG=".artifacts/foundry/orval/$SMOKE_CLIENT_NAME.orval.config.ts"

SMOKE_ADR_IDENTIFIER=""
SMOKE_ADR_PATH=""

cleanup() {
  if [[ -n "$SMOKE_ADR_PATH" && -f "$SMOKE_ADR_PATH" ]]; then
    rm -f "$SMOKE_ADR_PATH"
  fi
  rm -f docs/adr/ADR-9*-smoke-test-adr.md
  rm -f docs/adr/ADR-9*-smoke-test-a-d-r.md
  rm -f docs/adr/ADR-9*-smoke-test-decision.md
  rm -f docs/adr/ADR-9*-smoke*.md
  rm -f docs/adr/ADR-9*-smoke-test-adr.md
  rm -f docs/adr/ADR-9*-smoke-test-a-d-r.md
  rm -f docs/adr/ADR-9*-smoke-test-decision.md
  rm -rf "$SMOKE_PACKAGE_DIR"
  rm -rf "$SMOKE_SERVICE_DIR"
  rm -rf "$SMOKE_CLIENT_DIR"
  rm -f "$SMOKE_ORVAL_CONFIG"
}

trap cleanup EXIT

assert_contains() {
  local haystack="$1"
  local needle="$2"

  if ! grep -Fq "$needle" <<<"$haystack"; then
    echo "Expected output to contain: $needle" >&2
    echo "Actual output:" >&2
    echo "$haystack" >&2
    exit 1
  fi
}

run_expect_success() {
  local output
  output="$("$@" 2>&1)"
  echo "$output"
}

run_expect_failure() {
  local output
  local exit_code

  set +e
  output="$("$@" 2>&1)"
  exit_code="$?"
  set -e

  if [[ "$exit_code" -eq 0 ]]; then
    echo "Expected command to fail, but it succeeded:" >&2
    printf ' %q' "$@" >&2
    echo >&2
    echo "$output" >&2
    exit 1
  fi

  echo "$output"
}

choose_unused_smoke_adr() {
  local number
  local identifier
  local candidate_path

  for number in $(seq 9000 9999); do
    identifier="ADR-$number"
    candidate_path="docs/adr/${identifier}-smoke-test-decision.md"

    if [[ ! -e "$candidate_path" ]]; then
      SMOKE_ADR_IDENTIFIER="$identifier"
      SMOKE_ADR_PATH="$candidate_path"
      return 0
    fi
  done

  echo "Could not find an unused smoke ADR identifier in ADR-9000..ADR-9999" >&2
  exit 1
}

echo "==> Verifying generator registry"
registry_output="$(run_expect_success node "$CLI_BIN" generate --list)"
assert_contains "$registry_output" "governance-artifact:adr"
assert_contains "$registry_output" "package:typescript-library"
assert_contains "$registry_output" "service:hono-api"
assert_contains "$registry_output" "contract-artifact:openapi-typescript-client"

echo "==> Verifying package generator dry-run preview"
preview_output="$(
  run_expect_success node "$CLI_BIN" generate \
    --generator package:typescript-library \
    --name "$SMOKE_PACKAGE_NAME"
)"
assert_contains "$preview_output" "Dry run: yes"
assert_contains "$preview_output" "$SMOKE_PACKAGE_DIR/package.json"
assert_contains "$preview_output" "No scaffolded project files were written"

echo "==> Verifying planned audit event output"
audit_preview_output="$(
  run_expect_success node "$CLI_BIN" generate \
    --generator package:typescript-library \
    --name "$SMOKE_PACKAGE_NAME" \
    --audit-event
)"
assert_contains "$audit_preview_output" '"eventType": "generator.plan.created"'
assert_contains "$audit_preview_output" '"result": "planned"'

echo "==> Verifying invalid input blocking"
invalid_output="$(
  run_expect_failure node "$CLI_BIN" generate \
    --generator package:typescript-library \
    --name "../bad" \
    --execute
)"
assert_contains "$invalid_output" "Generator execution was blocked because the plan has unresolved"
assert_contains "$invalid_output" "issues."
assert_contains "$invalid_output" "Input \"name\" must not contain path traversal segments"
assert_contains "$invalid_output" "Package name \"../bad\" must not contain path separators"

echo "==> Verifying Plop package generation"
package_output="$(
  run_expect_success node "$CLI_BIN" generate \
    --generator package:typescript-library \
    --name "$SMOKE_PACKAGE_NAME" \
    --execute
)"
assert_contains "$package_output" "Execution preflight:"
assert_contains "$package_output" "result: passed"
assert_contains "$package_output" "Plop execution:"
assert_contains "$package_output" "Scaffolded project files were written"

if [[ ! -f "$SMOKE_PACKAGE_DIR/package.json" ]]; then
  echo "Package generator did not create $SMOKE_PACKAGE_DIR/package.json" >&2
  exit 1
fi

if [[ ! -f "$SMOKE_PACKAGE_DIR/src/index.ts" ]]; then
  echo "Package generator did not create $SMOKE_PACKAGE_DIR/src/index.ts" >&2
  exit 1
fi

echo "==> Verifying package collision preflight"
collision_output="$(
  run_expect_failure node "$CLI_BIN" generate \
    --generator package:typescript-library \
    --name "$SMOKE_PACKAGE_NAME" \
    --execute
)"
assert_contains "$collision_output" "Generator execution was blocked by preflight checks"
assert_contains "$collision_output" "path-already-exists"

echo "==> Verifying generated package scripts"
(
  cd "$SMOKE_PACKAGE_DIR"
  bun run typecheck
  bun run test
  bun run build
)

echo "==> Verifying Scaffdog ADR generation"
choose_unused_smoke_adr

adr_output="$(
  run_expect_success node "$CLI_BIN" generate \
    --generator governance-artifact:adr \
    --identifier "$SMOKE_ADR_IDENTIFIER" \
    --name "Smoke Test Decision" \
    --status proposed \
    --execute
)"
assert_contains "$adr_output" "Scaffdog execution:"
assert_contains "$adr_output" "Scaffolded project files were written"

mapfile -t generated_adr_candidates < <(
  find docs/adr -maxdepth 1 -type f -name "${SMOKE_ADR_IDENTIFIER}-*.md" -print | sort
)

if [[ "${#generated_adr_candidates[@]}" -ne 1 ]]; then
  echo "Scaffdog ADR generator did not create exactly one ADR for $SMOKE_ADR_IDENTIFIER" >&2
  echo "Expected one file matching: docs/adr/${SMOKE_ADR_IDENTIFIER}-*.md" >&2
  echo "Found:" >&2

  if [[ "${#generated_adr_candidates[@]}" -eq 0 ]]; then
    find . -type f -name "*${SMOKE_ADR_IDENTIFIER}*" -print | sort >&2 || true
  else
    printf '%s\n' "${generated_adr_candidates[@]}" >&2
  fi

  echo "" >&2
  echo "Scaffdog command output was:" >&2
  echo "$adr_output" >&2
  exit 1
fi

SMOKE_ADR_PATH="${generated_adr_candidates[0]}"
echo "==> Scaffdog ADR created: $SMOKE_ADR_PATH"

echo "==> Verifying Copier Hono service generation"
service_output="$(
  run_expect_success node "$CLI_BIN" generate \
    --generator service:hono-api \
    --name "$SMOKE_SERVICE_NAME" \
    --execute
)"
assert_contains "$service_output" "Copier execution:"
assert_contains "$service_output" "Scaffolded project files were written"

if [[ ! -f "$SMOKE_SERVICE_DIR/package.json" ]]; then
  echo "Copier service generator did not create $SMOKE_SERVICE_DIR/package.json" >&2
  exit 1
fi

if [[ ! -f "$SMOKE_SERVICE_DIR/src/index.ts" ]]; then
  echo "Copier service generator did not create $SMOKE_SERVICE_DIR/src/index.ts" >&2
  exit 1
fi

echo "==> Verifying Orval OpenAPI client generation"
if [[ ! -f "contracts/openapi/gov-api.yaml" ]]; then
  echo "Missing sample OpenAPI contract: contracts/openapi/gov-api.yaml" >&2
  exit 1
fi

client_output="$(
  run_expect_success node "$CLI_BIN" generate \
    --generator contract-artifact:openapi-typescript-client \
    --name "$SMOKE_CLIENT_NAME" \
    --contract "contracts/openapi/gov-api.yaml" \
    --execute
)"
assert_contains "$client_output" "Orval execution:"
assert_contains "$client_output" "Scaffolded project files were written"

if [[ ! -f "$SMOKE_CLIENT_DIR/index.ts" ]]; then
  echo "Orval generator did not create $SMOKE_CLIENT_DIR/index.ts" >&2
  exit 1
fi

if [[ ! -d "$SMOKE_CLIENT_DIR/model" ]]; then
  echo "Orval generator did not create $SMOKE_CLIENT_DIR/model" >&2
  exit 1
fi

echo "==> Generator smoke tests verified"
