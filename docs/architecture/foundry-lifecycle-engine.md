---
title: "Foundry Lifecycle Engine"
status: "Draft"
owner: "Foundry Project"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "Architecture"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

# Foundry Lifecycle Engine

The Foundry Lifecycle Engine is the internal architecture that powers repository creation, evolution, validation, auditability, and AI handoff.

The engine exists so Foundry commands do not become unrelated scripts.

Instead, each command should pass through a common lifecycle pipeline.

## Core Lifecycle

```txt
inspect → resolve → plan → apply → verify → document → audit → handoff
````

## Lifecycle Stages

### 1. Inspect

Foundry inspects the current workspace.

Inspection should detect:

```txt
repository root
package manager
workspace layout
Foundry metadata
existing provider registry
existing docs
existing ADRs
existing work packets
existing scripts
existing CI
existing database setup
existing app/service layout
current Foundry schema version
```

The result is a structured repository state object.

### 2. Resolve

Foundry resolves the requested operation into a desired capability change.

Examples:

```txt
initialize new project
add PostgreSQL + Drizzle
add PostgreSQL + Prisma
add MongoDB
add Supabase compatibility
add GitHub Actions CI
add documentation baseline
upgrade repo contract
migrate package manager conventions
refresh AI handoff
```

Resolution should account for:

```txt
explicit user options
provider defaults
project profile
existing repository state
compatibility rules
conflicts
required documentation updates
required verification commands
```

### 3. Plan

Foundry creates an operation plan before writing files.

A plan should include:

```txt
operation id
operation kind
workspace path
current state summary
target state summary
files to create
files to modify
files to skip
scripts to add
docs to create or update
ADRs to create or update
verification commands
audit event preview
warnings
blocking errors
```

Plans must be serializable so they can be shown, saved, audited, tested, and re-used.

### 4. Apply

Foundry applies the plan.

Apply should be deterministic and safe.

Apply must support:

```txt
dry-run
check mode
conflict detection
idempotency where practical
clear overwrite rules
clear skip rules
clear failure reporting
```

### 5. Verify

Foundry reports how to verify the operation.

Where practical, Foundry may run verification commands directly.

Verification may include:

```txt
typecheck
lint
test
build
repo contract validation
docs validation
provider validation
database validation
AI context validation
```

### 6. Document

Foundry updates documentation when the operation changes the meaning of the repository.

Examples:

```txt
adding a provider should update provider docs
adding persistence should update an ADR
adding CI should update verification docs
adding auth should update architecture/security docs
running an upgrade should update current state
```

Documentation is not optional ceremony. It is part of the repository contract.

### 7. Audit

Foundry writes an audit event.

Audit events should make it possible to answer:

```txt
what changed
who or what initiated it
when it happened
which providers participated
what plan was applied
what was skipped
what verification was recommended or executed
what warnings occurred
```

### 8. Handoff

Foundry refreshes AI-readable state when appropriate.

This may include:

```txt
docs/ai/CURRENT_STATE.md
docs/ai/BOOTSTRAP_PROMPT.md
docs/ai/FRESH_CHAT_HANDOFF.md
.foundry/state/latest-status.md
.charon/daedalus/handoff-packets/
```

AI handoff is a first-class output because Foundry assumes long-running AI-assisted development across multiple sessions.

## Internal Domain Objects

The lifecycle engine should eventually model these concepts explicitly:

```txt
RepositoryState
FoundryProject
FoundryManifest
FoundryOperation
FoundryPlan
FoundryPlanStep
FoundryProvider
FoundryProviderCapability
FoundryRecipe
FoundryMigration
FoundryUpgrade
FoundryRepoContract
FoundryAuditEvent
FoundryVerificationCommand
FoundryHandoffState
```

## Command Mapping

### `foundry init`

Uses the lifecycle engine to create the first repository state.

```txt
inspect empty or existing directory
resolve project profile
plan initial files
apply scaffold
verify baseline
document product/repo state
audit init event
handoff initial AI context
```

### `foundry add`

Adds a capability to an existing repository.

```txt
inspect current repo
resolve requested provider/capability
plan additive changes
apply provider files/scripts/docs
verify compatibility
audit add event
refresh handoff
```

### `foundry upgrade`

Evolves Foundry-managed conventions.

```txt
inspect current Foundry schema version
resolve target version
plan upgrade recipe
apply safe changes
verify repo contract
audit upgrade event
refresh current state
```

### `foundry migrate`

Moves an existing repo from one supported pattern to another.

```txt
inspect current pattern
resolve migration target
plan transformation
detect conflicts
apply migration steps
verify result
audit migration event
refresh docs and handoff
```

### `foundry validate`

Checks whether repository state satisfies Foundry contracts.

```txt
inspect repo
load contracts
evaluate rules
report pass/warn/fail
suggest repairs
```

### `foundry doctor`

Diagnoses local development environment and repository setup.

```txt
inspect environment
inspect repo
check tools
check ports
check package manager
check providers
report fixes
```

### `foundry audit`

Reads and explains Foundry operation history.

```txt
load audit events
summarize changes
show operation details
support compliance/debug workflows
```

### `foundry spec`

Manages specification artifacts.

```txt
initialize specs
validate specs
diff specs
derive requirements
derive work packets
derive ADR candidates
```

### `foundry ai`

Manages AI-native project state.

```txt
generate bootstrap prompt
refresh current state
create handoff packet
validate AI context files
summarize active work
```

## Design Constraints

The lifecycle engine must be:

```txt
deterministic
testable
provider-driven
idempotent where practical
safe by default
auditable
serializable
docs-aware
AI-native
```

## Implementation Direction

The current `init` database planner work should evolve into this broader lifecycle model.

Database providers should not be special cases. They should become one category of provider capability within the same engine that eventually supports apps, services, docs, CI, auth, observability, and deployment providers.

## Open Questions

The following decisions still need ADRs or implementation specs:

```txt
Foundry manifest schema
audit event schema
provider SDK shape
plan file schema
recipe format
migration format
repo contract rule format
AI handoff file schema
plugin package discovery rules
```

````

---

# 3. Add an ADR

Use the next available ADR number in your repo. If no ADRs exist yet, use:

```bash
docs/adr/ADR-0002-docs-spec-driven-ai-native-foundry.md
````

Full contents:

````md
---
title: "ADR-0002: Treat Docs/Spec-Driven and AI-Native Workflows as Core Foundry Scope"
status: "accepted"
version: "0.1.0"
created: "2026-05-06"
updated: "2026-05-06"
owner: "Foundry Project"
decision_type: "architecture"
---

# ADR-0002: Treat Docs/Spec-Driven and AI-Native Workflows as Core Foundry Scope

## Status

Accepted.

## Context

Foundry began as a personal CLI need: avoid rewriting the same setup, structure, documentation, configuration, and project-evolution work repeatedly across projects.

The product direction has expanded from a one-time initializer into a lifecycle-aware project factory.

Foundry is now intended to support:

```txt
repository initialization
repository evolution
provider-based capabilities
upgrade recipes
migration recipes
repo contract validation
audit logging
documentation generation
specification management
AI-readable handoff state
````

Existing scaffolders and generators usually focus on copying files or generating code. Foundry’s intended differentiation is broader: it should help create and evolve serious software repositories through explicit specifications, architecture decisions, verification contracts, and durable project context.

AI-assisted development also creates a new requirement: repositories should contain enough structured context for future AI sessions to safely resume work without relying on hidden chat memory.

## Decision

Foundry will treat docs/spec-driven development and AI-native workflows as foundational product scope.

This means Foundry commands should be designed around the lifecycle:

```txt
specify → plan → generate → verify → document → audit → evolve
```

Foundry will treat the following artifact classes as first-class:

```txt
product docs
software requirements
architecture docs
ADRs
domain models
specifications
work packets
repo contracts
verification commands
audit events
AI bootstrap prompts
current state summaries
handoff packets
provider manifests
upgrade recipes
migration recipes
```

Foundry will not treat documentation or AI handoff as optional afterthoughts.

## Consequences

### Positive Consequences

Foundry becomes more differentiated from simple scaffolders.

Generated repositories become easier to understand, verify, resume, and evolve.

AI-assisted development becomes safer because project context is stored in the repository.

Upgrade and migration commands can be tied to explicit specs, contracts, and audit events.

Community contributors can build providers and packs that include docs, validation, and lifecycle behavior rather than only templates.

### Negative Consequences

The CLI becomes more complex than a simple generator.

The initial implementation requires more schema design.

Provider authors will need to understand documentation, validation, and audit expectations.

Some users looking for minimal scaffolding may consider Foundry too heavy.

### Risk Mitigations

Foundry should provide profiles so users can choose the amount of generated structure.

Foundry should keep generated repositories usable without a hosted Foundry service.

Foundry should support dry-run and check modes.

Foundry should keep local-first workflows free and useful.

Foundry should document provider authoring clearly.

## Accepted Product Rule

Every meaningful Foundry operation should attempt to answer:

```txt
What changed?
Why did it change?
What spec, ADR, provider, recipe, or requirement justified the change?
How can it be verified?
What audit record was produced?
What AI-readable state was refreshed?
```

## Non-Goals

This decision does not require Foundry to become a full autonomous AI coding agent.

This decision does not require Foundry to host user repositories.

This decision does not require generated projects to depend on Foundry Cloud.

This decision does not require every small file generation operation to create a new ADR.

## Follow-Up Work

Define the Foundry manifest schema.

Define the audit event schema.

Define the provider SDK.

Define the operation plan schema.

Define the repo contract schema.

Define AI handoff file requirements.

Implement lifecycle engine primitives.

Refactor `init` so it uses the shared lifecycle model.

Add `foundry plan`.

Add `foundry validate`.

Add `foundry ai bootstrap`.

Add `foundry ai handoff`.