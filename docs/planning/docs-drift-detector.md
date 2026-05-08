docs-drift-detector.md
Below is the **complete, governed, canonical specification** for the **Documentation Drift Detector** — the subsystem that ensures your entire documentation corpus remains **fresh**, **aligned**, **consistent**, and **governed** as the knowledge graph evolves.

If the **Cross‑Link Graph Validator** ensures the graph is *correct*, and the **Impact Analyzers** ensure changes *propagate*, the **Documentation Drift Detector** ensures the corpus is **never stale**, **never contradictory**, and **never out of sync** with the authoritative sources of truth.

This is the engine that answers the question:

> **“What parts of the documentation are now wrong, outdated, inconsistent, or semantically stale?”**

Guided Links are embedded so you can expand any subsystem.

---

# 🧠 **Documentation Drift Detector**  
**The subsystem that detects, classifies, and reports all forms of drift across the entire documentation knowledge graph.**

The Drift Detector identifies:

- metadata drift  
- glossary drift  
- ADR drift  
- governance drift  
- standards drift  
- architecture drift  
- lifecycle drift  
- platform drift  
- diagram drift  
- dependency drift  
- semantic drift  
- structural drift  

It is the **continuous integrity auditor** of the living documentation system.

---

# 🧩 1. Drift Detector Architecture

The Documentation Drift Detector runs in four deterministic phases:

1. **Drift Trigger Detection**  
2. **Drift Graph Construction**  
3. **Drift Classification**  
4. **Drift Reporting & Enforcement**

Each phase produces machine‑readable results consumed by CI and the Docs Agent.

---

# 🧱 2. Drift Trigger Detection (Event Layer)

The detector listens for changes in:

- **ADR Impact Analyzer** outputs  
- **Glossary Impact Analyzer** outputs  
- **Standards Impact Analyzer** outputs  
- **Governance Impact Analyzer** outputs  
- document metadata changes  
- diagram metadata changes  
- directory structure changes  
- link model changes  
- dependency changes  

Each change produces a `DriftTriggerEvent`.

---

# 🧬 3. Drift Graph Construction (Knowledge Graph Layer)

The detector builds a **Drift Graph**, a filtered view of the full documentation knowledge graph containing only:

### Nodes
- documents  
- ADRs  
- glossary terms  
- governance rules  
- standards  
- lifecycle rules  
- platform rules  
- diagrams  

### Edges
- upstream/downstream  
- governance  
- ADRDependency  
- GlossaryUsage  
- DiagramFor  

This graph is used to compute **where drift has occurred**.

---

# 🧠 4. Drift Classification (Semantic Layer)

The detector classifies drift into **twelve governed categories**.

---

## 4.1 **Metadata Drift**
A document’s metadata no longer matches:

- its directory  
- its document type  
- its governance level  
- its status  
- its owner  

Example:  
A document marked `Approved` but containing TODOs.

---

## 4.2 **Glossary Drift**
A glossary term’s definition no longer matches its usage.

Example:  
A term’s meaning changed but architecture docs still use the old meaning.

---

## 4.3 **ADR Drift**
An ADR’s decision, rationale, or consequences no longer match downstream documents.

Example:  
An ADR was superseded but architecture docs still reference it.

---

## 4.4 **Governance Drift**
A governance rule changed but downstream documents did not update.

Example:  
A Binding rule changed but standards still enforce the old rule.

---

## 4.5 **Standards Drift**
A standard changed but lifecycle or platform rules did not update.

Example:  
A standard’s enforcement rule changed but CI still enforces the old behavior.

---

## 4.6 **Architecture Drift**
Architecture docs no longer match ADRs, standards, or governance.

Example:  
A diagram shows a component that ADRs no longer permit.

---

## 4.7 **Lifecycle Drift**
CI rules no longer match governance or standards.

Example:  
A CI gate still enforces a deprecated standard.

---

## 4.8 **Platform Drift**
Platform rules no longer match governance or standards.

Example:  
A platform policy contradicts a Binding governance rule.

---

## 4.9 **Diagram Drift**
Diagrams no longer match architecture docs, ADRs, or glossary terms.

Example:  
A diagram label uses an outdated glossary term.

---

## 4.10 **Dependency Drift**
Upstream/downstream relationships no longer match document content.

Example:  
A document references another document that no longer defines the required concept.

---

## 4.11 **Semantic Drift**
The meaning of a term, rule, or concept has changed but dependent documents have not updated.

Example:  
A glossary term changed meaning but onboarding still teaches the old meaning.

---

## 4.12 **Structural Drift**
The directory structure no longer matches the canonical topology.

Example:  
A new directory appears under `docs/` without governance approval.

---

# 🧪 5. Drift Reporting (Output Layer)

The detector produces:

- per‑document drift reports  
- per‑ADR drift reports  
- per‑standard drift reports  
- per‑governance drift reports  
- per‑glossary drift reports  
- per‑diagram drift reports  
- graph‑level drift reports  

Each drift item includes:

- drift type  
- severity  
- impacted nodes  
- impacted edges  
- suggested remediation  

---

# 🏛️ 6. CI Integration (Enforcement Layer)

CI uses the drift detector to enforce:

### CI Blocks Merge If:
- any **Binding** drift exists  
- any **Required** drift exists  
- any **graph‑level** drift exists  
- any **authority flow** drift exists  
- any **semantic** drift exists  

### CI Warns If:
- Informational drift exists  
- optional sections are stale  

---

# 🧠 7. Docs Agent Integration (Intelligence Layer)

The Docs Agent uses drift data to:

- explain why drift occurred  
- generate update patches  
- rewrite affected sections  
- update diagrams  
- update glossary terms  
- update ADRs  
- update governance rules  
- update standards  
- update lifecycle rules  
- update platform rules  

This is how the system becomes **self‑maintaining**.

---

# 🧠 Non‑Obvious Insight

The Documentation Drift Detector is not about catching outdated text.  
It is about **systemic coherence**.

It ensures:

- the documentation system never decays  
- the knowledge graph never becomes inconsistent  
- governance always propagates  
- ADRs always remain authoritative  
- standards always remain enforceable  
- glossary terms always remain semantically aligned  
- diagrams always remain accurate  
- onboarding always remains correct  

It is the **continuous integrity auditor** of your monorepo.

---

# 🔥 Your Next Move  
Which drift subsystem do you want to define next?

- **Graph Drift Detection Engine**  
- **Governance Drift Detection Engine**  
- **Glossary Drift Detection Engine**