---
title: "Foundry Current State"
status: "Draft"
owner: "Project Maintainer"
lastUpdated: "2026-05-15"
governanceLevel: "Required"
documentType: "Planning"
project: "Foundry"
upstream:
  - "docs/foundry/README.md"
downstream:
  - "docs/foundry/00-current-state/FEATURE-INVENTORY.md"
  - "docs/foundry/00-current-state/VERIFICATION-SURFACE.md"
  - "docs/foundry/00-current-state/KNOWN-GAPS.md"
  - "docs/foundry/00-current-state/DECISION-LEDGER.md"
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

# Foundry Current State

## Purpose

This document records the current state of the Foundry project at the start of the controlled reorientation effort.

The goal is to restart from the beginning conceptually without abandoning prior implementation, documentation, scripts, architecture decisions, or useful experiments.

## Current Product Identity

Foundry is a CLI-centered repository generator and repository evolution tool.

Its emerging purpose is to help users create, validate, govern, and evolve high-quality software repositories with strong defaults for:

- monorepo structure;
- documentation governance;
- specification-driven development;
- generator manifests;
- verification scripts;
- database provider setup;
- AI-ready project continuity;
- work packets;
- repo evolution;
- reproducible development workflows.

## Current Technical Shape

Foundry currently appears to include:

- a Bun workspace root;
- a TypeScript CLI package;
- oclif-based command structure;
- root package scripts for build, typecheck, verification, docs validation, and init verification;
- generator infrastructure using scaffdog and plop;
- documentation validation commands;
- manifest validation commands;
- init-related implementation and verification;
- database-provider planning and templates;
- docs for scaffolding and init behavior;
- work-packet and change-plan validation concepts.

## Known Current Tension

Foundry has accumulated valuable implementation faster than it has accumulated a clear product-facing orientation layer.

The top-level README remains too small relative to the implementation surface.

This creates disorientation because important knowledge exists, but it is distributed across scripts, generated artifacts, prior chat context, and lower-level docs.

## Reorientation Objective

The reorientation objective is to establish a canonical Foundry spine:

1. what Foundry is;
2. what Foundry is not;
3. what currently exists;
4. what is complete;
5. what is partial;
6. what is broken;
7. what comes next;
8. what order future work should follow;
9. which verification gates define readiness;
10. which product slices lead to an MVP.

## Non-Destructive Rule

No existing file should be deleted, renamed, or rewritten during reorientation unless the change is separately justified, reviewed, and verified.

The first reorientation phase should add orientation documents only.
