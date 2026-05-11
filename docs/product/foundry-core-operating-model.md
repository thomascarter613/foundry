---
title: "Foundry Core Operating Model"
status: "Approved"
owner: "Foundry Project"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "Product"
upstream:
  - "docs/planning/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Planning"
  - "Foundry"
  - "Core"
  - "Operating"
  - "Model"
  - "Product"
---
# Foundry Core Operating Model

Foundry is a docs/spec-driven, AI-native software lifecycle CLI for creating, evolving, validating, auditing, and handing off serious software repositories.

Foundry exists to prevent repeated manual recreation of project structure, documentation, configuration, verification, provider setup, and architectural decisions across projects.

Foundry is not merely a scaffolder. It is a project lifecycle engine.

## Product Definition

Foundry initializes and evolves repositories through explicit plans, governed specifications, provider plugins, verification contracts, audit logs, and AI-readable project state.

The core lifecycle is:

```txt
specify → plan → generate → verify → document → audit → evolve
````

## Core Command Families

The following command families are core product scope:

* foundry init
* foundry add
* foundry upgrade
* foundry migrate
* foundry validate
* foundry doctor
* foundry audit
* foundry plan
* foundry spec
* foundry ai

## Non-Negotiable Principles

### 1. Specs Before Silent Mutation

Foundry must not silently mutate a repository without an explainable plan.

Every meaningful change should be traceable to at least one of:

* specification
* requirement
* ADR
* work packet
* provider capability
* upgrade recipe
* migration recipe
* repo contract

### 2. Init Is the First Evolution Event

`foundry init` is not a special one-off generator.

It is the first repository evolution event.

The same internal lifecycle model should support:

* init
* add
* upgrade
* migrate
* repair
* validate
* doctor
* audit

### 3. Generated Repositories Must Remain Usable Without Foundry

Foundry may generate files, docs, scripts, contracts, and metadata, but the resulting repository must remain understandable and usable without requiring a hosted Foundry service.

Foundry should create durable project assets, not opaque lock-in.

### 4. Docs Are First-Class Artifacts

Foundry-generated projects must treat documentation as part of the product, not as an afterthought.

Core generated documentation should include, where applicable:


* product charter
* software requirements specification
* architecture overview
* ADRs
* domain model
* work packets
* runbooks
* verification guide
* AI bootstrap prompt
* current state summary
* handoff packet


### 5. AI Context Is a Repository Artifact

Foundry must assume that AI-assisted development will happen across multiple sessions, tools, and contributors.

Therefore, repositories should contain AI-readable context artifacts that explain:

* what the product is
* what decisions have been made
* what commands verify the project
* what work is currently active
* what files are canonical
* what should be read first by a new AI assistant
* what must not be changed without an ADR

### 6. Verification Is Part of Generation

Foundry should not merely create files.

It should also generate or update the commands needed to verify them.

A Foundry operation should be able to explain:

* what changed
* why it changed
* how to verify it
* what to commit
* what remains incomplete

### 7. Auditability Is Core

Foundry must record meaningful lifecycle events.

Audit records should include:

* timestamp
* command
* workspace
* detected repository state
* requested operation
* resolved plan
* provider plugins used
* files created
* files modified
* files skipped
* warnings
* verification commands
* result

### 8. Provider Support Must Be Pluggable

Foundry must not hardcode a single blessed stack.

Provider support should be adapter-driven.

Examples include:

* database providers
* ORM providers
* frontend framework providers
* backend framework providers
* auth providers
* CI providers
* documentation providers
* deployment providers
* observability providers

### 9. Upgrade and Evolution Commands Are Core

Foundry must not stop at project creation.

A project becomes valuable over time through safe evolution.

Core evolution examples include:

* add a database provider
* add an auth provider
* add an application
* add a service
* add CI
* add documentation
* upgrade repo contracts
* upgrade generated templates
* migrate package manager conventions
* migrate ORM conventions
* refresh AI handoff state

### 10. Community/Ecosystem Readiness Matters

Foundry should be designed so external contributors can eventually provide:

* providers
* packs
* recipes
* repo contracts
* verification rules
* documentation templates
* upgrade paths
* migration paths

The ecosystem unit is not merely a template. The ecosystem unit is a governed, verifiable capability.

## Core Repository Artifacts

A mature Foundry-managed repository may include:

```txt
.foundry/
  audit/
  registry/
  state/
  contracts/
  recipes/

.charon/
  daedalus/
    handoff-packets/

docs/
  product/
  requirements/
  architecture/
  adr/
  domain/
  specs/
  work-packets/
  runbooks/
  ai/
```

## Foundry Operation Contract

Every operation should attempt to produce the following:

1. repository state inspection
2. desired change resolution
3. plan
4. conflict report
5. file changes
6. script changes
7. documentation changes
8. verification commands
9. audit event
10. commit recommendation

## Product Boundary

Foundry is not:

* a generic template copier
* a hosted-only platform
* a secrets manager
* a replacement for every framework CLI
* a replacement for every monorepo tool
* a full AI coding agent
* a production infrastructure provisioner by default

Foundry may integrate with specialized tools, but it should remain focused on project lifecycle governance.

## Strategic Positioning

Foundry should be positioned as:

> A repo-native software lifecycle CLI for turning project standards into executable, auditable, AI-readable repository blueprints.

Short form:

> Initialize. Evolve. Validate. Audit. Handoff.


### AI-Expected, Not AI-Required

Foundry assumes that many users will work with some form of AI, LLM, GPT, agent, or MCP-enabled tooling during the software lifecycle.

Foundry should therefore generate and maintain AI-readable project state, bootstrap prompts, handoff packets, current-state summaries, repo maps, specification indexes, work packet summaries, and provider-agnostic prompt templates.

However, AI usage must not be required.

Foundry must remain useful when no AI provider, local model, hosted model, GPT subscription, MCP server, or cloud AI service is configured.

Users may operate Foundry in any of the following modes:

* no AI configured
* manual AI assistant usage
* hosted LLM/GPT provider
* OpenAI-compatible API provider
* local/self-hosted model runtime
* MCP-connected tool runtime
* future Foundry SaaS/cloud AI service
* custom provider adapter

Foundry will offer SaaS or cloud AI services, but generated repositories and core CLI workflows must not depend on those services.


## Design Rule

This gives us a clean product boundary:

* AI-readable artifacts: core
* AI provider integrations: optional
* Foundry cloud AI service: optional future offering
* Useful non-AI CLI output: required

## What the CLI Should Do Without AI

Even with no AI configured, Foundry should still be able to:

* initialize projects
* add providers
* upgrade repo conventions
* migrate supported patterns
* validate repo contracts
* generate docs
* generate specs
* generate ADR templates
* generate work packets
* generate audit logs
* generate verification commands
* generate AI-readable context files for later use

The user can then choose whether those context files are consumed by ChatGPT, Claude, Gemini, Ollama, LM Studio, llama.cpp, MCP tools, a future Foundry Cloud service, or no assistant at all.
