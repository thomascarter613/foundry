---
title: "Foundry CLI"
status: "draft"
version: "0.1.0"
created: "2026-05-05"
updated: "2026-05-05"
owner: "Project Maintainer"
classification: "internal"
---

# Foundry CLI

The Foundry CLI is the project-local command interface for governed scaffolding, generation, validation, and automation workflows.

## Purpose

The CLI provides one stable user-facing command surface over multiple internal generator engines.

Users should eventually run commands such as:

```bash
bun run foundry generate adr
bun run foundry generate work-packet
bun run foundry init app
bun run foundry init package
bun run foundry init service
```

Current Status
This package currently provides the first oclif command shell.

Implemented:

Bash
￼
foundry generate
Not yet implemented:

Bash
￼
foundry init app
foundry init package
foundry init service
foundry generate adr
foundry generate work-packet
foundry generate openapi-client
Local Usage
From the repository root:

Bash
￼
cd packages/cli
bun install
bun run foundry --help
bun run foundry generate --help
bun run foundry generate --dry-run
Design Rules
The CLI is the only normal user-facing entry point for scaffolding.

Generator engines are internal implementation details.

Commands must support dry-run before destructive writes.

Commands must eventually emit audit-log events.

Commands must not silently overwrite files.

Commands must print verification guidance after generation.

Related Documents
docs/adr/ADR-0001-monorepo-scaffolding-toolchain.md

docs/scaffolding/scaffolding-strategy.md

docs/scaffolding/generator-taxonomy.md
