---
title: "Scaffolding Strategy"
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
  - "Strategy"
---

# Scaffolding Strategy

## Purpose

This document defines the project scaffolding strategy.

The scaffolding system exists to generate repeatable, policy-compliant, reviewable project artifacts inside the monorepo.

It must support both software artifacts and governance artifacts.

## Goals

The scaffolding system must:

1. Generate monorepo artifacts consistently.
2. Reduce manual setup errors.
3. Preserve architectural boundaries.
4. Make generated output auditable.
5. Support dry-run behavior.
6. Support future audit logging.
7. Support future policy validation.
8. Keep the developer-facing interface simple.
9. Avoid binding the whole project to a single generator engine.
10. Remain FOSS-first.

## Non-Goals

The scaffolding system is not intended to:

1. Replace all manual software design.
2. Replace architectural review.
3. Replace code review.
4. Generate production code without validation.
5. Hide important files or decisions from maintainers.
6. Adopt a heavyweight developer portal before it is needed.
7. Make generated files uneditable unless explicitly documented.

## Design Principle

The project CLI owns the user experience.

Generator engines are implementation details.

The user should run project-local commands such as:

```bash
bun run foundry init app
bun run foundry init package
bun run foundry init service
bun run foundry generate adr
bun run foundry generate work-packet
```

The user should not need to know which underlying engine is used for a specific artifact.

Layers
1. CLI Command Layer
The CLI command layer is responsible for:

Command parsing.

Help text.

Input validation.

Prompt orchestration.

Dry-run flags.

Audit-log flags.

Delegating to the correct generator engine.

Presenting success and failure output.

Chosen tool:

￼
oclif
2. Generator Registry Layer
The generator registry is responsible for recording:

Generator ID.

Generator category.

Owning engine.

Required inputs.

Optional inputs.

Output paths.

Safety rules.

Validation rules.

Whether the generator supports dry-run.

Whether the generator writes audit events.

Whether the generator is allowed to overwrite files.

This layer prevents generators from becoming undocumented scripts.

3. Template Layer
The template layer stores the actual files or template definitions used by the engines.

Template categories include:

￼
turbo/plop templates
copier templates
scaffdog templates
contract-generation configs
4. Validation Layer
The validation layer ensures generated output is acceptable.

Validation may include:

File existence checks.

Naming convention checks.

Package manifest checks.

TypeScript compilation.

Markdown frontmatter checks.

OpenAPI validity checks.

Repo-contract checks.

Architecture-boundary checks.

5. Audit Layer
The audit layer records important generator activity.

Audit events should eventually capture:

Timestamp.

Generator ID.

User-provided inputs.

Resolved output paths.

Files created.

Files modified.

Files skipped.

Validation result.

Dry-run status.

Tool version.

Git commit hash when available.

Preferred Generator Flow
A generator command should follow this flow:

￼
1. Parse command.
2. Load generator registry.
3. Validate requested generator exists.
4. Collect or resolve inputs.
5. Validate inputs.
6. Resolve output paths.
7. Check for collisions.
8. Preview planned file operations.
9. Execute dry-run or write operation.
10. Run post-generation validation.
11. Write audit event.
12. Print next-step instructions.
Safety Rules
Generators must not silently overwrite existing files.

Overwrite behavior must be one of:

Mode	Meaning
fail	Stop if the file already exists
skip	Leave existing file unchanged
merge	Merge into existing file using a controlled strategy
overwrite	Replace existing file only when explicitly allowed
￼
The default mode is:

￼
fail
Naming Rules
Generated artifacts must use stable, predictable names.

Examples:

￼
apps/member-portal
apps/public-site
packages/ui
packages/config
services/gov-api
docs/adr/ADR-0002-example-decision.md
docs/work-packets/WP-0001-example-work-packet.md
Required Generator Features for v1
The first production-ready version of the scaffolding system should support:

init app

init package

init service

generate adr

generate work-packet

generate runbook

generate openapi-client

dry-run mode

no-overwrite safety

generator registry

generated output summary

verification command recommendation

Deferred Features
These features are valuable but deferred:

Backstage developer portal.

Web-based scaffold request approval.

GitHub issue creation from generator output.

Automatic PR creation.

Cross-repo template distribution.

Template update automation.

Policy-as-code enforcement for every generated artifact.

Interactive TUI.

Remote template registry.
