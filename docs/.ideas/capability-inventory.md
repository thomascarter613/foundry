---
title: "Capability Inventory"
status: "Draft"
owner: "Product Architecture"
lastUpdated: "2026-05-08"
governanceLevel: "Informational"
documentType: "Idea"
upstream:
  - "docs/planning/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Documentation System"
---

# Foundry CLI Capability Inventory

Below is the clearest honest inventory based on what we have been building.

One important caveat: **I have not freshly inspected your repo files in this message**, so I am separating **known/current implementation** from **planned/intended capabilities**. Also, based on your last terminal output, the CLI currently has a **TypeScript build blocker** in:

```txt
src/init/database/external-plugins.ts
```

So some “current” capabilities exist in code structure but are not fully usable until that type error is fixed.

---

# 1. What Foundry CLI Currently Can Do

## A. Exists as a Bun + TypeScript CLI package

Current status: **implemented / in progress**

It currently has a CLI package structure under something like:

```txt
packages/cli
```

It can be worked on with commands like:

```bash
bun run typecheck
bun run build
```

The project is using **Bun** and **TypeScript**.

Current limitation: the build/typecheck is blocked by the `exactOptionalPropertyTypes` issue in `external-plugins.ts`.

---

## B. Has an `init` capability under active development

Current status: **partially implemented**

The main current product slice is the Foundry `init` command.

The purpose of `init` is not just “copy files from a template.” It is meant to create a structured project initialization plan based on selected providers, plugins, conventions, and verification steps.

Current direction:

```txt
foundry init
```

or eventually:

```txt
foundry init my-app
foundry init --database postgres-drizzle
foundry init --database postgres-prisma
foundry init --database mongodb
foundry init --database supabase
```

Exact CLI flags may still be in flux.

---

## C. Has a database provider architecture in progress

Current status: **implemented in structure, not fully finished**

We have been actively building the database-provider system for `init`.

The current architecture is meant to support database providers as pluggable units rather than hardcoding only one stack.

Known active area:

```txt
src/init/database/
```

Current or emerging modules include things like:

```txt
planner.ts
external-plugins.ts
```

This means Foundry is already moving toward:

```txt
database provider registry
database provider plugins
database initialization planning
database verification scripts
database lifecycle scripts
```

---

## D. Can model database initialization as a plan

Current status: **partially implemented**

From the TypeScript errors you showed earlier, Foundry currently has an `InitPlanScript` concept.

That means it is not merely generating files directly. It is building an initialization plan that can include scripts such as:

```txt
validate database connections
start local database services
stop local database services
```

This is important because the CLI is becoming plan-aware.

That is a major differentiator from simple scaffolders.

---

## E. Has support, or is being given support, for multiple database targets

Current status: **partially implemented / actively being expanded**

You explicitly locked in that Foundry `init` database support must not be limited to PostgreSQL + Drizzle.

The current intended provider set includes:

```txt
PostgreSQL + Drizzle
PostgreSQL + Prisma
MongoDB
Supabase-compatible PostgreSQL
```

And the architecture should allow future providers like:

```txt
SQLite
MariaDB
MySQL
Turso/LibSQL
PlanetScale
Neon
CockroachDB
Redis-adjacent app stores
other provider adapters
```

Current limitation: the exact provider templates and generated output may not all exist yet.

---

## F. Has external plugin support under construction

Current status: **partially implemented, currently typecheck-blocked**

The file:

```txt
src/init/database/external-plugins.ts
```

shows that Foundry is being designed to load database provider plugins from external entries.

The current type error involves this type:

```ts
ExternalInitDatabaseProviderPluginEntry
```

That means the code already has the concept of an external plugin entry with fields like:

```txt
id
module
exportName
```

Current blocker: the function currently returns `id: string | undefined` where the type expects `id?: string` or `id: string`, depending on the desired model.

---

## G. Has strict TypeScript settings

Current status: **implemented**

The current error is caused by:

```txt
exactOptionalPropertyTypes: true
```

That is a good thing.

It means the CLI is being built with a strict TypeScript posture, which catches sloppy optional-field handling early.

Foundry is not being built as a loose JavaScript script. It is being built as a maintainable TypeScript tool.

---

## H. Has a provider/plugin direction rather than a hardcoded template direction

Current status: **architecturally established**

This is already one of the most important current capabilities.

Foundry is not just:

```txt
copy template A
copy template B
copy template C
```

It is moving toward:

```txt
select providers
compose providers
generate plan
generate files
generate scripts
generate verification
record choices
support extension
```

That is the right direction.

---

# 2. What Foundry CLI Is Planned To Be Able To Do

This is the larger intended capability set.

## A. Project initialization

Planned status: **core feature**

Foundry should be able to initialize a new software product repository from scratch.

Expected command shape:

```bash
foundry init <project-name>
```

It should eventually be able to generate:

```txt
repository structure
package manager setup
TypeScript config
workspace config
README
docs structure
governance structure
CI skeleton
test structure
tooling config
database setup
environment files
verification scripts
```

---

## B. Opinionated but configurable project factory

Planned status: **core feature**

Foundry should not be a generic blank-file generator.

It should initialize projects according to production-grade conventions.

Planned outputs may include:

```txt
apps/
packages/
services/
docs/
governance/
infra/
ops/
contracts/
db/
tools/
config/
templates/
.artifacts/
```

This should align with the canonical monorepo structure decisions we have been developing.

---

## C. Pluggable database providers

Planned status: **core feature**

Foundry should support database providers as plugins.

Planned first-class providers:

```txt
PostgreSQL + Drizzle
PostgreSQL + Prisma
MongoDB
Supabase
```

Planned future providers:

```txt
SQLite
MariaDB
MySQL
Turso/LibSQL
Neon
PlanetScale
CockroachDB
Redis-based support where appropriate
```

The important principle:

```txt
database support should be adapter-driven, not hardcoded
```

---

## D. Multi-provider database combinations

Planned status: **important feature**

Foundry should eventually support combinations like:

```txt
PostgreSQL + Drizzle for relational application data
MongoDB for document/unstructured data
Qdrant or another vector DB for retrieval
Redis for queues/cache/session state
Supabase as managed Postgres/auth/storage target
```

This is especially important for AI/agentic software products, where one database is often not enough.

---

## E. ORM/provider selection

Planned status: **important feature**

Foundry should eventually distinguish between:

```txt
database engine
database hosting target
ORM/query layer
migration tool
local development strategy
production deployment strategy
```

Example:

```txt
Database: PostgreSQL
ORM: Prisma
Hosting: Supabase
Local dev: Docker Compose
Migrations: Prisma migrate
```

Or:

```txt
Database: PostgreSQL
ORM: Drizzle
Hosting: Neon
Local dev: Docker Compose
Migrations: Drizzle Kit
```

---

## F. Template generation

Planned status: **core feature**

Foundry should generate complete files, not fragments.

This includes:

```txt
source files
configuration files
documentation files
test files
CI files
Docker files
environment templates
README files
ADR templates
work packet templates
```

The goal is not “sample code.” The goal is usable, coherent project scaffolding.

---

## G. Plan-first generation

Planned status: **major differentiator**

Before writing files, Foundry should be able to produce a plan.

Example:

```txt
Foundry will create:
- Bun workspace
- TypeScript package baseline
- database provider: PostgreSQL + Drizzle
- local Docker Compose service
- .env.example
- migration directory
- verification scripts
- ADR for persistence decision
- README section documenting local database usage
```

This is more useful than blind scaffolding.

---

## H. Dry-run mode

Planned status: **very important**

Foundry should support something like:

```bash
foundry init my-app --dry-run
```

Expected dry-run behavior:

```txt
show files that would be created
show files that would be modified
show scripts that would be added
show provider decisions
show warnings
show conflicts
write nothing
```

---

## I. Audit logging

Planned status: **major feature**

You explicitly wanted full audit log ability.

Foundry should eventually record:

```txt
command invoked
timestamp
selected options
resolved defaults
provider plugins used
files created
files modified
files skipped
conflicts encountered
verification commands suggested
warnings emitted
errors encountered
```

Potential output location:

```txt
.foundry/audit/
```

or:

```txt
.artifacts/foundry/audit/
```

This would make Foundry much more serious than normal scaffolders.

---

## J. Repo contract validation

Planned status: **important feature**

Foundry should eventually validate that a repository still conforms to its expected structure.

Example:

```bash
foundry validate
foundry doctor
foundry check
```

Possible checks:

```txt
required files exist
required directories exist
package manager is correct
CI files exist
docs have frontmatter
ADR index exists
work packet index exists
security files exist
tooling config exists
scripts are wired correctly
```

---

## K. Project health checks

Planned status: **important feature**

Foundry should eventually include a doctor-style command.

Example:

```bash
foundry doctor
```

It should detect problems like:

```txt
missing Bun lockfile
wrong Node/Bun version
missing environment file
broken workspace references
missing TypeScript config
missing database provider config
Docker unavailable
database port already in use
invalid plugin configuration
missing verification scripts
```

---

## L. Verification command generation

Planned status: **core feature**

Foundry should generate commands such as:

```bash
bun run typecheck
bun run test
bun run lint
bun run build
bun run verify
```

And provider-specific commands like:

```bash
bun run db:validate
bun run db:up
bun run db:down
bun run db:migrate
bun run db:studio
```

The exact scripts should depend on the selected providers.

---

## M. Documentation generation

Planned status: **core feature**

Foundry should generate first-class documentation, including:

```txt
README.md
CONTRIBUTING.md
SECURITY.md
docs/adr/
docs/product/
docs/architecture/
docs/domain/
docs/requirements/
docs/runbooks/
docs/tutorials/
docs/ai/
```

For serious projects, this is one of Foundry’s strongest planned capabilities.

---

## N. ADR generation

Planned status: **important feature**

Foundry should eventually generate ADRs for major decisions.

Examples:

```txt
ADR-0001 — repository source of truth
ADR-0002 — package manager decision
ADR-0003 — database provider decision
ADR-0004 — ORM strategy
ADR-0005 — verification model
ADR-0006 — plugin architecture
```

This would be a major differentiator from typical scaffolders.

---

## O. Work packet generation

Planned status: **important feature**

Foundry should eventually generate work packets.

Possible command:

```bash
foundry work-packet create
foundry wp create
```

A work packet could include:

```txt
objective
scope
non-goals
files changed
acceptance criteria
verification commands
rollback notes
commit message
handoff summary
```

---

## P. Conventional Commit guidance

Planned status: **important feature**

Foundry should eventually recommend or enforce atomic Conventional Commit messages.

Example:

```txt
feat(init): add postgres drizzle provider
fix(database): normalize optional external plugin fields
docs(adr): record database provider architecture
test(init): add database planner coverage
```

Potential command:

```bash
foundry commit suggest
```

or integration into generated work packets.

---

## Q. Plugin system

Planned status: **core feature**

Foundry should eventually have plugins for:

```txt
database providers
ORMs
frontend frameworks
backend frameworks
auth providers
CMS integrations
deployment targets
testing frameworks
documentation systems
CI providers
monorepo tools
observability stacks
```

Plugin examples:

```txt
@foundry/plugin-postgres-drizzle
@foundry/plugin-postgres-prisma
@foundry/plugin-mongodb
@foundry/plugin-supabase
@foundry/plugin-hono
@foundry/plugin-tanstack-start
@foundry/plugin-solid
@foundry/plugin-keycloak
@foundry/plugin-payload
@foundry/plugin-docker-compose
@foundry/plugin-github-actions
```

---

## R. Local development environment generation

Planned status: **important feature**

Foundry should eventually generate:

```txt
Docker Compose files
devcontainer files
.env.example
local database setup
local object storage setup
local mail/testing service setup
local observability setup
```

Possible services:

```txt
PostgreSQL
MongoDB
Redis
Qdrant
MinIO
Mailpit
Meilisearch
Keycloak
```

---

## S. CI generation

Planned status: **important feature**

Foundry should eventually generate CI pipelines.

Initial target:

```txt
GitHub Actions
```

Possible jobs:

```txt
lint
typecheck
test
build
verify repo contract
verify docs
security scan
container scan
migration check
```

---

## T. Security baseline generation

Planned status: **important feature**

Foundry should eventually generate:

```txt
SECURITY.md
secret scanning guidance
dependency update config
CODEOWNERS
branch protection recommendations
supply-chain notes
.env.example without secrets
safe defaults
```

Possible integrations:

```txt
Dependabot
GitHub secret scanning
Gitleaks
Trivy
Checkov
Terrascan
```

---

## U. Docs-as-code and metadata support

Planned status: **important feature**

Foundry should eventually generate Markdown files with YAML frontmatter.

Example:

```yaml
---
title: "Persistence Architecture"
status: "draft"
version: "0.1.0"
last_updated: "2026-05-06"
---
```

This aligns with the documentation standard we have been using.

---

## V. AI/context continuity support

Planned status: **important differentiator**

Foundry should eventually generate AI handoff and continuity files.

Examples:

```txt
docs/ai/BOOTSTRAP_PROMPT.md
docs/ai/CURRENT_STATE.md
docs/ai/FRESH_CHAT_HANDOFF.md
.foundry/state/latest-status.md
.charon/daedalus/handoff-packets/
```

This is one of the most distinctive features relative to normal scaffolders.

---

## W. Runtime/tooling integration

Planned status: **future feature**

Foundry may eventually coordinate with tools like:

```txt
Plop
scaffdog
Hygen
Cookiecutter
Nx
Turbo
Docker
GitHub Actions
Biome
Vitest
Playwright
OpenAPI tooling
```

The important principle:

```txt
Foundry orchestrates; it does not need to replace every specialized tool.
```

---

## X. Monorepo support

Planned status: **core feature**

Foundry should eventually be able to initialize and evolve monorepos.

Expected support:

```txt
apps/
packages/
services/
tools/
docs/
infra/
contracts/
db/
```

Expected tooling:

```txt
Bun workspaces
Turbo
TypeScript project references or package-local configs
shared lint/typecheck/test/build conventions
```

---

## Y. Provider-aware generated scripts

Planned status: **core feature**

Scripts should be generated based on selected providers.

Example for PostgreSQL + Drizzle:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio"
}
```

Example for Prisma:

```json
{
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio"
}
```

Example for MongoDB:

```json
{
  "db:validate": "..."
}
```

---

## Z. Upgrade/evolution commands

Planned status: **future feature**

Eventually Foundry should not only initialize projects, but help evolve them.

Possible commands:

```bash
foundry add database postgres-drizzle
foundry add service api
foundry add app web
foundry add docs
foundry add ci
foundry add auth keycloak
foundry upgrade
foundry migrate
```

This would move Foundry from a one-time generator to a lifecycle tool.

---

# 3. Things Foundry Does Not Currently Do

## A. It does not currently appear to be a fully working published CLI

Current status: **not yet**

It is not yet at the stage where a user can reliably install it with:

```bash
bun install -g foundry
```

or:

```bash
npm install -g <package-name>
```

and use it as a polished product.

---

## B. It does not currently have a completed `init` command

Current status: **not yet complete**

The `init` system is under construction.

It may have planner/provider internals, but it is not yet a finished end-user command with all expected flags, templates, outputs, validation, and tests.

---

## C. It does not currently generate a full production app end-to-end

Current status: **not yet**

Foundry does not yet fully generate:

```txt
frontend app
backend API
database schema
auth system
CI/CD
docs
tests
deployment config
observability
```

as one complete, verified product.

That is planned, but not current.

---

## D. It does not currently replace framework CLIs

Foundry does not replace tools like:

```txt
create-vite
create-next-app
create-t3-app
rails new
cargo new
go mod init
nx generate
```

Instead, Foundry should eventually orchestrate or wrap lower-level project setup where useful.

---

## E. It does not currently replace Nx, Turbo, or other monorepo engines

Foundry should not become a task runner replacement.

It should not try to replace:

```txt
Turbo
Nx
Bun workspaces
pnpm workspaces
GitHub Actions
Docker Compose
```

It should generate and govern their use.

---

## F. It does not currently replace Plop, Hygen, scaffdog, or Cookiecutter

Foundry is not just a text generator.

It may use or imitate those tools, but its real value is above them:

```txt
planning
provider selection
audit logs
verification
project governance
architecture-aware initialization
```

---

## G. It does not currently deploy applications

Current status: **not yet**

Foundry does not yet deploy to:

```txt
Vercel
Netlify
Fly.io
Railway
Render
AWS
GCP
Azure
Kubernetes
Docker Swarm
single VPS
```

Deployment provider plugins could come later.

---

## H. It does not currently manage production infrastructure

Current status: **not yet**

It does not yet provision:

```txt
databases
cloud accounts
DNS
TLS certificates
object storage
Kubernetes clusters
secrets managers
CDN config
production observability
```

It may eventually generate IaC, but it should be careful not to become a dangerous infra automation tool too early.

---

## I. It does not currently manage secrets

Current status: **not yet**

Foundry should generate `.env.example` files and secret placeholders.

But it should not currently:

```txt
store real secrets
rotate secrets
sync secrets to cloud providers
act as a secrets manager
```

Eventually it may integrate with tools like:

```txt
1Password
Doppler
Vault
SOPS
age
GitHub Actions secrets
```

But that is future work.

---

## J. It does not currently run AI agents

Current status: **not currently the core**

Foundry is adjacent to the Agentic Software Foundry idea, but the CLI itself does not currently act as a full autonomous coding agent.

It does not yet:

```txt
read your whole repo intelligently
plan code changes autonomously
edit files by itself as an AI runtime
open pull requests automatically
run long-lived agent workflows
maintain semantic memory
```

Those may belong to the broader Foundry Control Plane or Charon-style system, not necessarily the first CLI.

---

## K. It does not currently provide a GUI

Current status: **not planned for the CLI itself**

The CLI is CLI-first.

It does not currently provide:

```txt
web dashboard
desktop app
visual project planner
Backstage-style portal
admin UI
```

A web/control-plane UI could exist later, but the CLI should remain useful without one.

---

## L. It does not currently provide hosted SaaS features

Current status: **not yet**

The CLI itself does not provide:

```txt
user accounts
billing
teams
organizations
cloud-hosted project registry
remote audit logs
hosted plugin marketplace
hosted templates
```

Those are possible future SaaS/productization layers, not current CLI features.

---

## M. It does not currently guarantee generated code is production-ready

Current status: **not yet**

The goal is production-grade generation.

But until we have:

```txt
templates
tests
verification
fixtures
snapshot tests
example apps
documentation
integration tests
cross-provider validation
```

we should not claim production readiness.

---

## N. It does not currently support every language

Current status: **not yet**

The broader project may eventually support polyglot products.

But the current CLI work is TypeScript/Bun-centered.

It does not yet deeply support generating mature projects in:

```txt
Go
Rust
Python
Java
Ruby
PHP
C#
Kotlin
Swift
```

These could be added as language/framework provider plugins later.

---

## O. It does not currently enforce architectural correctness by itself

Current status: **not yet**

Foundry can eventually generate ADRs, docs, and validation checks.

But it does not currently understand a full architecture and prevent all drift automatically.

That would require:

```txt
repo contract rules
policy checks
domain model checks
dependency graph analysis
package boundary enforcement
architecture tests
```

---

# 4. The Best Simple Summary

## Currently, Foundry CLI is:

```txt
A Bun + TypeScript CLI under construction, currently focused on a plan-first init command with a pluggable database provider architecture.
```

## Planned, Foundry CLI becomes:

```txt
A governance-grade software project factory that initializes, verifies, documents, audits, and evolves production-ready repositories through provider-based plugins.
```

## It is not:

```txt
just a template copier
a replacement for every framework CLI
a deployment platform
an AI coding agent
a SaaS dashboard
a secrets manager
a full infrastructure orchestrator
```

---

# 5. My Rating of the Current Shape

Right now, I would classify it like this:

| Area                           |                  Current Maturity |
| ------------------------------ | --------------------------------: |
| CLI package foundation         |                            Medium |
| TypeScript strictness          |                              Good |
| `init` command concept         |                            Strong |
| `init` command implementation  |                         Early/mid |
| Database provider architecture |          Promising but unfinished |
| External plugin system         | Started but blocked by type error |
| Audit logging                  |                           Planned |
| Full scaffolding output        |                      Not complete |
| Verification system            |                   Planned/partial |
| Documentation generation       |                           Planned |
| Production usability           |                           Not yet |
| Product differentiation        |                            Strong |

The most honest status is:

> **Foundry is currently a promising early CLI foundation, not yet a finished tool. Its biggest strength is that it is being designed as a governed project factory instead of a generic scaffolder.**
