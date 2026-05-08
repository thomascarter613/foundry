---
title: "Supabase Compatibility"
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

# Supabase Compatibility

## Purpose

This document defines first-class Supabase compatibility for `foundry init`.

Supabase must be treated as a first-class database/platform target from the beginning, not as a later add-on and not merely as generic PostgreSQL.

## Compatibility Rule

Supabase support must account for both:

1. Supabase Postgres compatibility;
2. Supabase platform compatibility.

## Supabase Provider Family

Foundry should support these provider IDs:

```text
supabase:sql
supabase:drizzle
supabase:prisma
supabase:client
````

## Provider Meanings

### `supabase:sql`

Supabase SQL migrations and local Supabase project structure.

Responsible for:

```text
supabase/config.toml
supabase/migrations/
supabase/seed.sql
supabase/functions/
db/<connection>/rollbacks/
```

### `supabase:drizzle`

Supabase Postgres with Drizzle.

Responsible for:

```text
drizzle.config.ts or namespaced drizzle config
db/<connection>/schema/
db/<connection>/seeds/
db/<connection>/rollbacks/
supabase/migrations/
```

### `supabase:prisma`

Supabase Postgres with Prisma.

Responsible for:

```text
prisma/<connection>/schema.prisma
prisma/<connection>/seed.ts
db/<connection>/rollbacks/
supabase/migrations/
```

### `supabase:client`

Supabase JavaScript client package.

Responsible for:

```text
packages/supabase-client/
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## Supabase Is Not Only PostgreSQL

Supabase projects include Postgres compatibility, but a useful generated Supabase project also needs local project structure, migrations, seed workflows, optional client setup, and policy organization.

Foundry should not collapse Supabase into only:

```text
postgres:drizzle
postgres:prisma
```

Those providers are still useful, but Supabase deserves explicit provider IDs.

## Supabase Generated Layout

When Supabase support is selected, the generated repository may include:

```text
supabase/
├── config.toml
├── migrations/
├── seed.sql
├── functions/
└── README.md

db/
└── primary/
    ├── schema/
    ├── policies/
    ├── rollbacks/
    └── seeds/

packages/
└── supabase-client/
    ├── package.json
    ├── README.md
    └── src/
        └── index.ts
```

The exact files depend on selected Supabase providers.

## Supabase Environment Variables

Generated `.env.example` should include:

```env
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

For local development, the generated docs should explain that these values may differ between local Supabase and hosted Supabase.

## Supabase Scripts

Generated scripts may include:

```json
{
  "scripts": {
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:status": "supabase status",
    "supabase:reset": "supabase db reset",
    "supabase:migration:new": "supabase migration new",
    "supabase:db:push": "supabase db push",
    "supabase:db:pull": "supabase db pull"
  }
}
```

General database scripts should map to Supabase scripts when Supabase is the primary database:

```json
{
  "scripts": {
    "db:up": "bun run supabase:start",
    "db:down": "bun run supabase:stop",
    "db:reset": "bun run supabase:reset"
  }
}
```

## Supabase Local Mode

Supabase local mode should generate:

```text
supabase/config.toml
supabase/migrations/
supabase/seed.sql
```

It should assume a local Supabase stack managed by Supabase CLI and Docker.

## Supabase Hosted Mode

Supabase hosted mode should generate environment placeholders and deployment guidance, but should not attempt to create a hosted Supabase project automatically in the MVP.

Hosted mode should support:

```text
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## Supabase Both Mode

Both mode supports:

1. local Supabase development;
2. hosted Supabase deployment;
3. clear environment variable separation;
4. documented migration promotion workflow.

## Supabase + Drizzle

When using:

```text
supabase:drizzle
```

the generated project should include Drizzle schema files while respecting Supabase migration conventions.

Generated files may include:

```text
db/primary/schema/index.ts
db/primary/seeds/seed.ts
db/primary/rollbacks/.gitkeep
drizzle.config.ts
supabase/migrations/.gitkeep
supabase/seed.sql
```

## Supabase + Prisma

When using:

```text
supabase:prisma
```

the generated project should include a Prisma schema for Supabase Postgres.

Generated files may include:

```text
prisma/primary/schema.prisma
prisma/primary/seed.ts
db/primary/rollbacks/.gitkeep
supabase/migrations/.gitkeep
supabase/seed.sql
```

## Supabase Client Package

When using:

```text
supabase:client
```

the generated project should include:

```text
packages/supabase-client/package.json
packages/supabase-client/README.md
packages/supabase-client/src/index.ts
```

The package should expose a typed factory for creating a Supabase client from environment variables.

## RLS and Policies

Supabase projects commonly rely on SQL-level policies.

Foundry should reserve a policy directory:

```text
db/primary/policies/
```

Policies should be applied through migrations, not hidden runtime behavior.

## Seed Policy

Supabase seed SQL should live at:

```text
supabase/seed.sql
```

Optional TypeScript seed scripts may live at:

```text
db/primary/seeds/
```

## Migration Policy

Supabase SQL migrations should live under:

```text
supabase/migrations/
```

Generated migration helpers should not hide Supabase migration behavior.

## Rollback Policy

Supabase rollback is project-controlled.

Rollback files should live under:

```text
db/primary/rollbacks/
```

Example:

```text
db/primary/rollbacks/0001_initial.down.sql
```

The generated rollback command must refuse to run without an explicit rollback file.

## Multi-Database Compatibility

Supabase may be combined with other providers.

Examples:

```bash
foundry init myapp \
  --db primary=supabase:drizzle \
  --db documents=mongodb:native \
  --yes
```

```bash
foundry init myapp \
  --db primary=supabase:sql \
  --db local=sqlite:prisma \
  --yes
```

The database manifest must make those connections explicit.

## Acceptance Criteria

Supabase compatibility is accepted when:

* [ ] Supabase appears in Tier 1 provider requirements;
* [ ] `supabase:sql` is represented;
* [ ] `supabase:drizzle` is represented;
* [ ] `supabase:prisma` is represented;
* [ ] `supabase:client` is represented;
* [ ] Supabase local mode is documented;
* [ ] Supabase hosted mode is documented;
* [ ] Supabase migrations, seeds, policies, and rollbacks have assigned paths;
* [ ] Supabase can be combined with non-Supabase providers;
* [ ] Supabase rollback is explicit and project-controlled.
