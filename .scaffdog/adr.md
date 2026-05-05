---
name: "adr"
root: "."
output: "."
questions:
  identifier: "ADR identifier, for example ADR-0002"
  name: "Decision title"
  status:
    message: "ADR status"
    choices:
      - "proposed"
      - "accepted"
      - "superseded"
      - "rejected"
    initial: "proposed"
---

# `docs/adr/{{ inputs.identifier }}-{{ inputs.name | kebab }}.md`

```markdown
---
title: "{{ inputs.identifier }}: {{ inputs.name }}"
status: "{{ inputs.status }}"
version: "0.1.0"
created: "{{ date "YYYY-MM-DD" }}"
updated: "{{ date "YYYY-MM-DD" }}"
decision_owner: "Project Maintainer"
classification: "internal"
---

# {{ inputs.identifier }}: {{ inputs.name }}

## Status

{{ inputs.status }}.

## Context

Describe the situation, constraints, problem, and forces that led to this decision.

## Decision

State the decision clearly and directly.

## Rationale

Explain why this decision is preferred over the alternatives.

## Consequences

### Positive

- To be completed.

### Negative

- To be completed.

### Neutral

- To be completed.

## Alternatives Considered

### Alternative 1

Describe the alternative and why it was not selected.

## Enforcement

Describe how this decision will be enforced in documentation, code, tooling, review, tests, or governance.

## Related Documents

- To be completed.
```
