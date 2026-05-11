---
title: "Foundry Lifecycle Manifest"
status: "Draft"
owner: "Architecture"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "Architecture"
upstream:
  - "docs/architecture/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks:
  - "docs/architecture/adr/0001-architecture-principles.md"
  - "docs/adr/ADR-0001-monorepo-scaffolding-toolchain.md"
glossaryTerms:
  - "Architecture"
  - "Foundry"
  - "Lifecycle"
  - "Manifest"
---

# Foundry Lifecycle Manifest

The Foundry manifest is a repository-local contract that describes how a workspace participates in Foundry lifecycle workflows.

It is the shared schema foundation for:

```text
foundry init
foundry add
foundry upgrade
foundry migrate
foundry validate
foundry doctor
foundry audit
foundry plan
foundry spec
foundry ai
foundry handoff
Purpose
Foundry must not treat each command as an isolated generator.

Every meaningful repository evolution should follow the same lifecycle model:

￼
inspect → resolve → plan → apply → verify → document → audit → handoff
The manifest gives commands a common language for:

workspace identity;

lifecycle events;

verification commands;

audit log location;

AI mode;

AI-readable artifacts;

provider references.

Default path
The recommended manifest path is:

￼
.foundry/manifest.json
The schema path is:

￼
contracts/foundry/manifest.schema.json
Top-level manifest fields
￼
schemaVersion
foundryVersion
workspace
lifecycle
verification
audit
ai
providers
Workspace section
The workspace section records:

￼
name
kind
packageManager
sourceOfTruth
The repository should be the default source of truth.

Lifecycle section
The lifecycle section records supported events and the default flow.

Supported event examples:

￼
init
add
upgrade
migrate
repair
validate
doctor
audit
plan
spec
ai
handoff
Default flow:

￼
inspect
resolve
plan
apply
verify
document
audit
handoff
Verification section
Verification commands are first-class.

Examples:

￼
bun run typecheck
bun run build
bun run verify
Foundry should prefer deterministic verification before and after mutating repository operations.

Audit section
The audit section defines whether local audit logging is enabled and where events are written.

Default path:

￼
.foundry/audit/events.ndjson
AI section
The AI section records AI operating mode and expected AI-readable artifacts.

Supported modes:

￼
none
manual
optional-provider
configured-provider
AI provider usage must remain optional.

The manifest must not require a paid subscription or hosted provider.

Providers section
The providers section references configured providers such as:

￼
database providers
AI providers
future pack or recipe providers
Provider references identify the provider ID, kind, requirement level, and source.

Policy
The manifest is not merely documentation.

It is a contract that future Foundry commands should inspect, validate, update, audit, and hand off.

Commands should avoid silent architecture drift by updating or checking this manifest during meaningful repository evolution.
