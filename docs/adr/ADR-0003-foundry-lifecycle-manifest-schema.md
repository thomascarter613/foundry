---
title: "ADR-0003 Foundry Lifecycle Manifest Schema"
status: "Approved"
owner: "Architecture"
lastUpdated: "2026-05-08"
governanceLevel: "Binding"
documentType: "ADR"
upstream:
  - "docs/architecture/adr/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "ADR"
  - "0003"
  - "Foundry"
  - "Lifecycle"
  - "Manifest"
  - "Schema"
---

# ADR-0003: Foundry Lifecycle Manifest Schema

## Status

Accepted.

## Context

Foundry is intended to become a repo-native software lifecycle engine, not merely a scaffolder.

Its core command families include:

```text
init
add
upgrade
migrate
validate
doctor
audit
plan
spec
ai
handoff
These commands need a shared model for repository evolution.

Without a shared manifest, each command risks developing its own assumptions about workspace identity, verification, audit logging, AI artifacts, and provider configuration.

Decision
Foundry will introduce a versioned repository-local manifest schema.

The recommended manifest path is:

￼
.foundry/manifest.json
The schema path is:

￼
contracts/foundry/manifest.schema.json
The manifest will describe:

workspace identity;

lifecycle model;

supported lifecycle events;

verification commands;

audit configuration;

AI mode and AI-readable artifacts;

provider references.

Lifecycle model
The shared lifecycle model is:

￼
inspect → resolve → plan → apply → verify → document → audit → handoff
Not every command must execute every step, but every mutating lifecycle command should be understood in relation to this flow.

Rationale
The manifest gives Foundry a stable contract for:

initialization;

repository evolution;

upgrade planning;

migration planning;

validation;

auditability;

AI-readable handoff;

provider governance;

future ecosystem capabilities.

It also helps prevent silent architecture drift.

Consequences
Future Foundry commands should inspect the manifest before making significant changes.

Mutating commands should update audit output and, when relevant, update the manifest.

Generated workspaces should eventually include .foundry/manifest.json.

Verification should eventually validate the manifest against contracts/foundry/manifest.schema.json.

Rejected alternatives
Per-command configuration only
Rejected because it would duplicate lifecycle concepts across commands.

Cloud-only control plane
Rejected because Foundry must remain useful as a local-first CLI.

AI-provider-specific project state
Rejected because Foundry is AI-expected but not AI-locked.

Related documents
￼
docs/product/foundry-core-operating-model.md
docs/product/foundry-ai-operating-principles.md
docs/architecture/foundry-lifecycle-manifest.md
docs/architecture/ai-provider-agnostic-architecture.md
contracts/foundry/manifest.schema.json
