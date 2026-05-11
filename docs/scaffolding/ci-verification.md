---
title: "CI Verification"
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
  - "docs/adr/ADR-0002-ai-expected-provider-agnostic-architecture.md"
  - "docs/adr/ADR-0001-monorepo-scaffolding-toolchain.md"
  - "docs/architecture/adr/0004-architecture-principles.md"
glossaryTerms:
  - "Scaffolding"
  - "Platform"
  - "CI"
  - "Verification"
---

# CI Verification

## Purpose

This document defines the initial continuous integration workflow for the repository.

## Workflow

The initial workflow is:

```text
.github/workflows/ci.yml
```

Trigger Policy
CI runs on:

￼
pull_request
push to main
Permission Policy
The workflow uses read-only repository contents permissions:

YAML
￼
permissions:
  contents: read
Verification Command
CI runs the same verification command used locally:

Bash
￼
bun run verify
CI Steps
The workflow performs the following steps:

checks out the repository;

installs Bun;

prints tool versions;

installs dependencies using the lockfile;

runs repository verification;

confirms .artifacts/ is not tracked.

Local Parity Rule
If CI fails, reproduce locally with:

Bash
￼
bun install
bun run verify
If the failure is lockfile-related, run:

Bash
￼
bun install
bun run verify
git status --short
Then commit the corrected lockfile if dependency metadata changed.

Artifact Rule
The .artifacts/ directory is local-only.

CI may create .artifacts/ during generator smoke tests, but those files must not be tracked by Git.
