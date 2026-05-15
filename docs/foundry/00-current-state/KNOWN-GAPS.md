---
title: "Foundry Known Gaps"
status: "Draft"
owner: "Project Maintainer"
lastUpdated: "2026-05-15"
governanceLevel: "Required"
documentType: "Planning"
project: "Foundry"
upstream:
  - "docs/foundry/00-current-state/CURRENT-STATE.md"
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

# Foundry Known Gaps

## Purpose

This document records known gaps, risks, ambiguities, and cleanup needs in Foundry.

This is not a failure list.

It is a control surface for reducing disorientation and preventing architectural drift.

## Gap Categories

### Product Orientation Gap

The project needs a clearer top-level product explanation.

Current symptom:

- The implementation and scripts are more advanced than the README.
- It is not immediately obvious to a new reader what Foundry is, what is complete, and what comes next.

Mitigation:

- Create canonical Foundry product docs.
- Rewrite README after current-state inventory.
- Add an MVP scope document.

### Roadmap Gap

The project needs an explicit milestone roadmap.

Current symptom:

- Work has moved through many valuable slices, but the cumulative order is hard to reconstruct.

Mitigation:

- Create `docs/foundry/02-roadmap/ROADMAP.md`.
- Map existing features into milestones.
- Define the next ten atomic work packets.

### Status Gap

The project needs clear feature status markers.

Current symptom:

- Some features are complete.
- Some are partial.
- Some are aspirational.
- Some are experimental.

Mitigation:

- Maintain `FEATURE-INVENTORY.md`.
- Use status labels consistently.
- Link feature status to verification commands.

### Verification Gap

The project needs a clean verification report.

Current symptom:

- Many verification scripts exist.
- It is unclear which gates pass right now without running them.
- Some failures may be expected because features are mid-slice.

Mitigation:

- Run each verification gate.
- Record pass/fail/known failure.
- Distinguish root gate from focused gates.

### Documentation Drift Gap

The project may contain docs that are stale, incomplete, or not yet aligned to the current product direction.

Mitigation:

- Inventory docs.
- Mark stale docs instead of deleting them immediately.
- Add `supersedes` or `supersededBy` frontmatter when needed.

### CLI Surface Gap

The CLI command surface needs a canonical command map.

Mitigation:

- Generate or manually document command list.
- Explain command groups.
- Ensure help text is coherent.

### Init Scope Gap

`foundry init` appears to have a large scope and may need a clear distinction between v1 complete behavior and future behavior.

Mitigation:

- Audit actual behavior against requirements.
- Split requirements into `v1`, `v1.x`, and `future`.
- Ensure docs do not overclaim.

### Database Provider Gap

Database provider support is ambitious and needs precise status.

Mitigation:

- Verify each provider fixture.
- Record provider-specific output.
- Separate provider interface from provider implementation quality.

### Repo Evolution Gap

Repo evolution is strategically important but may not yet be implemented to the desired standard.

Mitigation:

- Define the minimal `foundry upgrade` or `foundry evolve` command.
- Require preview and diff before write.
- Require provenance-aware operations.

### AI-Native Gap

Foundry should be AI-ready but should not prematurely become a large agent platform.

Mitigation:

- Keep AI provider integration optional.
- Generate AI-readable project state files.
- Defer complex agent orchestration to AionX or Workbench unless needed for Foundry MVP.

## Non-Destructive Cleanup Rule

When uncertainty exists, prefer:

1. mark;
2. inventory;
3. link;
4. supersede;
5. delete only later with justification.

Do not delete useful historical work during the reorientation phase.
