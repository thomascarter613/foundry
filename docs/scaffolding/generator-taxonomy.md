---
title: "Generator Taxonomy"
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
  - "Scaffolding"
  - "Platform"
---

# Generator Taxonomy

## Purpose

This document defines the official generator categories for the monorepo scaffolding system.

The taxonomy prevents the project from accumulating unrelated one-off generators with unclear ownership.

## Generator Categories

The project recognizes the following generator categories:

```text
app
package
service
tool
cli-command
document
governance-artifact
contract-artifact
configuration
test-fixture
```

Category: app
An app is a user-facing or operator-facing application.

Typical destinations:

￼
apps/*
Examples:

￼
apps/public-site
apps/member-portal
apps/admin
apps/docs
Preferred generator engine:

￼
@turbo/gen / Plop
Copier for larger golden templates
Required outputs:

Application directory.

package.json.

TypeScript configuration.

Source entrypoint.

Test setup.

README.

Local verification command.

Category: package
A package is a reusable internal library.

Typical destinations:

￼
packages/*
Examples:

￼
packages/ui
packages/config
packages/domain
packages/logger
packages/testing
Preferred generator engine:

￼
@turbo/gen / Plop
Required outputs:

Package directory.

package.json.

TypeScript configuration.

Source entrypoint.

Test file.

README.

Export policy.

Category: service
A service is a backend process, API, worker, or daemon.

Typical destinations:

￼
services/*
Examples:

￼
services/gov-api
services/indexer
services/audit-worker
services/notification-worker
Preferred generator engine:

￼
@turbo/gen / Plop
Copier for larger golden templates
Required outputs:

Service directory.

package.json.

Source entrypoint.

Configuration boundary.

Health check or placeholder.

Test file.

README.

Runtime notes.

Category: tool
A tool is an internal developer or automation utility.

Typical destinations:

￼
tools/*
Examples:

￼
tools/repo-contract
tools/migration-checker
tools/scaffold-validator
Preferred generator engine:

￼
@turbo/gen / Plop
Required outputs:

Tool directory.

Entrypoint.

Test file.

README.

Usage example.

Category: cli-command
A CLI command is a command exposed through the project CLI.

Typical destinations:

￼
packages/cli/src/commands/*
Examples:

￼
packages/cli/src/commands/init/app.ts
packages/cli/src/commands/init/package.ts
packages/cli/src/commands/generate/adr.ts
Preferred generator engine:

￼
oclif generator
@turbo/gen / Plop for internal command templates
Required outputs:

Command implementation.

Unit test.

Help text.

Command registration if needed.

README or command reference update.

Category: document
A document is a Markdown or MDX file used for project knowledge, planning, architecture, or operations.

Typical destinations:

￼
docs/*
Examples:

￼
docs/product/software-requirements-specification.md
docs/architecture/system-overview.md
docs/runbooks/local-development.md
Preferred generator engine:

￼
Scaffdog
Required outputs:

Markdown file.

YAML frontmatter.

Status.

Version.

Owner.

Created and updated dates.

Category: governance-artifact
A governance artifact is a structured document used to control decisions, execution, review, or compliance.

Typical destinations:

￼
docs/adr/*
docs/work-packets/*
governance/*
Examples:

￼
docs/adr/ADR-0001-example.md
docs/work-packets/WP-0001-example.md
governance/policies/example-policy.md
Preferred generator engine:

￼
Scaffdog
Required outputs:

Canonical identifier.

YAML frontmatter.

Status.

Decision or execution metadata.

Review fields.

Verification section.

Category: contract-artifact
A contract artifact is generated from or related to an interface contract.

Typical destinations:

￼
contracts/*
generated/*
packages/api-client/*
Examples:

￼
contracts/openapi/gov-api.yaml
generated/clients/gov-api
packages/gov-api-client
Preferred generator engine:

￼
Orval
OpenAPI Generator
Buf if protobuf is adopted
Required outputs:

Generated client or stub.

Generator config.

Source contract reference.

Verification command.

Generated-code notice where appropriate.

Category: configuration
A configuration artifact is a project, app, package, service, or tool configuration file.

Typical destinations:

￼
.
config/*
apps/*/*
packages/*/*
services/*/*
Examples:

￼
tsconfig.json
biome.json
turbo.json
lefthook.yml
commitlint.config.ts
Preferred generator engine:

￼
@turbo/gen / Plop
Copier for large template sets
Required outputs:

Config file.

Ownership note where appropriate.

Validation command.

Category: test-fixture
A test fixture is generated sample data or structure used to test the scaffold system or project behavior.

Typical destinations:

￼
test/fixtures/*
packages/*/test/fixtures/*
tools/*/test/fixtures/*
Preferred generator engine:

￼
@turbo/gen / Plop
Required outputs:

Fixture data.

README or inline explanation.

Test that consumes the fixture where practical.

Generator Naming Convention
Generator IDs must follow this pattern:

￼
<category>:<name>
Examples:

￼
app:solid-start
package:typescript-library
service:hono-api
document:runbook
governance-artifact:adr
governance-artifact:work-packet
contract-artifact:openapi-typescript-client
cli-command:init-app
Generator Registry Requirement
Every generator must eventually be registered in a machine-readable registry.

The registry should include:

￼
id
category
description
engine
input_schema
output_paths
supports_dry_run
supports_audit_log
overwrite_policy
validation_commands
Default Overwrite Policy
The default overwrite policy is:

￼
fail
Generators must not overwrite existing files unless the command explicitly allows it.

Default Verification Expectation
Every generator should print a recommended verification command after execution.

Examples:

Bash
￼
bun run verify
bun run typecheck
bun run test
bun run lint
Current Approved Tool Ownership
Generator Category	Approved Engine
app	@turbo/gen / Plop, Copier
package	@turbo/gen / Plop
service	@turbo/gen / Plop, Copier
tool	@turbo/gen / Plop
cli-command	oclif, Plop
document	Scaffdog
governance-artifact	Scaffdog
contract-artifact	Orval, OpenAPI Generator
configuration	Plop, Copier
test-fixture	Plop
