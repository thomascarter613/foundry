---
title: "WP-0013: Add Upgrade Evolve Command Registration"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
  - "docs/work-packets/WP-0012-add-upgrade-evolve-baseline-smoke-gate.md"
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

# WP-0013: Add Upgrade Evolve Command Registration

## Purpose

Add minimal command registration for the future `foundry upgrade` and `foundry evolve` command family.

## Problem

The upgrade/evolve baseline smoke gate can detect whether the command surfaces exist, but the commands are not yet guaranteed to be registered.

## Deliverables

This Work Packet adds:

- `packages/cli/src/commands/upgrade/index.ts`
- `packages/cli/src/commands/evolve/index.ts`

## Required Behavior

The commands must:

1. Compile.
2. Show help.
3. Avoid repository mutation.
4. Print diagnostic JSON with `--json`.
5. Support a `--root` flag.
6. Support a `--report-path` flag.
7. Exit `0`.

## Non-Goals

This Work Packet does not implement upgrade planning, file writing, migrations, or evolution behavior.

## Verification

Run:

    bun run --cwd packages/cli typecheck
    ( cd packages/cli && bun run build )
    node packages/cli/bin/run.js upgrade --help
    node packages/cli/bin/run.js evolve --help
    tools/scripts/check-foundry-upgrade-evolve-baseline.sh
    cat .artifacts/foundry/upgrade-evolve-baseline/summary.json

## Acceptance Criteria

This Work Packet is accepted when:

1. Typecheck passes.
2. Build passes.
3. `upgrade --help` exits `0`.
4. `evolve --help` exits `0`.
5. The upgrade/evolve baseline smoke gate reports `"ok": true`.
6. The baseline summary reports `"commandSurfaceReady": true`.

## Change History

- Added Work Packet for upgrade/evolve command registration.
