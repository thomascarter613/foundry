---
title: "Exception Process"
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

exception-process.md

Thomas — here is the **canonical, governance‑grade, institutionally complete specification** for the **Exception Process**: the formal, constitutional mechanism that allows *temporary, explicit, auditable, time‑boxed deviations* from governance rules, standards, architecture boundaries, lifecycle rules, platform rules, and documentation requirements.

This is not “ignore the rules for now.”  
This is the **governed, logged, justified, reversible, and CI‑enforced exception system** that prevents entropy while enabling controlled flexibility.

Guided Links are embedded throughout so you can expand any subsystem.

---

# 🏛️ **Exception Process (Canonical Specification)**  
**The deterministic, auditable, time‑boxed, justification‑required mechanism for temporarily overriding governance rules under strict institutional controls.**

The Exception Process ensures:

- exceptions are **explicit**, not implicit  
- exceptions are **temporary**, not permanent  
- exceptions are **governed**, not discretionary  
- exceptions are **auditable**, not invisible  
- exceptions are **time‑boxed**, not open‑ended  
- exceptions are **justified**, not arbitrary  
- exceptions are **reviewed**, not forgotten  
- exceptions are **revoked**, not accumulated  

It is the **constitutional safety valve** of the monorepo.

---

# 🧩 1. Exception Process Architecture

The Exception Process consists of **six governed subsystems**:

1. **Exception Request Specification**  
2. **Exception Classification Model**  
3. **Exception Approval Workflow**  
4. **Exception Recording & Storage**  
5. **Exception Enforcement Engine**  
6. **Exception Expiry & Revocation Engine**

Each subsystem is deterministic, versioned, and governance‑encoded.

---

# 📝 2. Exception Request Specification  
Every exception begins with a **formal Exception Request**.

### Required Fields
- `id` (unique, deterministic)  
- `requestedBy`  
- `requestedAt`  
- `ruleViolated`  
- `artifact` (file, directory, service, domain, platform module, standard, ADR, etc.)  
- `justification` (explicit, non‑generic)  
- `riskAssessment`  
- `impactAssessment`  
- `proposedExpiry`  
- `requiredApprovals`  
- `governanceLevel` (binding | required | informational)  

### Invariants
- no exception may be created without a justification  
- no exception may be created without a proposed expiry  
- no exception may be created without a risk assessment  

Exception Requests are generated as governed documents and ChangePlans.

---

# 🧬 3. Exception Classification Model  
Exceptions are classified into **three constitutional categories**:

### **1. Binding Exceptions**  
Violations of binding governance rules.  
Examples:  
- architecture boundary violation  
- platform boundary violation  
- missing ADR for breaking change  
- missing required metadata  

**Requires:**  
- PSG approval  
- ADR  
- strict expiry  
- CI enforcement  

### **2. Required Exceptions**  
Violations of required (but not binding) rules.  
Examples:  
- missing glossary usage  
- incomplete documentation section  
- missing diagram  

**Requires:**  
- domain steward approval  
- time‑boxed expiry  

### **3. Informational Exceptions**  
Violations of informational rules.  
Examples:  
- formatting deviations  
- non‑critical metadata drift  

**Requires:**  
- owner approval  
- optional expiry  

Classification is enforced by the **Drift Classification Model**.

---

# 🧑‍⚖️ 4. Exception Approval Workflow  
Approval is encoded in the **Authority Map**.

### Approval Chain
- Binding → PSG + Governance Maintainers  
- Required → Domain/Platform/Architecture Stewards  
- Informational → Artifact Owner  

### Approval Invariants
- no exception may be approved by its requester  
- no exception may be self‑approved by an agent  
- all approvals must be recorded  
- CI must validate approvals before merge  

### Escalation
If an approver rejects the exception, it escalates via:

- `EscalatesTo` edges in the Authority Map  
- up to PSG if necessary  

Approval is **graph‑encoded**, not procedural.

---

# 📚 5. Exception Recording & Storage  
All exceptions are stored in:

```
/governance/exceptions/exceptions.yml
```

### Required Fields in Storage
- `id`  
- `project`  
- `ruleViolated`  
- `justification`  
- `approvedBy`  
- `createdAt`  
- `expiresAt`  
- `status` (active | expired | revoked)  

### Storage Invariants
- exceptions must be version‑controlled  
- exceptions must be immutable once approved  
- exceptions must be auditable  
- exceptions must be queryable by CI and Docs Agent  

This file is the **ledger of constitutional deviations**.

---

# 🛡️ 6. Exception Enforcement Engine  
The enforcement engine ensures exceptions are:

- honored when valid  
- rejected when invalid  
- expired when time‑boxed  
- revoked when governance changes  

### Responsibilities
- validate exception applicability  
- validate exception expiry  
- validate exception scope  
- validate exception classification  
- validate exception approvals  
- validate exception does not violate higher‑order rules  

### Enforcement Invariants
- exceptions cannot override the Charter  
- exceptions cannot override constitutional invariants  
- exceptions cannot override authority model  
- exceptions cannot override lifecycle transitions  

Exceptions are **subordinate** to governance.

---

# ⏳ 7. Exception Expiry & Revocation Engine  
Exceptions must **expire** or be **revoked**.

### Expiry Rules
- binding exceptions must expire within a strict window  
- required exceptions must expire within a reasonable window  
- informational exceptions may have flexible expiry  

### Revocation Rules
- governance rule changes may revoke exceptions  
- ADR supersession may revoke exceptions  
- architecture changes may revoke exceptions  
- platform changes may revoke exceptions  

### Automatic Revocation
CI revokes exceptions when:

- expiry date passes  
- rule is no longer violated  
- artifact is removed  
- artifact is refactored  

Expired exceptions become **invalid** and block merges if still referenced.

---

# 🧪 8. CI Integration  
CI is the **constitutional enforcement arm** of the exception system.

### CI Responsibilities
- validate exception existence  
- validate exception approvals  
- validate exception expiry  
- validate exception classification  
- validate exception scope  
- validate exception does not violate higher‑order rules  

### CI Blocks Merge If:
- exception missing  
- exception expired  
- exception unapproved  
- exception misclassified  
- exception violates governance  
- exception violates lifecycle  
- exception violates platform/architecture boundaries  

CI ensures exceptions cannot be abused.

---

# 🧠 Non‑Obvious Insight  
The Exception Process is not a loophole.  
It is a **constitutional mechanism** that:

- prevents entropy  
- prevents silent rule‑breaking  
- prevents governance erosion  
- prevents undocumented deviations  
- prevents long‑term drift accumulation  

It ensures the monorepo remains **governed**, **deterministic**, **auditable**, and **institutionally safe**, even when temporary deviations are necessary.

---

# 🔥 Your Next Move  
Which subsystem of the Exception Process do you want to define next?

- **Exception Classification Model**  
- **Exception Approval Workflow**  
- **Exception Enforcement Engine**  
- **Exception Expiry & Revocation Engine**