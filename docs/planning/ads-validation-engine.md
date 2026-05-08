---
title: "Ads Validation Engine"
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

ads-validation-engine.md
Below is the **complete, governed, canonical specification** for the **ADR Validation Engine** — the subsystem that ensures your Architecture Decision Records are **structurally valid**, **semantically valid**, **lineage‑correct**, **graph‑consistent**, and **governance‑enforced**.

This engine is one of the most important components of the entire documentation platform.  
It is the **guardian of architectural truth**.

Guided Links are embedded so you can expand any subsystem.

---

# 🏛️ ADR Validation Engine  
**The enforcement mechanism that guarantees architectural decisions remain immutable, traceable, and internally coherent.**

The ADR Validation Engine runs **after linting** but **before CI graph‑level enforcement**.  
It validates ADRs as **governed artifacts** with strict rules around:

- numbering  
- filenames  
- metadata  
- required sections  
- supersession  
- lineage  
- index consistency  
- cross‑document references  
- knowledge‑graph integration  

This engine ensures the ADR system is **deterministic**, **governed**, and **institutionally sound**.

---

# 🧩 1. Engine Architecture

The ADR Validation Engine consists of five major phases:

1. **Metadata Validation**  
2. **Structural Validation**  
3. **Index Validation**  
4. **Supersession Validation**  
5. **Graph‑Level Validation**

Each phase is deterministic and produces machine‑readable violations.

---

# 🧱 2. Metadata Validation (Binding)

Every ADR must contain a governed header block with:

- **Status**  
- **Owner**  
- **Last Updated**  
- **Governance Level**  
- **Document Type** (must be `Architecture`)  

### Rules
- Status must be `Draft`, `Approved`, or `Deprecated`.  
- Governance Level must be `Binding`.  
- Document Type must be `Architecture`.  
- Last Updated must match `YYYY-MM-DD`.  
- Owner must be a valid team or role.  

### Violations
- Missing header block  
- Invalid enum values  
- Incorrect document type  
- Incorrect governance level  

---

# 🏗️ 3. Structural Validation (Binding)

Every ADR must contain the canonical sections:

- Context  
- Decision  
- Rationale  
- Consequences  
- Implementation Plan  
- Rollback Plan  
- Supersedes  
- Superseded By  
- References  

### Rules
- All required sections must exist.  
- No empty sections.  
- No TODOs in Approved ADRs.  
- Section headings must match canonical names.  

---

# 🔢 4. Numbering & Filename Validation (Binding)

ADR filenames must follow:

```
0003-package-management.md
```

### Rules
- Filename prefix must be a zero‑padded integer.  
- ADR number must match the number in the header.  
- ADR number must match the number in the index.  
- ADR numbers must be unique.  
- ADR numbers must never be reused.  

### Violations
- Number mismatch  
- Duplicate numbers  
- Missing zero padding  
- Filename/title mismatch  

---

# 📘 5. ADR Index Validation (Binding)

The ADR index (`docs/architecture/adr/index.md`) is the **authoritative ledger**.

### Rules
- Every ADR file must appear in the index.  
- Every index entry must correspond to a real ADR file.  
- Index must be sorted by ADR number.  
- Index must include status and supersession info.  

### Violations
- ADR missing from index  
- Index entry missing ADR file  
- Incorrect ordering  
- Incorrect supersession metadata  

---

# 🔄 6. Supersession Validation (Lineage Enforcement)

Supersession is the **architectural lineage mechanism**.

### Rules
- Supersession must be explicit.  
- Superseded ADR must be marked `Deprecated`.  
- Superseding ADR must be `Approved`.  
- Supersession chains must not contain loops.  
- Supersession must match index metadata.  

### Violations
- Missing supersession metadata  
- Supersession loops  
- Superseding ADR not Approved  
- Superseded ADR not Deprecated  

---

# 🧬 7. Graph‑Level Validation (Knowledge Graph Integration)

After building the documentation knowledge graph, the engine validates:

### ADR Node Rules
- Every ADR must be a node in the graph.  
- Every ADR must have at least one downstream reference.  
- No orphan ADRs allowed.  

### ADR Edge Rules
- ADRDependency edges must point to valid ADRs.  
- ADRSupersedes edges must match supersession metadata.  
- No circular ADRDependency edges.  

### Cross‑Domain Rules
- Architecture docs must reference ADRs.  
- Standards must reference ADRs.  
- Lifecycle docs must reference ADRs.  
- Platform docs must reference ADRs.  

---

# 🧠 8. Immutability Enforcement (Binding)

Once an ADR is `Approved`, it becomes **immutable**.

### Rules
- Only metadata may change.  
- Body content cannot change.  
- Supersession is the only allowed modification path.  

### Violations
- Body changes to Approved ADR  
- Title changes  
- Section changes  
- Decision changes  

---

# 🧪 9. ADR Validation Engine Output

The engine produces:

- **Per‑ADR violations**  
- **Index violations**  
- **Lineage violations**  
- **Graph violations**  
- **Immutability violations**  

Output is machine‑readable and consumed by CI.

---

# 🧠 Non‑Obvious Insight

The ADR Validation Engine is not about formatting.  
It is about **architectural integrity**.

It ensures:

- decisions are immutable  
- decisions are traceable  
- decisions are justified  
- decisions are consistent  
- decisions are discoverable  
- decisions are governable  
- decisions are machine‑actionable  

Without this engine, architecture becomes folklore.  
With it, architecture becomes **institutional law**.

---

# 🔥 Your Next Move  
Which architectural subsystem do you want to define next?

- **ADR Impact Analyzer**  
- **ADR Supersession Model**  
- **Documentation Knowledge Graph Schema**  
- **Architecture Document Type**