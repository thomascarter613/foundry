---
title: "WP-0008: Integrate Init MVP Verification Gate"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
  - "docs/work-packets/WP-0004-add-init-workspace-smoke-fixture.md"
  - "docs/work-packets/WP-0006-verify-generated-workspace-contract.md"
  - "docs/work-packets/WP-0007-require-init-provenance-audit-contract.md"
downstream:
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Work Packet"
  - "Repository Contract"
  - "Provenance"
  - "Audit"
  - "Verification"
---

# WP-0008: Integrate Init MVP Verification Gate

## Purpose

Integrate the Foundry init smoke fixture, generated workspace contract verifier, provenance/audit verifier, and generated workspace self-verification into one authoritative MVP gate.

## Problem

The Foundry init MVP path currently has multiple useful checks, but they are not yet composed into a single product-level verification command.

## Deliverables

This Work Packet updates:

- `tools/scripts/check-foundry-init-mvp.sh`

The script must run:

1. CLI typecheck.
2. CLI build.
3. docs verification.
4. docs readiness artifact generation.
5. CLI help.
6. init help.
7. init workspace smoke fixture.
8. generated workspace contract verification.
9. generated workspace self-verification.

## Required Output

The gate must write:

- `.artifacts/foundry/init-mvp/summary.txt`
- `.artifacts/foundry/init-mvp/summary.json`

## Acceptance Criteria

The integrated init MVP gate is accepted when:

1. `tools/scripts/check-foundry-init-mvp.sh` exits `0`.
2. `.artifacts/foundry/init-mvp/summary.json` reports `"ok": true`.
3. The summary includes statuses for all required checks.
4. The generated workspace contract summary reports `"ok": true`.
5. The generated workspace verification summary reports `"ok": true`.

## Verification

Run:

    tools/scripts/check-foundry-init-mvp.sh
    cat .artifacts/foundry/init-mvp/summary.json

## Change History

- Created Work Packet for integrated Foundry init MVP verification gate.
