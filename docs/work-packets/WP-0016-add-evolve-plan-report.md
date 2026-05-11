---
title: "WP-0016: Add Evolve Plan Report"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
  - "docs/work-packets/WP-0014-add-repository-inspection-report.md"
  - "docs/work-packets/WP-0015-add-upgrade-plan-report.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Work Packet"
  - "Verification"
  - "Repository Contract"
  - "CLI"
---

# WP-0016: Add Evolve Plan Report

## Purpose

Add a read-only evolve plan report to the `foundry evolve` command.

## Problem

The `evolve` command can inspect a repository, but it does not yet translate repository state into an actionable capability-evolution plan.

## Deliverables

This Work Packet adds:

- `packages/cli/src/commands/shared/evolve-plan.ts`
- `foundry evolve --plan`
- `tools/scripts/check-foundry-evolve-plan.sh`

## Required Behavior

The evolve plan command must:

1. Inspect the repository.
2. Produce deterministic capability-evolution actions.
3. Group actions by priority.
4. Avoid file writes unless `--report-path` is provided.
5. Exit `0`.
6. Support text and JSON output.

## Non-Goals

This Work Packet does not apply evolution actions.

## Verification

Run:

    bun run --cwd packages/cli typecheck
    ( cd packages/cli && bun run build )
    node packages/cli/bin/run.js evolve --plan
    node packages/cli/bin/run.js evolve --plan --json --report-path .artifacts/foundry/evolve/plan.json
    tools/scripts/check-foundry-evolve-plan.sh
    cat .artifacts/foundry/evolve-plan/summary.json

## Acceptance Criteria

This Work Packet is accepted when:

1. Typecheck passes.
2. Build passes.
3. `evolve --plan` exits `0`.
4. `evolve --plan --json` exits `0`.
5. The evolve plan report has an `actions` array.
6. The evolve plan smoke gate reports `"ok": true`.

## Change History

- Added read-only evolve plan report Work Packet.
