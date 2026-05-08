---
title: "ADR-0002: Adopt AI-Expected Provider-Agnostic Architecture"
status: "Approved"
owner: "Foundry Project"
lastUpdated: "2026-05-08"
governanceLevel: "Binding"
documentType: "ADR"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

# ADR-0002: Adopt AI-Expected Provider-Agnostic Architecture

## Status

Accepted.

## Context

Foundry is intended to be a docs/spec-driven and AI-native software lifecycle CLI.

The term AI-native can be misinterpreted as meaning that the CLI requires a specific AI provider, hosted model, paid subscription, proprietary assistant, or cloud service.

That is not the intended product direction.

Foundry should assume that many users will work with some type of AI, LLM, GPT, agent, or MCP-enabled tooling. Foundry should therefore generate repository artifacts that make AI-assisted development safer, more repeatable, and easier to resume across sessions.

However, Foundry must also remain useful to users who do not configure or use AI at all.

Foundry should also support users who prefer local or self-hosted AI runtimes where available and where their hardware supports it.

## Decision

Foundry will adopt an AI-expected, AI-optional, provider-agnostic architecture.

Foundry will assume AI-assisted development is common, but it will not require AI-assisted development.

Foundry must support useful operation in the following modes:

```txt
* no AI configured
* manual AI assistant usage through repository files
* hosted LLM/GPT provider
* OpenAI-compatible API provider
* local/self-hosted model runtime
* MCP-connected tool runtime
* future Foundry SaaS/cloud AI service
* custom provider adapter
````

Foundry must not require:

```txt
* a paid LLM/GPT subscription
* a specific hosted model provider
* a proprietary AI assistant
* a Foundry Cloud account
* internet access for local-only workflows
```

Foundry's AI-native behavior will begin with provider-neutral repository artifacts, not provider calls.

## Required Product Behavior

Foundry must remain useful without AI.

Without AI configured, Foundry should still support:

```txt
* project initialization
* provider selection
* repository evolution
* upgrade planning
* migration planning
* repo contract validation
* documentation generation
* specification generation
* ADR generation
* work packet generation
* audit logging
* verification command generation
* doctor diagnostics
* dry-run plans
* check-mode reports
```

AI support should enhance these workflows, not replace them.

## Required Architecture Behavior

Foundry AI support must be adapter-driven.

Possible future adapters may include:

```txt
* OpenAI-compatible endpoints
* Ollama
* LM Studio
* llama.cpp
* vLLM
* hosted provider APIs
* MCP servers
* custom provider adapters
* future Foundry Cloud AI services
```

No adapter is mandatory.

The `none` and `manual` modes are first-class modes.

## Privacy Boundary

Foundry must not send repository content, code, documentation, prompts, specs, audit logs, or handoff packets to an external AI provider unless the user explicitly configures and invokes such behavior.

Local-only workflows must remain local by default.

## SaaS Boundary

Foundry may later offer SaaS or cloud AI services.

Such services may enhance:

```txt
* context indexing
* team handoff
* multi-repo intelligence
* hosted provider configuration
* AI-assisted upgrade planning
* MCP registry management
```

However, Foundry Cloud must not be required for core CLI usage.

Generated repositories must remain portable and useful without Foundry Cloud.

## Consequences

### Positive Consequences

Foundry can support modern AI-assisted workflows without vendor lock-in.

Users can choose hosted, local, self-hosted, MCP-based, manual, or no-AI workflows.

The CLI remains useful for users without paid AI subscriptions.

The architecture is compatible with future model and tool ecosystem changes.

Foundry can later offer SaaS services without making the open-source CLI dependent on them.

### Negative Consequences

Provider abstraction adds implementation complexity.

Foundry must carefully separate AI-readable artifact generation from runtime AI invocation.

Some advanced AI workflows may require additional configuration.

Local model support may vary based on user hardware and runtime availability.

### Risk Mitigations

Start with provider-neutral AI-readable artifacts.

Make provider runtime integration optional.

Use explicit configuration for any external provider.

Avoid default external data transfer.

Document local, hosted, MCP, manual, and no-AI modes clearly.

Keep generated repositories portable.

## Non-Goals

Foundry will not become dependent on ChatGPT, Claude, Gemini, Copilot, OpenAI, Anthropic, Google, or any other specific provider.

Foundry will not require a paid AI subscription.

Foundry will not require Foundry Cloud.

Foundry will not require internet access for local-only workflows.

Foundry will not require every user to use AI.

Foundry will not initially become a full autonomous coding agent.

## Follow-Up Work

Define AI artifact templates.

Define AI provider configuration schema.

Define AI provider adapter interface.

Define MCP configuration format.

Add `foundry ai bootstrap`.

Add `foundry ai handoff`.

Add `foundry ai validate`.

Add AI context artifact validation to `foundry validate`.

Add privacy and provider disclosure metadata.

Add local/OpenAI-compatible adapter support after provider-neutral artifacts are stable.