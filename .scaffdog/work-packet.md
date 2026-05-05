---
name: "work-packet"
root: "."
output: "."
questions:
  identifier: "Work packet identifier, for example WP-0001"
  name: "Work packet title"
  status:
    message: "Work packet status"
    choices:
      - "planned"
      - "active"
      - "blocked"
      - "complete"
      - "cancelled"
    initial: "planned"
---

# `docs/work-packets/{{ inputs.identifier }}-{{ inputs.name | kebab }}.md`

```markdown
---
title: "{{ inputs.identifier }}: {{ inputs.name }}"
status: "{{ inputs.status }}"
version: "0.1.0"
created: "{{ date "YYYY-MM-DD" }}"
updated: "{{ date "YYYY-MM-DD" }}"
owner: "Project Maintainer"
classification: "internal"
---

# {{ inputs.identifier }}: {{ inputs.name }}

## Status

{{ inputs.status }}.

## Purpose

Describe why this work packet exists.

## Scope

This work packet includes:

- To be completed.

## Non-Goals

This work packet does not include:

- To be completed.

## Inputs

Required inputs:

- To be completed.

## Outputs

Expected outputs:

- To be completed.

## Execution Plan

1. To be completed.
2. To be completed.
3. To be completed.

## Acceptance Criteria

This work packet is complete when:

- [ ] The intended files or artifacts have been created.
- [ ] The generated output has been reviewed.
- [ ] Verification commands pass.
- [ ] The work can be committed atomically.

## Verification

Run:

```bash
bun run verify
```

## Git Commit

Recommended atomic Conventional Commit:

```bash
git commit -m "chore(work-packet): complete {{ inputs.name | kebab }}"
```
```
