---
title: "Foundry AI Operating Principles"
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
adrLinks:
  - "docs/architecture/adr/0004-ci-governance.md"
  - "docs/adr/ADR-0002-ai-expected-provider-agnostic-architecture.md"
glossaryTerms:
  - "Product"
  - "CI"
---

# Foundry AI Operating Principles

Foundry is AI-expected, AI-native, AI-optional, provider-agnostic, model-agnostic, subscription-agnostic, and local-runtime-compatible.

Foundry assumes many users will work with some form of AI, LLM, GPT, agent, or MCP-enabled tooling during the software lifecycle.

Foundry must therefore generate and maintain project artifacts that are useful to AI-assisted development.

However, Foundry must not require AI in order to produce useful results.

## Core Product Rule

Foundry must be AI-native without becoming AI-locked.

AI-native means Foundry produces durable, structured, provider-agnostic project context that can be used by humans, hosted AI providers, local models, MCP-connected agents, editor assistants, and future Foundry services.

AI-locked would mean Foundry requires a specific paid subscription, hosted model, proprietary assistant, vendor API, or Foundry Cloud account in order to function.

Foundry must never require AI lock-in.

## Expected Usage Modes

Foundry must support the following modes:

```txt
* no AI configured
* manual AI assistant usage through repository files
* hosted LLM/GPT provider
* OpenAI-compatible API provider
* local/self-hosted model runtime
* MCP-connected tool runtime
* future Foundry SaaS/cloud AI service
* custom provider adapter
```

The CLI must remain useful in all modes.

## Required Non-AI Baseline

If a user chooses to forego AI, LLM, GPT, MCP, local model, hosted model, or cloud AI usage entirely, Foundry must still be able to produce useful results.

At minimum, Foundry should still support:

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

## AI-Readable Artifacts Are Core

Foundry should generate and maintain AI-readable artifacts even when no AI provider is configured.

These artifacts are useful because a user may later provide them to any AI assistant or local model.

Core AI-readable artifacts may include:

```txt
docs/ai/BOOTSTRAP_PROMPT.md
docs/ai/CURRENT_STATE.md
docs/ai/FRESH_CHAT_HANDOFF.md
docs/ai/CONTEXT_INDEX.md
docs/ai/PROJECT_MAP.md
docs/ai/DECISION_LOG.md
docs/ai/ACTIVE_WORK.md
.foundry/state/latest-status.md
.charon/daedalus/handoff-packets/
```

These files should be understandable by humans and consumable by machines.

## Provider-Agnostic AI

Foundry must not depend on any single AI provider.

Foundry may support integrations with providers such as:

```txt
* OpenAI
* Anthropic
* Google Gemini
* Mistral
* Groq
* OpenRouter
* Ollama
* LM Studio
* llama.cpp
* vLLM
* local OpenAI-compatible endpoints
* MCP servers
* custom provider adapters
* future Foundry Cloud AI services
```

This list is illustrative, not exclusive.

No provider is mandatory.

## Subscription-Agnostic AI

Foundry must not require a paid ChatGPT, Claude, Gemini, Copilot, OpenAI, Anthropic, Google, or other commercial AI subscription.

Users may use paid providers if they choose.

Users may also use local or self-hosted models where available and where their hardware supports it.

Users may also use no AI provider at all.

## Local and Self-Hosted AI

Foundry should support local and self-hosted AI usage where practical.

Examples may include:

```txt
* Ollama
* LM Studio
* llama.cpp
* vLLM
* local OpenAI-compatible API servers
* self-hosted MCP servers
* private model gateways
```

Foundry should not promise that every local machine can run every model.

Instead, Foundry should provide adapter points and configuration patterns so users with sufficient resources can use local or self-hosted runtimes.

## MCP Compatibility

Foundry should treat MCP as a first-class integration path.

MCP support may eventually include:

```txt
* MCP server configuration templates
* MCP tool registry metadata
* MCP-compatible project context exports
* MCP-aware bootstrap prompts
* MCP-aware handoff packets
* MCP validation checks
```

MCP support must remain optional.

## Future Foundry SaaS or Cloud AI Services

Foundry may later offer SaaS or cloud AI services.

Potential future services may include:

```txt
* hosted AI context indexing
* hosted project memory
* team handoff dashboards
* private provider gateway
* managed MCP server registry
* AI-assisted upgrade advisories
* AI-generated work packet suggestions
* multi-repo project intelligence
```

However, generated repositories and core CLI workflows must not depend on Foundry SaaS.

Foundry Cloud may be an enhancement, not a requirement.

## Human-First Output

Foundry must never make the repository understandable only to an AI system.

Generated artifacts should be:

```txt
* human-readable
* machine-readable where practical
* version-controlled
* auditable
* plain-text where practical
* portable
* provider-neutral
```

Markdown, YAML, JSON, and other durable text formats should be preferred for core project state.

## Privacy and Data Boundary

Foundry must not send repository content, specs, code, prompts, audit logs, or generated context to an external AI provider unless the user explicitly configures and invokes such behavior.

Local CLI operations should remain local by default.

If a future Foundry Cloud or hosted AI integration exists, data transfer must be explicit, documented, and configurable.

## Product Positioning

Foundry should be described as:

> A docs/spec-driven, AI-expected, AI-optional software lifecycle CLI that creates and evolves provider-agnostic, auditable, AI-readable repositories.

Short form:

> AI-native. Not AI-locked.