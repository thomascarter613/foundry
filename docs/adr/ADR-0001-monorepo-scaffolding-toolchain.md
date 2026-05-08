---
title: "ADR-0001: Monorepo Scaffolding Toolchain"
status: "Approved"
owner: "Architecture"
lastUpdated: "2026-05-08"
governanceLevel: "Binding"
documentType: "ADR"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

# ADR-0001: Monorepo Scaffolding Toolchain

## Status

Accepted.

## Context

The project requires a governed scaffolding system capable of generating apps, packages, services, tools, documentation, governance artifacts, configuration files, and contract-derived clients inside a monorepo.

The scaffolding system must be:

- FOSS-first.
- Embeddable in the repository.
- Invocable from a project-local CLI.
- Compatible with Bun and TypeScript.
- Suitable for a long-lived monorepo.
- Auditable.
- Testable.
- Template-driven where appropriate.
- Capable of future migration, validation, and dry-run behavior.
- Explicit about which generator owns which kind of output.

The project must avoid reinventing generic scaffolding capabilities that are already well solved by existing tools.

## Decision

The project will use a layered scaffolding architecture.

The selected toolchain is:

| Layer | Tool | Purpose |
| --- | --- | --- |
| CLI front door | oclif | Project-local command surface |
| Primary monorepo generator | `@turbo/gen` with Plop-style generators | Generate apps, packages, services, modules, and repo-local code |
| Large template engine | Copier | Instantiate larger golden templates that may need template update support |
| Markdown/document generator | Scaffdog | Generate reviewable docs-as-code artifacts |
| OpenAPI TypeScript client generation | Orval | Generate TypeScript clients from OpenAPI contracts |
| Broad OpenAPI generation | OpenAPI Generator | Generate SDKs, server stubs, or non-TypeScript clients when needed |
| Future internal developer portal | Backstage Scaffolder | Optional future web-based scaffolding interface |

## Architectural Rule

The project CLI is the only user-facing entry point for scaffolding.

Users should not be expected to directly invoke Plop, Turbo generators, Copier, Scaffdog, Orval, or OpenAPI Generator for normal workflows.

Instead, commands should look like:

```bash
bun run foundry init app
bun run foundry init package
bun run foundry init service
bun run foundry generate adr
bun run foundry generate work-packet
bun run foundry generate client
```

The CLI may internally delegate to the selected generator engine based on the requested artifact type.

Generator Ownership Model
Artifact Type	Owning Tool
New app	@turbo/gen / Plop, or Copier for large templates
New package	@turbo/gen / Plop
New service	@turbo/gen / Plop, or Copier for large templates
New CLI command	oclif generator or internal Plop generator
ADR	Scaffdog
Work packet	Scaffdog
Runbook	Scaffdog
SRS section	Scaffdog
OpenAPI TypeScript client	Orval
General OpenAPI client/server stub	OpenAPI Generator
Future portal-based scaffold	Backstage Scaffolder

Consequences
Positive
The project avoids writing a custom scaffolding engine from scratch.

The CLI remains stable even if internal generator engines change.

The monorepo can support multiple artifact types without forcing one tool to do everything.

Markdown-heavy governance artifacts remain easy to review.

Large templates can be managed separately from small local generators.

Contract-derived generated code is delegated to specialized tools.

The system can later add dry-run, audit logs, validation, policy checks, and template provenance.

Negative
The project will maintain several generation tools instead of one.

The internal CLI must provide a clean abstraction over multiple tools.

Generator ownership boundaries must be documented and enforced.

Dependency management must avoid letting unused scaffolding tools accumulate.

Neutral
Nx is not adopted at this stage.

Backstage is deferred until a developer portal is actually needed.

Yeoman, Hygen, Cookiecutter, and Projen are not selected for the initial implementation.

Rejected Alternatives
Single custom generator engine
Rejected because existing FOSS tools already solve template rendering, prompting, copying, and contract generation.

Yeoman as the primary generator
Rejected because it is more appropriate as a broad generator ecosystem than as a governed repo-local scaffolding layer for this project.

Nx generators
Rejected for now because adopting Nx would introduce a larger workspace model change. The project currently prefers Bun and Turbo.

Projen
Rejected for now because Projen changes the ownership model of generated configuration files. This project prefers human-reviewable configuration and explicit generated artifacts.

Cookiecutter
Rejected as the default large-template engine because Copier is a better fit for updateable templates.

Hygen
Rejected for now because Plop and Scaffdog already cover the desired local generator use cases.

Enforcement
Future implementation must ensure:

All scaffolding commands are exposed through the project CLI.

Generated artifacts include provenance metadata where appropriate.

Dry-run mode is supported before destructive writes.

The generator registry records ownership, destination paths, required inputs, and validation rules.

Generator outputs are covered by tests or repo-contract checks.

Scaffolding changes are committed atomically.

Related Documents
docs/scaffolding/scaffolding-strategy.md

docs/scaffolding/generator-taxonomy.md
