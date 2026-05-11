---
title: "CI Constitutional Pipeline"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-08"
governanceLevel: "Binding"
documentType: "ChangePlan"
upstream:
  - "docs/changeplans/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks:
  - "docs/architecture/adr/0004-ci-governance.md"
glossaryTerms:
  - "ChangePlan"
  - "Lifecycle"
  - "CI"
  - "Pipeline"
---

ci-constitutional-pipeline.md
---

# 🏛️ **CI Constitutional Pipeline — Canonical Specification**  
**status:** draft  
**governanceLevel:** binding  
**documentType:** governance  
**owner:** Governance Maintainers  
**version:** 0.1.0  
**created:** 2026‑05‑08  
**lifecyclePhase:** draft  
**governedBy:**  
- Governance Charter  
- Repository Contract  
- Governance Enforcement Engine  
- Versioning Strategy  
- Exception Process  

---

## 1. Purpose  
The **CI Constitutional Pipeline** is the **enforcement arm of the Governance Enforcement Engine (GEE)**.  
It ensures that:

- governance rules are **binding**  
- drift is **illegal**  
- ChangePlans are **mandatory**  
- metadata is **required**  
- architecture boundaries are **enforced**  
- platform boundaries are **enforced**  
- lifecycle transitions are **validated**  
- governance.json is **authoritative**  
- drift-baseline.json is **authoritative**  

This pipeline is the **constitutional CI layer** of the Foundry monorepo.

---

## 2. Problem Statement  
The repository now contains:

- governed metadata  
- governance.json  
- architecture.json  
- platform.json  
- lifecycle.json  
- drift-baseline.json  
- ChangePlans  
- drift baselines  
- the Governance Enforcement Engine  

But nothing in CI **executes** these rules.

Without the CI Constitutional Pipeline:

- governance is not enforced  
- drift is not detected  
- ChangePlans are optional  
- metadata can be missing  
- boundaries can be violated  
- lifecycle can be skipped  
- governance.json can drift  
- architecture.json can drift  
- platform.json can drift  
- drift-baseline.json can drift  

The CI Constitutional Pipeline activates the entire governance system.

---

## 3. Scope  

### Included  
The pipeline enforces:

- Governance Rules  
- Governed Metadata  
- ChangePlan Requirements  
- Drift Detection  
- Architecture Boundaries  
- Platform Boundaries  
- Lifecycle Transitions  
- Versioning Strategy  

### Excluded  
- executing ChangePlans (Execution Agent does that)  
- generating documentation (Docs Agent does that)  
- generating code or templates  

---

## 4. Pipeline Architecture  

The CI Constitutional Pipeline consists of **five constitutional gates**:

---

### Gate 1 — **Structural Governance Gate**  
Validates:

- governed directory structure  
- no ungoverned directories  
- no governed file deleted without ChangePlan  
- no new governed file added without metadata  

Fails if:

- structure violates governance.json  
- structure violates repository contract  

---

### Gate 2 — **Metadata Gate**  
Validates:

- governed header block exists  
- metadata matches schema  
- metadata matches governance.json  
- metadata matches lifecycle.json  
- metadata matches architecture.json  
- metadata matches platform.json  

Fails if:

- any metadata field is missing  
- metadata is inconsistent  
- metadata violates schema  

---

### Gate 3 — **ChangePlan Gate**  
Validates:

- governed changes require a ChangePlan  
- ChangePlan metadata is valid  
- ChangePlan approvals are valid  
- ChangePlan lineage is valid  
- ChangePlan is recorded in index.json  

Fails if:

- governed change without ChangePlan  
- ChangePlan missing approvals  
- ChangePlan missing lineage  

---

### Gate 4 — **Drift Gate**  
Validates:

- drift-baseline.json is authoritative  
- per-surface drift baselines are authoritative  
- drift is classified  
- drift is allowed only if covered by exception  

Fails if:

- binding drift  
- required drift  
- expired exception  
- missing exception  

---

### Gate 5 — **Boundary Gate**  
Validates:

- architecture boundaries  
- platform boundaries  
- lifecycle transitions  
- governance rules  

Fails if:

- architecture violation  
- platform violation  
- lifecycle violation  
- governance rule violation  

---

## 5. Pipeline Execution Flow  

1. **Checkout**  
2. **Install toolchain**  
3. **Run Governance Enforcement Engine**  
4. **Run Structural Gate**  
5. **Run Metadata Gate**  
6. **Run ChangePlan Gate**  
7. **Run Drift Gate**  
8. **Run Boundary Gate**  
9. **Publish enforcement logs**  
10. **Block or allow merge**  

---

## 6. Outputs  

The pipeline produces:

- governance violation reports  
- drift reports  
- ChangePlan requirement reports  
- boundary violation reports  
- metadata violation reports  
- lifecycle violation reports  
- architecture violation reports  
- platform violation reports  

These are consumed by:

- Docs Agent  
- Execution Agent  
- Governance Maintainers  

---

## 7. Invariants Introduced  

1. No merge may occur without passing all constitutional gates.  
2. No governed artifact may change without a ChangePlan.  
3. No drift may exist without classification.  
4. No metadata may be missing.  
5. No governance rule may be violated.  
6. No architecture boundary may be violated.  
7. No platform boundary may be violated.  
8. No lifecycle transition may be skipped.  
9. governance.json must always be consistent.  
10. drift-baseline.json must always be consistent.  

---

## 8. Final State  

After implementing the CI Constitutional Pipeline:

- governance becomes **active law**  
- drift becomes **detectable and enforceable**  
- ChangePlans become **mandatory**  
- metadata becomes **required**  
- architecture becomes **enforceable**  
- platform becomes **enforceable**  
- lifecycle becomes **enforceable**  
- CI becomes a **constitutional enforcement system**  
- Docs Agent and Execution Agent become **governed actors**  

This pipeline is the **execution backbone** of the Foundry governance system.

---

If you want the **next artifact**, choose one:

- **Drift Classification Engine**  
- **Execution Agent Specification**  
- **Docs Agent Specification**  
- **Governance Rules Engine**  