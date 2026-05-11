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
PLAN_REJECT_OUT="$ARTIFACT_DIR/plan-reject-blocking.out"
PLAN_REJECT_ERR="$ARTIFACT_DIR/plan-reject-blocking.err"
PLAN_OUT="$ARTIFACT_DIR/plan-spec.out"
PLAN_JSON_OUT="$ARTIFACT_DIR/plan-spec-json.out"
PLAN_OVERWRITE_OUT="$ARTIFACT_DIR/plan-overwrite.out"
PLAN_OVERWRITE_ERR="$ARTIFACT_DIR/plan-overwrite.err"
TASKS_REJECT_OUT="$ARTIFACT_DIR/tasks-reject-blocking.out"
TASKS_REJECT_ERR="$ARTIFACT_DIR/tasks-reject-blocking.err"
TASKS_OUT="$ARTIFACT_DIR/tasks-spec.out"
TASKS_JSON_OUT="$ARTIFACT_DIR/tasks-spec-json.out"
TASKS_OVERWRITE_OUT="$ARTIFACT_DIR/tasks-overwrite.out"
TASKS_OVERWRITE_ERR="$ARTIFACT_DIR/tasks-overwrite.err"

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
GENERATED_PLAN="$CREATE_DIR/0001-add-authentication/implementation-plan.md"
GENERATED_TASKS="$CREATE_DIR/0001-add-authentication/tasks.md"

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

echo "verify:specs: validating plan rejection with blocking clarifications"

set +e
bash tools/scripts/foundry.sh spec plan "$GENERATED_SPEC" \
  >"$PLAN_REJECT_OUT" 2>"$PLAN_REJECT_ERR"
PLAN_REJECT_EXIT_CODE=$?
set -e

if [[ "$PLAN_REJECT_EXIT_CODE" -eq 0 ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected spec plan to reject blocking clarifications by default."
  echo ""
  echo "Output:"
  cat "$PLAN_REJECT_OUT"
  echo ""
  echo "Error:"
  cat "$PLAN_REJECT_ERR"
  exit 1
fi

PLAN_REJECT_COMBINED="$ARTIFACT_DIR/plan-reject-blocking.combined"

cat "$PLAN_REJECT_OUT" "$PLAN_REJECT_ERR" >"$PLAN_REJECT_COMBINED"

if ! grep -q "blocking clarification" "$PLAN_REJECT_COMBINED" || \
   ! grep -q "questions remain" "$PLAN_REJECT_COMBINED"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected plan rejection output to mention blocking clarification questions."
  echo ""
  echo "Output:"
  cat "$PLAN_REJECT_OUT"
  echo ""
  echo "Error:"
  cat "$PLAN_REJECT_ERR"
  exit 1
fi

echo "verify:specs: planning generated spec with explicit blocking override"

bash tools/scripts/foundry.sh spec plan "$GENERATED_SPEC" \
  --allow-blocking-clarifications \
  >"$PLAN_OUT"

if [[ ! -f "$GENERATED_PLAN" ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected implementation plan to exist:"
  echo "$GENERATED_PLAN"
  echo ""
  echo "Output:"
  cat "$PLAN_OUT"
  exit 1
fi

if ! grep -q "Foundry implementation plan created." "$PLAN_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected plan output to confirm plan creation."
  echo ""
  echo "Output:"
  cat "$PLAN_OUT"
  exit 1
fi

if ! grep -q "# Implementation Plan: SPEC-0001" "$GENERATED_PLAN"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected implementation plan heading for SPEC-0001."
  echo ""
  echo "Plan:"
  cat "$GENERATED_PLAN"
  exit 1
fi

if ! grep -q "## Planning Gate Status" "$GENERATED_PLAN"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected implementation plan to include Planning Gate Status section."
  echo ""
  echo "Plan:"
  cat "$GENERATED_PLAN"
  exit 1
fi

if ! grep -q "## Requirements Covered" "$GENERATED_PLAN"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected implementation plan to include Requirements Covered section."
  echo ""
  echo "Plan:"
  cat "$GENERATED_PLAN"
  exit 1
fi

if ! grep -q "## Work Breakdown Seed" "$GENERATED_PLAN"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected implementation plan to include Work Breakdown Seed section."
  echo ""
  echo "Plan:"
  cat "$GENERATED_PLAN"
  exit 1
fi

echo "verify:specs: validating plan overwrite protection"

set +e
bash tools/scripts/foundry.sh spec plan "$GENERATED_SPEC" \
  --allow-blocking-clarifications \
  >"$PLAN_OVERWRITE_OUT" 2>"$PLAN_OVERWRITE_ERR"
PLAN_OVERWRITE_EXIT_CODE=$?
set -e

if [[ "$PLAN_OVERWRITE_EXIT_CODE" -eq 0 ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected plan to reject overwriting an existing plan without --force."
  echo ""
  echo "Output:"
  cat "$PLAN_OVERWRITE_OUT"
  echo ""
  echo "Error:"
  cat "$PLAN_OVERWRITE_ERR"
  exit 1
fi

echo "verify:specs: validating plan JSON output"

bash tools/scripts/foundry.sh spec plan "$GENERATED_SPEC" \
  --allow-blocking-clarifications \
  --force \
  --json \
  >"$PLAN_JSON_OUT"

if ! grep -q '"ok": true' "$PLAN_JSON_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected plan JSON output to include \"ok\": true."
  echo ""
  echo "Output:"
  cat "$PLAN_JSON_OUT"
  exit 1
fi

if ! grep -q '"specId": "SPEC-0001"' "$PLAN_JSON_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected plan JSON output to include SPEC-0001."
  echo ""
  echo "Output:"
  cat "$PLAN_JSON_OUT"
  exit 1
fi

if ! grep -q '"requirementCount": 1' "$PLAN_JSON_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected plan JSON output to include requirementCount 1."
  echo ""
  echo "Output:"
  cat "$PLAN_JSON_OUT"
  exit 1
fi

echo "verify:specs: validating tasks rejection with blocking clarifications"

set +e
bash tools/scripts/foundry.sh spec tasks "$GENERATED_PLAN" \
  >"$TASKS_REJECT_OUT" 2>"$TASKS_REJECT_ERR"
TASKS_REJECT_EXIT_CODE=$?
set -e

if [[ "$TASKS_REJECT_EXIT_CODE" -eq 0 ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected spec tasks to reject blocking clarifications by default."
  echo ""
  echo "Output:"
  cat "$TASKS_REJECT_OUT"
  echo ""
  echo "Error:"
  cat "$TASKS_REJECT_ERR"
  exit 1
fi

TASKS_REJECT_COMBINED="$ARTIFACT_DIR/tasks-reject-blocking.combined"
cat "$TASKS_REJECT_OUT" "$TASKS_REJECT_ERR" >"$TASKS_REJECT_COMBINED"

if ! grep -q "Cannot generate tasks" "$TASKS_REJECT_COMBINED" || \
   ! grep -q "blocking clarification" "$TASKS_REJECT_COMBINED"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected tasks rejection output to mention blocking clarification questions."
  echo ""
  echo "Output:"
  cat "$TASKS_REJECT_OUT"
  echo ""
  echo "Error:"
  cat "$TASKS_REJECT_ERR"
  exit 1
fi

echo "verify:specs: generating tasks with explicit blocking override"

bash tools/scripts/foundry.sh spec tasks "$GENERATED_PLAN" \
  --allow-blocking-clarifications \
  >"$TASKS_OUT"

if [[ ! -f "$GENERATED_TASKS" ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected task document to exist:"
  echo "$GENERATED_TASKS"
  echo ""
  echo "Output:"
  cat "$TASKS_OUT"
  exit 1
fi

if ! grep -q "Foundry task document created." "$TASKS_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected tasks output to confirm task document creation."
  echo ""
  echo "Output:"
  cat "$TASKS_OUT"
  exit 1
fi

if ! grep -q "# Tasks: SPEC-0001" "$GENERATED_TASKS"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected task document heading for SPEC-0001."
  echo ""
  echo "Tasks:"
  cat "$GENERATED_TASKS"
  exit 1
fi

if ! grep -q "## Requirements Traceability" "$GENERATED_TASKS"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected task document to include Requirements Traceability section."
  echo ""
  echo "Tasks:"
  cat "$GENERATED_TASKS"
  exit 1
fi

if ! grep -q "## Task List" "$GENERATED_TASKS"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected task document to include Task List section."
  echo ""
  echo "Tasks:"
  cat "$GENERATED_TASKS"
  exit 1
fi

if ! grep -q "TASK-0001" "$GENERATED_TASKS"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected generated tasks to include TASK-0001."
  echo ""
  echo "Tasks:"
  cat "$GENERATED_TASKS"
  exit 1
fi

if ! grep -q "REQ-0001" "$GENERATED_TASKS"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected generated tasks to include REQ-0001 traceability."
  echo ""
  echo "Tasks:"
  cat "$GENERATED_TASKS"
  exit 1
fi

if ! grep -q "bun run verify:specs" "$GENERATED_TASKS"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected generated tasks to include spec verification command."
  echo ""
  echo "Tasks:"
  cat "$GENERATED_TASKS"
  exit 1
fi

echo "verify:specs: validating tasks overwrite protection"

set +e
bash tools/scripts/foundry.sh spec tasks "$GENERATED_PLAN" \
  --allow-blocking-clarifications \
  >"$TASKS_OVERWRITE_OUT" 2>"$TASKS_OVERWRITE_ERR"
TASKS_OVERWRITE_EXIT_CODE=$?
set -e

if [[ "$TASKS_OVERWRITE_EXIT_CODE" -eq 0 ]]; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected tasks command to reject overwriting an existing task document without --force."
  echo ""
  echo "Output:"
  cat "$TASKS_OVERWRITE_OUT"
  echo ""
  echo "Error:"
  cat "$TASKS_OVERWRITE_ERR"
  exit 1
fi

echo "verify:specs: validating tasks JSON output"

bash tools/scripts/foundry.sh spec tasks "$GENERATED_PLAN" \
  --allow-blocking-clarifications \
  --force \
  --json \
  >"$TASKS_JSON_OUT"

if ! grep -q '"ok": true' "$TASKS_JSON_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected tasks JSON output to include \"ok\": true."
  echo ""
  echo "Output:"
  cat "$TASKS_JSON_OUT"
  exit 1
fi

if ! grep -q '"specId": "SPEC-0001"' "$TASKS_JSON_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected tasks JSON output to include SPEC-0001."
  echo ""
  echo "Output:"
  cat "$TASKS_JSON_OUT"
  exit 1
fi

if ! grep -q '"requirementCount": 1' "$TASKS_JSON_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected tasks JSON output to include requirementCount 1."
  echo ""
  echo "Output:"
  cat "$TASKS_JSON_OUT"
  exit 1
fi

if ! grep -q '"taskCount":' "$TASKS_JSON_OUT"; then
  echo "verify:specs: failed"
  echo ""
  echo "Expected tasks JSON output to include taskCount."
  echo ""
  echo "Output:"
  cat "$TASKS_JSON_OUT"
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
