---
title: "Governance Compliance Validator"
status: "Draft"
owner: "Product Architecture"
lastUpdated: "2026-05-08"
governanceLevel: "Binding"
documentType: "Planning"
upstream:
  - "docs/planning/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks:
  - "docs/architecture/adr/0004-ci-governance.md"
glossaryTerms:
  - "Planning"
  - "Governance"
  - "Compliance"
  - "Validator"
---

governance-compliance-validator.md
Below is the **complete, governed, canonical specification** for the **Governance Compliance Validator** — the subsystem that ensures *every document, every dependency, every rule, every ADR, every glossary term, every diagram, and every structural element* complies with the **governance model** of the monorepo.

If the **Directory Structure Validator** enforces *where things live*, and the **Cross‑Link Graph Validator** enforces *how things relate*, the **Governance Compliance Validator** enforces *what rules apply* and *whether authority flows correctly*.

This validator is the **constitutional enforcement engine** of the entire documentation system.

Guided Links are embedded so you can expand any subsystem.

---

# 🏛️ Governance Compliance Validator  
**The subsystem that enforces governance rules, authority flows, approval requirements, and compliance with Binding/Required/Informational governance levels.**

This validator ensures:

- governance rules are followed  
- governance documents are authoritative  
- governance changes propagate  
- approvals match governance level  
- authority flows are valid  
- no document bypasses governance  
- governance drift is impossible  
- governance links are correct  
- governance metadata is correct  
- governance documents themselves are governed  

It is the **governance backbone** of the living documentation system.

---

# 🧩 1. Validator Architecture

The Governance Compliance Validator runs in four deterministic phases:

1. **Governance Metadata Validation**  
2. **Governance Link Validation**  
3. **Authority Flow Validation**  
4. **Governance Propagation Validation**

Each phase produces machine‑readable violations.

---

# 🧱 2. Governance Metadata Validation (Binding)

Every document must declare:

- `governanceLevel`  
- `owner`  
- `status`  
- `documentType`  

### Rules
- `governanceLevel` must be one of:  
  - **Informational**  
  - **Required**  
  - **Binding**  
- `Binding` documents must live under `docs/governance/` unless explicitly allowed (e.g., glossary).  
- `Required` documents must have domain owner approval.  
- `Binding` documents must have governance approval.  
- `Draft` documents cannot be Binding.  

### Violations
- Missing governance level  
- Invalid governance level  
- Binding document outside governance directory  
- Draft Binding document  
- Missing owner  

---

# 🔗 3. Governance Link Validation (Binding)

Every document must include a **Governance Links** section.

### Rules
- Governance links must point only to governance documents.  
- Governance links must resolve to existing files.  
- Governance links must not be empty.  
- Governance links must not be circular.  
- Governance links must not contradict document type.  

### Violations
- Missing governance links  
- Broken governance links  
- Governance link to non‑governance document  
- Circular governance references  

---

# 🧭 4. Authority Flow Validation (Constitutional)

This is the **core** of the Governance Compliance Validator.

It ensures that **authority flows correctly** from governance → standards → architecture → lifecycle → platform → onboarding.

### Rules
- Governance documents must form a valid authority tree.  
- No document may bypass governance.  
- No document may reference a governance document that is downstream of itself.  
- No document may contradict a Binding governance rule.  
- Standards must inherit governance rules.  
- Architecture must inherit governance rules.  
- Lifecycle must inherit governance rules.  
- Platform must inherit governance rules.  

### Violations
- Authority flow inversion  
- Missing inherited governance rules  
- Document contradicts Binding rule  
- Document bypasses governance  

---

# 🔄 5. Governance Propagation Validation (Reactive)

When a governance document changes:

- downstream documents must be revalidated  
- downstream documents must update their governance links  
- downstream documents must update their content if rules changed  
- ADRs referencing governance rules must be revalidated  
- standards referencing governance rules must be revalidated  
- lifecycle rules must be revalidated  
- platform rules must be revalidated  

### Rules
- Governance changes must propagate downstream.  
- Downstream documents must not remain stale.  
- Drift detection must run.  

### Violations
- Stale downstream documents  
- Missing propagation  
- Drift detected but not resolved  

---

# 🧬 6. Governance Compliance Rules (Binding)

These rules enforce the governance model itself.

### Rules
- Governance documents cannot be deleted.  
- Governance documents cannot be renamed.  
- Governance documents cannot be modified without versioning.  
- Governance documents cannot be downgraded in governance level.  
- Governance documents must be Binding or Required.  
- Governance documents must not depend on non‑governance documents.  

### Violations
- Unauthorized governance modification  
- Governance downgrade  
- Governance deletion  
- Governance dependency on non‑governance document  

---

# 🧠 7. Cross‑Domain Governance Rules

### Architecture
- Must reference governance charter.  
- Must comply with governance constraints.  
- Must not contradict governance rules.  

### Standards
- Must reference documentation governance.  
- Must enforce governance rules.  

### Lifecycle
- Must reference CI governance.  
- Must enforce governance gates.  

### Platform
- Must reference repository contract.  
- Must enforce governance constraints.  

### Onboarding
- Must reference governance quickref.  

### Violations
- Missing governance references  
- Contradictory rules  
- Missing enforcement  

---

# 🧪 8. Validator Output

The validator produces:

- governance metadata violations  
- governance link violations  
- authority flow violations  
- propagation violations  
- drift violations  
- governance immutability violations  
- governance dependency violations  

Output is machine‑readable and consumed by CI.

---

# 🧠 Non‑Obvious Insight

The Governance Compliance Validator is not about checking links.  
It is about **institutional integrity**.

It ensures:

- governance is authoritative  
- governance is immutable  
- governance is enforced  
- governance propagates  
- governance defines authority  
- governance defines constraints  
- governance defines lifecycle  
- governance defines the entire documentation system  

Without it, governance becomes a suggestion.  
With it, governance becomes **law**.

---

# 🔥 Your Next Move  
Which governance subsystem do you want to define next?

- **Authority Map**  
- **Repository Contract**  
- **Governance Links**  
- **Governance Drift Detection Engine**