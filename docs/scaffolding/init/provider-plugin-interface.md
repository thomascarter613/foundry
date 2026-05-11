---
title: "Foundry Init Provider Plugin Interface"
status: "Draft"
owner: "Platform"
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
  - "docs/adr/ADR-0002-ai-expected-provider-agnostic-architecture.md"
glossaryTerms:
  - "Platform"
  - "Scaffolding"
  - "Foundry"
  - "Init"
  - "Provider"
  - "Plugin"
  - "Interface"
---

# Foundry Init Provider Plugin Interface

The provider plugin interface is the post-v1 foundation for making `foundry init` database support extensible.

## Purpose

The interface exists so Foundry can support:

1. built-in Tier 1 providers;
2. planned first-party providers;
3. external provider packages;
4. custom local providers;
5. future provider marketplace or registry workflows.

## Provider plugin responsibilities

A provider plugin must define:

1. provider metadata;
2. runtime dependencies;
3. development dependencies;
4. environment variables;
5. commands;
6. generated files.

## Metadata

Provider metadata includes:

```text
id
family
adapter
label
description
tier
status
firstClassSupabase
capabilities
Required methods
```
A provider plugin must implement:

- getPackageAdditions()
- getEnvironmentVariables()
- getCommands()
- buildFiles(context)
- Capabilities

Provider capabilities are explicit strings such as:

- local-service
- sql
- document
- orm
- client
- migrations
- supabase
- docker-compose
- file-database
- cloud-managed
- Current scope

This document defines the provider plugin contract.

It does not yet load external provider packages. External loading belongs to a later post-v1 series.

## Policy

Provider plugins must not generate secrets.

Provider plugins must produce deterministic files.

Provider plugins must be testable without requiring network access.

Provider plugins must expose enough metadata for validation, documentation, planning, and generated workspace provenance.