---
title: Foundry Init
description: User-facing guide for initializing new Foundry workspaces.
status: draft
version: 0.1.0
created: 2026-05-06
updated: 2026-05-06
---

# Foundry Init

`foundry init` creates a new local Foundry workspace.

It is designed to produce a tested, usable monorepo that can immediately run the embedded Foundry CLI and generate future apps, services, packages, documents, contracts, generated clients, and database infrastructure.

## Command forms

```bash
bun run foundry -- init
bun run foundry -- init myapp
bun run foundry -- init myapp --yes
bun run foundry -- init myapp --no-database --yes --no-install
bun run foundry -- init myapp --database-provider postgres:drizzle --yes --no-install
Interactive mode

When run without --yes, foundry init uses an interactive wizard when a TTY is available.

The wizard asks for:

workspace directory;
whether to configure a database provider;
which database provider to use;
whether to install dependencies;
final confirmation.

Example:

bun run foundry -- init

Recommended wizard answers for a local smoke test:

Workspace directory: tmp-foundry-init-wizard-test
Configure a database provider?: yes
Database provider: postgres:drizzle
Install dependencies?: no
Create this workspace?: yes
Non-interactive mode

Use --yes for deterministic non-interactive initialization.

Example:

bun run foundry -- init tmp-foundry-init-no-db-test \
  --no-database \
  --yes \
  --no-install

This is the preferred mode for scripts, CI smoke tests, and reproducible tutorials.

Dry-run mode

Use --dry-run to print the initialization plan without writing files.

Example:

bun run foundry -- init myapp --database-provider postgres:drizzle --dry-run

Dry-run output includes:

workspace name;
destination;
database provider;
install behavior;
directories to create;
files to write;
scripts to expose.
Database behavior

By default, database files are written only when a provider is selected.

Use --no-database to create a workspace without database infrastructure:

bun run foundry -- init myapp --no-database --yes --no-install

Use --database-provider to select a provider:

bun run foundry -- init myapp \
  --database-provider postgres:drizzle \
  --yes \
  --no-install
Tier 1 database providers

The current Tier 1 provider IDs are:

postgres:drizzle
postgres:prisma
sqlite:drizzle
sqlite:prisma
mongodb:native
supabase:sql
supabase:drizzle
supabase:prisma
supabase:client

Supabase is treated as a first-class provider family, not merely as plain PostgreSQL.

Generated baseline workspace

Every initialized workspace includes at minimum:

package.json
bunfig.toml
README.md
.gitignore
tsconfig.base.json
turbo.json
.github/workflows/ci.yml
tools/scripts/foundry.sh
tools/scripts/verify.sh
packages/cli/
docs/README.md
apps/README.md
services/README.md
packages/README.md
tools/README.md
contracts/openapi/README.md
generated/README.md
generated/clients/README.md
config/foundry/generator-manifest.json
.scaffdog/config.js
templates/README.md

Database-enabled workspaces also include provider-specific files such as:

db/provider.json
.env.example
tools/scripts/db-validate.sh
tools/scripts/db-start.sh
tools/scripts/db-stop.sh

Depending on the provider, additional files may include:

docker-compose.yml
drizzle.config.ts
db/schema.ts
db/client.ts
prisma/schema.prisma
supabase/README.md
supabase/migrations/0001_initial.sql
data/.gitkeep
Verification

Focused init verification:

bun run verify:init

Full repository verification:

bun run verify

Fast local verification without the init smoke-test matrix:

FOUNDRY_SKIP_INIT_VERIFY=1 bun run verify
Expected generated-workspace verification

A generated no-database workspace should pass:

cd tmp-foundry-init-no-db-test
bun run foundry -- generate --list
bun run verify

A generated database workspace should include provider files and still pass:

cd tmp-foundry-init-postgres-drizzle
bun run foundry -- generate --list
bun run verify
bun run db:validate
Current limitations

Dependency installation is intentionally controllable through --no-install.

The current implementation focuses on local workspace generation and smoke-testable scaffolding shape. Provider-specific database runtime migrations, cloud provisioning, secret management, and production deployment are later slices.
