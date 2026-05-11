---
title: "Documentation Verification CI"
status: "Approved"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "Standard"
upstream:
  - "docs/standards/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "CI"
  - "Documentation System"
  - "Verification"
  - "Validation"
---

# Documentation Verification CI

This workflow verifies the governed documentation system on pushes and pull requests.

## Required Gates

The CI job fails when any of the following fail:

- CLI typecheck
- CLI build
- documentation verification pipeline
- documentation MVP stabilization check

## Strict Readiness

Strict readiness is reported but does not block the MVP bootstrap gate.

The readiness report distinguishes:

- bootstrap completion
- strict-mode readiness

Bootstrap completion is required for this workflow. Strict readiness remains a follow-up governance milestone until the remaining strict-mode action plan is complete.

## Artifacts

The workflow uploads `.artifacts/docs` as `docs-verification-artifacts`.

Expected reports include:

- `directory-validation-report.json`
- `validation-report.json`
- `graph.json`
- `graph-validation-report.json`
- `adr-validation-report.json`
- `glossary-validation-report.json`
- `changeplan-validation-report.json`
- `work-packet-validation-report.json`
- `verification-pipeline-report.json`
- `readiness-report.json`
- `mvp-stabilization-summary.json`
- `mvp-stabilization-summary.txt`

## Workflow File

- `.github/workflows/docs-verification.yml`
