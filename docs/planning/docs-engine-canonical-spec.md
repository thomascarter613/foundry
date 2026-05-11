---
title: "Docs Engine Canonical Spec"
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
  - "Documentation Engine"
---

docs-engine-canonical-spec.md
Thomas — here is the **canonical, governance‑grade, institutionally complete specification** for the **Docs Agent**, the second specialist agent in your governed multi‑agent architecture. This is the **final, authoritative version**, integrating everything you’ve already established across governance, scaffolding, drift detection, graph semantics, and deterministic artifact generation.

This specification is written as if it will be **implemented**, **versioned**, and **governed** as a real institutional agent.

Guided Links are embedded throughout so you can drill deeper into any subsystem.

---

# 🏛️ **Docs Agent — Canonical Specification**  
**The deterministic, governance‑encoded, artifact‑producing documentation agent responsible for generating, updating, validating, and integrating documentation artifacts across the entire monorepo.**

The Docs Agent is:

- **deterministic** — same inputs → same outputs  
- **governed** — obeys governance, ADRs, standards, glossary, directory rules  
- **non‑creative** — no hallucination, no invention  
- **structural** — generates documentation *structures*, not prose  
- **graph‑aware** — integrates with the documentation knowledge graph  
- **event‑driven** — reacts to documentation events  
- **ChangePlan‑based** — never writes files directly  
- **policy‑encoded** — all behavior is rule‑driven  
- **non‑interactive** — receives DelegationRequests, returns ChangePlanFragments  

It is the **documentation factory agent** of the monorepo.

---

# 🧩 1. Agent Inputs

The Docs Agent receives a **DelegationRequest** from the **Principal Engineer Agent**.

### DelegationRequest Fields
- `scope` — list of files, directories, or modules to document  
- `structuralMemory` — directory tree, file list, module metadata  
- `semanticMemory` — glossary, ADRs, governance rules, standards  
- `projectMetadata` — project‑level metadata  
- `templateMetadata` — documentation templates and rules  
- `policyContext` — governance mode, forbidden paths, allowed roots  
- `governanceMode` — strict | standard | experimental  
- `requiredOutputs` — what documentation artifacts must be produced  

The Docs Agent **never** infers scope.  
It only acts on the explicit DelegationRequest.

---

# 🧱 2. Agent Responsibilities

The Docs Agent is responsible for:

### 2.1 Documentation Artifact Generation
- module READMEs  
- directory READMEs  
- architecture summaries  
- API reference stubs  
- glossary usage blocks  
- ADR reference blocks  
- diagram reference blocks  
- lifecycle/standards references  
- onboarding references (if applicable)

### 2.2 Documentation Engine Updates
- updating sidebar/navigation  
- updating indexes (glossary, ADR, standards)  
- updating doc engine config  
- updating cross‑link metadata  

### 2.3 Documentation Graph Integration
- emitting GlossaryUsage edges  
- emitting ADRReference edges  
- emitting Governance edges  
- emitting DiagramFor edges  
- emitting Upstream/Downstream edges  

### 2.4 Drift Baseline Updates
- updating drift fingerprints  
- updating semantic baselines  
- updating structural baselines  

### 2.5 ChangePlanFragment Generation
The Docs Agent **never writes files**.  
It produces **ChangePlanFragments** consumed by the Principal Engineer Agent.

---

# 🧠 3. Agent Constraints (Hard Governance Rules)

The Docs Agent **must not**:

- modify application logic  
- modify business logic  
- modify code files except documentation comments  
- introduce new dependencies  
- modify non‑documentation directories  
- hallucinate APIs, behaviors, or architecture  
- bypass governance or policy rules  
- generate prose beyond governed templates  
- create new directories unless allowed by policy  
- modify ADRs  
- modify governance rules  
- modify standards  

The Docs Agent is a **documentation structural generator**, not a writer.

---

# 🧬 4. Agent Reasoning Pipeline (Deterministic 6‑Phase Model)

The Docs Agent uses a strict, deterministic pipeline:

### **Phase 1 — Scope Analysis**
- identify modules requiring documentation  
- identify missing documentation artifacts  
- identify required updates  
- identify glossary/ADR/governance/diagram references  

### **Phase 2 — Documentation Strategy Resolution**
- resolve template lineage  
- resolve documentation type  
- resolve required sections  
- resolve glossary/ADR/governance injection rules  
- resolve directory placement  

### **Phase 3 — Documentation Artifact Synthesis**
- generate documentation structures  
- generate metadata blocks  
- generate reference blocks  
- generate TODO markers for human prose  
- generate navigation/index updates  

### **Phase 4 — Documentation File Generation**
- produce file creation/modification instructions  
- produce deterministic content blocks  
- produce metadata updates  

### **Phase 5 — Documentation Engine Updates**
- update sidebar/navigation  
- update indexes  
- update doc engine config  
- update graph metadata  

### **Phase 6 — Fragment Assembly**
- assemble ChangePlanFragments  
- validate fragments  
- return fragments to Principal Engineer Agent  

This pipeline is **pure**, **deterministic**, and **governed**.

---

# 📦 5. Documentation Artifacts (Governed Outputs)

The Docs Agent produces:

### 5.1 Module README
Includes:
- purpose  
- directory structure  
- API surface summary  
- ADR references  
- glossary terms  
- governance links  
- diagrams  
- lifecycle rules  
- standards references  

### 5.2 Directory README
Includes:
- purpose  
- contents  
- glossary terms  
- governance links  

### 5.3 Architecture Summary
Includes:
- module role  
- upstream/downstream relationships  
- ADR lineage  
- glossary terms  
- diagrams  

### 5.4 API Reference Stub
Includes:
- endpoint list  
- schema list  
- glossary terms  
- ADR references  

### 5.5 Navigation & Index Updates
- sidebar updates  
- glossary index updates  
- ADR index updates  
- standards index updates  

---

# 🔗 6. Knowledge Graph Integration

The Docs Agent emits graph edges:

- **GlossaryUsage**  
- **ADRReference**  
- **GovernanceReference**  
- **DiagramFor**  
- **Upstream/Downstream**  
- **DocumentContains**  

It also updates:

- node metadata  
- semantic fingerprints  
- drift baselines  

---

# 🧪 7. Governance Modes

### **Strict Mode**
- no structural changes allowed  
- no new files allowed  
- no template deviations  
- no missing metadata tolerated  

### **Standard Mode**
- structural changes allowed with ADR justification  
- new files allowed if governed  
- template deviations allowed with warnings  

### **Experimental Mode**
- structural changes allowed  
- template deviations allowed  
- warnings emitted  

The Docs Agent must obey the governance mode in the DelegationRequest.

---

# 🏗️ 8. ChangePlanFragment Schema

The Docs Agent returns:

```
ChangePlanFragment:
  id: string
  description: string
  actions:
    - createFile
    - modifyFile
    - deleteFile
    - insertBlock
    - replaceBlock
    - appendBlock
  metadata:
    glossaryTerms: [...]
    adrReferences: [...]
    governanceLinks: [...]
    diagrams: [...]
    driftFingerprint: ...
```

Fragments are:

- deterministic  
- reversible  
- auditable  
- diff‑friendly  

---

# 🧠 Non‑Obvious Insight

The Docs Agent is not a writer.  
It is a **documentation structural generator**, a **graph integrator**, and a **governance enforcer**.

It ensures:

- documentation is complete  
- documentation is consistent  
- documentation is governed  
- documentation is graph‑integrated  
- documentation is drift‑resistant  
- documentation is deterministic  
- documentation is upgradeable  

It is the **documentation backbone agent** of the monorepo.

---

# 🔥 Your Next Move  
Which part of the Docs Agent do you want to define next?

- **DelegationRequest Schema**  
- **Documentation Strategy Engine**  
- **Documentation Artifact Synthesis**  
- **Docs Agent ChangePlan Model**