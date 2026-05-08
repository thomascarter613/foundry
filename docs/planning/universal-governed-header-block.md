universal-governed-header-block.md
Below are the **Governed Document Templates** — the *canonical, binding, institution‑grade templates* that every document in your `docs/` directory must follow.  
These are not “examples.” These are **the law** of your documentation system.

They are:

- **Human‑readable**  
- **Machine‑readable**  
- **Machine‑actionable**  
- **Governance‑enforced**  
- **Knowledge‑graph compatible**  
- **Deterministic**  
- **Uniform across all domains**  

Each template begins with the governed header block and includes the required sections for its document type.

Every template is a Guided Link so you can refine or extend any one of them.

---

# 🏛️ **1. Universal Governed Header Block (applies to ALL documents)**  
This block is mandatory and validated by CI, linting, and the knowledge graph.

```markdown
Status: <Draft | Approved | Deprecated>
Owner: <Team or Role>
Last Updated: YYYY-MM-DD
Governance Level: <Informational | Required | Binding>
Document Type: <Planning | Governance | Architecture | Lifecycle | Standard | Platform | Onboarding>
```

---

# 📘 **2. Planning Document Template**  
**Planning Template**

```markdown
# <Title>

Status: <...>  
Owner: <...>  
Last Updated: <...>  
Governance Level: <...>  
Document Type: Planning

## Purpose
Explain why this planning artifact exists.

## Context
Describe the background, domain, or strategic framing.

## Problem Statement
Define the problem this plan addresses.

## Requirements / Definitions / Maps
List requirements, definitions, diagrams, or domain maps.

## Constraints
List constraints that shape the plan.

## Open Questions
List unresolved issues.

## Related Documents
- Link to upstream and downstream docs.

## Change History
- YYYY-MM-DD: Summary of change
```

---

# 🏛️ **3. Governance Document Template**  
**Governance Template**

```markdown
# <Title>

Status: <...>  
Owner: <...>  
Last Updated: <...>  
Governance Level: Binding  
Document Type: Governance

## Purpose
Explain the governance function of this document.

## Authority
Define who has authority over this domain.

## Scope
Define what this governance applies to.

## Rules
List the binding rules.

## Enforcement
Describe how rules are enforced (CI, review, governance body).

## Exceptions
Describe how exceptions are granted and timeboxed.

## Versioning & Lifecycle
Describe how this governance document evolves.

## Related Documents
- Link to governance, architecture, lifecycle, standards.

## Change History
- YYYY-MM-DD: Summary of change
```

---

# 🏗️ **4. Architecture Document Template**  
**Architecture Template**

```markdown
# <Title>

Status: <...>  
Owner: Architecture  
Last Updated: <...>  
Governance Level: Required  
Document Type: Architecture

## Purpose
Explain the architectural intent of this document.

## Architectural Context
Describe where this view fits (system, container, component, etc.).

## Components / Views
Describe components, diagrams, or architectural views.

## Constraints
List architectural constraints relevant to this view.

## Tradeoffs
Explain accepted tradeoffs.

## Related ADRs
- ADR 000X – <Title>

## Change History
- YYYY-MM-DD: Summary of change
```

---

# 🔄 **5. Lifecycle Document Template**  
**Lifecycle Template**

```markdown
# <Title>

Status: <...>  
Owner: Engineering Productivity  
Last Updated: <...>  
Governance Level: Required  
Document Type: Lifecycle

## Purpose
Explain the lifecycle process.

## Workflow
Describe the step-by-step process.

## Roles & Responsibilities
Define who does what.

## Required Artifacts
List required artifacts (issues, PRs, ADRs, docs).

## Approval Gates
Define what must be true to proceed.

## Escalation Paths
Define how issues escalate.

## Related Documents
- Link to governance, CI policy, standards.

## Change History
- YYYY-MM-DD: Summary of change
```

---

# 🧪 **6. Standards Document Template**  
**Standards Template**

```markdown
# <Title>

Status: <...>  
Owner: Standards Committee  
Last Updated: <...>  
Governance Level: Binding  
Document Type: Standard

## Purpose
Explain why this standard exists.

## Standard Rules
List the binding rules.

## Examples
Provide compliant examples.

## Anti-Patterns
Provide non-compliant examples.

## Enforcement
Describe how CI and review enforce this standard.

## Related Documents
- Link to governance, architecture, lifecycle.

## Change History
- YYYY-MM-DD: Summary of change
```

---

# ⚙️ **7. Platform Document Template**  
**Platform Template**

```markdown
# <Title>

Status: <...>  
Owner: Platform Team  
Last Updated: <...>  
Governance Level: Required  
Document Type: Platform

## Purpose
Explain the platform capability.

## Responsibilities
Define what the platform owns.

## Architecture / Components
Describe the platform architecture.

## Operational Requirements
Define reliability, performance, and operational expectations.

## SLAs / SLOs
Define service guarantees.

## Related Documents
- Link to CI policy, standards, architecture.

## Change History
- YYYY-MM-DD: Summary of change
```

---

# 🧭 **8. Onboarding Document Template**  
**Onboarding Template**

```markdown
# <Title>

Status: <...>  
Owner: Engineering Productivity  
Last Updated: <...>  
Governance Level: Informational  
Document Type: Onboarding

## Purpose
Explain what this onboarding document helps with.

## Audience
Define who this is for.

## Overview
Provide a high-level explanation of the relevant area.

## Key Concepts
List essential ideas and terms.

## Navigation Guide
Explain where to find related artifacts.

## Related Documents
- Link to index, glossary, governance.

## Change History
- YYYY-MM-DD: Summary of change
```

---

# 🧠 Non‑Obvious Insight  
These templates are not just formatting.  
They are **typed, governed, machine‑actionable contracts** that:

- define the documentation knowledge graph  
- drive the linting engine  
- drive the CI rules  
- drive the Docs Agent  
- drive the documentation generator  
- enforce governance  
- enforce consistency  
- enforce architectural lineage  
- enforce cross‑link integrity  