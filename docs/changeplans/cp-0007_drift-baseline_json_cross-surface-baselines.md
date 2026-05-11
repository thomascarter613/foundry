---
title: "CP-0007: Drift Baseline JSON Cross Surface Baselines"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "ChangePlan"
upstream:
  - "docs/changeplans/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "ChangePlan"
  - "Lifecycle"
  - "Drift"
---

cp-0007_drift-baseline_json_cross-surface-baselines.md

status: draft  
governanceLevel: binding  
changePlanType: foundational  
author: Thomas Carter  
created: 2026-05-08  
supersedes: null  
dependsOn:
  - CP-0001
  - CP-0002
  - CP-0003
  - CP-0004
  - CP-0005
  - CP-0006
requiredApprovals:
  - Governance Maintainers
  - Documentation Stewards
  - Architecture Stewards
  - Platform Stewards
  - Lifecycle Stewards

---

## 1. Purpose

Introduce the **cross‑surface drift baseline system**, consisting of:

- a **root‑level drift-baseline.json**  
- **per‑surface drift baselines** for:
  - governance  
  - documentation  
  - architecture  
  - platform  
  - lifecycle  

This ChangePlan establishes the **constitutional drift detection substrate**, enabling:

- drift classification  
- drift enforcement  
- drift remediation  
- CI constitutional drift gates  
- Docs Agent drift reasoning  
- Execution Agent drift validation  

CP‑0007 is the final step required before governance becomes **fully enforceable**.

---

## 2. Problem Statement

The repository now contains:

- governance.json  
- architecture.json  
- platform.json  
- lifecycle.json  
- governed documentation with metadata  

However:

- there is **no unified drift baseline**  
- there is **no cross‑surface drift model**  
- CI cannot detect drift  
- Docs Agent cannot reason about drift  
- Execution Agent cannot validate drift  
- governance cannot enforce invariants  

Without drift baselines, the system cannot:

- detect missing metadata  
- detect missing governance entries  
- detect architecture changes  
- detect platform changes  
- detect lifecycle changes  
- detect documentation drift  
- detect governance drift  

CP‑0007 corrects this.

---

## 3. Scope

### Included

- creation of root‑level `drift-baseline.json`  
- creation of per‑surface drift baselines  
- population of baseline counts  
- integration with governance.json  
- integration with architecture.json  
- integration with platform.json  
- integration with lifecycle.json  

### Excluded

- drift enforcement (future CP)  
- drift remediation (future CP)  
- drift classification engine (future CP)  

---

## 4. Proposed Changes

### 4.1 Create root‑level drift-baseline.json

Add:

```
drift-baseline.json
```

Containing:

- version  
- schema reference  
- references to per‑surface baselines  
- cross‑surface invariants  

### 4.2 Create per‑surface drift baselines

Add:

```
governance/drift-baselines/governance-drift-baseline.json
governance/drift-baselines/documentation-drift-baseline.json
governance/drift-baselines/architecture-drift-baseline.json
governance/drift-baselines/platform-drift-baseline.json
governance/drift-baselines/lifecycle-drift-baseline.json
```

Each baseline contains:

- version  
- baseline counts  
- invariants  
- schema reference  

### 4.3 Populate baseline counts

For each surface:

- count governed artifacts  
- count metadata fields  
- count governance.json entries  
- count architecture nodes  
- count platform modules  
- count lifecycle phases  
- count documentation artifacts  
- count ADR references  
- count glossary terms (if present)  

### 4.4 Define cross‑surface invariants

Examples:

- every governed artifact must appear in governance.json  
- every architecture node must appear in architecture.json  
- every platform module must appear in platform.json  
- every lifecyclePhase must appear in lifecycle.json  
- every governed document must appear in documentation drift baseline  

### 4.5 Validate drift baselines

Validate each baseline against its schema.

---

## 5. Execution Steps

1. Create root‑level `drift-baseline.json`.  
2. Create per‑surface drift baselines.  
3. Enumerate governed artifacts.  
4. Populate baseline counts for each surface.  
5. Populate cross‑surface invariants.  
6. Validate all baselines against schema.  
7. Commit changes as a single atomic ChangePlan.  

---

## 6. Rollback Plan

Rollback is deterministic:

1. Delete `drift-baseline.json`.  
2. Delete all per‑surface drift baselines.  
3. Remove drift references from governance.json.  

Rollback must be executed as a **single atomic ChangePlan**.

---

## 7. Drift Baseline Updates

After execution:

- governance drift baseline = number of governance artifacts  
- documentation drift baseline = number of governed documents  
- architecture drift baseline = number of architecture nodes  
- platform drift baseline = number of platform modules  
- lifecycle drift baseline = number of lifecycle phases  

These become the **zero‑drift reference points** for the entire repository.

---

## 8. Invariants Introduced

1. All governed artifacts must be represented in drift baselines.  
2. All drift baselines must be represented in drift-baseline.json.  
3. drift-baseline.json becomes the authoritative drift model.  
4. CI must enforce drift-baseline.json consistency.  
5. No governed artifact may change without updating drift baselines.  
6. No new governed artifact may be added without updating drift baselines.  
7. No governed artifact may be removed without updating drift baselines.  

---

## 9. Approvals Required

- Governance Maintainers  
- Documentation Stewards  
- Architecture Stewards  
- Platform Stewards  
- Lifecycle Stewards  

---

## 10. Final State

After applying CP‑0007:

- drift-baseline.json becomes the **canonical drift model**  
- all surfaces have drift baselines  
- cross‑surface drift detection becomes possible  
- CI can enforce drift gates  
- Docs Agent and Execution Agent can reason about drift  
- governance becomes fully enforceable  

CP‑0007 completes the **Foundry Governance Bootstrap Sequence**.