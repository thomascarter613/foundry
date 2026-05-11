---
title: "WP-0012: Add Upgrade Evolve Baseline Smoke Gate"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
  - "docs/work-packets/WP-0011-add-init-database-matrix-ci-gate.md"
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

# WP-0012: Add Upgrade Evolve Baseline Smoke Gate

## Purpose

Add a baseline smoke gate for the future `foundry upgrade` and `foundry evolve` command family.

## Problem

Foundry init now has a verified MVP path. The next product capability is repository evolution: inspecting an existing workspace and applying governed upgrades over time.

Before implementing behavior, the repository needs a smoke gate that captures the current command surface.

## Deliverables

This Work Packet adds:

- `tools/scripts/check-foundry-upgrade-evolve-baseline.sh`

## Required Behavior

The baseline smoke gate must:

1. Run CLI typecheck.
2. Run CLI build.
3. Verify top-level CLI help.
4. Attempt `foundry upgrade --help`.
5. Attempt `foundry evolve --help`.
6. Capture all outputs.
7. Write a machine-readable summary.
8. Report whether upgrade/evolve command surfaces exist.

## Important Rule

This baseline gate is diagnostic-first.

It must not fail solely because `upgrade` or `evolve` are not implemented yet. Missing command surfaces should be reported as follow-up implementation work.

## Required Output

The smoke gate writes:

- `.artifacts/foundry/upgrade-evolve-baseline/summary.txt`
- `.artifacts/foundry/upgrade-evolve-baseline/summary.json`

## Verification

Run:

    tools/scripts/check-foundry-upgrade-evolve-baseline.sh
    cat .artifacts/foundry/upgrade-evolve-baseline/summary.json

## Acceptance Criteria

This Work Packet is accepted when:

1. The script exists and is executable.
2. The script exits `0` when typecheck/build/top-level CLI help pass.
3. The summary reports command-surface status for `upgrade`.
4. The summary reports command-surface status for `evolve`.
5. Missing command surfaces are captured as notes rather than hidden terminal output.

## Follow-Up

If either command is missing, the next implementation slice should add command registration and help output before implementing repo mutation behavior.

## Change History

- Added upgrade/evolve baseline smoke gate Work Packet.
