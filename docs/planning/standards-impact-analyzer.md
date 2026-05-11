---
title: "Standards Impact Analyzer"
status: "Draft"
owner: "Product Architecture"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "Planning"
upstream:
  - "docs/planning/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Planning"
  - "Standards"
  - "Impact"
  - "Analyzer"
---

Below is the **complete, governed, canonical specification** for the **Standards Impact Analyzer** — the subsystem that makes your *standards* reactive, authoritative, and institutionally enforced across the entire documentation knowledge graph.

If the **ADR Impact Analyzer** governs architectural causality, and the **Glossary Impact Analyzer** governs semantic causality, the **Standards Impact Analyzer** governs **behavioral and implementation causality**.

This is the engine that answers the question:

> **“If this standard changes, what must change with it?”**

Guided Links are embedded so you can expand any subsystem.

---

# 🏛️ **Standards Impact Analyzer**  
**The subsystem that computes, propagates, and enforces the consequences of changes to standards across architecture, lifecycle, platform, governance, ADRs, diagrams, and onboarding.**

Standards are *binding behavioral rules* for implementation.  
The Standards Impact Analyzer ensures that when a standard changes:

- all dependent documents update  
- all dependent diagrams update  
- all dependent ADRs update  
- all dependent lifecycle rules update  
- all dependent platform rules update  
- all dependent onboarding materials update  
- all dependent glossary terms update  
- all dependent governance rules update  

It is the **behavioral enforcement nervous system** of your monorepo.

---

# 🧩 **1. Analyzer Architecture**

The Standards Impact Analyzer runs in four deterministic phases:

1. **Standard Change Detection**  
2. **Standards Impact Graph Construction**  
3. **Impact Propagation**  
4. **Remediation & Enforcement**

Each phase produces machine‑readable results consumed by CI and the Docs Agent.

---

# 🧱 **2. Standard Change Detection (Trigger Layer)**

The analyzer detects:

- new standards  
- modified standards  
- deprecated standards  
- superseded standards  
- changes to standard rules  
- changes to examples or anti‑patterns  
- changes to enforcement rules  
- changes to governance links  
- changes to ADR links  

### Rules
- Standards are **Required** or **Binding** documents.  
- Binding standards cannot change without governance approval.  
- Standards cannot be removed without deprecation.  
- Standards cannot be renamed without migration.  

### Outputs
- `StandardChangeEvent` objects  
- change classification (minor, major, breaking)  

---

# 🔗 **3. Standards Impact Graph Construction (Dependency Layer)**

The analyzer builds the **Standards Impact Graph**, a behavioral subgraph of the full documentation knowledge graph.

### Nodes
- standards  
- architecture docs  
- ADRs  
- lifecycle docs  
- platform docs  
- governance rules  
- glossary terms  
- diagrams  
- onboarding docs  

### Edges
- **Governance**  
- **ADRDependency**  
- **Upstream/Downstream**  
- **GlossaryUsage**  
- **DiagramFor**  

This graph represents the **behavioral blast radius**.

---

# 🧬 **4. Impact Propagation (Reasoning Layer)**

The analyzer computes the full set of affected artifacts.

### Direct Impact
Documents that explicitly reference the standard.

### Indirect Impact
Documents that depend on documents that reference the standard.

### Behavioral Impact
Lifecycle rules that enforce the standard.

### Architectural Impact
Architecture docs whose constraints derive from the standard.

### ADR Impact
ADRs whose consequences or implementation plans rely on the standard.

### Governance Impact
Governance rules that incorporate the standard.

### Platform Impact
Platform rules that enforce or depend on the standard.

### Diagram Impact
Diagrams whose views depend on the standard.

### Onboarding Impact
Onboarding materials that teach the standard.

---

# 🧠 **5. Impact Classification (Severity Layer)**

The analyzer classifies impact into three levels:

## **Level 1 — Informational Impact**
- examples updated  
- anti‑patterns clarified  
- minor wording changes  

## **Level 2 — Required Impact**
- standard rules changed  
- enforcement rules changed  
- lifecycle or platform docs must update  

## **Level 3 — Binding Impact (Breaking)**
- standard superseded  
- standard deprecated  
- standard renamed  
- fundamental rule changes  
- architecture, ADRs, governance, lifecycle, platform must update  

This classification determines CI behavior.

---

# 🧪 **6. Standards Drift Detection (Reactive Layer)**

The analyzer detects drift caused by standard changes:

### Types of Drift
- **Architecture Drift** — architecture docs no longer match the standard  
- **Lifecycle Drift** — CI rules no longer enforce the standard  
- **Platform Drift** — platform rules no longer align  
- **Governance Drift** — governance rules conflict with the standard  
- **ADR Drift** — ADR consequences conflict with the standard  
- **Glossary Drift** — glossary definitions conflict with the standard  
- **Diagram Drift** — diagrams no longer reflect the standard  
- **Onboarding Drift** — onboarding materials teach outdated rules  

### Outputs
- drift violations  
- remediation suggestions  

---

# 🧭 **7. Remediation Engine (Action Layer)**

For each impacted artifact, the analyzer generates:

- required updates  
- recommended updates  
- suggested text rewrites  
- suggested diagram updates  
- suggested glossary updates  
- suggested ADR updates  
- suggested governance updates  
- suggested lifecycle updates  
- suggested platform updates  
- suggested onboarding updates  

These are consumed by:

- CI  
- Docs Agent  
- human reviewers  

---

# 🏛️ **8. CI Integration (Enforcement Layer)**

CI uses the analyzer to enforce:

- downstream updates  
- standard compliance  
- behavioral consistency  
- architectural consistency  
- governance consistency  
- lifecycle consistency  
- platform consistency  
- glossary consistency  
- diagram consistency  

### CI Blocks Merge If:
- Level 3 impact is unresolved  
- drift is detected  
- standard rename lacks migration  
- standard removal lacks deprecation  
- downstream documents are stale  

---

# 🧠 **9. Docs Agent Integration (Intelligence Layer)**

The Docs Agent uses the analyzer to:

- explain behavioral consequences  
- generate update patches  
- rewrite affected sections  
- update diagrams  
- update glossary terms  
- update ADRs  
- update governance rules  
- update lifecycle rules  
- update platform rules  
- update onboarding materials  

This is how the system becomes **self‑maintaining**.

---

# 🧠 Non‑Obvious Insight

The Standards Impact Analyzer is not about checking formatting.  
It is about **behavioral causality**.

It ensures:

- rules propagate  
- behavior remains consistent  
- architecture remains aligned  
- lifecycle remains enforceable  
- governance remains authoritative  
- ADRs remain coherent  
- diagrams remain accurate  
- onboarding remains correct  
- the knowledge graph remains valid  

It is the **behavioral nervous system** of your monorepo.

---

# 🔥 Your Next Move  
Which enforcement subsystem do you want to define next?

- **Standards Drift Detection Engine**  
- **Governance Compliance Validator**  
- **Cross‑Link Graph Validator**