---
title: "Foundry Init Dependency Installation Policy"
status: "Draft"
owner: "Platform"
lastUpdated: "2026-05-08"
governanceLevel: "Binding"
documentType: "Platform"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

# Foundry Init Dependency Installation Policy

`foundry init` supports two dependency modes:

1. install dependencies after writing files;
2. write files only.

## Default behavior

By default, `foundry init` installs dependencies after creating the workspace.

Example:

```bash
bun run foundry -- init myapp --yes

This writes the workspace and then runs:

bun install

inside the generated workspace.

File-only behavior

Use --no-install to write files without installing dependencies.

Example:

bun run foundry -- init myapp --yes --no-install

This mode is preferred for:

smoke tests;
CI matrix checks;
deterministic scaffolding verification;
debugging generated file shape;
avoiding network dependency during init tests.
Verification behavior

bun run verify:init uses --no-install.

This keeps the init smoke-test matrix focused on generated workspace shape and embedded CLI behavior, rather than package registry/network behavior.

Failure behavior

If dependency installation is requested and bun install fails, foundry init fails.

The workspace files remain written so the user can inspect the generated project and retry manually:

cd myapp
bun install
Policy

Do not silently ignore dependency installation failures.

Do not make smoke tests depend on package registry availability.

Do not use package managers other than Bun for Foundry-generated workspaces unless a future provider explicitly introduces and documents that behavior.
