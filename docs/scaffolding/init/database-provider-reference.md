---
title: Database Provider Reference
description: Tier 1 and planned database provider IDs for foundry init.
status: draft
version: 0.1.0
created: 2026-05-06
updated: 2026-05-06
---

# Database Provider Reference

`foundry init` uses provider IDs to select database infrastructure.

Provider IDs follow this shape:

```text
family:adapter

Examples:

postgres:drizzle
supabase:client
mongodb:native
Tier 1 providers
Provider ID	Family	Runtime	Adapter	Local service	Notes
postgres:drizzle	PostgreSQL	PostgreSQL	Drizzle	Yes	Local Docker Compose PostgreSQL service.
postgres:prisma	PostgreSQL	PostgreSQL	Prisma	Yes	Local Docker Compose PostgreSQL service.
sqlite:drizzle	SQLite	SQLite	Drizzle	No	Local file database.
sqlite:prisma	SQLite	SQLite	Prisma	No	Local file database.
mongodb:native	MongoDB	MongoDB	Native MongoDB driver	Yes	Local Docker Compose MongoDB service.
supabase:sql	Supabase	Supabase/PostgreSQL	SQL + Supabase client	No	First-class Supabase family.
supabase:drizzle	Supabase	Supabase/PostgreSQL	Drizzle	No	Supabase as a first-class provider with Drizzle.
supabase:prisma	Supabase	Supabase/PostgreSQL	Prisma	No	Supabase as a first-class provider with Prisma.
supabase:client	Supabase	Supabase APIs	Supabase client	No	Client-only Supabase integration.
Supabase rule

Supabase must remain modeled as its own provider family.

Do not collapse Supabase into plain PostgreSQL behavior. Supabase-compatible providers may reuse PostgreSQL-compatible tools, but they must still preserve Supabase-specific configuration, documentation, and migration layout.

Planned providers

The architecture is provider/plugin-based so additional combinations can be added without changing the overall init model.

Planned providers include:

mysql:drizzle
mysql:prisma
mariadb:drizzle
mariadb:prisma
mongodb:prisma
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
Provider implementation expectations

Each provider should define:

provider metadata;
required runtime dependencies;
required dev dependencies;
environment example values;
generated files;
validation script behavior;
local service start behavior;
local service stop behavior;
documentation notes;
smoke-test expectations.
Verification expectations

Every Tier 1 provider must be covered by:

bun run verify:init

The focused init verification gate must confirm that each generated workspace contains the expected provider-specific files.
