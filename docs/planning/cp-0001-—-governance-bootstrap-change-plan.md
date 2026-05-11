---
title: "CP-0001: Governance Bootstrap Change Plan"
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
  - "0001"
  - "Bootstrap"
  - "Change"
  - "Plan"
---

cp-0001-—-governance-bootstrap-change-plan.md
# CP-0001 — Governance Bootstrap ChangePlan

status: draft  
governanceLevel: binding  
changePlanType: foundational  
author: Thomas Carter  
created: 2026-05-08  
supersedes: null  
dependsOn: []  
requiredApprovals:
  - Platform Stewardship Group
  - Governance Maintainers
  - Architecture Stewards
  - Documentation Stewards

---

## 1. Purpose

Establish the **initial governed foundation** of the Foundry monorepo by introducing:

- the governance directory structure  
- governance.json  
- architecture.json  
- platform.json  
- lifecycle.json  
- glossary.json  
- drift-baseline.json  
- the ChangePlan directory  
- the Exceptions directory  
- the Approvals directory  
- the Governance Rules directory  
- the initial governance metadata schema  
- the universal governed header block  
- the constitutional invariants for governed artifacts  

This ChangePlan creates the **governance substrate** upon which all future governance, documentation, architecture, platform, and lifecycle rules depend.

---

## 2. Problem Statement

The repository contains extensive documentation and conceptual governance artifacts, but lacks:

- machine-readable governance models  
- drift baselines  
- a governed directory structure  
- a governed metadata schema  
- a ChangePlan system  
- an exception system  
- an approvals system  
- a governance rules engine  
- lifecycle metadata  
- platform metadata  
- architecture metadata  
- glossary metadata  

Without these, the repository cannot enforce governance, detect drift, or support the Docs Agent / Execution Agent model.

---

## 3. Scope

This ChangePlan introduces **no functional code changes**.  
It introduces **governance infrastructure only**.

**Included:**

- new directories  
- new JSON governance files  
- new metadata schemas  
- new documentation  
- new invariants  
- new drift baselines  

**Excluded:**

- modifying existing docs  
- modifying existing code  
- modifying existing architecture docs  
- modifying existing platform docs  

These will be handled in CP‑0002 through CP‑0007.

---

## 4. Proposed Changes

### 4.1 Create governed directory structure

Create:

- `governance/`  
- `governance/rules/`  
- `governance/exceptions/`  
- `governance/approvals/`  
- `governance/changeplans/`  
- `governance/drift-baselines/`  

### 4.2 Add machine-readable governance model

Create the following root-level files:

- `governance.json`  
- `architecture.json`  
- `platform.json`  
- `lifecycle.json`  
- `glossary.json`  
- `drift-baseline.json`  

### 4.3 Add governance metadata schema

Create:

- `governance/rules/governance-metadata-schema.json`  

Defines:

- required metadata fields  
- allowed governance levels  
- allowed lifecycle phases  
- allowed document types  
- required cross-references  

### 4.4 Add universal governed header block

Create:

- `governance/rules/universal-governed-header-block.md`  

Defines:

- metadata block  
- required fields  
- placement rules  
- validation rules  

### 4.5 Add initial drift baselines

Create:

- `governance/drift-baselines/governance-drift-baseline.json`  
- `governance/drift-baselines/documentation-drift-baseline.json`  
- `governance/drift-baselines/architecture-drift-baseline.json`  
- `governance/drift-baselines/platform-drift-baseline.json`  
- `governance/drift-baselines/lifecycle-drift-baseline.json`  

### 4.6 Add ChangePlan index

Create:

- `governance/changeplans/index.json`  

Contains:

- list of ChangePlans  
- status  
- approvals  
- lineage  

### 4.7 Add Exceptions index

Create:

- `governance/exceptions/exceptions.yml`  

### 4.8 Add Approvals directory README

Create:

- `governance/approvals/README.md`  

Defines:

- approval model  
- authority mapping  
- escalation rules  

---

## 5. Execution Steps

These steps are deterministic and must be executed **in order**:

1. Create `governance/` and subdirectories.  
2. Add root-level JSON governance files.  
3. Add governance metadata schema.  
4. Add universal governed header block.  
5. Add drift baselines.  
6. Add ChangePlan index.  
7. Add Exceptions index.  
8. Add Approvals README.  
9. Update root `README.md` to reference the governance system and CP‑0001.  

---

## 6. Rollback Plan

Rollback is deterministic and reversible:

1. Delete `governance/` directory.  
2. Delete `governance.json`, `architecture.json`, `platform.json`, `lifecycle.json`, `glossary.json`, `drift-baseline.json`.  
3. Remove references to governance.json and CP‑0001 from `README.md` and any other docs.  
4. Remove any drift baseline references introduced by this ChangePlan.  

Rollback must be executed as a **single atomic ChangePlan**.

---

## 7. Drift Baseline Updates

This ChangePlan introduces the **initial drift baselines**.

After execution:

- governance drift baseline = `0`  
- documentation drift baseline = `0`  
- architecture drift baseline = `0`  
- platform drift baseline = `0`  
- lifecycle drift baseline = `0`  

These values represent the **“clean slate”** against which future drift will be measured.

---

## 8. Invariants Introduced

This ChangePlan introduces the following **constitutional invariants**:

1. All governed documents must include a governed header block.  
2. All governed artifacts must have lifecycle metadata.  
3. All governed artifacts must have `governanceLevel` metadata.  
4. All governed artifacts must be represented in `governance.json`.  
5. All governed artifacts must be represented in `drift-baseline.json` or a surface-specific baseline.  
6. No governed artifact may be modified without a ChangePlan.  
7. No governed artifact may be deleted without a ChangePlan.  
8. No new governed artifact may be added without metadata.  
9. No directory may be added outside the governed structure.  
10. CI must enforce governance invariants as constitutional gates.  

---

## 9. Approvals Required

- Platform Stewardship Group (PSG)  
- Governance Maintainers  
- Architecture Stewards  
- Documentation Stewards  

No execution of this ChangePlan is valid without recorded approvals in `governance/approvals/`.

---

## 10. Final State

After applying CP‑0001, the repository becomes:

- **governed** — governance has a concrete, machine-readable substrate  
- **drift-aware** — baselines exist for governance, docs, architecture, platform, lifecycle  
- **metadata-complete** — governed artifacts have a shared metadata model  
- **ChangePlan-enabled** — all future governed changes flow through ChangePlans  
- **agent-ready** — Docs Agent and Execution Agent have a constitutional substrate  
- **CI-enforceable** — governance can be enforced as a first-class CI concern  

CP‑0001 is the **foundational ChangePlan** in the Foundry governance lineage.  
All subsequent governance ChangePlans (CP‑0002 and beyond) are **children of this constitutional event**.