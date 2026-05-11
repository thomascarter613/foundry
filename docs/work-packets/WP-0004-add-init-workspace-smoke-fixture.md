---
title: "WP-0004: Add Init Workspace Smoke Fixture"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
downstream:
  - "tools/scripts/check-foundry-init-workspace.sh"
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Work Packet"
  - "CLI"
  - "Scaffolding"
  - "Verification"
---

# WP-0004: Add Init Workspace Smoke Fixture

## Purpose

Add a disposable workspace smoke fixture for the `foundry init` MVP path.

## Problem

`foundry init --help` is reachable, but the product MVP requires more than help output.

The next validation question is:

> Can the init command create or plan a workspace in a disposable directory without crashing?

## Deliverables

This Work Packet delivers:

1. `tools/scripts/check-foundry-init-workspace.sh`
2. Disposable workspace creation under `.artifacts/foundry/init-workspace/`
3. Init help capture
4. Candidate init command execution
5. JSON summary output
6. A configurable override command for the exact init invocation

## Safety Rules

The fixture must:

1. Only write under `.artifacts/foundry/init-workspace/`.
2. Remove and recreate only its own disposable workspace directory.
3. Use timeouts to avoid hanging on interactive prompts.
4. Capture stdout and stderr for every candidate command.
5. Allow an explicit override via `FOUNDRY_INIT_SMOKE_COMMAND`.
6. Avoid touching the real repository workspace except for artifact output.

## Verification

Run:

~~~bash
tools/scripts/check-foundry-init-workspace.sh
~~~

Optional override example:

~~~bash
FOUNDRY_INIT_SMOKE_COMMAND='node packages/cli/bin/run.js init .artifacts/foundry/init-workspace/workspace --yes --no-install' \
  tools/scripts/check-foundry-init-workspace.sh
~~~

## Acceptance Criteria

The fixture is accepted when:

1. CLI typecheck passes.
2. CLI build passes.
3. `init --help` passes.
4. The fixture creates `.artifacts/foundry/init-workspace/summary.json`.
5. The fixture reports whether any init candidate succeeded.
6. Failures are captured as actionable data rather than hidden terminal output.

## Change History

- Created init workspace smoke fixture Work Packet.

## Smoke Fixture Result

The initial workspace smoke fixture confirmed:

- CLI typecheck passes.
- CLI build passes.
- `init --help` passes.
- No default non-interactive init candidate currently succeeds.
- No workspace files are produced by the default smoke candidates.

## Next Required Slice

The next implementation slice must establish a canonical non-interactive init invocation:

~~~bash
node packages/cli/bin/run.js init .artifacts/foundry/init-workspace/workspace --yes --no-install
~~~

The command should create a minimal verifiable workspace and exit with status `0`.

