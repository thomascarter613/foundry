---
title: "WP-0015: Add Upgrade Plan Report"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
  - "docs/work-packets/WP-0014-add-repository-inspection-report.md"
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

# WP-0015: Add Upgrade Plan Report

## Purpose

Add a read-only upgrade plan report to the `foundry upgrade` command.

## Problem

The `upgrade` command can inspect a repository, but it does not yet turn inspection findings into an actionable plan.

## Deliverables

This Work Packet adds:

- `packages/cli/src/commands/shared/upgrade-plan.ts`
- `foundry upgrade --plan`
- `tools/scripts/check-foundry-upgrade-plan.sh`

## Required Behavior

The upgrade plan command must:

1. Inspect the repository.
2. Produce deterministic plan actions.
3. Group actions by priority.
4. Avoid file writes unless `--report-path` is provided.
5. Exit `0`.
6. Support text and JSON output.

## Non-Goals

This Work Packet does not apply upgrade actions.

## Verification

Run:

    bun run --cwd packages/cli typecheck
    ( cd packages/cli && bun run build )
    node packages/cli/bin/run.js upgrade --plan
    node packages/cli/bin/run.js upgrade --plan --json --report-path .artifacts/foundry/upgrade/plan.json
    tools/scripts/check-foundry-upgrade-plan.sh
    cat .artifacts/foundry/upgrade-plan/summary.json

## Acceptance Criteria

This Work Packet is accepted when:

1. Typecheck passes.
2. Build passes.
3. `upgrade --plan` exits `0`.
4. `upgrade --plan --json` exits `0`.
5. The upgrade plan report has an `actions` array.
6. The upgrade plan smoke gate reports `"ok": true`.

## Change History

- Added read-only upgrade plan report Work Packet.
