---
title: "WP-0018: Add Upgrade Evolve Plan CI Gate"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/work-packets/WP-0017-integrate-upgrade-evolve-plan-gates.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Work Packet"
  - "Verification"
  - "Repository Contract"
  - "CI"
  - "CLI"
---

# WP-0018: Add Upgrade Evolve Plan CI Gate

## Purpose

Add CI coverage for the integrated upgrade/evolve plan verification gate.

## Problem

The upgrade/evolve plan gate can pass locally, but it is not yet protected by GitHub Actions.

## Deliverables

This Work Packet adds:

- `.github/workflows/foundry-upgrade-evolve.yml`
- `docs/standards/foundry-upgrade-evolve-ci.md`

## CI Gate

The workflow must run:

    tools/scripts/check-foundry-upgrade-evolve-plans.sh

The integrated gate verifies:

1. Upgrade/evolve command surfaces.
2. Upgrade help.
3. Evolve help.
4. Upgrade plan text output.
5. Upgrade plan JSON output.
6. Evolve plan text output.
7. Evolve plan JSON output.
8. Nested upgrade/evolve plan summaries.

## Acceptance Criteria

This Work Packet is accepted when:

1. The workflow exists.
2. The workflow installs dependencies with Bun.
3. The workflow runs the integrated upgrade/evolve plan gate.
4. The workflow uploads upgrade/evolve artifacts.
5. Local verification still reports `"ok": true`.

## Verification

Run:

    tools/scripts/check-foundry-upgrade-evolve-plans.sh
    cat .artifacts/foundry/upgrade-evolve-plans/summary.json

## Change History

- Added Work Packet for upgrade/evolve plan CI coverage.
