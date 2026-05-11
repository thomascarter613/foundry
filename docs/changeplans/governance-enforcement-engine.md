---
title: "Governance Enforcement Engine"
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
  - "Lifecycle"
  - "Governance"
  - "ChangePlan"
  - "Enforcement"
---

governance-enforcement-engine.md

---

# 🏛️ Governance Enforcement Engine (GEE) — Canonical Specification  
**Status:** draft  
**Governance Level:** binding  
**Document Type:** governance  
**Owner:** Governance Maintainers  
**Version:** 0.1.0  
**Created:** 2026‑05‑08  
**Lifecycle Phase:** draft  
**Governed By:**  
- docs/governance/governance-charter.md  
- docs/governance/repository-contract.md  
- docs/governance/documentation-governance.md  
- governance/rules/universal-governed-header-block.md  

---

## 1. Purpose  
The Governance Enforcement Engine (GEE) is the **constitutional enforcement subsystem** that ensures:

- governance rules are binding  
- ChangePlans are mandatory  
- drift is illegal  
- metadata is required  
- directory structure is governed  
- architecture boundaries are enforced  
- platform boundaries are enforced  
- lifecycle rules are enforced  
- governance.json is authoritative  
- drift-baseline.json is authoritative  

GEE is the **execution arm** of the governance constitution.

---

## 2. Problem Statement  
The Foundry monorepo now has:

- governance.json  
- architecture.json  
- platform.json  
- lifecycle.json  
- drift-baseline.json  
- governed metadata  
- ChangePlans  
- drift baselines  

But nothing **enforces** them.

Without GEE:

- governance rules are advisory  
- drift is undetected  
- ChangePlans are optional  
- metadata can be missing  
- boundaries can be violated  
- lifecycle can be ignored  
- governance.json can fall out of sync  
- architecture.json can drift  
- platform.json can drift  
- drift-baseline.json can drift  

GEE is required to **activate** the governance system.

---

## 3. Scope  

### Included  
GEE enforces:

- governance rules  
- directory invariants  
- metadata invariants  
- ChangePlan requirements  
- drift detection  
- architecture boundaries  
- platform boundaries  
- lifecycle transitions  
- cross‑surface invariants  
- governance.json consistency  
- architecture.json consistency  
- platform.json consistency  
- lifecycle.json consistency  
- drift-baseline.json consistency  

### Excluded  
GEE does **not**:

- execute ChangePlans (Execution Agent does that)  
- generate documentation (Docs Agent does that)  
- generate code  
- generate templates  
- generate architecture  

GEE is **pure enforcement**.

---

## 4. Enforcement Model  

GEE enforces governance through **five enforcement layers**:

### 4.1 Structural Enforcement  
Ensures:

- governed directories exist  
- no ungoverned directories exist  
- no files appear outside governed structure  
- no governed file is deleted without a ChangePlan  

### 4.2 Metadata Enforcement  
Ensures:

- every governed document has a governed header block  
- metadata matches schema  
- metadata matches governance.json  
- metadata matches lifecycle.json  
- metadata matches architecture.json  
- metadata matches platform.json  

### 4.3 ChangePlan Enforcement  
Ensures:

- no governed artifact changes without a ChangePlan  
- ChangePlan metadata is valid  
- ChangePlan approvals are valid  
- ChangePlan lineage is valid  
- ChangePlan is recorded in governance/changeplans/index.json  

### 4.4 Drift Enforcement  
Ensures:

- drift-baseline.json is authoritative  
- per‑surface drift baselines are authoritative  
- drift is detected  
- drift is classified  
- drift blocks merges unless covered by an exception  

### 4.5 Boundary Enforcement  
Ensures:

- architecture boundaries are respected  
- platform boundaries are respected  
- lifecycle transitions are valid  
- governance rules are binding  

---

## 5. Enforcement Pipeline  

GEE runs in **three phases**:

### Phase 1 — Static Analysis  
- directory structure validation  
- metadata validation  
- governance.json validation  
- architecture.json validation  
- platform.json validation  
- lifecycle.json validation  
- drift-baseline.json validation  

### Phase 2 — ChangePlan Validation  
- detect governed changes  
- require ChangePlan  
- validate ChangePlan metadata  
- validate approvals  
- validate lineage  

### Phase 3 — Drift Detection  
- compute drift deltas  
- classify drift  
- block merge if drift is binding or required  

---

## 6. Integration Points  

### 6.1 With Docs Agent  
Docs Agent provides:

- metadata generation  
- metadata updates  
- documentation drift detection  
- documentation remediation  

GEE validates Docs Agent output.

### 6.2 With Execution Agent  
Execution Agent:

- applies ChangePlans  
- updates drift baselines  
- updates governance.json  

GEE validates Execution Agent output.

### 6.3 With CI  
CI:

- runs GEE  
- blocks merges on violations  
- records enforcement logs  

GEE is the **constitutional CI layer**.

---

## 7. Violations  

### Binding Violations  
- block merge  
- require ChangePlan  
- require exception  

### Required Violations  
- block merge  
- require ChangePlan  

### Informational Violations  
- warn  
- do not block merge  

---

## 8. Outputs  

GEE produces:

- enforcement logs  
- drift reports  
- violation reports  
- ChangePlan requirement reports  
- boundary violation reports  
- metadata violation reports  

---

## 9. Invariants Introduced  

1. No governed artifact may change without GEE validation.  
2. No ChangePlan may execute without GEE validation.  
3. No drift may exist without GEE classification.  
4. No metadata may be missing.  
5. No governance rule may be violated.  
6. No architecture boundary may be violated.  
7. No platform boundary may be violated.  
8. No lifecycle transition may be skipped.  
9. governance.json must always be consistent.  
10. drift-baseline.json must always be consistent.  

---

## 10. Final State  

After implementing GEE:

- governance becomes **active law**  
- drift becomes **detectable**  
- ChangePlans become **mandatory**  
- metadata becomes **required**  
- architecture becomes **enforceable**  
- platform becomes **enforceable**  
- lifecycle becomes **enforceable**  
- CI becomes **constitutional**  
- Docs Agent and Execution Agent become **governed actors**  

GEE is the **constitutional enforcement engine** of the Foundry monorepo.