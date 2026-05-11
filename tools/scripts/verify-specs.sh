#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

export FOUNDRY_WORKSPACE_CWD="$ROOT_DIR"

ARTIFACT_DIR="$ROOT_DIR/.artifacts/foundry/spec-validation"
CREATE_DIR="$ARTIFACT_DIR/generated-specs"
VALID_SPEC="packages/cli/fixtures/specs/0001-example/spec.md"
INVALID_SPEC="$ARTIFACT_DIR/invalid-spec.md"

VALID_OUT="$ARTIFACT_DIR/valid-spec.out"
INVALID_OUT="$ARTIFACT_DIR/invalid-spec.out"
INVALID_ERR="$ARTIFACT_DIR/invalid-spec.err"
JSON_OUT="$ARTIFACT_DIR/json-spec.out"
CREATE_OUT="$ARTIFACT_DIR/create-spec.out"
CREATE_JSON_OUT="$ARTIFACT_DIR/create-spec-json.out"
CLARIFY_OUT="$ARTIFACT_DIR/clarify-spec.out"
CLARIFY_JSON_OUT="$ARTIFACT_DIR/clarify-spec-json.out"
CLARIFY_FAIL_OUT="$ARTIFACT_DIR/clarify-fail-on-blocking.out"
CLARIFY_FAIL_ERR="$ARTIFACT_DIR/clarify-fail-on-blocking.err"

cleanup() {
  rm -rf "$ARTIFACT_DIR"
}

trap cleanup EXIT

mkdir -p "$ARTIFACT_DIR"

echo "verify:specs: checking native spec validation"

if [[ ! -f "$VALID_SPEC" ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Missing valid spec fixture: $VALID_SPEC"
  exit 1
fi

echo "verify:specs: validating known-good spec"
bash tools/scripts/foundry.sh spec validate "$VALID_SPEC" >"$VALID_OUT"

if ! grep -q "Foundry spec validation: passed" "$VALID_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected valid spec validation to pass."
  echo ""
  echo "Output:"
  cat "$VALID_OUT"
  exit 1
fi

cat > "$INVALID_SPEC" <<'INVALID_SPEC_EOF'
---
id: BAD-1
title: Invalid Spec
status: Current
specStatus: draft
kind: feature
version: 0.1.0
created: 2026-05-11
updated: 2026-05-11
lastUpdated: 2026-05-11
owner: project-owner
owners:
  - project-maintainer
governanceLevel: Repository
documentType: Specification
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
bash tools/scripts/foundry.sh spec validate "$INVALID_SPEC" >"$INVALID_OUT" 2>"$INVALID_ERR"
INVALID_EXIT_CODE=$?
set -e

if [[ "$INVALID_EXIT_CODE" -eq 0 ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected invalid spec validation to fail, but it passed."
  echo ""
  echo "Output:"
  cat "$INVALID_OUT"
  echo ""
  echo "Error:"
  cat "$INVALID_ERR"
  exit 1
fi

if ! grep -q "invalid-spec-id" "$INVALID_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected invalid spec output to include invalid-spec-id."
  echo ""
  echo "Output:"
  cat "$INVALID_OUT"
  exit 1
fi

if ! grep -q "missing-required-section" "$INVALID_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected invalid spec output to include missing-required-section."
  echo ""
  echo "Output:"
  cat "$INVALID_OUT"
  exit 1
fi

echo "verify:specs: validating JSON output"

bash tools/scripts/foundry.sh spec validate "$VALID_SPEC" --json >"$JSON_OUT"

if ! grep -q '"ok": true' "$JSON_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected JSON output to include \"ok\": true."
  echo ""
  echo "Output:"
  cat "$JSON_OUT"
  exit 1
fi

if ! grep -q '"warningsAsErrors": false' "$JSON_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected JSON output to include \"warningsAsErrors\": false."
  echo ""
  echo "Output:"
  cat "$JSON_OUT"
  exit 1
fi

echo "verify:specs: creating generated spec"

bash tools/scripts/foundry.sh spec create "Add Authentication" \
  --dir "$CREATE_DIR" \
  >"$CREATE_OUT"

GENERATED_SPEC="$CREATE_DIR/0001-add-authentication/spec.md"
GENERATED_CLARIFICATIONS="$CREATE_DIR/0001-add-authentication/clarifications.md"

if [[ ! -f "$GENERATED_SPEC" ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected generated spec file to exist:"
  echo "$GENERATED_SPEC"
  echo ""
  echo "Output:"
  cat "$CREATE_OUT"
  exit 1
fi

if ! grep -q "Foundry spec created." "$CREATE_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected create output to confirm spec creation."
  echo ""
  echo "Output:"
  cat "$CREATE_OUT"
  exit 1
fi

if ! grep -q "ID: SPEC-0001" "$CREATE_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected create output to include ID: SPEC-0001."
  echo ""
  echo "Output:"
  cat "$CREATE_OUT"
  exit 1
fi

if ! grep -q "id: SPEC-0001" "$GENERATED_SPEC"; then
  echo "verify:specs: failed"
  echo ""
  echo "Generated spec is missing expected id frontmatter."
  echo ""
  echo "Generated spec:"
  cat "$GENERATED_SPEC"
  exit 1
fi

if ! grep -q "specStatus: draft" "$GENERATED_SPEC"; then
  echo "verify:specs: failed"
  echo ""
  echo "Generated spec is missing expected specStatus frontmatter."
  echo ""
  echo "Generated spec:"
  cat "$GENERATED_SPEC"
  exit 1
fi

echo "verify:specs: validating generated spec"

bash tools/scripts/foundry.sh spec validate "$GENERATED_SPEC" >"$ARTIFACT_DIR/generated-spec-validation.out"

if ! grep -q "Foundry spec validation: passed" "$ARTIFACT_DIR/generated-spec-validation.out"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected generated spec validation to pass."
  echo ""
  echo "Output:"
  cat "$ARTIFACT_DIR/generated-spec-validation.out"
  exit 1
fi

echo "verify:specs: clarifying generated spec"

bash tools/scripts/foundry.sh spec clarify "$GENERATED_SPEC" >"$CLARIFY_OUT"

if [[ ! -f "$GENERATED_CLARIFICATIONS" ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected clarification report to exist:"
  echo "$GENERATED_CLARIFICATIONS"
  echo ""
  echo "Output:"
  cat "$CLARIFY_OUT"
  exit 1
fi

if ! grep -q "Foundry spec clarification report created." "$CLARIFY_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected clarify output to confirm report creation."
  echo ""
  echo "Output:"
  cat "$CLARIFY_OUT"
  exit 1
fi

if ! grep -q "Blocking questions:" "$CLARIFY_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected clarify output to include blocking question count."
  echo ""
  echo "Output:"
  cat "$CLARIFY_OUT"
  exit 1
fi

if ! grep -q "# Clarification Report: SPEC-0001" "$GENERATED_CLARIFICATIONS"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected clarification report heading for SPEC-0001."
  echo ""
  echo "Report:"
  cat "$GENERATED_CLARIFICATIONS"
  exit 1
fi

if ! grep -q "## Blocking Questions" "$GENERATED_CLARIFICATIONS"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected clarification report to include Blocking Questions section."
  echo ""
  echo "Report:"
  cat "$GENERATED_CLARIFICATIONS"
  exit 1
fi

if ! grep -q "## Non-Blocking Questions" "$GENERATED_CLARIFICATIONS"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected clarification report to include Non-Blocking Questions section."
  echo ""
  echo "Report:"
  cat "$GENERATED_CLARIFICATIONS"
  exit 1
fi

echo "verify:specs: validating clarify overwrite protection"

set +e
bash tools/scripts/foundry.sh spec clarify "$GENERATED_SPEC" >"$ARTIFACT_DIR/clarify-overwrite.out" 2>"$ARTIFACT_DIR/clarify-overwrite.err"
CLARIFY_OVERWRITE_EXIT_CODE=$?
set -e

if [[ "$CLARIFY_OVERWRITE_EXIT_CODE" -eq 0 ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected clarify to reject overwriting an existing report without --force."
  echo ""
  echo "Output:"
  cat "$ARTIFACT_DIR/clarify-overwrite.out"
  echo ""
  echo "Error:"
  cat "$ARTIFACT_DIR/clarify-overwrite.err"
  exit 1
fi

echo "verify:specs: validating clarify JSON output"

bash tools/scripts/foundry.sh spec clarify "$GENERATED_SPEC" \
  --force \
  --json \
  >"$CLARIFY_JSON_OUT"

if ! grep -q '"specId": "SPEC-0001"' "$CLARIFY_JSON_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected clarify JSON output to include SPEC-0001."
  echo ""
  echo "Output:"
  cat "$CLARIFY_JSON_OUT"
  exit 1
fi

if ! grep -q '"blockingQuestions"' "$CLARIFY_JSON_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected clarify JSON output to include blockingQuestions."
  echo ""
  echo "Output:"
  cat "$CLARIFY_JSON_OUT"
  exit 1
fi

if ! grep -q '"nonBlockingQuestions"' "$CLARIFY_JSON_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected clarify JSON output to include nonBlockingQuestions."
  echo ""
  echo "Output:"
  cat "$CLARIFY_JSON_OUT"
  exit 1
fi

echo "verify:specs: validating clarify fail-on-blocking behavior"

set +e
bash tools/scripts/foundry.sh spec clarify "$GENERATED_SPEC" \
  --force \
  --fail-on-blocking \
  >"$CLARIFY_FAIL_OUT" 2>"$CLARIFY_FAIL_ERR"
CLARIFY_FAIL_EXIT_CODE=$?
set -e

if [[ "$CLARIFY_FAIL_EXIT_CODE" -eq 0 ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected clarify --fail-on-blocking to exit non-zero for generated draft spec."
  echo ""
  echo "Output:"
  cat "$CLARIFY_FAIL_OUT"
  echo ""
  echo "Error:"
  cat "$CLARIFY_FAIL_ERR"
  exit 1
fi

echo "verify:specs: creating generated spec with JSON output"

bash tools/scripts/foundry.sh spec create "Add Billing" \
  --dir "$CREATE_DIR" \
  --json \
  >"$CREATE_JSON_OUT"

GENERATED_JSON_SPEC="$CREATE_DIR/0002-add-billing/spec.md"

if [[ ! -f "$GENERATED_JSON_SPEC" ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected second generated spec file to exist:"
  echo "$GENERATED_JSON_SPEC"
  echo ""
  echo "Output:"
  cat "$CREATE_JSON_OUT"
  exit 1
fi

if ! grep -q '"ok": true' "$CREATE_JSON_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected create JSON output to include \"ok\": true."
  echo ""
  echo "Output:"
  cat "$CREATE_JSON_OUT"
  exit 1
fi

if ! grep -q '"id": "SPEC-0002"' "$CREATE_JSON_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected create JSON output to include SPEC-0002."
  echo ""
  echo "Output:"
  cat "$CREATE_JSON_OUT"
  exit 1
fi

bash tools/scripts/foundry.sh spec validate "$GENERATED_JSON_SPEC" >"$ARTIFACT_DIR/generated-json-spec-validation.out"

if ! grep -q "Foundry spec validation: passed" "$ARTIFACT_DIR/generated-json-spec-validation.out"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected second generated spec validation to pass."
  echo ""
  echo "Output:"
  cat "$ARTIFACT_DIR/generated-json-spec-validation.out"
  exit 1
fi

echo "verify:specs: passed"