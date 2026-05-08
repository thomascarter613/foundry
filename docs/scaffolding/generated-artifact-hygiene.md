---
title: "Generated Artifact Hygiene"
status: "Approved"
owner: "Project Maintainer"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "Platform"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

# Generated Artifact Hygiene

## Purpose

This document defines how generated artifacts, temporary generator state, and local audit outputs are handled.

## Artifact Classes

The project separates generator-related files into three classes.

| Class | Example | Commit? |
| --- | --- | --- |
| Canonical source | `contracts/openapi/gov-api.yaml` | Yes |
| Intentional generated output | `generated/clients/gov-api-client/index.ts` | Yes, when useful |
| Local generator state | `.artifacts/foundry/*` | No |

## Canonical Source Files

Canonical source files are the durable input to a generator.

Examples:

```text
contracts/openapi/*.yaml
templates/plop/**
templates/copier/**
.scaffdog/**
```

Canonical source files must be committed.

Intentional Generated Outputs
Intentional generated outputs may be committed when they are part of the developer experience or package consumption model.

Examples:

￼
generated/clients/*
When committed, generated outputs must be reviewed like normal code, but their source of truth remains the upstream contract or template.

Local Generator State
Local generator state includes:

￼
.artifacts/foundry/audit
.artifacts/foundry/orval
.artifacts/foundry/tools
These files are local-only and must not be committed by default.

Audit Logs
Audit logs are useful during local development and debugging.

They should not be committed unless a specific work packet or incident review explicitly requires preserving one.

Orval Configs
Generated Orval configs under .artifacts/foundry/orval are temporary execution files.

They should not be committed.

Copier Tool Environment
The repo-local Copier virtual environment under .artifacts/foundry/tools/copier-venv is local tool state.

It should not be committed.

Verification Rules
Repository verification should check that:

.artifacts/ is not tracked by Git.

generated client directories have expected entrypoints.

generated client directories have model directories when expected.

generated artifact documentation exists.
