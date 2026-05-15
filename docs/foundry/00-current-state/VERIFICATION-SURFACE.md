---
title: "Foundry Verification Surface"
status: "Draft"
owner: "Project Maintainer"
lastUpdated: "2026-05-15"
governanceLevel: "Required"
documentType: "Platform"
project: "Foundry"
upstream:
  - "docs/foundry/00-current-state/CURRENT-STATE.md"
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

# Foundry Verification Surface

## Purpose

This document records the known verification surface for Foundry.

The goal is to make the project understandable, reproducible, and safe to evolve.

## Primary Verification Principle

A Foundry change is not complete merely because files were written.

A Foundry change is complete only when the relevant verification gate passes or the failure is documented as an intentional known gap.

## Primary Gate

```bash
bun run verify
```

The root verification gate should eventually represent the full repository readiness standard.

## Known Verification Commands

```bash
bun run typecheck
bun run build
bun run verify
bun run verify:docs
bun run verify:contracts
bun run verify:generated
bun run verify:generator-manifest
bun run verify:generators
bun run verify:init
bun run verify:init-provider-plugins
bun run verify:init-external-provider-plugins
bun run verify:init-upgrade
bun run verify:manifest
bun run verify:manifest-reader
bun run verify:manifest-command
bun run verify:specs
bun run docs:graph:validate
bun run docs:adr:validate
bun run docs:adr:validate:strict
bun run docs:glossary:validate
bun run docs:glossary:validate:strict
bun run docs:verify
bun run docs:verify:strict
bun run docs:directory:validate
bun run docs:directory:validate:strict
bun run docs:readiness
bun run docs:readiness:json
bun run docs:changeplans:validate
bun run docs:changeplans:validate:strict
bun run docs:work-packets:validate
bun run docs:work-packets:validate:strict
```

## Verification Categories

### Build Verification

Purpose:

- Ensure the CLI compiles.
- Ensure TypeScript errors are caught.
- Ensure generated command output can run.

Commands:

```bash
bun run typecheck
bun run build
```

### Repository Verification

Purpose:

- Ensure the entire Foundry repository remains coherent.

Command:

```bash
bun run verify
```

### Documentation Verification

Purpose:

- Ensure docs are structured, indexed, linked, and governed.

Commands:

```bash
bun run verify:docs
bun run docs:verify
bun run docs:verify:strict
bun run docs:graph:validate
bun run docs:directory:validate
bun run docs:adr:validate
bun run docs:glossary:validate
```

### Init Verification

Purpose:

- Ensure `foundry init` can generate valid workspaces.

Command:

```bash
bun run verify:init
```

### Generator Verification

Purpose:

- Ensure generator manifests, templates, and generated outputs remain valid.

Commands:

```bash
bun run verify:generator-manifest
bun run verify:generators
bun run verify:generated
```

### Manifest Verification

Purpose:

- Ensure Foundry manifests are readable, valid, and enforced.

Commands:

```bash
bun run verify:manifest
bun run verify:manifest-reader
bun run verify:manifest-command
```

### Contract Verification

Purpose:

- Ensure OpenAPI or other contract files are valid.

Command:

```bash
bun run verify:contracts
```

### Spec Verification

Purpose:

- Ensure specification artifacts remain valid and machine-readable.

Command:

```bash
bun run verify:specs
```

## Current Verification Questions

The reorientation effort must answer:

1. Which verification commands currently pass?
2. Which fail?
3. Which are slow?
4. Which are redundant?
5. Which should be part of the primary gate?
6. Which should be focused gates only?
7. Which need clearer failure output?
8. Which need fixtures?
9. Which need documentation?
10. Which should be required in CI?

## Verification Target

The target for Foundry MVP is that this command passes from a clean clone after dependency installation:

```bash
bun install
bun run verify
```

The README should explain exactly what the command verifies.
