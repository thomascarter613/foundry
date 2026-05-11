---
title: "Foundry Init Requirements"
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
glossaryTerms:
  - "Platform"
  - "Scaffolding"
  - "Foundry"
  - "Init"
  - "Requirements"
---

# Foundry Init Requirements

## Purpose

This document defines the requirements for `foundry init`.

`foundry init` is the Foundry Workspace Initializer. It creates a new, tested, working, monorepo-ready workspace that already includes the Foundry CLI and can immediately generate apps, services, packages, documents, tools, scripts, contracts, generated clients, and database infrastructure.

## User Story

As a user of the Foundry CLI, I want to run:

```bash
foundry init
```

or:

```bash
foundry init myapp
```

so that the CLI interactively walks me through creating a new monorepo that is ready for development, verification, scaffolding, and database lifecycle workflows.

## Product Intent

`foundry init` upgrades Foundry from a generator inside an existing monorepo into a monorepo bootstrapper.

The initialized repository must be able to:

1. install dependencies;
2. run verification;
3. run the embedded Foundry CLI;
4. generate further artifacts;
5. support database lifecycle workflows;
6. support no-database, single-database, and multi-database projects;
7. support pluggable database providers;
8. support Supabase compatibility from the start.

## Command Surface

### Interactive mode

```bash
foundry init
```

The CLI asks questions and creates a workspace plan.

### Named project mode

```bash
foundry init myapp
```

The CLI uses `myapp` as the destination name and asks remaining questions.

### Non-interactive mode

```bash
foundry init myapp --yes
```

The CLI uses defaults and writes the workspace.

### Dry-run mode

```bash
foundry init myapp --dry-run
```

The CLI prints the planned workspace without writing files.

### No-install mode

```bash
foundry init myapp --no-install
```

The CLI generates files but does not install dependencies.

### No-database mode

```bash
foundry init myapp --no-database --yes
```

The CLI generates a Foundry-ready monorepo without database infrastructure.

### Multi-database mode

```bash
foundry init myapp \
  --db primary=supabase:drizzle \
  --db documents=mongodb:native \
  --yes
```

The CLI generates a workspace with multiple named database connections.

## Required Modes

`foundry init` must support:

1. interactive prompts;
2. named destination argument;
3. non-interactive `--yes`;
4. `--dry-run`;
5. `--no-install`;
6. `--no-database`;
7. one or more `--db` flags;
8. safe destination validation;
9. collision checks;
10. post-init summary.

## Destination Safety

The initializer must reject:

1. empty project names;
2. unsafe project names;
3. path traversal;
4. absolute paths unless explicitly supported later;
5. existing non-empty directories unless an explicit overwrite strategy is implemented;
6. reserved filesystem names;
7. project names that cannot become valid package/workspace names.

## Generated Repository Goals

A generated repository should include:

```text
<project-name>/
├── .github/
│   └── workflows/
│       └── ci.yml
├── apps/
├── packages/
│   └── cli/
├── services/
├── tools/
│   └── scripts/
├── docs/
├── contracts/
│   └── openapi/
├── generated/
│   └── clients/
├── config/
│   ├── foundry/
│   └── database/
├── templates/
├── .scaffdog/
├── package.json
├── tsconfig.base.json
├── turbo.json
├── .gitignore
├── README.md
└── bun.lock
```

If database support is selected, the generated repository should also include database-specific files such as:

```text
db/
supabase/
prisma/
drizzle.config.ts
docker-compose.yml
.env.example
```

depending on selected providers.

## Workspace Requirements

The generated repository must use Bun workspaces by default.

Root workspace patterns:

```json
{
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*",
    "tools/*"
  ]
}
```

## Embedded Foundry Requirements

The initialized repository must include its own working Foundry CLI under:

```text
packages/cli
```

The root repository must expose:

```bash
bun run foundry -- generate --list
```

The generated repository must support:

```bash
bun run verify
bun run verify:contracts
bun run verify:generated
bun run verify:generators
```

When database support is included, it must also expose a unified database command surface.

## Database Requirements

Database support must be pluggable.

The initializer must not be hardcoded to a single database or ORM.

The system must support:

1. no database;
2. one database;
3. multiple named database connections;
4. SQL databases;
5. document databases;
6. hosted-compatible database targets;
7. local Docker-backed database targets;
8. provider-defined migrations;
9. provider-defined seeding;
10. provider-defined rollback;
11. future provider plugins.

## Required First-Class Database Providers

The first provider architecture must account for:

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

## Required Near-Term Providers

The architecture must be ready for:

```text
mysql:drizzle
mysql:prisma
mariadb:drizzle
mariadb:prisma
mongodb:prisma
```

## Future Provider Candidates

The provider registry should be able to add:

```text
neon:drizzle
neon:prisma
turso:drizzle
libsql:drizzle
cloudflare-d1:drizzle
cockroachdb:prisma
sqlserver:prisma
singlestore:drizzle
planetscale:drizzle
custom:plugin
```

## Unified Database Commands

A generated repo with database support should expose:

```bash
bun run db:check
bun run db:up
bun run db:down
bun run db:migrate
bun run db:seed
bun run db:rollback
bun run db:reset
```

For multiple database connections, commands must support connection scoping:

```bash
bun run db:migrate -- --connection primary
bun run db:seed -- --connection documents
bun run db:rollback -- --connection primary --migration 0001_initial --yes
```

## Database Connection Manifest

Generated repositories with database support must include:

```text
config/database/connections.json
```

This file is the durable manifest of configured database connections.

It must record:

1. connection name;
2. provider ID;
3. role;
4. environment variables;
5. schema paths;
6. migration paths;
7. rollback paths;
8. seed paths;
9. local development requirements;
10. provider-specific metadata.

## Rollback Policy

Foundry must not promise universal automatic rollback.

Rollback is:

```text
explicit
provider-defined
project-controlled
auditable
refusal-first when rollback material is missing
```

For SQL providers, rollback may use project-owned `.down.sql` files.

For MongoDB native, rollback may use project-owned down migration scripts.

For Supabase, rollback may use project-owned rollback SQL files.

The CLI must refuse rollback when the provider does not support it or when rollback material is missing.

## Interactive Prompt Requirements

The initializer should ask:

### Project identity

```text
Project name?
Package scope?
Description?
Author?
License?
Initialize Git?
Create initial commit?
```

### Monorepo layout

```text
Include apps/?
Include services/?
Include packages/?
Include tools/?
Include docs/?
Include contracts/?
Include generated/?
Include database support?
```

### Foundry capabilities

```text
Include Foundry CLI?
Include generator registry?
Include document generators?
Include package generator?
Include service generator?
Include OpenAPI client generator?
Include verification scripts?
Include CI?
```

### Database

```text
Add database support?
How many database connections?
Connection name?
Database target?
Toolkit/provider?
Use Docker/local runtime?
Generate schema?
Generate migrations?
Generate seeds?
Generate rollback support?
Add another connection?
```

### Supabase-specific prompts

```text
Supabase mode?
Include Supabase CLI project files?
Include local Supabase stack?
Include hosted Supabase env placeholders?
Include SQL migrations?
Include seed.sql?
Include RLS policy directory?
Include Edge Functions directory?
Include Supabase JS client?
Add Drizzle on top of Supabase Postgres?
Add Prisma on top of Supabase Postgres?
```

## Non-Interactive Examples

### No database

```bash
foundry init myapp --no-database --yes
```

### PostgreSQL + Drizzle

```bash
foundry init myapp --db primary=postgres:drizzle --yes
```

### PostgreSQL + Prisma

```bash
foundry init myapp --db primary=postgres:prisma --yes
```

### SQLite + Prisma

```bash
foundry init myapp --db local=sqlite:prisma --yes
```

### Supabase SQL

```bash
foundry init myapp --db primary=supabase:sql --yes
```

### Supabase + Supabase client

```bash
foundry init myapp \
  --db primary=supabase:sql \
  --db client=supabase:client \
  --yes
```

### Supabase Drizzle + MongoDB native

```bash
foundry init myapp \
  --db primary=supabase:drizzle \
  --db documents=mongodb:native \
  --yes
```

## Init Implementation Architecture

The implementation should be split into subsystems:

```text
packages/cli/src/commands/init/index.ts
packages/cli/src/init/types.ts
packages/cli/src/init/defaults.ts
packages/cli/src/init/prompts.ts
packages/cli/src/init/validator.ts
packages/cli/src/init/planner.ts
packages/cli/src/init/writer.ts
packages/cli/src/init/post-init.ts
packages/cli/src/init/templates.ts
packages/cli/src/init/database/types.ts
packages/cli/src/init/database/registry.ts
packages/cli/src/init/database/planner.ts
packages/cli/src/init/database/providers/*
```

## Required Internal Flow

`foundry init` must follow this flow:

1. parse flags and optional project name;
2. collect missing inputs interactively unless `--yes`;
3. normalize inputs into an `InitConfig`;
4. validate project and database selections;
5. build an `InitPlan`;
6. check destination safety;
7. render template files;
8. write files only when not in dry-run mode;
9. optionally install dependencies;
10. optionally initialize Git;
11. optionally run verification;
12. print next steps.

## v1 Acceptance Criteria

`foundry init` is not v1-complete until:

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
* [ ] generated repos include a working embedded Foundry CLI;
* [ ] generated repos include root verification;
* [ ] generated database manifests are valid;
* [ ] generated database scripts are provider-aware;
* [ ] rollback behavior is explicit and provider-defined;
* [ ] init smoke tests pass.

## Deferred

The following are deferred until after the initial `foundry init` implementation:

1. Backstage integration;
2. GUI/TUI initializer;
3. remote template registry;
4. provider plugins loaded from external packages;
5. cloud provisioning;
6. secrets-manager integration;
7. automatic GitHub repository creation;
8. automatic hosted Supabase project creation;
9. automatic database migration deployment to production;
10. production-grade rollback automation beyond provider-defined local scaffolds.
