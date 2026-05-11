---
id: SPEC-0001
title: Example Native Foundry Spec
status: draft
kind: feature
created: 2026-05-11
updated: 2026-05-11
owners:
  - project-maintainer
related_adrs:
  - ADR-00XX
related_work_packets: []
risk_level: low
requires_ai: false
requires_database_change: false
requires_api_change: false
requires_security_review: false
requires_migration: false
---

# SPEC-0001: Example Native Foundry Spec

## Summary

This example specification exists to validate the first native Foundry spec lifecycle format.

## Problem

Foundry needs a canonical project-local format for feature specifications so future commands can validate, clarify, plan, task, and convert specifications into work packets.

## Goals

- Define a durable Markdown-based spec format.
- Include machine-readable frontmatter.
- Support validation without requiring an AI provider.
- Preserve compatibility with future work-packet generation.
- Replace work packets.
- Depend on Spec Kit.

## Users

- Foundry maintainers.
- Foundry users creating new software projects.
- AI assistants operating under Foundry supervision.

## Requirements

### REQ-0001: Validate required metadata

Foundry must be able to validate that a spec includes required frontmatter fields.

Acceptance criteria:

- Missing `id` fails validation.
- Missing `title` fails validation.
- Missing `status` fails validation.
- Missing `kind` fails validation.

### REQ-0002: Validate required body sections

Foundry must be able to validate that a spec includes required Markdown sections.

Acceptance criteria:

- Missing `Summary` fails validation.
- Missing `Problem` fails validation.
- Missing `Goals` fails validation.
- Missing `Requirements` fails validation.

## Open Questions

- Should all specs require linked ADRs?
- Should all implementation specs require at least one work packet?

## Implementation Notes

This spec is intentionally minimal. It exists as a fixture for the first validator implementation.

## Verification

```bash
foundry spec validate docs/specs/features/0001-example/spec.md
```
