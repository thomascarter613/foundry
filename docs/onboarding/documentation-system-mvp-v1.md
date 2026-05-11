---
title: "Documentation System MVP v1"
status: "Approved"
owner: "Documentation"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "Onboarding"
upstream:
  - "docs/onboarding/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Documentation System"
  - "Validation"
  - "Verification"
  - "Governance"
---

# Documentation System MVP v1

## Purpose

This document records the bootstrap completion criteria for the Foundry documentation system.

## MVP v1 Bootstrap Status

The documentation system MVP v1 bootstrap milestone is complete when the documentation verification pipeline runs successfully and all validator error counts are zero.

As of this milestone, bootstrap verification includes:

- directory topology validation
- governed metadata validation
- documentation graph construction
- documentation graph validation
- ADR validation
- glossary validation
- ChangePlan validation
- Work Packet validation
- machine-readable report generation under `.artifacts/docs`

## MVP v1 Bootstrap Completion Criteria

The MVP v1 bootstrap milestone is considered complete when:

1. TypeScript typecheck passes.
2. CLI build passes.
3. `foundry docs verify` passes.
4. `tools/scripts/verify-docs.ts` passes.
5. Metadata validation reports zero errors.
6. Directory validation reports zero errors.
7. Graph validation reports zero errors.
8. ADR validation reports zero errors.
9. Glossary validation reports zero errors.
10. ChangePlan validation reports zero errors.
11. Work Packet validation reports zero errors.
12. The integrated verification pipeline reports `ok: true`.
13. Required JSON artifacts are generated under `.artifacts/docs`.

## Accepted Bootstrap Warnings

The MVP v1 bootstrap milestone allows legacy-directory warnings while the documentation corpus is still being migrated toward strict topology.

Accepted bootstrap warnings may include:

- `docs/.ideas` remains as a legacy idea-capture location.
- `docs/adr` remains as a legacy ADR location.
- `docs/product` remains as a legacy product-document location.
- `docs/scaffolding` remains as a legacy scaffolding-document location.

These warnings are not acceptable for strict-mode readiness unless they are explicitly governed or migrated.

## Strict Mode

Strict mode is a later milestone.

Strict-mode readiness requires:

- no legacy directory warnings unless explicitly accepted by policy
- no graph warnings
- complete glossary quickref coverage
- strict ADR index coverage
- strict ChangePlan index coverage
- strict Work Packet index coverage
- no accepted bootstrap exceptions

## Operational Commands

Run bootstrap verification:

```bash
node packages/cli/bin/run.js docs verify
bun run tools/scripts/verify-docs.ts
tools/scripts/check-docs-mvp.sh
