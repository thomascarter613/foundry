---
title: "WP-0011: Add Init Database Matrix CI Gate"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
  - "docs/work-packets/WP-0010-add-init-database-provider-smoke-matrix.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Work Packet"
  - "CI"
  - "Verification"
  - "Scaffolding"
  - "Repository Contract"
---

# WP-0011: Add Init Database Matrix CI Gate

## Purpose

Add the Foundry init database-provider smoke matrix to CI as a separate verification job.

## Problem

The no-database init MVP path is protected by CI, but provider-specific init templates also need regression protection.

## Deliverables

This Work Packet updates:

- `.github/workflows/foundry-init-mvp.yml`

The workflow must run:

- `tools/scripts/check-foundry-init-mvp.sh`
- `tools/scripts/check-foundry-init-database-matrix.sh`

## CI Design

The database-provider matrix must run as a separate job from the no-database init MVP gate.

This keeps the core init MVP signal clear while still enforcing provider-template correctness.

## Acceptance Criteria

This Work Packet is accepted when:

1. CI has a dedicated no-database init MVP job.
2. CI has a dedicated database-provider matrix job.
3. Both jobs install dependencies with Bun.
4. Both jobs upload their artifacts.
5. Local verification still passes.

## Verification

Run:

    tools/scripts/check-foundry-init-mvp.sh
    tools/scripts/check-foundry-init-database-matrix.sh

Then inspect:

    cat .artifacts/foundry/init-mvp/summary.json
    cat .artifacts/foundry/init-database-matrix/summary.json

## Change History

- Added Work Packet for database-provider matrix CI coverage.
