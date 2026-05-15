---
title: "Foundry Roadmap"
status: "Draft"
owner: "Project Maintainer"
lastUpdated: "2026-05-15"
governanceLevel: "Required"
documentType: "Planning"
project: "Foundry"
upstream:
  - "docs/foundry/01-product/PRODUCT-CHARTER.md"
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

# Foundry Roadmap

## Purpose

This roadmap defines the controlled path from the current Foundry project state to a coherent MVP.

## Roadmap Principle

The project should move from disoriented accumulation to ordered product development.

The order is:

```text
Preserve
→ Inventory
→ Clarify
→ Stabilize
→ Verify
→ Ship
→ Evolve
```

## Milestones

### M0 — Reorientation and Stabilization

Goal:

Establish canonical orientation without destroying existing work.

Deliverables:

- Foundry project index.
- Current-state document.
- Feature inventory.
- Verification surface.
- Known gaps.
- Decision ledger.
- Product charter.
- Roadmap.

Exit criteria:

- Orientation documents exist.
- No implementation behavior has been changed.
- `git diff` is understandable.
- A clean commit records the reorientation layer.

### M1 — CLI Baseline Audit

Goal:

Understand and stabilize the current CLI command surface.

Deliverables:

- Command inventory.
- Help text review.
- CLI package map.
- Build/typecheck verification.
- Known CLI gaps.

Exit criteria:

- `bun run typecheck` passes or known failures are documented.
- `bun run build` passes or known failures are documented.
- Command map exists.

### M2 — Verification Baseline

Goal:

Determine the exact health of the repository.

Deliverables:

- Verification report.
- Pass/fail matrix.
- Slow/focused gate classification.
- Root gate definition.

Exit criteria:

- Each known verification command is categorized.
- Root `bun run verify` behavior is understood.
- Known failures have owners and next actions.

### M3 — Foundry Init Stabilization

Goal:

Stabilize `foundry init` as the first major product capability.

Deliverables:

- Init capability audit.
- Provider matrix audit.
- Generated workspace contract.
- Init smoke-test report.
- Updated init docs if needed.

Exit criteria:

- `bun run verify:init` passes or known failures are documented.
- Supported provider matrix is accurate.
- Generated workspace contract is explicit.

### M4 — Generator System Stabilization

Goal:

Clarify and stabilize the generator manifest/template system.

Deliverables:

- Generator manifest schema.
- Generator registry documentation.
- Template ownership map.
- Generator fixture tests.

Exit criteria:

- Generator validation passes.
- Generator docs explain how to add a generator.
- Collision and overwrite rules are clear.

### M5 — Docs, Specs, ADRs, and Work Packets

Goal:

Make Foundry's governance/documentation workflow coherent and productized.

Deliverables:

- Docs governance map.
- Spec workflow.
- ADR workflow.
- Work-packet workflow.
- Change-plan workflow.
- Relationship among these artifacts.

Exit criteria:

- Docs validation passes.
- Work-packet validation passes or gaps are documented.
- Specs validation passes or gaps are documented.
- The user can understand how brainstorm becomes implementation.

### M6 — Repository Inspection

Goal:

Add or stabilize a command that inspects an existing repo.

Potential command:

```bash
foundry inspect
```

Deliverables:

- Repo surface reader.
- Inspection report.
- Missing file detection.
- Foundry compatibility score.
- JSON output.

Exit criteria:

- Foundry can inspect its own repo.
- Foundry can inspect a generated repo.
- Foundry can report useful next actions.

### M7 — Repository Evolution

Goal:

Add or stabilize safe repo evolution commands.

Potential commands:

```bash
foundry plan
foundry apply
foundry upgrade
```

Deliverables:

- Non-destructive write policy.
- Change preview.
- Diff summary.
- Provenance-aware evolution.
- Backup or refusal strategy.

Exit criteria:

- Foundry can propose changes without writing.
- Foundry can apply approved changes safely.
- Foundry does not silently overwrite important user work.

### M8 — AI-Ready Context Layer

Goal:

Generate and maintain AI-readable project continuity files.

Deliverables:

- Bootstrap prompt.
- Current state file.
- Handoff packet.
- Work-packet summary.
- Verification summary.

Exit criteria:

- A fresh AI session can orient from repo files.
- Generated repos include useful AI continuity anchors.
- No hosted AI provider is required.

### M9 — MVP Release Candidate

Goal:

Prepare Foundry for first public use.

Deliverables:

- README rewrite.
- Install/use guide.
- Tutorial.
- Command reference.
- MVP demo.
- Release checklist.

Exit criteria:

- Clean clone works.
- README explains the product.
- Core commands work.
- MVP scope is honest.
- Known limitations are documented.

## Current Immediate Slice

The current immediate slice is:

```text
M0.1 — Add Foundry reorientation spine
```

## Atomic Commit for M0.1

```bash
git add docs/foundry
git commit -m "docs(foundry): add project reorientation spine"
```
