---
title: "WP-0010: Add Init Database Provider Smoke Matrix"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
  - "docs/work-packets/WP-0008-integrate-init-mvp-verification-gate.md"
  - "docs/work-packets/WP-0009-add-init-mvp-ci-gate.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Work Packet"
  - "Verification"
  - "Scaffolding"
  - "Repository Contract"
---

# WP-0010: Add Init Database Provider Smoke Matrix

## Purpose

Add a smoke matrix for supported `foundry init --database-provider` values.

## Problem

The no-database init MVP path is protected, but provider-specific init templates can still regress independently.

## Deliverables

This Work Packet adds:

- `tools/scripts/check-foundry-init-database-matrix.sh`

## Provider Matrix

The smoke matrix covers:

- `postgres:drizzle`
- `postgres:prisma`
- `sqlite:drizzle`
- `sqlite:prisma`
- `mongodb:native`
- `supabase:sql`
- `supabase:drizzle`
- `supabase:prisma`
- `supabase:client`

## Required Checks

For each provider, the matrix must verify:

1. `foundry init <workspace> --yes --no-install --database-provider <provider>` exits `0`.
2. The generated workspace exists.
3. `package.json` exists and parses as JSON.
4. `db/provider.json` exists and parses as JSON.
5. `.env.example` exists.
6. Database helper scripts exist.
7. Foundry provenance exists.
8. Foundry audit log exists.
9. Generated workspace verification script exits `0`.

## Required Output

The matrix writes:

- `.artifacts/foundry/init-database-matrix/summary.txt`
- `.artifacts/foundry/init-database-matrix/summary.json`
- one log per provider

## Verification

Run:

    tools/scripts/check-foundry-init-database-matrix.sh
    cat .artifacts/foundry/init-database-matrix/summary.json

## Acceptance Criteria

This Work Packet is accepted when:

1. The script exits `0`.
2. The summary reports `"ok": true`.
3. Every provider reports `"ok": true`.
4. Every generated provider workspace contains the required database contract files.

## Change History

- Added Work Packet for provider-specific init smoke coverage.
