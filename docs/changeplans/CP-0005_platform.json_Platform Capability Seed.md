---
title: "CP-0005: Platform Capability Seed"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "Lifecycle"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

CP-0005_platform.json_Platform Capability Seed.md
# CP-0005 — platform.json & Platform Capability Seed

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
requiredApprovals:
  - Platform Stewards
  - Governance Maintainers
  - Architecture Stewards
  - Documentation Stewards

---

## 1. Purpose

Introduce the **machine‑readable platform model** (`platform.json`) and seed the **initial platform capability graph**, defining:

- platform modules  
- platform capabilities  
- platform boundaries  
- platform dependencies  
- platform integration points  
- platform documentation references  
- platform drift baseline  

This ChangePlan transforms the platform from a **documentation‑only concept** into a **governed, enforceable, drift‑detectable, graph‑encoded subsystem**.

---

## 2. Problem Statement

The repository contains platform documentation under:

- `docs/platform/overview.md`  
- `docs/platform/ci-cd.md`  
- `docs/platform/tooling.md`  
- `docs/platform/observability.md`  

However:

- there is **no machine‑readable platform model**  
- there is **no platform capability graph**  
- there are **no platform boundaries**  
- there is **no mapping between platform modules and code**  
- there is **no platform drift baseline**  
- CI cannot enforce platform rules  
- Docs Agent cannot reason about platform capabilities  
- Execution Agent cannot validate platform‑related ChangePlans  

CP‑0005 corrects this.

---

## 3. Scope

### Included

- creation of `platform.json`  
- definition of platform modules  
- definition of platform capabilities  
- definition of platform boundaries  
- mapping of platform docs to platform modules  
- creation of platform drift baseline  

### Excluded

- enforcement of platform boundaries (future CP)  
- lifecycle integration (handled in CP‑0006)  
- documentation updates (handled in CP‑0002)  
- architecture integration (handled in CP‑0004)  

---

## 4. Proposed Changes

### 4.1 Create platform.json

Add a new root‑level file:

```
platform.json
```

Containing:

- version  
- schema reference  
- platform modules  
- platform capabilities  
- platform boundaries  
- platform dependencies  
- documentation references  
- integration points  

### 4.2 Define platform modules

Seed modules based on existing repo structure:

- `ci-cd`  
- `observability`  
- `tooling`  
- `docs-engine`  
- `generator-engine`  
- `contract-verification`  
- `scaffolding-engine`  

### 4.3 Define platform capabilities

Examples:

- CI enforcement  
- documentation verification  
- contract verification  
- generator manifest validation  
- template scaffolding  
- OpenAPI client generation  
- proto contract validation  
- drift detection  
- governance enforcement  
- lifecycle enforcement  

### 4.4 Define platform boundaries

Initial boundaries:

- platform modules may depend on each other  
- platform modules may not depend on services  
- platform modules may not depend on application packages  
- services and packages may depend on platform modules  
- templates may depend on platform modules  
- platform modules may not depend on templates  

### 4.5 Define platform dependencies

Examples:

- `ci-cd` → depends on `tooling`, `docs-engine`, `contract-verification`  
- `docs-engine` → depends on `generator-engine`  
- `generator-engine` → depends on `contract-verification`  

### 4.6 Map platform docs to platform modules

For each doc under `docs/platform/`:

- map to module  
- add `documentationReferences`  

### 4.7 Create platform drift baseline

Add:

```
governance/drift-baselines/platform-drift-baseline.json
```

Containing:

- number of modules  
- number of capabilities  
- number of boundaries  
- number of dependencies  
- number of documentation references  

---

## 5. Execution Steps

1. Create `platform.json` with schema, version, and empty structures.  
2. Enumerate platform modules from documentation and toolchain.  
3. Populate platform.json with modules, capabilities, boundaries, and dependencies.  
4. Extract documentation references from `docs/platform/*.md`.  
5. Create platform drift baseline.  
6. Validate platform.json against schema.  
7. Commit changes as a single atomic ChangePlan.  

---

## 6. Rollback Plan

Rollback is deterministic:

1. Delete `platform.json`.  
2. Delete `governance/drift-baselines/platform-drift-baseline.json`.  
3. Remove platform references from governance.json.  

Rollback must be executed as a **single atomic ChangePlan**.

---

## 7. Drift Baseline Updates

After execution:

- platform drift baseline = number of modules + capabilities + boundaries + dependencies + references  

This becomes the new **zero‑drift reference point**.

---

## 8. Invariants Introduced

1. All platform modules must be represented in platform.json.  
2. All platform capabilities must be encoded in platform.json.  
3. All platform boundaries must be encoded in platform.json.  
4. All platform docs must be mapped to platform modules.  
5. platform.json becomes the authoritative platform model.  
6. CI must enforce platform.json consistency.  
7. No platform change may occur without a ChangePlan.  

---

## 9. Approvals Required

- Platform Stewards  
- Governance Maintainers  
- Architecture Stewards  
- Documentation Stewards  

---

## 10. Final State

After applying CP‑0005:

- platform.json becomes the **canonical platform model**  
- the platform capability graph exists  
- platform boundaries are defined  
- platform docs are mapped  
- platform drift detection becomes possible  
- CI can enforce platform rules  
- Docs Agent and Execution Agent can reason about platform capabilities  

CP‑0005 is the **foundational platform governance event**.