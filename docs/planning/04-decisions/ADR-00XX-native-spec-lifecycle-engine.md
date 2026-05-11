---
id: ADR-00XX
title: Native Spec Lifecycle Engine
status: accepted
date: 2026-05-11
decision_owner: project-maintainer
supersedes: []
superseded_by: []
related:
  - Foundry CLI
  - AionX
  - Charon
  - Work Packet Execution Model
---

# ADR-00XX: Native Spec Lifecycle Engine

## Status

Accepted.

## Context

Foundry is intended to be more than a monorepo generator. It is a repo-evolution and software delivery system that helps users move from product intent to implementation through governed, inspectable, auditable artifacts.

GitHub Spec Kit provides a useful pattern for spec-driven development:

1. establish a project constitution,
2. write a feature specification,
3. clarify ambiguities,
4. create an implementation plan,
5. generate tasks,
6. analyze consistency,
7. implement through an AI-assisted workflow.

Foundry should learn from that pattern, but should not depend on Spec Kit as its core implementation because Foundry has broader requirements:

- repo generation,
- repo evolution,
- provider/plugin architecture,
- database provider orchestration,
- audit logging,
- provenance,
- supervised execution,
- verification gates,
- AI-provider agnosticism,
- optional AI usage,
- Charon/AionX context continuity,
- work-packet generation,
- durable repo contracts.

## Decision

Foundry will implement a native **Spec Lifecycle Engine**.

The Spec Lifecycle Engine will own Foundry’s canonical workflow for turning product intent into verified repository changes.

The initial lifecycle will be:

```text
constitution
→ spec
→ clarify
→ plan
→ tasks
→ work packet
→ supervised execution
→ verification
→ commit recommendation
```

Foundry may later support Spec Kit compatibility through adapters, import/export commands, presets, or migration tools, but Spec Kit will not be a required runtime dependency.

## Consequences

### Positive

* Foundry owns its core product workflow.
* Foundry remains TypeScript/Bun-native.
* Foundry avoids Python/uv/pipx dependency coupling.
* Foundry can enforce stronger repo governance than Spec Kit alone.
* Foundry can support users with or without AI.
* Foundry can map specs directly into work packets, repo evolution plans, verification gates, audit logs, and Charon handoff artifacts.

### Negative

* Foundry must implement more functionality itself.
* Spec compatibility will require adapter maintenance.
* The project must avoid drifting into vague planning documents without executable validation.

## Initial Implementation Scope

The first implementation slice will add:

1. a canonical Foundry spec schema,
2. a Markdown/frontmatter spec format,
3. a spec validator,
4. a future CLI surface for `foundry spec validate`.

The first slice will not generate implementation code.

## Future Work

Future slices will add:

* `foundry spec create`,
* `foundry spec clarify`,
* `foundry spec plan`,
* `foundry spec tasks`,
* `foundry work-packet from-spec`,
* `foundry evolve from-spec`,
* Spec Kit import/export support,
* AI provider integration,
* local/offline model compatibility,
* supervised execution approval gates.

## Decision Summary

Foundry will implement native spec-driven development capabilities directly. Spec Kit will be treated as a reference, compatibility target, and possible adapter source, not as Foundry’s core spec engine.
