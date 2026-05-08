---
title: "Database Provider Architecture"
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

# Database Provider Architecture

## Purpose

This document defines the database provider architecture for `foundry init`.

The initializer must support pluggable database providers so new projects can choose PostgreSQL, Supabase, SQLite, MongoDB, MySQL, MariaDB, and future targets without hardcoding the initializer to one stack.

## Core Rule

Database support is provider-driven.

`foundry init` must not assume:

```text
one database
one ORM
one migration tool
one seed strategy
one rollback strategy
one local runtime
```

Instead, each database capability is supplied by a provider definition.

## Provider ID Format

Provider IDs use this format:

```text
<database-target>:<toolkit>
```

Examples:

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
mysql:drizzle
mysql:prisma
mariadb:drizzle
mariadb:prisma
```

## Database Targets

Initial database targets:

```text
postgres
supabase
sqlite
mongodb
mysql
mariadb
```

Future database targets:

```text
neon
turso
libsql
cloudflare-d1
cockroachdb
sqlserver
singlestore
planetscale
custom
```

## Toolkits

Initial toolkits:

```text
drizzle
prisma
native
sql
supabase-client
driver
manual
```

## Provider Definition

Each provider should be represented by a typed definition.

```ts
export interface DatabaseProviderDefinition {
  readonly id: DatabaseProviderId;
  readonly database: DatabaseKind;
  readonly toolkit: DatabaseToolkit;
  readonly displayName: string;
  readonly description: string;
  readonly status: "available" | "planned" | "deferred";
  readonly supportsMigrations: boolean;
  readonly supportsSeeding: boolean;
  readonly supportsRollback: "native" | "project-controlled" | "manual" | "none";
  readonly supportsDockerCompose: boolean;
  readonly supportsSupabaseLocalStack: boolean;
  readonly supportsHostedConnection: boolean;
  readonly requiredDependencies: readonly string[];
  readonly requiredDevDependencies: readonly string[];
  readonly generatedFiles: readonly string[];
  readonly envVars: readonly EnvVarDefinition[];
  readonly scripts: Record<string, string>;
}
```

## Provider Registry

Provider definitions should live under:

```text
packages/cli/src/init/database/providers
```

The registry should live under:

```text
packages/cli/src/init/database/registry.ts
```

Expected shape:

```ts
export const databaseProviderRegistry = {
  providers: [
    postgresDrizzleProvider,
    postgresPrismaProvider,
    sqliteDrizzleProvider,
    sqlitePrismaProvider,
    mongodbNativeProvider,
    supabaseSqlProvider,
    supabaseDrizzleProvider,
    supabasePrismaProvider,
    supabaseClientProvider
  ]
};
```

## Connection Manifest

Generated repositories must include:

```text
config/database/connections.json
```

Example:

```json
{
  "version": "foundry.database-connections.v1",
  "connections": [
    {
      "name": "primary",
      "provider": "supabase:drizzle",
      "role": "primary",
      "env": {
        "databaseUrl": "DATABASE_URL",
        "supabaseUrl": "SUPABASE_URL",
        "supabaseAnonKey": "SUPABASE_ANON_KEY",
        "supabaseServiceRoleKey": "SUPABASE_SERVICE_ROLE_KEY"
      },
      "local": {
        "requiresDocker": true,
        "usesSupabaseCli": true,
        "projectDirectory": "supabase"
      },
      "schema": {
        "directory": "db/primary/schema"
      },
      "migrations": {
        "directory": "supabase/migrations",
        "rollbackDirectory": "db/primary/rollbacks"
      },
      "seeds": {
        "sqlSeed": "supabase/seed.sql",
        "scriptDirectory": "db/primary/seeds"
      }
    }
  ]
}
```

## Multi-Database Rule

Multi-database support is first-class.

A generated project may include:

```text
primary=supabase:drizzle
documents=mongodb:native
local=sqlite:prisma
analytics=postgres:prisma
```

Each connection must have:

1. stable connection name;
2. provider ID;
3. role;
4. environment variables;
5. provider-generated files;
6. provider-specific scripts;
7. lifecycle command support.

## Connection Roles

Allowed connection roles should include:

```text
primary
document-store
read-model
analytics
event-store
cache
local
test
custom
```

## Generated DB Layout

For one or more database connections:

```text
db/
├── README.md
├── registry.ts
├── primary/
│   ├── schema/
│   ├── migrations/
│   ├── rollbacks/
│   └── seeds/
└── documents/
    ├── schema/
    ├── migrations/
    ├── rollbacks/
    └── seeds/
```

Provider-specific roots may also exist:

```text
supabase/
prisma/
```

## Unified Command Surface

The generated repo should expose:

```bash
bun run db:check
bun run db:up
bun run db:down
bun run db:migrate
bun run db:seed
bun run db:rollback
bun run db:reset
```

All commands should dispatch through:

```text
tools/scripts/db.ts
```

Provider-specific wrappers may also be generated:

```json
{
  "scripts": {
    "db:primary:migrate": "bun run tools/scripts/db.ts migrate --connection primary",
    "db:documents:seed": "bun run tools/scripts/db.ts seed --connection documents"
  }
}
```

## Migration Policy

Migration strategy is provider-defined.

### Drizzle providers

Drizzle providers may use:

```text
drizzle-kit generate
drizzle-kit migrate
```

with provider-specific configuration.

### Prisma providers

Prisma providers may use:

```text
prisma migrate dev
prisma migrate deploy
prisma db seed
```

with one Prisma schema per connection where needed.

### MongoDB native provider

MongoDB native provider should use project-controlled migration scripts.

### Supabase SQL provider

Supabase SQL provider should use:

```text
supabase/migrations/*.sql
supabase/seed.sql
```

with Supabase CLI local workflows.

## Rollback Policy

Rollback is provider-defined.

Foundry must not pretend every provider has safe automatic rollback.

Allowed rollback modes:

```text
native
project-controlled
manual
none
```

### `native`

The provider has a documented native rollback mechanism.

### `project-controlled`

Foundry generates a rollback convention, such as:

```text
db/<connection>/rollbacks/<migration>.down.sql
```

or:

```text
db/<connection>/rollbacks/<migration>.down.ts
```

### `manual`

Foundry documents how rollback should be performed, but does not generate an executable rollback command.

### `none`

Rollback is not supported for this provider.

## Rollback Command Requirements

The generated rollback command must:

1. require `--connection`;
2. require `--migration`;
3. require confirmation unless `--yes`;
4. refuse to run if rollback files are missing;
5. run rollback in a transaction when provider supports transactions;
6. record rollback attempts where feasible;
7. print exactly what it did.

Example:

```bash
bun run db:rollback -- --connection primary --migration 0001_initial --yes
```

## Environment Variables

Generated `.env.example` should include only variables required by selected providers.

Examples:

```env
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MONGODB_URI=
MONGODB_DATABASE=
SQLITE_DATABASE_PATH=
MYSQL_DATABASE_URL=
```

## Provider Tiering

### Tier 1

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

### Tier 2

```text
mysql:drizzle
mysql:prisma
mariadb:drizzle
mariadb:prisma
mongodb:prisma
```

### Tier 3

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

## Provider Composition

Provider combinations must be valid.

Examples:

```text
primary=postgres:drizzle
primary=postgres:prisma
primary=supabase:sql + client=supabase:client
primary=supabase:drizzle + documents=mongodb:native
local=sqlite:prisma
```

Invalid examples:

```text
same connection name used twice
same provider with conflicting root files
two providers both claiming the same prisma/schema.prisma path without namespacing
supabase:client without Supabase env variables
```

## Prisma Multi-Connection Rule

Prisma provider implementations must not assume one global Prisma schema for multiple unrelated databases.

When multiple Prisma-backed connections exist, generate namespaced Prisma schema directories.

Example:

```text
prisma/primary/schema.prisma
prisma/analytics/schema.prisma
```

## Supabase Rule

Supabase compatibility is first-class.

Supabase providers must support:

1. local Supabase stack;
2. hosted Supabase environment placeholders;
3. SQL migrations;
4. seed SQL;
5. optional Drizzle overlay;
6. optional Prisma overlay;
7. optional Supabase JS client package;
8. RLS and policy organization;
9. provider-controlled rollback convention.

## Verification Requirements

Generated repos with database support must include checks for:

1. valid `config/database/connections.json`;
2. required env example variables;
3. required provider files;
4. required provider scripts;
5. provider-specific config syntax where feasible.

## Implementation Files

Planned implementation paths:

```text
packages/cli/src/init/database/types.ts
packages/cli/src/init/database/registry.ts
packages/cli/src/init/database/planner.ts
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

## Acceptance Criteria

This architecture is accepted when:

* [ ] provider IDs are standardized;
* [ ] Tier 1 providers are represented in requirements;
* [ ] Supabase providers are first-class;
* [ ] multiple database connections are supported by design;
* [ ] rollback behavior is explicit and provider-defined;
* [ ] generated repositories use a database connection manifest;
* [ ] implementation work packets follow this architecture.
