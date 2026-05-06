---
title: "AI Provider-Agnostic Architecture"
file: "docs/architecture/ai-provider-agnostic-architecture.md"
status: "draft"
version: "0.1.0"
created: "2026-05-06"
updated: "2026-05-06"
owner: "Foundry Project"
scope: "architecture"
---

# AI Provider-Agnostic Architecture

Foundry's AI architecture must be provider-agnostic, model-agnostic, subscription-agnostic, local-runtime-compatible, MCP-compatible, and optional.

The architecture must allow Foundry to be AI-native without requiring any specific AI provider or paid subscription.

## Architectural Principle

AI is an expected workflow, not a required dependency.

Foundry should optimize for AI-assisted development while still producing useful results without AI.

The CLI must continue to support initialization, evolution, validation, documentation, audit logging, and verification even when no AI provider is configured.

## Capability Layers

Foundry AI support should be split into layers.

```txt
AI-readable repository artifacts
  ↓
AI context generation
  ↓
AI provider abstraction
  ↓
AI runtime adapters
  ↓
Optional hosted/local/MCP integrations
````

The lower layers are optional.

The repository artifacts remain valuable even when no runtime adapter is configured.

## Required Runtime Modes

Foundry should eventually support these runtime modes:

| Mode                | Description                                                 | Required? |
| ------------------- | ----------------------------------------------------------- | --------: |
| `none`              | No AI provider configured                                   |       Yes |
| `manual`            | User manually gives Foundry-generated files to an assistant |       Yes |
| `hosted-api`        | Hosted model provider with API credentials                  |  Optional |
| `openai-compatible` | Any OpenAI-compatible endpoint, including local gateways    |  Optional |
| `local-runtime`     | Local/self-hosted model runtime                             |  Optional |
| `mcp`               | MCP-connected tool or agent runtime                         |  Optional |
| `foundry-cloud`     | Future Foundry-hosted AI service                            |  Optional |
| `custom`            | User-defined adapter                                        |  Optional |

The `none` and `manual` modes are essential because Foundry must not require an AI subscription.

## AI Provider Abstraction

Foundry should eventually model AI provider configuration through a provider abstraction.

Potential domain objects:

```txt
AiProvider
AiProviderAdapter
AiRuntimeMode
AiRuntimeCapability
AiModelProfile
AiContextArtifact
AiContextBundle
AiPromptTemplate
AiHandoffPacket
AiBootstrapProfile
McpServerDefinition
McpToolDefinition
AiInvocationPolicy
```

## Provider Adapter Responsibilities

An AI provider adapter may eventually be responsible for:

```txt
describing provider capabilities
validating local configuration
checking required environment variables
checking endpoint availability
checking model availability where possible
formatting provider-specific requests
normalizing provider-specific responses
declaring privacy implications
declaring network requirements
declaring cost/subscription implications
```

Provider adapters must not be required for core CLI workflows.

## Provider Configuration Shape

A future Foundry AI configuration may resemble:

```json
{
  "ai": {
    "mode": "optional",
    "defaultProvider": "none",
    "providers": []
  }
}
```

A local OpenAI-compatible endpoint may resemble:

```json
{
  "ai": {
    "mode": "optional",
    "defaultProvider": "local-openai-compatible",
    "providers": [
      {
        "id": "local-openai-compatible",
        "kind": "openai-compatible",
        "baseUrlEnv": "FOUNDRY_AI_BASE_URL",
        "apiKeyEnv": "FOUNDRY_AI_API_KEY",
        "modelEnv": "FOUNDRY_AI_MODEL"
      }
    ]
  }
}
```

An MCP configuration may resemble:

```json
{
  "ai": {
    "mode": "optional",
    "mcp": {
      "enabled": true,
      "serversFile": ".foundry/ai/mcp.servers.json"
    }
  }
}
```

These examples are illustrative and not yet accepted schemas.

## CLI Command Implications

Foundry should eventually support AI-specific commands such as:

```txt
foundry ai init
foundry ai providers
foundry ai configure
foundry ai bootstrap
foundry ai handoff
foundry ai context
foundry ai validate
```

However, core commands must not require AI configuration.

The following commands must work without AI:

```txt
foundry init
foundry add
foundry upgrade
foundry migrate
foundry validate
foundry doctor
foundry audit
foundry plan
foundry spec
```

## AI-Readable Artifact Generation

Foundry should generate AI-readable context files as part of normal repository lifecycle operations.

Examples:

```txt
docs/ai/BOOTSTRAP_PROMPT.md
docs/ai/CURRENT_STATE.md
docs/ai/FRESH_CHAT_HANDOFF.md
docs/ai/CONTEXT_INDEX.md
docs/ai/PROJECT_MAP.md
docs/ai/ACTIVE_WORK.md
.foundry/state/latest-status.md
.charon/daedalus/handoff-packets/
```

These files should be useful for:

```txt
manual handoff to ChatGPT or Claude
local model prompts
MCP tool context
future Foundry Cloud context indexing
human onboarding
project recovery
repo continuity
```

## Privacy Boundary

Local Foundry commands must not transmit repository content externally unless the user explicitly configures and invokes an integration that does so.

The default behavior should be local-only.

Future hosted integrations must clearly distinguish:

```txt
local-only operation
user-configured provider operation
future Foundry Cloud operation
```

## Cost Boundary

Foundry must not imply that a paid subscription is required.

If a configured provider may incur cost, Foundry should be able to disclose that in provider metadata.

Examples:

```txt
network_required: true
external_service: true
may_incur_cost: true
requires_subscription: provider-dependent
```

Local providers may also have hardware costs or performance constraints, but they should not require external subscription by default.

## SaaS Boundary

A future Foundry SaaS or cloud AI service may provide enhanced capabilities.

Possible examples:

```txt
hosted context indexing
multi-repo intelligence
organization policy summaries
AI-assisted upgrade planning
private provider gateways
team handoff dashboards
hosted MCP registry
```

But core CLI behavior must not depend on Foundry SaaS.

Generated repositories must remain portable.

## Verification Requirements

AI-related validation should distinguish between artifact validation and runtime validation.

Artifact validation may check:

```txt
required AI docs exist
AI context index is present
handoff packet format is valid
bootstrap prompt references current canonical files
current state file is present
forbidden provider lock-in is absent
```

Runtime validation may check, only when configured:

```txt
provider config exists
environment variables are present
endpoint is reachable
model name is configured
MCP servers file exists
local runtime appears available
```

Runtime validation must not fail the entire project merely because no AI provider is configured, unless the user explicitly requires AI for that project profile.

## Implementation Direction

The first implementation should not call any AI provider.

The first implementation should generate and validate provider-agnostic AI-readable artifacts.

Recommended implementation order:

```txt
1. Define AI operating principles.
2. Define AI provider-agnostic architecture.
3. Add ADR accepting AI-expected / AI-optional constraints.
4. Add docs/ai artifact templates.
5. Add foundry ai bootstrap command.
6. Add foundry ai handoff command.
7. Add foundry ai validate command.
8. Add provider config schema.
9. Add local/OpenAI-compatible provider adapter.
10. Add MCP config support.
11. Add optional hosted provider adapters.
```

## Non-Goals

This architecture does not require Foundry to become an autonomous coding agent.

This architecture does not require Foundry to choose a default hosted AI provider.

This architecture does not require a paid LLM/GPT subscription.

This architecture does not require internet access for local-only workflows.

This architecture does not require Foundry Cloud.

This architecture does not require all users to use AI.