---
title: "Generated Artifacts"
status: "accepted"
version: "0.1.0"
created: "2026-05-06"
updated: "2026-05-06"
owner: "Project Maintainer"
classification: "internal"
---

# Generated Artifacts

This directory contains generated artifacts that are intentionally kept inside the repository.

## Purpose

Generated artifacts are outputs derived from canonical source files, contracts, schemas, or templates.

Examples include:

```text
generated/clients/*
```


Source of Truth Rule
Generated artifacts are not the source of truth.

The source of truth is the input used to generate them.

Examples:

Generated artifact	Source of truth
generated/clients/gov-api-client/*	contracts/openapi/gov-api.yaml
￼
Commit Policy
Generated artifacts may be committed when doing so improves:

developer experience;

type safety;

reviewability;

reproducibility;

downstream package consumption.

Generated artifacts should not be edited manually unless the artifact explicitly says it is hand-maintained.

Local Tool State
Local tool state must not be committed.

The following path is local-only:

￼
.artifacts/
Verification
Run:

Bash
￼
bun run verify
￼
