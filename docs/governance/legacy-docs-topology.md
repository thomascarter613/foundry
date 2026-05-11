---
title: "Legacy Documentation Topology Policy"
status: "Approved"
owner: "Governance"
lastUpdated: "2026-05-11"
governanceLevel: "Binding"
documentType: "Governance"
upstream:
  - "docs/governance/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Governance"
  - "Documentation System"
  - "Policy"
  - "Repository Contract"
---

# Legacy Documentation Topology Policy

## Purpose

Define which legacy documentation directories are temporarily accepted during the transition from bootstrap documentation governance to strict documentation governance.

## Policy

The following directories are accepted transitional documentation topology:

| Directory | Status | Rationale | Future Disposition |
| --- | --- | --- | --- |
| `docs/.ideas` | Accepted Legacy | Idea-capture material remains useful during bootstrap. | Migrate or formalize into planning intake. |
| `docs/adr` | Accepted Legacy | Existing ADRs predate the canonical `docs/architecture/adr` topology. | Migrate, supersede, or explicitly retain as historical ADR ledger. |
| `docs/product` | Accepted Legacy | Product documents predate the canonical planning/product split. | Migrate into `docs/planning` or a canonical product domain. |
| `docs/scaffolding` | Accepted Legacy | Scaffolding material predates the canonical platform/scaffolding boundary. | Migrate into `docs/platform` or formalize as a canonical domain. |

## Enforcement

Accepted legacy directories are not treated as documentation topology errors.

They may still appear as informational findings until migrated or formally retained by a later ADR.

Any unlisted legacy or unexpected docs directory remains subject to directory topology validation.

## Strict Mode

Strict mode may pass with accepted legacy directories only while this policy is active and approved.

Removing or changing this policy requires updating the directory topology validator and the documentation readiness criteria.

## Change History

- Approved accepted legacy directory policy for Documentation System MVP v1 bootstrap completion.
