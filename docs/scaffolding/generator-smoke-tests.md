---
title: "Generator Smoke Tests"
status: "accepted"
version: "0.1.0"
created: "2026-05-06"
updated: "2026-05-06"
owner: "Project Maintainer"
classification: "internal"
---

# Generator Smoke Tests

## Purpose

Generator smoke tests prove that the Foundry scaffolding system can safely preview, validate, execute, and clean up core generator workflows.

## Command

Run:

```bash
bun run verify:generators
```

The smoke tests are also included in:

Bash
￼
bun run verify
Coverage
The smoke tests verify:

generator registry listing;

dry-run package preview;

planned audit event output;

invalid input blocking;

Plop package generation;

collision preflight blocking;

generated package typecheck, test, and build;

Scaffdog ADR generation;

Copier Hono service generation;

Orval OpenAPI client generation;

cleanup of disposable smoke-test outputs.

Disposable Outputs
The smoke test creates temporary artifacts using names such as:

￼
packages/smoke-package-<timestamp>-<pid>
services/smoke-service-<timestamp>-<pid>
generated/clients/smoke-client-<timestamp>-<pid>
docs/adr/ADR-9xxx-smoke-test-adr.md
These files are removed automatically when the smoke test exits.

Local Tool State
Some generators may create local tool state under:

￼
.artifacts/
This directory is intentionally ignored by Git.

Rule
Smoke tests must not leave committed source files behind.

If a smoke test fails midway, run:

Bash
￼
git status --short
Then remove any disposable smoke-* files before committing.

￼

