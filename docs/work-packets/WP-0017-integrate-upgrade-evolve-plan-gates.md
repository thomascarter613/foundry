---
title: "WP-0017: Integrate Upgrade Evolve Plan Gates"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/work-packets/WP-0012-add-upgrade-evolve-baseline-smoke-gate.md"
  - "docs/work-packets/WP-0015-add-upgrade-plan-report.md"
  - "docs/work-packets/WP-0016-add-evolve-plan-report.md"
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

# WP-0017: Integrate Upgrade Evolve Plan Gates

## Purpose

Integrate the upgrade/evolve baseline, upgrade plan, and evolve plan smoke gates into one authoritative verification gate.

## Deliverables

This Work Packet adds:

- `tools/scripts/check-foundry-upgrade-evolve-plans.sh`

## Required Behavior

The integrated gate must run:

1. `tools/scripts/check-foundry-upgrade-evolve-baseline.sh`
2. `tools/scripts/check-foundry-upgrade-plan.sh`
3. `tools/scripts/check-foundry-evolve-plan.sh`

The gate must write:

- `.artifacts/foundry/upgrade-evolve-plans/summary.txt`
- `.artifacts/foundry/upgrade-evolve-plans/summary.json`

## Acceptance Criteria

This Work Packet is accepted when:

1. The integrated gate exits `0`.
2. The integrated summary reports `"ok": true`.
3. The baseline summary reports `"ok": true`.
4. The baseline summary reports `"commandSurfaceReady": true`.
5. The upgrade plan summary reports `"ok": true`.
6. The evolve plan summary reports `"ok": true`.

## Verification

Run:

    tools/scripts/check-foundry-upgrade-evolve-plans.sh
    cat .artifacts/foundry/upgrade-evolve-plans/summary.json

## Change History

- Added integrated upgrade/evolve plan verification gate.
