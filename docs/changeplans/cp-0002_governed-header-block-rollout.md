cp-0002_governed-header-block-rollout.md
# CP-0002 — Governed Header Block Rollout

status: draft  
governanceLevel: binding  
changePlanType: systemic  
author: Thomas Carter  
created: 2026-05-08  
supersedes: null  
dependsOn:
  - CP-0001
requiredApprovals:
  - Governance Maintainers
  - Documentation Stewards
  - Architecture Stewards
  - Platform Stewards

---

## 1. Purpose

Apply the **Universal Governed Header Block** (introduced in CP‑0001) to **all governed documentation artifacts** across the repository, ensuring:

- every governed document has a metadata block  
- every governed document declares governanceLevel  
- every governed document declares lifecyclePhase  
- every governed document declares documentType  
- every governed document declares ownership  
- every governed document is linkable from governance.json  
- every governed document is drift‑detectable  

This ChangePlan operationalizes the **constitutional metadata layer** of the documentation system.

---

## 2. Problem Statement

The repository contains a large corpus of documentation under:

- `docs/governance/`  
- `docs/architecture/`  
- `docs/lifecycle/`  
- `docs/platform/`  
- `docs/standards/`  
- `docs/onboarding/`  
- `docs/planning/`  
- `docs/product/`  
- `docs/scaffolding/`  

However:

- none of these documents contain governed metadata  
- none declare governanceLevel  
- none declare lifecyclePhase  
- none declare documentType  
- none declare ADR lineage  
- none declare glossary terms  
- none declare governedBy references  

This prevents:

- drift detection  
- lifecycle enforcement  
- governance enforcement  
- cross‑document linking  
- Docs Agent reasoning  
- Execution Agent validation  
- CI constitutional enforcement  

CP‑0002 corrects this.

---

## 3. Scope

### Included

- All Markdown files under `docs/**` except explicitly ungoverned files  
- All Markdown files under `governance/**`  
- All ADRs under `docs/adr/**`  
- All architecture docs under `docs/architecture/**`  
- All standards under `docs/standards/**`  
- All lifecycle docs under `docs/lifecycle/**`  
- All platform docs under `docs/platform/**`  
- All governance docs under `docs/governance/**`  

### Excluded

- Generated documentation  
- README files in code packages (unless explicitly governed)  
- Non‑Markdown files  
- Templates under `/templates`  

---

## 4. Proposed Changes

### 4.1 Insert governed header block into all governed docs

Prepend the following metadata block to each governed document:

```yaml
status: draft
governanceLevel: binding
documentType: <to be assigned>
owner: <to be assigned>
version: 0.1.0
created: 2026-05-08
lastUpdated: 2026-05-08
lifecyclePhase: draft
adrReferences: []
glossaryTerms: []
governedBy:
  - docs/governance/governance-charter.md
  - docs/governance/repository-contract.md
  - docs/governance/documentation-governance.md
```

### 4.2 Assign documentType values

Examples:

- governance → `governance`  
- architecture → `architecture`  
- lifecycle → `lifecycle`  
- platform → `platform`  
- standards → `standard`  
- adr → `adr`  
- onboarding → `onboarding`  
- planning → `planning`  
- product → `product`  
- scaffolding → `scaffolding`  

### 4.3 Assign ownership

Examples:

- governance docs → Governance Maintainers  
- architecture docs → Architecture Stewards  
- platform docs → Platform Stewards  
- lifecycle docs → Lifecycle Stewards  
- standards → Standards Stewards  
- onboarding → Documentation Stewards  
- planning → Docs Agent Team  
- product → Product Stewards  

### 4.4 Update governance.json

Add entries for each governed document:

- path  
- documentType  
- governanceLevel  
- lifecyclePhase  
- owner  
- version  

### 4.5 Update drift baselines

Increment:

- documentation drift baseline  
- governance drift baseline  

to reflect the new metadata.

---

## 5. Execution Steps

1. Enumerate all governed documents under `docs/**` and `governance/**`.  
2. For each document, prepend the governed header block.  
3. Assign documentType based on directory.  
4. Assign owner based on governance domain.  
5. Update `governance.json` with entries for each document.  
6. Update `governance/drift-baselines/documentation-drift-baseline.json`.  
7. Update `governance/drift-baselines/governance-drift-baseline.json`.  
8. Commit changes as a single atomic ChangePlan.  

---

## 6. Rollback Plan

Rollback is deterministic:

1. Remove governed header blocks from all modified documents.  
2. Remove entries from `governance.json`.  
3. Revert drift baselines to pre‑CP‑0002 state.  

Rollback must be executed as a **single atomic ChangePlan**.

---

## 7. Drift Baseline Updates

After execution:

- documentation drift baseline = number of governed docs  
- governance drift baseline = number of governance docs  

These become the new **zero‑drift reference points**.

---

## 8. Invariants Introduced

1. All governed documents must contain a governed header block.  
2. All governed documents must declare governanceLevel.  
3. All governed documents must declare lifecyclePhase.  
4. All governed documents must declare documentType.  
5. All governed documents must declare ownership.  
6. All governed documents must be represented in governance.json.  
7. All governed documents must be drift‑tracked.  
8. No governed document may exist without metadata.  

---

## 9. Approvals Required

- Governance Maintainers  
- Documentation Stewards  
- Architecture Stewards  
- Platform Stewards  

---

## 10. Final State

After applying CP‑0002:

- every governed document has a metadata block  
- governance.json becomes a complete index of governed artifacts  
- drift detection becomes possible  
- lifecycle enforcement becomes possible  
- governance enforcement becomes possible  
- Docs Agent and Execution Agent can operate deterministically  
- CI can enforce documentation governance as constitutional law  

CP‑0002 is the **first systemic governance rollout** in the Foundry documentation lineage.