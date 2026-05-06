---
title: "Foundry CLI"
status: "accepted"
version: "0.1.0"
created: "2026-05-05"
updated: "2026-05-06"
owner: "Project Maintainer"
classification: "internal"
---

# Foundry CLI

The Foundry CLI is the repository-local command interface for governed scaffolding, generation, validation, and automation workflows.

## Purpose

The CLI provides one stable user-facing command surface over multiple internal generator engines.

The CLI currently supports:

```text
foundry generate
```

Current Generator Backends
Backend	Purpose
Scaffdog	Governance and Markdown document generation
Plop	Small local package/file scaffolds
Copier	Larger golden-template scaffolds
Orval	OpenAPI-derived TypeScript client generation
￼
Usage
From this package:

Bash
￼
bun run typecheck
bun run build
node ./bin/run.js generate --help
From the repository root:

Bash
￼
bun run verify
List Generators
Bash
￼
node ./bin/run.js generate --list
Preview a Generator
Bash
￼
node ./bin/run.js generate \
  --generator package:typescript-library \
  --name "logger"
Preview mode writes no scaffolded project files.

Execute a Generator
Bash
￼
node ./bin/run.js generate \
  --generator package:typescript-library \
  --name "logger" \
  --execute
Persist an Audit Log
Bash
￼
node ./bin/run.js generate \
  --generator package:typescript-library \
  --name "logger" \
  --execute \
  --write-audit-log
Audit logs are written under:

￼
.artifacts/foundry/audit/
The .artifacts/ directory is local-only and must not be committed by default.

Available MVP Generators
Generator ID	Backend	Output
governance-artifact:adr	Scaffdog	docs/adr/*.md
governance-artifact:work-packet	Scaffdog	docs/work-packets/*.md
package:typescript-library	Plop	packages/*
service:hono-api	Copier	services/*
contract-artifact:openapi-typescript-client	Orval	generated/clients/*
￼
Safety Rules
Preview is the default.

File writes require --execute.

Audit logs require --write-audit-log.

Existing output paths block execution.

Invalid inputs block execution.

Unsafe paths block execution.

Generated clients are derived from OpenAPI contracts.

Local tool state under .artifacts/ is not committed.

Documentation
See:

￼
docs/scaffolding/cli/foundry-cli-usage.md
docs/scaffolding/scaffolding-strategy.md
docs/scaffolding/generator-taxonomy.md
docs/scaffolding/generated-artifact-hygiene.md
docs/scaffolding/contract-verification.md
docs/scaffolding/generator-smoke-tests.md
docs/scaffolding/ci-verification.md
