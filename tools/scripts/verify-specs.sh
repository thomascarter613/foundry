#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

export FOUNDRY_WORKSPACE_CWD="$ROOT_DIR"

ARTIFACT_DIR="$ROOT_DIR/.artifacts/foundry/spec-validation"
VALID_SPEC="packages/cli/fixtures/specs/0001-example/spec.md"
INVALID_SPEC="$ARTIFACT_DIR/invalid-spec.md"

cleanup() {
  rm -rf "$ARTIFACT_DIR"
}

trap cleanup EXIT

echo "verify:specs: checking native spec validation"

if [[ ! -f "$VALID_SPEC" ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Missing valid spec fixture: $VALID_SPEC"
  exit 1
fi

echo "verify:specs: validating known-good spec"
bash tools/scripts/foundry.sh spec validate "$VALID_SPEC" >/tmp/foundry-valid-spec.out

if ! grep -q "Foundry spec validation: passed" /tmp/foundry-valid-spec.out; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected valid spec validation to pass."
  echo ""
  echo "Output:"
  cat /tmp/foundry-valid-spec.out
  exit 1
fi

mkdir -p "$ARTIFACT_DIR"

cat > "$INVALID_SPEC" <<'INVALID_SPEC_EOF'
---
id: BAD-1
title: Invalid Spec
status: active
specStatus: draft
kind: feature
version: 0.1.0
created: 2026-05-11
updated: 2026-05-11
lastUpdated: 2026-05-11
owner: project-owner
owners:
  - project-maintainer
governanceLevel: project
documentType: spec
related_adrs: []
related_work_packets: []
risk_level: low
requires_ai: false
requires_database_change: false
requires_api_change: false
requires_security_review: false
requires_migration: false
tags:
  - spec
  - invalid-fixture
---

# Invalid Spec

## Summary

This intentionally invalid spec exists to verify that the validator rejects bad specs.
INVALID_SPEC_EOF

echo "verify:specs: validating known-bad spec"

set +e
bash tools/scripts/foundry.sh spec validate "$INVALID_SPEC" >/tmp/foundry-invalid-spec.out 2>/tmp/foundry-invalid-spec.err
INVALID_EXIT_CODE=$?
set -e

if [[ "$INVALID_EXIT_CODE" -eq 0 ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected invalid spec validation to fail, but it passed."
  echo ""
  echo "Output:"
  cat /tmp/foundry-invalid-spec.out
  echo ""
  echo "Error:"
  cat /tmp/foundry-invalid-spec.err
  exit 1
fi

if ! grep -q "invalid-spec-id" /tmp/foundry-invalid-spec.out; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected invalid spec output to include invalid-spec-id."
  echo ""
  echo "Output:"
  cat /tmp/foundry-invalid-spec.out
  exit 1
fi

if ! grep -q "missing-required-section" /tmp/foundry-invalid-spec.out; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected invalid spec output to include missing-required-section."
  echo ""
  echo "Output:"
  cat /tmp/foundry-invalid-spec.out
  exit 1
fi

echo "verify:specs: validating JSON output"

JSON_OUTPUT="$(bash tools/scripts/foundry.sh spec validate "$VALID_SPEC" --json)"

if ! echo "$JSON_OUTPUT" | grep -q '"ok": true'; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected JSON output to include \"ok\": true."
  echo ""
  echo "Output:"
  echo "$JSON_OUTPUT"
  exit 1
fi

if ! echo "$JSON_OUTPUT" | grep -q '"warningsAsErrors": false'; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected JSON output to include \"warningsAsErrors\": false."
  echo ""
  echo "Output:"
  echo "$JSON_OUTPUT"
  exit 1
fi

rm -f /tmp/foundry-valid-spec.out
rm -f /tmp/foundry-invalid-spec.out
rm -f /tmp/foundry-invalid-spec.err

echo "verify:specs: passed"
