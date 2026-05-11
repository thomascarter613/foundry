---
title: "Contract Verification"
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
  - "docs/architecture/adr/0004-ci-governance.md"
glossaryTerms:
  - "Platform"
  - "Scaffolding"
  - "Contract"
  - "Verification"
---

# Contract Verification

## Purpose

This document defines how OpenAPI contracts are verified before generated client output is trusted.

## Rule

OpenAPI contracts under `contracts/openapi/` are canonical source files.

Generated clients under `generated/clients/` are derived artifacts.

The contract must pass verification before the generated client is considered trustworthy.

## Tool

The project uses Redocly CLI for OpenAPI linting.

## Verification Command

Run:

```bash
bun run verify
```

Or run contract verification directly:

Bash
￼
bash tools/scripts/verify-contracts.sh
Contract Location
Current contracts:

￼
contracts/openapi/gov-api.yaml
Generated Client Location
Current generated clients:

￼
generated/clients/gov-api-client
Governance Rule
When changing an OpenAPI contract:

update the contract;

run contract verification;

regenerate the affected client;

inspect the generated diff;

run full repository verification;

commit the contract and generated output together.

Current Redocly Rules
The initial MVP rules are intentionally modest:

YAML
￼
extends:
  - recommended

rules:
  no-unused-components: warn
  operation-operationId: error
  operation-summary: error
  operation-2xx-response: error
  security-defined: off
security-defined is disabled for the starter contract because the first generated endpoints are public service metadata and health endpoints.

This rule should be revisited when authenticated or governance-sensitive endpoints are added.

￼

