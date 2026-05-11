---
title: "Foundry Init MVP CI"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "Standard"
upstream:
  - "docs/standards/index.md"
  - "docs/work-packets/WP-0009-add-init-mvp-ci-gate.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "CI"
  - "Verification"
  - "Repository Contract"
---

# Foundry Init MVP CI

## Purpose

Define the CI standard for protecting the Foundry init MVP path.

## Workflow

The GitHub Actions workflow is located at:

    .github/workflows/foundry-init-mvp.yml

The workflow runs the local integrated gate:

    tools/scripts/check-foundry-init-mvp.sh

## Required Checks

The integrated gate verifies:

1. CLI typecheck.
2. CLI build.
3. documentation verification.
4. documentation readiness artifact generation.
5. CLI help.
6. init help.
7. init workspace smoke generation.
8. generated workspace contract verification.
9. generated workspace self-verification.

## Artifact Policy

The workflow uploads:

- `.artifacts/foundry`
- `.artifacts/docs`

These artifacts provide inspection data for failed CI runs.

## Strict Readiness

Strict documentation readiness may remain in attention status while bootstrap verification is complete.

The init MVP CI gate requires documentation verification to pass and requires the readiness artifact to be generated, but it does not require strict readiness to be complete.

## Change History

- Added Foundry init MVP CI standard.

## Database-Provider Matrix Job

The workflow also runs a separate database-provider smoke matrix job.

The matrix job executes:

    tools/scripts/check-foundry-init-database-matrix.sh

The job verifies that supported database providers can be generated non-interactively and that each generated workspace satisfies its provider contract.

This job is intentionally separate from the no-database init MVP gate so the baseline init path and provider-template matrix can be diagnosed independently.
