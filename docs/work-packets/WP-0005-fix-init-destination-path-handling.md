---
title: "WP-0005: Fix Init Destination Path Handling"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
downstream:
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Work Packet"
  - "CLI"
  - "Scaffolding"
  - "Verification"
---

# WP-0005: Fix Init Destination Path Handling

## Purpose

Repair `foundry init` so the documented `[DESTINATION]` argument behaves as a repository-relative workspace path.

## Problem

The init command help documents `[DESTINATION]` as a repository-relative workspace directory, but the current validation path treats the full destination string as the project name.

This causes a valid invocation such as:

~~~bash
node packages/cli/bin/run.js init .artifacts/foundry/init-workspace/workspace --yes --no-install --no-database
~~~

to fail with:

~~~text
project-name-path-separator
Project name must not contain path separators.
~~~

## Required Behavior

The init command must distinguish:

- destination path: may contain path separators
- project name: must not contain path separators

When a destination path is supplied, the default project name should be derived from the destination basename.

Examples:

| Destination | Derived Project Name |
| --- | --- |
| `myapp` | `myapp` |
| `.artifacts/foundry/init-workspace/workspace` | `workspace` |
| `examples/demo-app` | `demo-app` |

## Acceptance Criteria

1. CLI typecheck passes.
2. CLI build passes.
3. `init --help` passes.
4. This command exits `0`:

~~~bash
node packages/cli/bin/run.js init .artifacts/foundry/init-workspace/workspace --yes --no-install --no-database
~~~

5. The workspace smoke fixture reports `"ok": true`.
6. The generated workspace contains at least one file.
7. Existing `foundry init myapp --yes --no-install` behavior remains valid.

## Verification

Run:

~~~bash
bun run --cwd packages/cli typecheck
( cd packages/cli && bun run build )
tools/scripts/check-foundry-init-workspace.sh
cat .artifacts/foundry/init-workspace/summary.json
~~~

## Change History

- Created Work Packet for init destination path handling fix.
