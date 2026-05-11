---
title: "WP-0002: Add Foundry Init Workspace Initializer"
status: "Draft"
owner: "Project Maintainer"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/changeplans/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "ChangePlan"
  - "0002"
  - "Foundry"
  - "Init"
  - "Workspace"
  - "Initializer"
  - "WorkPacket"
---
# WP-0002: Add Foundry Init Workspace Initializer

## Status

planned.

## Purpose

This work packet introduces `foundry init`, the Foundry Workspace Initializer.

The initializer creates a new monorepo-ready workspace with an embedded Foundry CLI, verification scripts, documentation structure, generator templates, and optional pluggable database infrastructure.

## Scope

This work packet includes:

1. `foundry init` command design;
2. init requirements documentation;
3. pluggable database provider architecture;
4. first-class Supabase compatibility;
5. dry-run init planner;
6. non-interactive init support;
7. interactive init wizard;
8. template writer;
9. database provider registry;
10. Tier 1 database provider definitions;
11. generated repo smoke tests.

## Non-Goals

This work packet does not include:

1. hosted Supabase project creation;
2. cloud database provisioning;
3. secrets-manager integration;
4. Backstage Scaffolder integration;
5. GUI/TUI initializer;
6. remote template registry;
7. production database deployment automation;
8. external provider plugin loading;
9. automatic GitHub repository creation.

## Requirements Documents

This work packet is governed by:

```text
docs/scaffolding/init/foundry-init-requirements.md
docs/scaffolding/init/database-provider-architecture.md
docs/scaffolding/init/supabase-compatibility.md
````

## Implementation Slices

### Slice 1 — Requirements and Architecture

Create requirements documents and work packet.

Files:

```text
docs/scaffolding/init/foundry-init-requirements.md
docs/scaffolding/init/database-provider-architecture.md
docs/scaffolding/init/supabase-compatibility.md
docs/work-packets/WP-0002-add-foundry-init-workspace-initializer.md
```

Commit:

```bash
git commit -m "docs(init): define pluggable workspace initializer"
```

### Slice 2 — Init Command Skeleton

Create:

```text
packages/cli/src/commands/init/index.ts
packages/cli/src/init/types.ts
packages/cli/src/init/defaults.ts
```

Support:

```bash
foundry init --help
foundry init myapp --dry-run
```

No file writes yet.

Commit:

```bash
git commit -m "feat(init): add workspace initializer command shell"
```

### Slice 3 — Init Planner and Validator

Create:

```text
packages/cli/src/init/planner.ts
packages/cli/src/init/validator.ts
packages/cli/src/init/path-safety.ts
```

Support:

1. destination path resolution;
2. project name validation;
3. workspace directory planning;
4. dependency planning;
5. database planning placeholders;
6. post-init command planning.

Commit:

```bash
git commit -m "feat(init): add workspace initializer dry-run planner"
```

### Slice 4 — Database Provider Registry Types

Create:

```text
packages/cli/src/init/database/types.ts
packages/cli/src/init/database/registry.ts
packages/cli/src/init/database/planner.ts
```

Define:

```text
DatabaseKind
DatabaseToolkit
DatabaseProviderDefinition
DatabaseConnectionConfig
DatabaseConnectionPlan
DatabaseWorkspacePlan
```

Commit:

```bash
git commit -m "feat(init): add database provider registry"
```

### Slice 5 — Tier 1 Database Providers

Create:

```text
packages/cli/src/init/database/providers/postgres-drizzle.ts
packages/cli/src/init/database/providers/postgres-prisma.ts
packages/cli/src/init/database/providers/sqlite-drizzle.ts
packages/cli/src/init/database/providers/sqlite-prisma.ts
packages/cli/src/init/database/providers/mongodb-native.ts
packages/cli/src/init/database/providers/supabase-sql.ts
packages/cli/src/init/database/providers/supabase-drizzle.ts
packages/cli/src/init/database/providers/supabase-prisma.ts
packages/cli/src/init/database/providers/supabase-client.ts
```

Commit:

```bash
git commit -m "feat(init): add tier one database providers"
```

### Slice 6 — Template Writer

Create:

```text
packages/cli/src/init/writer.ts
templates/init/monorepo/**
```

Support no-database project generation first.

Commit:

```bash
git commit -m "feat(init): add workspace template writer"
```

### Slice 7 — Database Template Generation

Generate provider-specific files for:

```text
postgres:drizzle
postgres:prisma
sqlite:drizzle
sqlite:prisma
mongodb:native
supabase:sql
supabase:drizzle
supabase:prisma
supabase:client
```

Commit:

```bash
git commit -m "feat(init): scaffold pluggable database workspaces"
```

### Slice 8 — Interactive Wizard

Add prompts.

Create:

```text
packages/cli/src/init/prompts.ts
```

Commit:

```bash
git commit -m "feat(init): add interactive workspace initializer"
```

### Slice 9 — Init Verification

Create:

```text
tools/scripts/verify-init.sh
```

Test:

```bash
foundry init temp-no-db --no-database --yes --no-install
foundry init temp-supabase --db primary=supabase:sql --yes --no-install
foundry init temp-multi --db primary=supabase:drizzle --db documents=mongodb:native --yes --no-install
```

Commit:

```bash
git commit -m "test(init): add workspace initializer smoke tests"
```

## Required Provider Support

Tier 1 providers:

```text
postgres:drizzle
postgres:prisma
sqlite:drizzle
sqlite:prisma
mongodb:native
supabase:sql
supabase:drizzle
supabase:prisma
supabase:client
```

## Acceptance Criteria

This work packet is complete when:

* [ ] `foundry init --help` works;
* [ ] `foundry init myapp --dry-run` works;
* [ ] `foundry init myapp --no-database --yes --no-install` works;
* [ ] `foundry init myapp --db primary=postgres:drizzle --yes --no-install` works;
* [ ] `foundry init myapp --db primary=postgres:prisma --yes --no-install` works;
* [ ] `foundry init myapp --db local=sqlite:drizzle --yes --no-install` works;
* [ ] `foundry init myapp --db local=sqlite:prisma --yes --no-install` works;
* [ ] `foundry init myapp --db documents=mongodb:native --yes --no-install` works;
* [ ] `foundry init myapp --db primary=supabase:sql --yes --no-install` works;
* [ ] `foundry init myapp --db primary=supabase:drizzle --yes --no-install` works;
* [ ] `foundry init myapp --db primary=supabase:prisma --yes --no-install` works;
* [ ] `foundry init myapp --db primary=supabase:drizzle --db documents=mongodb:native --yes --no-install` works;
* [ ] generated repos include an embedded Foundry CLI;
* [ ] generated repos can run `bun run foundry -- generate --list`;
* [ ] generated repos include root verification;
* [ ] generated repos include `config/database/connections.json` when database support is enabled;
* [ ] generated database scripts are provider-aware;
* [ ] rollback behavior is explicit and provider-defined;
* [ ] init smoke tests pass;
* [ ] `bun run verify` passes.

## Verification

Run:

```bash
bun run verify
```

After init smoke tests are added, run:

```bash
bun run verify:init
```

## Git Commit

Recommended atomic Conventional Commit for this slice:

```bash
git commit -m "docs(init): define pluggable workspace initializer"
```
