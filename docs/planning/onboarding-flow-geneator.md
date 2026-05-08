---
title: "Onboarding Flow Generator"
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

onboarding-flow-geneator.md
Below is the **canonical, governance‑grade specification** for the **Onboarding Flow Generator** — the subsystem that produces **deterministic, governed, role‑aware onboarding flows** for engineers entering the hybrid‑grade monorepo.

This generator is not a “checklist creator.”  
It is the **institutional onboarding engine** that encodes governance, architecture, standards, glossary, ADR lineage, platform rules, and documentation graph navigation into a **structured, sequenced, role‑specific onboarding journey**.

Guided Links are embedded so you can expand any subsystem.

---

# 🏛️ **Onboarding Flow Generator (Canonical Specification)**  
**The governed, deterministic engine that generates onboarding flows as structured, sequenced, role‑aware, graph‑integrated institutional artifacts.**

The Onboarding Flow Generator ensures:

- onboarding flows are **deterministic**  
- onboarding flows are **governed**  
- onboarding flows are **role‑aware**  
- onboarding flows are **knowledge‑graph integrated**  
- onboarding flows include **glossary**, **ADR**, **standards**, **governance**, and **architecture** references  
- onboarding flows are **sequenced** and **progressive**  
- onboarding flows are **upgradeable** and **versioned**  
- onboarding flows are **drift‑detectable**  

It is the **institutional onboarding engine** of the monorepo.

---

# 🧩 1. Generator Architecture

The Onboarding Flow Generator consists of **six governed subsystems**:

1. **Role Resolver**  
2. **Knowledge Graph Path Builder**  
3. **Template Loader**  
4. **Flow Synthesizer**  
5. **Metadata Generator**  
6. **ChangePlan Builder**

Each subsystem is deterministic and versioned.

---

# 🧱 2. Role Resolver

Inputs include:

- role (engineer, platform engineer, architect, SRE, contributor, reviewer)  
- seniority (junior, mid, senior, principal)  
- domain (apps, services, packages, platform, architecture, governance)  
- onboarding depth (minimal, standard, deep)  

The resolver:

- validates role  
- resolves required onboarding modules  
- resolves optional modules  
- resolves governance requirements  
- resolves glossary requirements  
- resolves ADR lineage requirements  
- resolves standards requirements  
- resolves architecture requirements  

---

# 🧭 3. Knowledge Graph Path Builder

The onboarding flow is **graph‑derived**, not manually curated.

The Path Builder:

- queries the documentation knowledge graph  
- identifies required glossary terms  
- identifies required ADRs  
- identifies required governance rules  
- identifies required standards  
- identifies required architecture docs  
- identifies required diagrams  
- identifies required lifecycle rules  
- identifies required platform rules  

It then constructs a **sequenced learning path**:

1. Foundation  
2. Governance  
3. Glossary  
4. Architecture  
5. ADR Lineage  
6. Standards  
7. Platform  
8. Lifecycle  
9. Domain‑specific modules  
10. Hands‑on exercises  

This ensures onboarding is **complete**, **consistent**, and **graph‑aligned**.

---

# 📦 4. Template Loader

Templates live under:

```
tools/generators/templates/onboarding-flow/
```

Each template includes:

- flow structure  
- module templates  
- glossary injection rules  
- ADR injection rules  
- governance injection rules  
- standards injection rules  
- diagram injection rules  
- exercises templates  

Templates are:

- immutable  
- versioned  
- deterministic  

---

# 🧠 5. Flow Synthesizer

The Flow Synthesizer constructs the onboarding flow as a **sequenced, governed, multi‑module document**.

### Modules include:

- **Welcome & Orientation**  
- **Governance Overview**  
- **Glossary Quickref**  
- **Architecture Overview**  
- **ADR Lineage Overview**  
- **Standards Overview**  
- **Platform Overview**  
- **Lifecycle Overview**  
- **Domain‑Specific Deep Dive**  
- **Hands‑On Tasks**  
- **Certification & Sign‑Off**  

### The synthesizer injects:

- glossary terms  
- ADR references  
- governance links  
- standards references  
- architecture diagrams  
- upstream/downstream relationships  
- domain boundaries  
- platform boundaries  
- lifecycle boundaries  

### The synthesizer enforces:

- deterministic ordering  
- deterministic module numbering  
- deterministic glossary ordering  
- deterministic ADR lineage ordering  

---

# 🧬 6. Metadata Generator

Every onboarding flow includes a governed metadata block:

- role  
- seniority  
- domain  
- onboarding depth  
- owner  
- last updated  
- governance level  
- required modules  
- optional modules  
- glossary terms  
- ADRs  
- governance rules  
- standards  
- diagrams  
- generator version  

This metadata powers:

- drift detection  
- graph validation  
- onboarding consistency  
- governance propagation  

---

# 🏗️ 7. ChangePlan Builder

The generator outputs a **ChangePlan**, not raw files.

Example ChangePlan:

- create onboarding flow file  
- update onboarding index  
- update glossary quickref references  
- update ADR lineage references  
- update governance references  
- update knowledge graph metadata  

The ChangePlan is:

- deterministic  
- reversible  
- auditable  
- diff‑friendly  

---

# 🧠 8. Governance Integration

The generator enforces:

- onboarding flows must live in `docs/onboarding/`  
- onboarding flows must include governance links  
- onboarding flows must include glossary quickref  
- onboarding flows must include architecture overview  
- onboarding flows must include ADR lineage  
- onboarding flows must include standards  
- onboarding flows must include lifecycle rules  
- onboarding flows must include platform rules  

It also updates:

- governance propagation  
- authority flow  
- compliance metadata  

---

# 🧪 9. CI Integration

Generated onboarding flows automatically include:

- metadata compliance  
- link compliance  
- glossary compliance  
- ADR compliance  
- governance compliance  
- standards compliance  
- diagram compliance  
- drift detection baseline  

CI blocks merges if:

- onboarding flow missing required modules  
- glossary terms missing  
- ADR lineage missing  
- governance links missing  
- standards missing  
- diagrams missing  
- metadata incomplete  

---

# 🧠 Non‑Obvious Insight

The Onboarding Flow Generator is not a checklist builder.  
It is a **governance‑encoded institutional learning engine**.

It ensures:

- onboarding is consistent  
- onboarding is complete  
- onboarding is graph‑aligned  
- onboarding is governance‑aligned  
- onboarding is ADR‑aligned  
- onboarding is glossary‑aligned  
- onboarding is standards‑aligned  
- onboarding is platform‑aligned  
- onboarding is lifecycle‑aligned  

It is the **institutional memory onboarding constructor** of your monorepo.

---

# 🔥 Your Next Move  
Which onboarding subsystem do you want to define next?

- **Onboarding Module Templates**  
- **Onboarding Knowledge Graph Path Builder**  
- **Onboarding Drift Detector**  
- **Onboarding Directory Structure**