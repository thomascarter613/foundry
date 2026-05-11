---
title: "WP-0014: Add Repository Inspection Report"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
  - "docs/work-packets/WP-0013-add-upgrade-evolve-command-registration.md"
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

# WP-0014: Add Repository Inspection Report

## Purpose

Add a read-only repository inspection report to the `foundry upgrade` and `foundry evolve` command surfaces.

## Problem

The `upgrade` and `evolve` commands are now registered, but they only prove command availability. The next useful capability is detecting the current repository state without mutating files.

## Deliverables

This Work Packet updates:

- `packages/cli/src/commands/shared/repo-surface.ts`

## Required Behavior

The command surfaces must inspect and report:

1. package.json presence.
2. package name.
3. package manager signals.
4. workspace configuration signals.
5. Foundry directory presence.
6. Foundry manifest presence.
7. init provenance presence.
8. docs governance presence.
9. CI workflow presence.
10. verification script presence.
11. top-level repository directories.
12. package scripts.

## Non-Goals

This Work Packet does not implement upgrade planning or file mutation.

## Verification

Run:

    bun run --cwd packages/cli typecheck
    ( cd packages/cli && bun run build )
    node packages/cli/bin/run.js upgrade --json --report-path .artifacts/foundry/upgrade/report.json
    node packages/cli/bin/run.js evolve --json --report-path .artifacts/foundry/evolve/report.json
    tools/scripts/check-foundry-upgrade-evolve-baseline.sh
    cat .artifacts/foundry/upgrade/report.json
    cat .artifacts/foundry/evolve/report.json

## Acceptance Criteria

This Work Packet is accepted when:

1. Typecheck passes.
2. Build passes.
3. `upgrade --json` exits `0`.
4. `evolve --json` exits `0`.
5. Reports include repository inspection details.
6. The upgrade/evolve baseline smoke gate reports `"ok": true`.
7. The baseline summary reports `"commandSurfaceReady": true`.

## Change History

- Added repository inspection report for upgrade/evolve command surfaces.
