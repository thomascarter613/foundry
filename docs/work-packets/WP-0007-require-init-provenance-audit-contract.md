---
title: "WP-0007: Require Init Provenance Audit Contract"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
  - "docs/work-packets/WP-0006-verify-generated-workspace-contract.md"
downstream:
  - "tools/scripts/check-generated-workspace-contract.sh"
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

# WP-0007: Require Init Provenance Audit Contract

## Purpose

Promote generated workspace provenance and audit files from optional signals to required Foundry init MVP contract artifacts.

## Context

The init writer is expected to emit provenance and audit files as part of the generated workspace. The generated workspace contract verifier previously treated those files as optional. This Work Packet makes them required and validates their minimum semantic shape.

## Required Provenance Contract

A generated workspace must include:

- `.foundry/init/provenance.json`
- `.foundry/init/audit.ndjson`
- `.foundry/README.md`

## Required Provenance JSON Fields

The generated `.foundry/init/provenance.json` file must include:

- `schemaVersion`
- `generatedBy`
- `generatedAt`
- `workspace`
- `generatedFiles`
- `plan`

The `generatedFiles` field must be a non-empty array.

The `workspace` field must be an object with a non-empty `name`.

## Required Audit Event Fields

The generated `.foundry/init/audit.ndjson` file must contain at least one valid JSON line with:

- `schemaVersion`
- `type`
- `occurredAt`
- `actor`
- `subject`
- `details`

The first event type must be:

    foundry.init.workspace_created

## Verification

Run:

    tools/scripts/check-foundry-init-workspace.sh
    tools/scripts/check-generated-workspace-contract.sh
    cat .artifacts/foundry/generated-workspace-contract/summary.json

## Acceptance Criteria

This Work Packet is accepted when:

1. Init workspace smoke succeeds.
2. Generated workspace contract verification succeeds.
3. Provenance files are required, not optional.
4. `provenance.json` parses as JSON.
5. `audit.ndjson` contains at least one valid audit event.
6. Contract summary reports `"ok": true`.

## Change History

- Promoted init provenance and audit files to required generated workspace contract artifacts.
