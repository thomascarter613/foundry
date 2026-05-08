---
title: "ADR Impact Analyzer"
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

adr-impact-analyzer.md
Below is the **complete, governed, canonical specification** for the **ADR Impact Analyzer** — the subsystem that makes your ADR framework *reactive*, *intelligent*, and *institutionally enforceable*.  
If the **ADR Validation Engine** ensures ADRs are *correct*, the **ADR Impact Analyzer** ensures ADRs are *consequential*.

This is the engine that answers the question:

> *“If this ADR changes, what must change with it?”*

Guided Links are embedded so you can expand any subsystem.

---

# 🏛️ **ADR Impact Analyzer**  
**The subsystem that computes, propagates, and enforces the architectural consequences of ADR changes across the entire documentation knowledge graph.**

The ADR Impact Analyzer:

- identifies all documents affected by an ADR  
- computes the architectural blast radius  
- detects drift caused by ADR changes  
- enforces downstream updates  
- integrates with governance  
- integrates with glossary semantics  
- integrates with diagrams  
- integrates with lifecycle and standards  
- integrates with the Docs Agent reasoning engine  

It is the **reactive architectural intelligence layer** of your monorepo.

---

# 🧩 **1. Analyzer Architecture**

The ADR Impact Analyzer runs in four deterministic phases:

1. **ADR Change Detection**  
2. **Impact Graph Construction**  
3. **Impact Propagation**  
4. **Remediation & Enforcement**

Each phase produces machine‑readable results consumed by CI and the Docs Agent.

---

# 🧱 **2. ADR Change Detection (Trigger Layer)**

The analyzer detects:

- new ADRs  
- modified ADRs  
- superseded ADRs  
- deprecated ADRs  
- ADRs with changed rationale  
- ADRs with changed consequences  
- ADRs with changed implementation plans  

### Rules
- Approved ADRs cannot change except metadata.  
- Draft ADRs may change freely.  
- Supersession is the only valid modification path.  

### Outputs
- `ADRChangeEvent` objects  
- change classification (minor, major, breaking)  

---

# 🔗 **3. Impact Graph Construction (Dependency Layer)**

The analyzer builds the **ADR Impact Graph**, a subgraph of the full documentation knowledge graph.

### Nodes
- ADRs  
- Architecture docs  
- Standards  
- Lifecycle docs  
- Platform docs  
- Governance docs  
- Glossary terms  
- Diagrams  

### Edges
- **ADRDependency**  
- **ADRSupersedes**  
- **Upstream/Downstream**  
- **GlossaryUsage**  
- **DiagramFor**  

This graph represents the **architectural blast radius**.

---

# 🧬 **4. Impact Propagation (Reasoning Layer)**

The analyzer computes the full set of affected artifacts.

### Direct Impact
Documents that explicitly reference the ADR.

### Indirect Impact
Documents that depend on documents that reference the ADR.

### Semantic Impact
Glossary terms whose definitions rely on ADR concepts.

### Diagram Impact
Diagrams whose views depend on ADR decisions.

### Governance Impact
Governance rules that incorporate ADR constraints.

### Lifecycle Impact
CI rules or lifecycle gates derived from ADR decisions.

### Standard Impact
Standards that enforce ADR decisions.

---

# 🧠 **5. Impact Classification (Severity Layer)**

The analyzer classifies impact into three levels:

## **Level 1 — Informational Impact**
- ADR metadata changed  
- Minor glossary updates  
- No architectural consequences  

## **Level 2 — Required Impact**
- ADR rationale changed  
- ADR consequences changed  
- Standards or lifecycle docs affected  

## **Level 3 — Binding Impact (Breaking)**
- ADR decision changed  
- ADR superseded  
- Architecture docs must update  
- Diagrams must update  
- Governance rules affected  

This classification determines CI behavior.

---

# 🧪 **6. Drift Detection (Reactive Layer)**

The analyzer detects drift caused by ADR changes:

### Types of Drift
- **Architectural Drift** — architecture docs no longer match ADR  
- **Standards Drift** — standards no longer enforce ADR  
- **Lifecycle Drift** — CI rules no longer reflect ADR  
- **Glossary Drift** — definitions conflict with ADR  
- **Diagram Drift** — diagrams no longer reflect ADR  
- **Governance Drift** — governance rules conflict with ADR  

### Outputs
- drift violations  
- remediation suggestions  

---

# 🧭 **7. Remediation Engine (Action Layer)**

For each impacted artifact, the analyzer generates:

- required updates  
- recommended updates  
- suggested text changes  
- suggested diagram updates  
- suggested glossary updates  
- suggested governance updates  

These are consumed by:

- CI  
- Docs Agent  
- human reviewers  

---

# 🏛️ **8. CI Integration (Enforcement Layer)**

CI uses the analyzer to enforce:

- downstream updates  
- supersession correctness  
- architectural consistency  
- governance consistency  
- glossary consistency  
- diagram consistency  

### CI Blocks Merge If:
- Level 3 impact is unresolved  
- Drift is detected  
- Supersession is incomplete  
- Downstream documents are stale  

---

# 🧠 **9. Docs Agent Integration (Intelligence Layer)**

The Docs Agent uses the analyzer to:

- explain architectural consequences  
- generate update patches  
- rewrite affected sections  
- update diagrams  
- update glossary terms  
- update standards  
- update lifecycle rules  

This is how the system becomes **self‑maintaining**.

---

# 🧠 Non‑Obvious Insight

The ADR Impact Analyzer is not about detecting broken links.  
It is about **architectural causality**.

It ensures:

- decisions propagate  
- architecture stays consistent  
- standards stay aligned  
- lifecycle rules stay correct  
- governance stays authoritative  
- glossary stays semantically coherent  
- diagrams stay accurate  
- the knowledge graph stays valid  

It is the **architectural nervous system** of your monorepo.

---

# 🔥 Your Next Move  
Which architectural subsystem do you want to define next?

- **ADR Supersession Model**  
- **Graph Drift Detection Engine**  
- **Docs Agent Reasoning Engine**