---
title: "Generator Manifest and Provenance"
status: "Approved"
owner: "Project Maintainer"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "Scaffolding"
upstream:
  - "docs/platform/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks:
  - "docs/architecture/adr/0002-monorepo-structure.md"
  - "docs/adr/ADR-0001-monorepo-scaffolding-toolchain.md"
glossaryTerms:
  - "Platform"
  - "Scaffolding"
  - "Generator"
  - "Manifest"
  - "Provenance"
---

# Generator Manifest and Provenance

## Purpose

The generator manifest is the machine-readable inventory of Foundry scaffolding generators.

It records each generator's identity, backend, source files, output path patterns, verification commands, and provenance rules.

## Manifest Location

```text
config/foundry/generator-manifest.json
```

Verification Command
Run:

Bash
￼
bun run verify:generator-manifest
The manifest is also verified by:

Bash
￼
bun run verify
Why the Manifest Exists
The manifest prevents generator drift.

Without a manifest, generator knowledge becomes scattered across:

￼
packages/cli/src/generation/registry.ts
.scaffdog/*
plopfile.mjs
templates/*
contracts/*
tools/scripts/*
docs/*
The manifest provides a single inventory that can be checked by automation.

Manifest Responsibilities
The manifest records:

generator ID;

generator category;

backend engine;

availability status;

source template paths;

output path patterns;

canonical inputs;

derived artifact locations;

verification commands;

provenance rules.

Availability Statuses
available
The generator is implemented and executable through the Foundry CLI.

planned
The generator is known and intentionally planned, but not executable yet.

deferred
The generator is known but intentionally deferred.

Provenance Rules
Each generator has a provenance object.

The provenance object defines:

Field	Meaning
sourceOfTruth	Primary source file, contract, or template
generatedOutputIsEditable	Whether generated output may be manually edited
generatedOutputRequiresReview	Whether output diffs must be reviewed
localStatePaths	Local-only paths created by the generator or backend
￼
Current Available Generators
￼
governance-artifact:adr
governance-artifact:work-packet
package:typescript-library
service:hono-api
contract-artifact:openapi-typescript-client
Current Planned Generators
￼
document:runbook
app:solid-start
cli-command:oclif-command
Source-of-Truth Rule
Generated artifacts are not source-of-truth unless explicitly documented otherwise.

Examples:

Generator	Source of truth	Derived output
governance-artifact:adr	.scaffdog/adr.md	docs/adr/*.md
package:typescript-library	templates/plop/package/typescript-library	packages/*
service:hono-api	templates/copier/service-hono-api	services/*
contract-artifact:openapi-typescript-client	contracts/openapi/gov-api.yaml	generated/clients/*
￼
Drift Prevention
The manifest verification checks that:

the manifest exists;

the manifest is valid JSON;

required top-level fields exist;

each generator has required metadata;

source paths referenced by available generators exist;

available generator IDs are listed by the CLI;

.artifacts/ is not tracked by Git.

Local Artifact Rule
The manifest may reference local-state paths such as:

￼
.artifacts/foundry/audit
.artifacts/foundry/orval
.artifacts/foundry/tools/copier-venv
Those paths are local-only and must not be committed.

￼

