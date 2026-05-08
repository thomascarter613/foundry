governance-rules.md

Thomas — here is the **canonical, governance‑grade, institutionally complete specification** for the **Documentation Governance Rules**: the binding, constitutional rule‑set that governs *every* documentation artifact, *every* documentation change, *every* Docs Agent action, and *every* CI enforcement step across the monorepo.

This is not a style guide.  
This is the **law** that documentation must obey.

Guided Links are embedded throughout so you can expand any subsystem.

---

# 🏛️ **Documentation Governance Rules (Canonical Specification)**  
**The binding, constitutional rule‑set that defines structure, metadata, lifecycle, authority, enforcement, and invariants for all documentation artifacts in the monorepo.**

The Documentation Governance Rules ensure:

- documentation is **deterministic**, not creative  
- structure is **governed**, not optional  
- metadata is **mandatory**, not advisory  
- lifecycle is **enforced**, not suggestive  
- drift is **illegal**, not tolerated  
- Docs Agent is **bound**, not autonomous  
- CI is **constitutional**, not procedural  

These rules are the **supreme law** of the documentation system.

---

# 🧩 1. Rule Categories

Documentation Governance Rules are divided into **seven binding categories**:

1. **Structural Rules**  
2. **Metadata Rules**  
3. **Reference Rules**  
4. **Directory Rules**  
5. **Lifecycle Rules**  
6. **Authority & Approval Rules**  
7. **Enforcement Rules**

Each category is binding and versioned.

---

# 🧱 2. Structural Rules  
Define the **shape** and **required sections** of every governed document.

### Required Sections (for governed docs)
- Title  
- Summary  
- Purpose  
- Scope  
- Required Metadata Block  
- Glossary Usage  
- ADR References  
- Governance Links  
- Diagrams (if applicable)  
- Change History  

### Structural Invariants
- all governed documents must follow their template  
- no governed document may omit required sections  
- no governed document may reorder required sections  
- no governed document may introduce ungoverned sections  
- all documents must be deterministic in formatting  

### Structural Violations
- missing required section  
- incorrect section order  
- ungoverned section  
- structural drift  

Structural rules are enforced by the **Docs Agent** and CI.

---

# 🧾 3. Metadata Rules  
Define the **mandatory metadata block** for all governed documents.

### Required Metadata Fields
- `governanceLevel` (binding | required | informational)  
- `documentType` (standard, architecture, ADR, glossary, platform, lifecycle, etc.)  
- `owner`  
- `status` (draft, proposed, approved, active, deprecated, retired)  
- `version`  
- `lastUpdated`  
- `governedBy` (list of governance rules)  
- `adrReferences`  
- `glossaryTerms`  
- `lifecyclePhase`  

### Metadata Invariants
- metadata must appear at the top of the file  
- metadata must be valid YAML or JSON5  
- metadata must match the document’s directory and type  
- metadata must be updated on every governed change  

Metadata rules are enforced by the **Metadata Sentinel** and CI.

---

# 🔗 4. Reference Rules  
Define how documents must reference glossary terms, ADRs, governance rules, diagrams, and architecture.

### Glossary Rules
- all glossary terms must be linked  
- glossary terms must match canonical definitions  
- glossary misuse is semantic drift  

### ADR Rules
- all architectural decisions must reference ADRs  
- ADR references must be correct and current  
- superseded ADRs must not be referenced  

### Governance Rules
- all governed documents must reference the rules that govern them  
- governance links must be valid and resolvable  

### Diagram Rules
- diagrams must reference the architecture nodes they depict  
- diagrams must be versioned and governed  

Reference rules are enforced by the **Graph Consistency Monitor**.

---

# 🗂️ 5. Directory Rules  
Define where documentation must live and what each directory may contain.

### Governed Directories
- `docs/`  
- `docs/governance/`  
- `docs/architecture/`  
- `docs/standards/`  
- `docs/lifecycle/`  
- `docs/platform/`  
- `docs/glossary/`  
- `docs/adr/`  

### Directory Invariants
- no governance documents outside `docs/governance/`  
- no ADRs outside `docs/adr/`  
- no standards outside `docs/standards/`  
- no lifecycle docs outside `docs/lifecycle/`  
- no platform docs outside `docs/platform/`  
- no ungoverned directories may be added  

Directory rules are enforced by the **Directory Structure Sentinel**.

---

# 🔄 6. Lifecycle Rules  
Define the lifecycle of documentation artifacts.

### Lifecycle Phases
- Draft  
- Proposed  
- Approved  
- Active  
- Deprecated  
- Retired  

### Lifecycle Invariants
- no document may skip phases  
- no document may move phases without required approvals  
- deprecated documents must include deprecation metadata  
- retired documents must be archived, not deleted  

Lifecycle rules integrate with the **Lifecycle Integration Layer**.

---

# 🧑‍⚖️ 7. Authority & Approval Rules  
Define who may create, modify, approve, or retire documentation.

### Authority Rules
- document owners must be defined  
- domain stewards must approve domain docs  
- governance maintainers must approve governance docs  
- platform stewards must approve platform docs  
- architecture stewards must approve architecture docs  

### Approval Rules
- all governed changes require ChangePlans  
- all ChangePlans require MustApprove signatures  
- CI must validate approvals before merge  

Authority rules integrate with the **Authority Map**.

---

# 🛡️ 8. Enforcement Rules  
Define how documentation governance is enforced.

### Enforcement Mechanisms
- Docs Agent  
- Execution Agent  
- CI Constitutional Pipeline  
- Drift Detection Engine  
- Governance Enforcement Engine  
- Background Daemon  

### Enforcement Invariants
- no governed document may be modified directly  
- all changes must be ChangePlan‑based  
- all changes must be drift‑checked  
- all changes must be validated by CI  
- all changes must be executed by the Execution Agent  

Violations block merges and trigger remediation.

---

# 🧬 9. Drift Rules  
Define how documentation drift is detected and classified.

### Drift Types
- structural drift  
- metadata drift  
- glossary drift  
- ADR drift  
- governance drift  
- semantic drift  
- directory drift  
- lifecycle drift  

### Drift Severity
- Binding Drift → merge blocked  
- Required Drift → merge blocked  
- Informational Drift → warning  

Drift rules integrate with the **Drift Classification Model**.

---

# 🧠 Non‑Obvious Insight  
Documentation Governance Rules are not guidelines.  
They are the **constitutional law** that:

- binds the Docs Agent  
- binds contributors  
- binds CI  
- binds the Execution Agent  
- binds the architecture model  
- binds the platform  
- binds the lifecycle  
- binds the entire monorepo  

They ensure documentation is **governed**, **deterministic**, **drift‑resistant**, **graph‑integrated**, and **institutionally enforceable**.

---

# 🔥 Your Next Move  
Which governed subsystem do you want to define next?

- **Governed Directory Structure**  
- **Drift Classification Model**  
- **Governance Enforcement Engine**  
- **Documentation Templates**