---
title: "CP-0004: Architecture JSON Architecture Graph Seed"
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
  - "Lifecycle"
  - "Architecture"
  - "Knowledge Graph"
  - "ChangePlan"
  - "0004"
  - "JSON"
  - "Graph"
---

cp-0004_architecture.json_architecture-graph-seed.md

# CP-0004 — architecture.json & Architecture Graph Seed

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
requiredApprovals:
  - Architecture Stewards
  - Governance Maintainers
  - Documentation Stewards
  - Platform Stewards

---

## 1. Purpose

Introduce the **machine‑readable architecture model** (`architecture.json`) and seed the **initial architecture graph** that represents:

- domains  
- services  
- packages  
- modules  
- boundaries  
- dependencies  
- ADR lineage  
- documentation references  

This ChangePlan transforms the architecture from a **documentation‑only concept** into a **governed, enforceable, drift‑detectable, graph‑encoded system**.

---

## 2. Problem Statement

The repository contains extensive architecture documentation under:

- `docs/architecture/`  
- `docs/adr/`  
- `docs/planning/architecture-*`  

However:

- there is **no machine‑readable architecture model**  
- there is **no architecture graph**  
- there are **no architecture boundaries**  
- there is **no mapping between code and architecture**  
- there is **no ADR lineage encoded in metadata**  
- there is **no architecture drift baseline**  
- CI cannot enforce architecture rules  
- Docs Agent cannot reason about architecture  
- Execution Agent cannot validate architecture‑related ChangePlans  

CP‑0004 corrects this.

---

## 3. Scope

### Included

- creation of `architecture.json`  
- creation of the initial architecture graph  
- mapping of domains, services, packages, and modules  
- mapping of ADRs to architecture nodes  
- mapping of architecture docs to architecture nodes  
- creation of architecture drift baseline  

### Excluded

- enforcement of architecture boundaries (future CP)  
- platform integration (handled in CP‑0005)  
- lifecycle integration (handled in CP‑0006)  
- documentation updates (handled in CP‑0002)  

---

## 4. Proposed Changes

### 4.1 Create architecture.json

Add a new root‑level file:

```
architecture.json
```

Containing:

- version  
- schema reference  
- domains  
- services  
- packages  
- modules  
- boundaries  
- dependencies  
- ADR lineage  
- documentation references  

### 4.2 Define architecture domains

Seed domains based on existing repo structure:

- `foundry-core`  
- `foundry-cli`  
- `foundry-services`  
- `foundry-templates`  
- `foundry-contracts`  
- `foundry-docs`  

### 4.3 Define services

From `/services`:

- `gov-api`  

### 4.4 Define packages

From `/packages`:

- `cli`  
- `example`  
- `example-utils`  

### 4.5 Define modules

Modules are derived from:

- `src/` directories  
- template engines  
- generator manifests  
- contract schemas  

### 4.6 Define architecture boundaries

Initial boundaries:

- services may depend on packages  
- packages may depend on other packages  
- packages may not depend on services  
- templates may not depend on services or packages  
- contracts may not depend on services or packages  
- docs may not depend on code  
- code may not depend on docs  

### 4.7 Map ADRs to architecture nodes

For each ADR under `docs/adr/`:

- extract ADR number  
- extract affected domain/service/module  
- add `adrReferences` to architecture.json  

### 4.8 Map architecture docs to architecture nodes

For each doc under `docs/architecture/`:

- map to domain or module  
- add `documentationReferences`  

### 4.9 Create architecture drift baseline

Add:

```
governance/drift-baselines/architecture-drift-baseline.json
```

Containing:

- number of domains  
- number of services  
- number of packages  
- number of modules  
- number of boundaries  
- number of ADR references  
- number of documentation references  

---

## 5. Execution Steps

1. Create `architecture.json` with schema, version, and empty structures.  
2. Enumerate domains, services, packages, and modules.  
3. Populate architecture.json with discovered nodes.  
4. Extract ADR lineage from `docs/adr/*.md`.  
5. Extract documentation references from `docs/architecture/*.md`.  
6. Define initial architecture boundaries.  
7. Define initial dependency graph.  
8. Create architecture drift baseline.  
9. Validate architecture.json against schema.  
10. Commit changes as a single atomic ChangePlan.  

---

## 6. Rollback Plan

Rollback is deterministic:

1. Delete `architecture.json`.  
2. Delete `governance/drift-baselines/architecture-drift-baseline.json`.  
3. Remove architecture references from governance.json.  

Rollback must be executed as a **single atomic ChangePlan**.

---

## 7. Drift Baseline Updates

After execution:

- architecture drift baseline = number of architecture nodes + boundaries + references  

This becomes the new **zero‑drift reference point**.

---

## 8. Invariants Introduced

1. All architecture artifacts must be represented in architecture.json.  
2. All architecture boundaries must be encoded in architecture.json.  
3. All ADRs must be mapped to architecture nodes.  
4. All architecture docs must be mapped to architecture nodes.  
5. architecture.json becomes the authoritative architecture model.  
6. CI must enforce architecture.json consistency.  
7. No architecture change may occur without a ChangePlan.  

---

## 9. Approvals Required

- Architecture Stewards  
- Governance Maintainers  
- Documentation Stewards  
- Platform Stewards  

---

## 10. Final State

After applying CP‑0004:

- architecture.json becomes the **canonical architecture model**  
- the architecture graph exists  
- ADR lineage is encoded  
- architecture docs are mapped  
- architecture boundaries are defined  
- architecture drift detection becomes possible  
- CI can enforce architecture rules  
- Docs Agent and Execution Agent can reason about architecture  

CP‑0004 is the **foundational architecture governance event**.