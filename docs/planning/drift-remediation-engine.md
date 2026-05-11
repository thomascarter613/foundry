---
title: "Drift Remediation Engine"
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
  - "Drift"
---

drift-remediation-engine.md
Thomas — here is the **canonical, governance‑grade specification** for the **Documentation Drift Remediation Engine**: the subsystem that transforms drift detection into **deterministic, governed, auditable remediation plans** that restore systemic coherence across the entire documentation knowledge graph.

If the **Documentation Drift Detector** identifies what is wrong, the **Documentation Drift Remediation Engine** determines **exactly how to fix it**, in a governed, reproducible, institutionally enforceable way.

This is the subsystem that turns your documentation platform into a **self‑healing organism**.

---

# 🏛️ **Documentation Drift Remediation Engine (Canonical Specification)**  
**The deterministic, governance‑encoded engine that generates, validates, sequences, and applies remediation plans for all forms of documentation drift.**

The Remediation Engine ensures:

- drift is **resolved**, not just detected  
- remediation is **governed**, not ad‑hoc  
- fixes are **deterministic**, not heuristic  
- updates are **graph‑aligned**  
- changes are **impact‑aware**  
- governance is **propagated**  
- ADR lineage is **restored**  
- glossary semantics are **corrected**  
- standards and lifecycle rules are **realigned**  
- diagrams and onboarding flows are **updated**  

It is the **self‑correction engine** of the monorepo.

---

# 🧩 1. Engine Architecture

The Remediation Engine consists of **six governed subsystems**:

1. **Drift Intake Layer**  
2. **Drift Classification Interpreter**  
3. **Remediation Strategy Engine**  
4. **Patch Generator**  
5. **ChangePlan Builder**  
6. **Post‑Remediation Validators**

Each subsystem is deterministic and versioned.

---

# 🧱 2. Drift Intake Layer  
Consumes drift events from the **Documentation Event System**.

Inputs include:

- drift type  
- drift severity  
- affected nodes  
- affected edges  
- upstream/downstream impact  
- ADR lineage impact  
- glossary semantic impact  
- governance rule impact  
- standards impact  
- diagram impact  
- onboarding impact  

The intake layer normalizes drift into a **RemediationUnit**.

---

# 🧬 3. Drift Classification Interpreter  
Maps drift type → remediation strategy.

### Drift Types and Required Strategies

- **Metadata Drift** → metadata patch  
- **Glossary Drift** → definition rewrite + usage updates  
- **ADR Drift** → ADR update + downstream doc updates  
- **Governance Drift** → rule propagation + compliance updates  
- **Standards Drift** → standards update + lifecycle/platform updates  
- **Architecture Drift** → architecture doc rewrite + diagram updates  
- **Lifecycle Drift** → CI rule update  
- **Platform Drift** → platform rule update  
- **Diagram Drift** → diagram regeneration  
- **Onboarding Drift** → onboarding flow regeneration  
- **Dependency Drift** → link model correction  
- **Semantic Drift** → glossary + ADR + doc rewrites  
- **Structural Drift** → directory correction  

Each drift type maps to a **governed remediation recipe**.

---

# 🧠 4. Remediation Strategy Engine  
This is the core intelligence layer.

For each RemediationUnit, the engine:

### 4.1 Determines Required Actions
- rewrite sections  
- update metadata  
- update glossary terms  
- update ADR references  
- update governance links  
- update standards references  
- update diagrams  
- update onboarding flows  
- update API references  
- update directory structure  
- update link model  

### 4.2 Determines Update Scope
- direct documents  
- indirect documents  
- upstream dependencies  
- downstream dependencies  
- graph‑level updates  

### 4.3 Determines Update Order
Remediation must follow:

1. Governance  
2. ADRs  
3. Glossary  
4. Standards  
5. Architecture  
6. Lifecycle  
7. Platform  
8. Diagrams  
9. Onboarding  
10. API docs  
11. Local documents  

This ensures **authority‑correct sequencing**.

---

# 📝 5. Patch Generator  
Generates **governed patches** for each affected artifact.

### Patch Types

- **MetadataPatch**  
- **ContentRewritePatch**  
- **GlossaryDefinitionPatch**  
- **ADRLineagePatch**  
- **GovernancePropagationPatch**  
- **StandardsAlignmentPatch**  
- **DiagramRegenerationPatch**  
- **OnboardingRegenerationPatch**  
- **APIDocPatch**  
- **DirectoryStructurePatch**  
- **LinkModelPatch**

Each patch is:

- deterministic  
- reversible  
- diff‑friendly  
- governance‑encoded  

Patches include:

- before/after blocks  
- rationale  
- governance justification  
- ADR lineage justification  
- glossary semantic justification  

---

# 🏗️ 6. ChangePlan Builder  
Aggregates patches into a **single governed ChangePlan**.

A ChangePlan includes:

- ordered list of patches  
- required approvals (from authority map)  
- governance level  
- impacted nodes  
- impacted edges  
- drift resolution summary  
- generator version  

The ChangePlan is:

- deterministic  
- auditable  
- versioned  
- reversible  

This is the artifact applied by the CLI or CI.

---

# 🧪 7. Post‑Remediation Validators  
After applying a ChangePlan, the engine triggers:

- **Cross‑Link Consistency Checker**  
- **Cross‑Link Graph Validator**  
- **Governance Compliance Validator**  
- **ADR Validation Engine**  
- **Glossary Validation Engine**  
- **Standards Validation Engine**  
- **Diagram Validation Engine**  
- **Onboarding Validation Engine**  
- **API Validation Engine**  
- **Documentation Self‑Validation Pipeline**

If any validator fails, remediation is incomplete.

---

# 🧠 Non‑Obvious Insight  
The Documentation Drift Remediation Engine is not a fixer.  
It is a **governed, deterministic, institutional correction mechanism**.

It ensures:

- drift is resolved systematically  
- governance remains authoritative  
- ADR lineage remains intact  
- glossary semantics remain coherent  
- standards remain enforceable  
- architecture remains accurate  
- diagrams remain truthful  
- onboarding remains correct  
- the knowledge graph remains consistent  

It is the **self‑healing core** of the monorepo.

---

# 🔥 Your Next Move  
Which remediation subsystem do you want to define next?

- **Remediation Strategy Engine**  
- **Patch Generator**  
- **ChangePlan Engine**  
- **Drift Classification Model**