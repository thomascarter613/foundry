---
title: "Foundry CLI Usage"
status: "accepted"
version: "0.1.0"
created: "2026-05-06"
updated: "2026-05-06"
owner: "Project Maintainer"
classification: "internal"
---

# Foundry CLI Usage

## Purpose

The Foundry CLI is the repository-local command surface for governed scaffolding.

It provides one stable interface over multiple generator backends:

| Backend | Purpose |
| --- | --- |
| Scaffdog | Governance and Markdown document generation |
| Plop | Small local package/file scaffolds |
| Copier | Larger golden-template scaffolds |
| Orval | OpenAPI-derived TypeScript client generation |

## Current MVP Command

The current MVP command is:

```bash
foundry generate
```

From the repository root, run it through the CLI package:

Bash
￼
cd packages/cli
node ./bin/run.js generate --help
cd ../..
If the root package script is configured, use:

Bash
￼
bun run foundry -- generate --help
Safety Model
The CLI follows a conservative safety model.

By default, generator commands only preview planned operations.

Files are written only when this flag is present:

Bash
￼
--execute
Audit logs are written only when this flag is present:

Bash
￼
--write-audit-log
The CLI blocks execution when:

required inputs are missing;

inputs are invalid;

generated paths are unsafe;

generated paths would collide with existing files;

the requested backend is not implemented.

Preview Mode
Preview mode is the default.

Example:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator package:typescript-library \
  --name "logger"
cd ../..
This prints planned operations but writes no scaffolded project files.

Execute Mode
Execute mode invokes the selected generator backend.

Example:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator package:typescript-library \
  --name "logger" \
  --execute
cd ../..
Execution performs:

input validation;

dry-run plan creation;

collision preflight;

backend invocation;

result reporting.

Audit Event Preview
To print a structured audit event without writing an audit log file:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator package:typescript-library \
  --name "logger" \
  --audit-event
cd ../..
Audit event results include:

Result	Meaning
planned	A preview plan was created
blocked	Execution was blocked before backend invocation
succeeded	Backend execution succeeded
failed	Backend execution failed
￼
Audit Log Persistence
To persist an audit log:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator package:typescript-library \
  --name "logger" \
  --execute \
  --write-audit-log
cd ../..
Audit logs are written under:

￼
.artifacts/foundry/audit/
The .artifacts/ directory is local-only and must not be committed by default.

List Generators
Bash
￼
cd packages/cli
node ./bin/run.js generate --list
cd ../..
Available Generators
governance-artifact:adr
Creates an Architecture Decision Record.

Backend:

￼
scaffdog
Preview:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator governance-artifact:adr \
  --identifier ADR-0003 \
  --name "Example Decision" \
  --status proposed
cd ../..
Execute:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator governance-artifact:adr \
  --identifier ADR-0003 \
  --name "Example Decision" \
  --status proposed \
  --execute
cd ../..
Expected output:

￼
docs/adr/ADR-0003-example-decision.md
Identifier format:

￼
ADR-0001
Allowed statuses:

￼
proposed
accepted
superseded
rejected
governance-artifact:work-packet
Creates a work packet.

Backend:

￼
scaffdog
Preview:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator governance-artifact:work-packet \
  --identifier WP-0001 \
  --name "Example Work Packet" \
  --status planned
cd ../..
Execute:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator governance-artifact:work-packet \
  --identifier WP-0001 \
  --name "Example Work Packet" \
  --status planned \
  --execute
cd ../..
Expected output:

￼
docs/work-packets/WP-0001-example-work-packet.md
Identifier format:

￼
WP-0001
Allowed statuses:

￼
planned
active
blocked
complete
cancelled
package:typescript-library
Creates an internal TypeScript package.

Backend:

￼
plop
Preview:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator package:typescript-library \
  --name "logger"
cd ../..
Execute:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator package:typescript-library \
  --name "logger" \
  --execute
cd ../..
Expected output:

￼
packages/logger/package.json
packages/logger/tsconfig.json
packages/logger/README.md
packages/logger/src/index.ts
packages/logger/src/index.test.ts
Verify generated package:

Bash
￼
cd packages/logger
bun run typecheck
bun run test
bun run build
cd ../..
service:hono-api
Creates a Hono API service.

Backend:

￼
copier
Preview:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator service:hono-api \
  --name "gov-api"
cd ../..
Execute:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator service:hono-api \
  --name "gov-api" \
  --execute
cd ../..
Expected output:

￼
services/gov-api/package.json
services/gov-api/tsconfig.json
services/gov-api/README.md
services/gov-api/src/index.ts
services/gov-api/src/index.test.ts
Verify generated service:

Bash
￼
bun install
cd services/gov-api
bun run typecheck
bun run test
bun run build
cd ../..
The first Copier execution may create a repo-local Python virtual environment under:

￼
.artifacts/foundry/tools/copier-venv
That path is local-only.

contract-artifact:openapi-typescript-client
Generates a TypeScript fetch client from an OpenAPI contract.

Backend:

￼
orval
Preview:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator contract-artifact:openapi-typescript-client \
  --name "gov-api-client" \
  --contract "contracts/openapi/gov-api.yaml"
cd ../..
Execute:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator contract-artifact:openapi-typescript-client \
  --name "gov-api-client" \
  --contract "contracts/openapi/gov-api.yaml" \
  --execute
cd ../..
Expected output:

￼
generated/clients/gov-api-client/index.ts
generated/clients/gov-api-client/model/
The source of truth is:

￼
contracts/openapi/gov-api.yaml
The generated client should not be edited manually.

Verification
Run full verification:

Bash
￼
bun run verify
Run targeted verification:

Bash
￼
bun run verify:contracts
bun run verify:generated
bun run verify:generators
Collision Behavior
The CLI refuses to execute when any planned output path already exists.

Example:

Bash
￼
cd packages/cli
node ./bin/run.js generate \
  --generator package:typescript-library \
  --name "logger" \
  --execute
cd ../..
If packages/logger/package.json already exists, execution is blocked before Plop is invoked.

Invalid Input Behavior
The CLI rejects unsafe names such as:

￼
../bad
/bad
bad\path
The CLI also rejects invalid identifiers such as:

￼
BAD-123
ADR-1
WP-1
Local Artifact Policy
Do not commit:

￼
.artifacts/
Usually commit:

￼
contracts/openapi/*.yaml
templates/**
.scaffdog/**
tools/scripts/**
docs/**
Commit generated clients intentionally when useful:

￼
generated/clients/*
v1 MVP Rule
A generator is considered v1-ready only when it supports:

registry listing;

preview mode;

input validation;

collision preflight;

explicit execution;

optional audit logging;

verification coverage;

documentation.

￼

