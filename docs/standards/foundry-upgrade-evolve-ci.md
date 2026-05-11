---
title: "Foundry Upgrade Evolve CI"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "Standard"
upstream:
  - "docs/standards/index.md"
  - "docs/work-packets/WP-0018-add-upgrade-evolve-plan-ci-gate.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "CI"
  - "Verification"
  - "Repository Contract"
  - "CLI"
---

# Foundry Upgrade Evolve CI

## Purpose

Define the CI standard for protecting the Foundry upgrade/evolve planning path.

## Workflow

The GitHub Actions workflow is located at:

    .github/workflows/foundry-upgrade-evolve.yml

The workflow runs the local integrated gate:

    tools/scripts/check-foundry-upgrade-evolve-plans.sh

## Required Checks

The integrated gate verifies:

1. Upgrade/evolve baseline command surfaces.
2. Upgrade command help.
3. Evolve command help.
4. Upgrade plan text output.
5. Upgrade plan JSON output.
6. Evolve plan text output.
7. Evolve plan JSON output.
8. Nested verification summaries.

## Artifact Policy

The workflow uploads upgrade/evolve artifacts from:

- `.artifacts/foundry/upgrade-evolve-baseline`
- `.artifacts/foundry/upgrade-evolve-plans`
- `.artifacts/foundry/upgrade-plan`
- `.artifacts/foundry/evolve-plan`
- `.artifacts/foundry/upgrade`
- `.artifacts/foundry/evolve`

These artifacts provide inspection data for failed CI runs.

## Mutation Policy

The upgrade/evolve CI gate is read-only.

It verifies command surfaces and planning output, but it must not apply repository changes.

## Change History

- Added Foundry upgrade/evolve CI standard.
