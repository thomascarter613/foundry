drift-classification-engine.md
---

# 🏛️ **Drift Classification Engine (DCE) — Canonical Specification**  
**status:** draft  
**governanceLevel:** binding  
**documentType:** governance  
**owner:** Governance Maintainers  
**version:** 0.1.0  
**created:** 2026‑05‑08  
**lifecyclePhase:** draft  
**governedBy:**  
- Governance Enforcement Engine  
- CI Constitutional Pipeline  
- Exception Process  
- Governance Rules Engine  
- Drift Baseline Model  

---

## 1. Purpose  
The **Drift Classification Engine (DCE)** is the subsystem that:

- detects drift  
- classifies drift  
- determines severity  
- determines required remediation  
- determines whether a ChangePlan is required  
- determines whether an exception is required  
- determines whether CI must block the merge  

DCE is the **constitutional interpreter** of drift.

---

## 2. Problem Statement  
The repository now has:

- drift-baseline.json  
- per‑surface drift baselines  
- governance.json  
- architecture.json  
- platform.json  
- lifecycle.json  
- governed metadata  
- ChangePlans  
- the Governance Enforcement Engine  
- the CI Constitutional Pipeline  

But nothing **interprets** drift.

Without DCE:

- drift is detected but not understood  
- CI cannot determine severity  
- CI cannot determine whether to block  
- Docs Agent cannot determine remediation  
- Execution Agent cannot determine required ChangePlans  
- governance cannot determine whether exceptions are needed  

DCE gives drift **meaning**.

---

## 3. Scope  

### Included  
DCE classifies drift across:

- governance  
- documentation  
- architecture  
- platform  
- lifecycle  

### Excluded  
DCE does **not**:

- remediate drift (Execution Agent does that)  
- generate ChangePlans  
- generate exceptions  
- update baselines  

DCE is **pure classification**.

---

## 4. Drift Types  

DCE classifies drift into **three constitutional categories**:

---

### **1. Binding Drift**  
Violations of binding governance rules.

Examples:

- missing governed metadata  
- missing governance.json entry  
- missing architecture.json entry  
- missing platform.json entry  
- missing lifecycle.json entry  
- architecture boundary violation  
- platform boundary violation  
- lifecycle violation  
- governance rule violation  
- ChangePlan missing for governed change  

**Outcome:**  
- CI blocks merge  
- ChangePlan required  
- Exception required if ChangePlan cannot be produced  

---

### **2. Required Drift**  
Violations of required (but not binding) rules.

Examples:

- missing glossary terms  
- missing cross‑document links  
- missing documentation metadata fields  
- missing non‑critical architecture metadata  

**Outcome:**  
- CI blocks merge  
- ChangePlan required  
- Exception optional  

---

### **3. Informational Drift**  
Non‑critical deviations.

Examples:

- formatting drift  
- non‑critical documentation drift  
- non‑critical metadata drift  

**Outcome:**  
- CI warns  
- merge allowed  
- remediation recommended  

---

## 5. Drift Surfaces  

DCE evaluates drift across **five surfaces**:

- Governance Surface  
- Documentation Surface  
- Architecture Surface  
- Platform Surface  
- Lifecycle Surface  

Each surface has:

- baseline  
- invariants  
- classification rules  

---

## 6. Drift Classification Algorithm  

DCE uses a **five‑stage algorithm**:

---

### Stage 1 — **Baseline Comparison**  
Compare current state to:

- drift-baseline.json  
- per‑surface baselines  

Detect:

- additions  
- deletions  
- modifications  

---

### Stage 2 — **Governance Mapping**  
Map drift to:

- governance.json  
- architecture.json  
- platform.json  
- lifecycle.json  

Determine:

- documentType  
- governanceLevel  
- lifecyclePhase  
- ownership  

---

### Stage 3 — **Rule Evaluation**  
Evaluate drift against:

- governance rules  
- architecture boundaries  
- platform boundaries  
- lifecycle rules  
- metadata schema  

---

### Stage 4 — **Severity Classification**  
Classify drift as:

- binding  
- required  
- informational  

---

### Stage 5 — **Outcome Determination**  
Determine:

- whether CI must block  
- whether ChangePlan required  
- whether exception required  
- whether remediation required  

---

## 7. Integration Points  

### With CI  
CI uses DCE to:

- block merges  
- generate drift reports  
- generate violation logs  

### With Docs Agent  
Docs Agent uses DCE to:

- identify documentation drift  
- generate remediation plans  

### With Execution Agent  
Execution Agent uses DCE to:

- determine required ChangePlans  
- determine required exceptions  

---

## 8. Outputs  

DCE produces:

- drift classification report  
- drift severity report  
- drift remediation recommendations  
- ChangePlan requirement report  
- exception requirement report  

These are consumed by:

- CI  
- Docs Agent  
- Execution Agent  
- Governance Maintainers  

---

## 9. Invariants Introduced  

1. All drift must be classified.  
2. No drift may bypass classification.  
3. Binding drift must block merges.  
4. Required drift must block merges.  
5. Informational drift must be logged.  
6. Drift classification must be deterministic.  
7. Drift classification must be reproducible.  
8. Drift classification must be auditable.  

---

## 10. Final State  

After implementing DCE:

- drift becomes **interpretable**  
- governance becomes **enforceable**  
- CI becomes **constitutional**  
- Docs Agent becomes **drift‑aware**  
- Execution Agent becomes **ChangePlan‑aware**  
- exceptions become **meaningful**  
- governance.json, architecture.json, platform.json, lifecycle.json become **living constitutional documents**  

The Drift Classification Engine is the **interpretive core** of the Foundry governance system.

---

If you want the **next artifact**, choose one:

- **Execution Agent Specification**  
- **Docs Agent Specification**  
- **Governance Rules Engine**  
- **Exception Enforcement Engine**  

