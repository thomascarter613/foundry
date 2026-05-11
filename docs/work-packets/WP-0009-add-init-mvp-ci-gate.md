---
title: "WP-0009: Add Init MVP CI Gate"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
  - "docs/work-packets/WP-0008-integrate-init-mvp-verification-gate.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Work Packet"
  - "CI"
  - "Verification"
  - "Repository Contract"
---

# WP-0009: Add Init MVP CI Gate

## Purpose

Add a GitHub Actions workflow that runs the integrated Foundry init MVP verification gate on pushes and pull requests.

## Problem

The Foundry init MVP path now passes locally, but it is not yet protected by CI.

## Deliverables

This Work Packet adds:

- `.github/workflows/foundry-init-mvp.yml`
- `docs/standards/foundry-init-mvp-ci.md`

## CI Gate

The CI workflow must run:

    tools/scripts/check-foundry-init-mvp.sh

The gate verifies:

1. CLI typecheck.
2. CLI build.
3. documentation verification.
4. documentation readiness artifact generation.
5. CLI help.
6. init help.
7. init workspace smoke generation.
8. generated workspace contract verification.
9. generated workspace self-verification.

## Acceptance Criteria

This Work Packet is accepted when:

1. The workflow exists.
2. The workflow installs dependencies with Bun.
3. The workflow runs the integrated init MVP gate.
4. The workflow uploads `.artifacts/foundry` and `.artifacts/docs` as CI artifacts.
5. Local verification still reports `ok: true`.

## Verification

Run:

    tools/scripts/check-foundry-init-mvp.sh

Then inspect:

    cat .artifacts/foundry/init-mvp/summary.json

## Change History

- Added Work Packet for Foundry init MVP CI gate.
