---
title: "Foundry Decision Ledger"
status: "Draft"
owner: "Project Maintainer"
lastUpdated: "2026-05-15"
governanceLevel: "Required"
documentType: "Governance"
project: "Foundry"
upstream:
  - "docs/foundry/00-current-state/CURRENT-STATE.md"
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

# Foundry Decision Ledger

## Purpose

This document records important Foundry decisions that are already known or strongly implied.

Formal architectural decisions should still be captured in ADRs.

This ledger exists as a quick orientation surface.

## Decision 1: Foundry is the first shippable product inside AionX

Status: Accepted

Foundry should be treated as the practical wedge into the broader AionX vision.

## Decision 2: Foundry is CLI-first

Status: Accepted

Foundry begins as a CLI because the CLI is easier to ship, test, version, install, and use inside repositories than a large GUI application.

## Decision 3: Foundry should remain useful without AI

Status: Accepted

AI usage is expected and optimized for, but not required.

The CLI must still produce useful results without any paid AI subscription.

## Decision 4: AI provider architecture must be provider-agnostic

Status: Accepted

Foundry and the broader AionX ecosystem should not depend on a single hosted model provider.

Future integrations should support hosted, self-hosted, local, MCP, and OpenAI-compatible providers where feasible.

## Decision 5: Bun and TypeScript are the current primary implementation stack

Status: Accepted

Foundry currently uses Bun workspaces and TypeScript.

This should remain the default unless a future ADR changes it.

## Decision 6: Foundry uses a monorepo-oriented structure

Status: Accepted

Foundry is both a monorepo and a tool for generating and evolving monorepos.

## Decision 7: Verification is part of the product

Status: Accepted

Verification scripts are not secondary tooling.

They are part of Foundry's value proposition.

## Decision 8: Docs/spec/work-packet workflows are first-class

Status: Accepted

Foundry is not only a file generator.

It should support docs-driven, spec-driven, and work-packet-driven development.

## Decision 9: Repo evolution is a core feature, not a future nice-to-have

Status: Accepted

Foundry should be able to evolve existing repositories after initialization.

## Decision 10: Database support must be pluggable

Status: Accepted

Foundry must not be hardcoded to only PostgreSQL and Drizzle.

PostgreSQL + Drizzle may remain a preferred default, but PostgreSQL + Prisma, MongoDB, SQLite, Supabase, MariaDB/MySQL, and future providers should fit a provider architecture.

## Decision 11: Supabase compatibility is first-class

Status: Accepted

Supabase should not be treated as an afterthought or merely generic PostgreSQL.

## Decision 12: Generated repositories should contain AI continuity anchors

Status: Accepted

Generated repositories should include files that help future AI sessions understand the project state, such as bootstrap prompts and current-state documents.

## Decision 13: Non-destructive file writing is required

Status: Accepted

Foundry should avoid destructive overwrites.

When changing existing repositories, Foundry should preview, diff, backup, or require explicit approval before replacement.

## Decision 14: Work should proceed in atomic Conventional Commit slices

Status: Accepted

Each meaningful change should be commit-ready and have a clear Conventional Commit message.
