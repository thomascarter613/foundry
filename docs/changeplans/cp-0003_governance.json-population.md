---
title: "CP-0003: Governance JSON Population"
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
  - "docs/architecture/adr/0004-architecture-principles.md"
glossaryTerms:
  - "ChangePlan"
  - "Lifecycle"
  - "Governance"
---

cp-0003_governance.json-population.md
# CP-0003 — governance.json Population

status: draft  
governanceLevel: binding  
changePlanType: systemic  
author: Thomas Carter  
created: 2026-05-08  
supersedes: null  
dependsOn:
  - CP-0001
  - CP-0002
requiredApprovals:
  - Governance Maintainers
  - Documentation Stewards
  - Architecture Stewards
  - Platform Stewards

---

## 1. Purpose

Populate the machine‑readable **governance.json** file introduced in CP‑0001 with a complete, authoritative index of **all governed artifacts** across the repository.

This ChangePlan transforms governance.json from an empty constitutional placeholder into the **canonical governance registry**, enabling:

- governance enforcement  
- drift detection  
- lifecycle enforcement  
- cross‑document linking  
- Docs Agent reasoning  
- Execution Agent validation  
- CI constitutional gating  

CP‑0003 is the moment governance.json becomes **the source of truth** for the governance system.

---

## 2. Problem Statement

The repository contains a large corpus of governed documentation under:

- `docs/governance/`  
- `docs/architecture/`  
- `docs/lifecycle/`  
- `docs/platform/`  
- `docs/standards/`  
- `docs/onboarding/`  
- `docs/planning/`  
- `docs/product/`  
- `docs/scaffolding/`  
- `docs/adr/`  

However:

- governance.json is empty  
- no governed artifacts are indexed  
- no metadata is recorded  
- no lifecyclePhase is recorded  
- no governanceLevel is recorded  
- no documentType is recorded  
- no ownership is recorded  
- no drift baselines reference governed artifacts  

This prevents:

- governance enforcement  
- lifecycle enforcement  
- drift detection  
- cross‑document linking  
- Docs Agent reasoning  
- Execution Agent validation  
- CI enforcement  

CP‑0003 corrects this.

---

## 3. Scope

### Included

- Populate governance.json with entries for **all governed documents**  
- Assign metadata fields for each governed artifact  
- Link each governed artifact to its owner, governanceLevel, lifecyclePhase, and documentType  
- Validate metadata against governance-metadata-schema.json  
- Update drift baselines  

### Excluded

- Modifying document content (handled in CP‑0002)  
- Modifying architecture.json, platform.json, lifecycle.json (handled in CP‑0004–0006)  
- Adding new governance rules (future CPs)  

---

## 4. Proposed Changes

### 4.1 Populate governance.json with governed artifacts

For each governed document:

- `path`  
- `documentType`  
- `governanceLevel`  
- `lifecyclePhase`  
- `owner`  
- `version`  
- `created`  
- `lastUpdated`  
- `adrReferences`  
- `glossaryTerms`  
- `governedBy`  

### 4.2 Assign governanceLevel

Rules:

- governance docs → `binding`  
- architecture docs → `binding`  
- lifecycle docs → `binding`  
- platform docs → `binding`  
- standards → `binding`  
- onboarding → `required`  
- planning → `required`  
- product → `informational`  
- scaffolding → `required`  
- ADRs → `binding`  

### 4.3 Assign lifecyclePhase

Initial assignment:

- all governed artifacts → `draft`  

Lifecycle transitions will be handled in CP‑0006.

### 4.4 Assign ownership

- governance → Governance Maintainers  
- architecture → Architecture Stewards  
- platform → Platform Stewards  
- lifecycle → Lifecycle Stewards  
- standards → Standards Stewards  
- onboarding → Documentation Stewards  
- planning → Docs Agent Team  
- product → Product Stewards  
- scaffolding → Tooling Stewards  
- ADRs → Architecture Stewards  

### 4.5 Validate metadata

Validate each entry against:

```
governance/rules/governance-metadata-schema.json
```

### 4.6 Update drift baselines

Increment:

- governance drift baseline  
- documentation drift baseline  

to reflect the new metadata.

---

## 5. Execution Steps

1. Enumerate all governed documents under `docs/**` and `governance/**`.  
2. For each document, extract metadata from the governed header block (added in CP‑0002).  
3. Construct governance.json entries for each document.  
4. Validate governance.json against governance-metadata-schema.json.  
5. Update drift baselines.  
6. Commit changes as a single atomic ChangePlan.  

---

## 6. Rollback Plan

Rollback is deterministic:

1. Restore governance.json to its empty CP‑0001 skeleton.  
2. Remove all entries referencing governed artifacts.  
3. Revert drift baselines to pre‑CP‑0003 state.  

Rollback must be executed as a **single atomic ChangePlan**.

---

## 7. Drift Baseline Updates

After execution:

- governance drift baseline = number of governance artifacts  
- documentation drift baseline = number of governed documents  

These become the new **zero‑drift reference points**.

---

## 8. Invariants Introduced

1. All governed artifacts must be represented in governance.json.  
2. No governed artifact may exist without a governance.json entry.  
3. governance.json becomes the authoritative index of governed artifacts.  
4. governance.json must validate against governance-metadata-schema.json.  
5. governance.json must be updated for all governed changes.  
6. CI must enforce governance.json consistency.  

---

## 9. Approvals Required

- Governance Maintainers  
- Documentation Stewards  
- Architecture Stewards  
- Platform Stewards  

---

## 10. Final State

After applying CP‑0003:

- governance.json becomes the **canonical governance registry**  
- all governed artifacts are indexed  
- all governed artifacts have metadata  
- drift detection becomes fully operational  
- lifecycle enforcement becomes possible  
- governance enforcement becomes possible  
- Docs Agent and Execution Agent can reason over the governance graph  
- CI can enforce governance.json as constitutional law  

CP‑0003 is the **moment governance becomes machine-readable and enforceable**.