---
title: Foundry Init v1 Handoff
description: Completion report and continuation guide for foundry init v1.
status: complete
version: 1.0.0
created: 2026-05-06
updated: 2026-05-06
---

# Foundry Init v1 Handoff

`foundry init` v1 is the workspace initialization feature for the Foundry CLI.

It creates a new Foundry-compatible monorepo that can immediately run the embedded Foundry CLI, verify itself, and serve as the baseline for generated apps, services, packages, docs, contracts, clients, and database infrastructure.

## v1 status

Status: complete for the current v1 scope.

## Supported command forms

```bash
bun run foundry -- init
bun run foundry -- init myapp
bun run foundry -- init myapp --yes
bun run foundry -- init myapp --no-database --yes --no-install
bun run foundry -- init myapp --database-provider postgres:drizzle --yes --no-install
Supported v1 provider matrix

Tier 1 providers:

postgres:drizzle
postgres:prisma
sqlite:drizzle
sqlite:prisma
mongodb:native
supabase:sql
supabase:drizzle
supabase:prisma
supabase:client

Supabase is modeled as a first-class provider family, not merely as plain PostgreSQL.

Core v1 capabilities

foundry init v1 supports:

repository-relative workspace initialization;
no-database workspace generation;
database provider workspace generation;
Tier 1 provider templates;
first-class Supabase provider templates;
interactive wizard mode;
non-interactive --yes mode;
dry-run planning mode;
dependency installation by default;
--no-install file-only mode;
init smoke-test matrix through bun run verify:init;
optional inclusion in the main verification gate;
generated workspace provenance;
generated workspace audit metadata;
generated workspace repository hygiene files;
generated workspace AI continuity anchors.
Generated workspace baseline

Every generated workspace includes:

package.json
bunfig.toml
README.md
.gitignore
.gitattributes
.editorconfig
CONTRIBUTING.md
SECURITY.md
.github/workflows/ci.yml
.github/pull_request_template.md
tsconfig.base.json
turbo.json
tools/scripts/foundry.sh
tools/scripts/verify.sh
packages/cli/
docs/README.md
docs/ai/BOOTSTRAP_PROMPT.md
docs/ai/CURRENT_STATE.md
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
.foundry/README.md
.foundry/init/provenance.json
.foundry/init/audit.ndjson

Database-enabled workspaces also include provider-specific files such as:

db/provider.json
db/README.md
.env.example
tools/scripts/db-validate.sh
tools/scripts/db-start.sh
tools/scripts/db-stop.sh

Provider-specific additions may include:

docker-compose.yml
drizzle.config.ts
db/schema.ts
db/client.ts
db/indexes.ts
prisma/schema.prisma
supabase/README.md
supabase/migrations/0001_initial.sql
data/.gitkeep
Verification commands

Focused init matrix:

bun run verify:init

Full repository gate:

bun run verify

Fast repository gate without init matrix:

FOUNDRY_SKIP_INIT_VERIFY=1 bun run verify

Generated workspace verification:

cd myapp
bun run foundry -- generate --list
bun run verify

Database workspace validation:

cd myapp
bun run db:validate
Important implementation files

Command:

packages/cli/src/commands/init/index.ts

Core init modules:

packages/cli/src/init/defaults.ts
packages/cli/src/init/dependencies.ts
packages/cli/src/init/path-safety.ts
packages/cli/src/init/planner.ts
packages/cli/src/init/provenance.ts
packages/cli/src/init/templates.ts
packages/cli/src/init/types.ts
packages/cli/src/init/validator.ts
packages/cli/src/init/wizard.ts
packages/cli/src/init/writer.ts

Database modules:

packages/cli/src/init/database/planner.ts
packages/cli/src/init/database/providers.ts
packages/cli/src/init/database/registry.ts
packages/cli/src/init/database/templates.ts
packages/cli/src/init/database/types.ts

Verification:

tools/scripts/verify-init.sh
tools/scripts/verify.sh

Docs:

docs/scaffolding/init/README.md
docs/scaffolding/init/database-provider-architecture.md
docs/scaffolding/init/database-provider-reference.md
docs/scaffolding/init/dependency-installation-policy.md
docs/scaffolding/init/foundry-init-requirements.md
docs/scaffolding/init/generated-workspace-quality.md
docs/scaffolding/init/provenance-and-audit.md
docs/scaffolding/init/supabase-compatibility.md
docs/scaffolding/init/foundry-init-v1-handoff.md
v1 invariants

The following invariants must remain true:

--no-database generates no db/provider.json.
Every Tier 1 provider generates db/provider.json.
Every generated workspace has .foundry/init/provenance.json.
Every generated workspace has .foundry/init/audit.ndjson.
Every generated workspace passes bun run foundry -- generate --list.
Every generated workspace passes bun run verify.
bun run verify:init covers every Tier 1 provider.
Supabase remains a first-class provider family.
--no-install remains available for deterministic smoke testing.
No generated workspace commits secrets.
Known v1 limitations

foundry init v1 intentionally does not yet provide:

production deployment provisioning;
cloud database provisioning;
secret manager integration;
database migration execution;
generated app/service/package runtime integration;
provider plugin loading from external packages;
upgrade/migration support for already-generated workspaces.

These are post-v1 work areas.

Recommended post-v1 backlog

Recommended next work after v1:

add an init provider plugin interface;
add external provider package loading;
add workspace upgrade/migration support;
add provider-specific database migration commands;
add real generated CLI command parity with the parent workspace;
add template snapshot tests;
add JSON schema validation for provenance and provider metadata;
add generated workspace E2E tests;
add support for planned providers such as MySQL, MariaDB, Neon, Turso, libSQL, Cloudflare D1, CockroachDB, SQL Server, SingleStore, PlanetScale, and custom plugins.
Final v1 acceptance checklist

Before marking v1 complete, run:

cd packages/cli
bun run typecheck
bun run build
cd ../..

bun run verify:init
FOUNDRY_SKIP_INIT_VERIFY=1 bun run verify
bun run verify

Then run one install-mode smoke test:

rm -rf tmp-foundry-init-v1-install-test

bun run foundry -- init tmp-foundry-init-v1-install-test \
  --no-database \
  --yes

test -d tmp-foundry-init-v1-install-test
test -d tmp-foundry-init-v1-install-test/node_modules

cd tmp-foundry-init-v1-install-test
bun run foundry -- generate --list
bun run verify
cd ..

rm -rf tmp-foundry-init-v1-install-test

If all commands pass, foundry init v1 is complete.
