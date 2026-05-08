---
title: "ADR Directory Structure"
status: "Draft"
owner: "Product Architecture"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "Planning"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

adr-directory-structure.md
Below is the **complete, governed, canonical definition of the ADR Directory + Index** — not just the files, but the *institutional logic*, *governance rules*, *machine‑actionable semantics*, and *knowledge‑graph behavior* that make your ADR system the backbone of architectural truth in the monorepo.

This is the **authoritative specification** for:

- the ADR directory structure  
- the ADR index  
- ADR numbering  
- ADR lifecycle  
- ADR supersession  
- ADR machine‑readability  
- ADR integration with the documentation knowledge graph  
- ADR enforcement in CI  

Guided Links are embedded so you can drill deeper into any subsystem.

---

# 🏛️ **1. ADR Directory Structure (Canonical, Governed)**

```
docs/architecture/adr/
  index.md
  _template.md
  _supersession.md
  0001-architecture-principles.md
  0002-monorepo-structure.md
  0003-package-management.md
  0004-ci-governance.md
```

Each file is a **typed, governed artifact** with strict semantics.

- `index.md` → the authoritative ADR ledger  
- `_template.md` → the canonical ADR creation template  
- `_supersession.md` → the canonical ADR supersession template  
- `000X-*.md` → immutable, versioned architectural decisions  

This directory is consumed by the **documentation knowledge graph**, the **ADR validation engine**, and the **Docs Agent**.

---

# 🧩 **2. ADR Index (The Architectural Ledger)**

The ADR index is not a list.  
It is a **governed, machine‑readable architectural ledger**.

It must live at:

```
docs/architecture/adr/index.md
```

### **Canonical Structure**

```markdown
# Architecture Decision Record Index

Status: Approved  
Owner: Architecture  
Last Updated: YYYY-MM-DD  
Governance Level: Binding  
Document Type: Architecture

## Purpose
Provide the authoritative index of all ADRs.

## ADR List
| Number | Title | Status | Superseded By |
|--------|--------|---------|----------------|
| 0001 | Architecture Principles | Approved | — |
| 0002 | Monorepo Structure | Approved | — |
| 0003 | Package Management (bun-only) | Approved | — |
| 0004 | CI Governance & Lefthook | Approved | — |

## Related Documents
- ../principles.md
- ../constraints.md

## Change History
- YYYY-MM-DD: Initial creation
```

### **Machine‑Actionable Semantics**

The index is used to:

- validate ADR numbering  
- validate ADR existence  
- validate supersession chains  
- detect missing ADRs  
- detect numbering gaps  
- detect ADR drift  
- enforce immutability of Approved ADRs  
- build the architectural lineage graph  

This is the **root node** of the architecture knowledge graph.

---

# 🧱 **3. ADR Numbering Rules (Strict, Immutable)**

ADR numbers:

- start at `0001`  
- increment by 1  
- never change  
- never get reused  
- never get renumbered  
- must match filename prefix  
- must match index entry  

Example:

```
0003-package-management.md
```

If an ADR is superseded, its number remains forever.

This is enforced by the **ADR validation engine**.

---

# 🧬 **4. ADR Template (Canonical, Binding)**

Located at:

```
docs/architecture/adr/_template.md
```

This is the **only** allowed format for new ADRs.

```markdown
# ADR <Number>: <Title>

Status: Draft  
Owner: Architecture  
Last Updated: YYYY-MM-DD  
Governance Level: Binding  
Document Type: Architecture

## Context
Describe the background and forces.

## Decision
State the decision clearly.

## Rationale
Explain why this decision was made.

## Consequences
Describe positive and negative outcomes.

## Implementation Plan
Steps required to implement.

## Rollback Plan
How to revert if needed.

## Supersedes
List ADRs replaced.

## Superseded By
List ADRs that replace this one.

## References
Links to planning, architecture, governance.
```

This template is consumed by:

- the knowledge graph  
- the linting engine  
- the Docs Agent  
- CI  

---

# 🔄 **5. ADR Supersession Template**

Located at:

```
docs/architecture/adr/_supersession.md
```

Used when replacing an existing ADR.

```markdown
# ADR <Number>: <Title> (Supersession)

Status: Approved  
Owner: Architecture  
Last Updated: YYYY-MM-DD  
Governance Level: Binding  
Document Type: Architecture

## Supersedes
- ADR <Old Number>: <Old Title>

## Context
Why the previous ADR is no longer valid.

## Decision
The new decision.

## Migration Plan
How to transition.

## Impact
Affected documents and components.

## References
Links to superseded ADR and related docs.
```

This ensures **architectural lineage** is preserved.

---

# 🧠 **6. ADR Lifecycle (Governed, Enforced)**

### **States**
- `Draft` → editable  
- `Approved` → immutable  
- `Deprecated` → replaced  

### **Transitions**
- Draft → Approved (requires Architecture approval)  
- Approved → Deprecated (requires supersession ADR)  

### **Machine Enforcement**
- Approved ADRs cannot change except metadata  
- Supersession must be explicit  
- Index must reflect supersession  
- CI blocks invalid transitions  

---

# 🧩 **7. ADR Integration with the Knowledge Graph**

Each ADR becomes a **node** with:

- metadata (from header block)  
- edges to:
  - related ADRs  
  - architecture docs  
  - planning docs  
  - governance docs  
  - standards  
  - lifecycle rules  

This enables:

- impact analysis  
- drift detection  
- dependency mapping  
- architectural lineage visualization  

This is consumed by the **Docs Agent reasoning engine**.

---

# ⚙️ **8. ADR CI Enforcement**

CI validates:

- numbering  
- index consistency  
- immutability  
- required sections  
- supersession correctness  
- cross‑link validity  
- header block correctness  

This is defined in the **documentation CI rules**.

---

# 🧠 Non‑Obvious Insight  
Your ADR directory is not a folder.  
It is a **governed architectural memory system** that:

- defines the architecture  
- constrains the architecture  
- evolves the architecture  
- documents the architecture  
- validates the architecture  
- enforces the architecture  
- explains the architecture  
- preserves the architecture  

It is the **constitutional record** of your monorepo.

---

# 🔥 Your Next Move  
Which part of the ADR system do you want to build next?

- **ADR Validation Engine**  
- **ADR Impact Analyzer**  
- **Generate ADR 0001–0004 with full content**  
- **Documentation Knowledge Graph Schema**