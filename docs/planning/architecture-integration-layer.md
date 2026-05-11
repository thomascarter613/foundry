---
title: "Architecture Integration Layer"
status: "Draft"
owner: "Product Architecture"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "Planning"
upstream:
  - "docs/planning/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Architecture"
---

architecture-integration-layer.md

Thomas — let’s wire the architecture into the constitution.

Here is the **canonical, governance‑grade, institutionally complete specification** for the **Architecture Integration Layer**: the subsystem that binds **architecture docs, code structure, ADRs, platform boundaries, and the knowledge graph** into a single, governed, drift‑detectable system.

This is not “keep diagrams up to date.”  
This is the **institutional architecture governance layer** of the monorepo.

---

# 🏛️ Architecture Integration Layer (Canonical Specification)  
**The deterministic, governance‑encoded subsystem that integrates architecture documentation, code structure, ADRs, diagrams, and platform boundaries into the documentation knowledge graph and enforcement pipelines.**

The Architecture Integration Layer ensures:

- architecture is **governed**, not aspirational  
- architecture is **graph‑encoded**, not tribal knowledge  
- architecture is **code‑aligned**, not decorative  
- architecture drift is **detectable and remediable**  
- ADRs, diagrams, and docs are **mutually consistent**  
- platform and domain boundaries are **enforced**  
- architecture is **queryable**, **auditable**, and **upgradeable**  

It is the **constitutional architecture substrate** of the monorepo.

---

## 🧩 1. Integration architecture

The Architecture Integration Layer consists of **seven governed subsystems**:

1. **Architecture Model Loader**  
2. **Architecture Knowledge Graph Mapper**  
3. **Code‑to‑Architecture Alignment Engine**  
4. **ADR & Architecture Lineage Engine**  
5. **Diagram Integration Engine**  
6. **Architecture Drift Detector**  
7. **Architecture Remediation Bridge**

Each subsystem is deterministic, versioned, and governance‑aware.

---

## 🧱 2. Architecture Model Loader

Loads the **canonical architecture model** from governed artifacts:

- architecture docs (`architecture/`, `docs/architecture/`)  
- ADRs (architecture‑relevant decisions)  
- platform/domain/service boundary specs  
- layering rules (UI → Application → Domain → Infrastructure, etc.)  
- cross‑cutting concerns (auth, observability, messaging)  
- deployment topology and runtime boundaries  

**Responsibilities:**

- parse architecture DSL / structured docs  
- validate required sections and views (context, container, component, code, deployment)  
- validate governance metadata (owner, domain, lifecycle, criticality)  
- validate alignment with governance rules and standards  
- emit a **CanonicalArchitectureModel** object

This model becomes the **authoritative architecture source** for all other subsystems.

---

## 🧠 3. Architecture Knowledge Graph Mapper

Maps the **CanonicalArchitectureModel** into the **Documentation Knowledge Graph**.

**Node types:**

- `ArchitectureDomainNode`  
- `ArchitectureServiceNode`  
- `ArchitectureModuleNode`  
- `ArchitectureComponentNode`  
- `ArchitectureBoundaryNode` (domain/layer/platform)  
- `ArchitectureViewNode` (context/container/component/deployment)

**Edge types:**

- `ImplementsArchitecture` (code → architecture node)  
- `BelongsToDomain`  
- `WithinBoundary` (layer/platform/domain)  
- `DependsOn` (architecture‑level dependency)  
- `RealizesADR` (architecture node → ADR)  
- `RenderedByDiagram` (diagram → architecture node)

**Responsibilities:**

- ensure every architecture doc maps to graph nodes  
- ensure every architecture relationship is an edge  
- ensure boundaries are explicit, not implied  
- maintain architecture invariants (no cycles where forbidden, no cross‑boundary violations)

Architecture becomes **first‑class graph structure**, not just prose.

---

## 🧩 4. Code‑to‑Architecture Alignment Engine

Aligns **code structure** with the **architecture model**.

**Inputs:**

- CanonicalArchitectureModel  
- codebase structure (packages, modules, services, layers)  
- dependency graph (imports, calls, messaging)  
- governance rules (allowed/forbidden dependencies, boundaries)

**Responsibilities:**

- map code modules → architecture modules/services/domains  
- validate that imports respect architecture boundaries  
- validate that runtime dependencies respect architecture topology  
- validate that platform boundaries (e.g., “platform/”, “domains/”) match architecture model  
- validate that “apps/”, “services/”, “packages/” align with architecture views  
- emit `ImplementsArchitecture` edges into the graph

**Violations:**

- cross‑domain imports where forbidden  
- layer violations (e.g., infra → domain, UI → infra)  
- code modules with **no architecture mapping** (orphaned)  
- architecture nodes with **no code realization** (dead architecture)

These become **architecture drift events**.

---

## 🧬 5. ADR & Architecture Lineage Engine

Binds **ADRs** to **architecture** as a lineage chain.

**Responsibilities:**

- map ADRs to architecture nodes (domains, services, modules, boundaries)  
- ensure every major architecture element has ADR coverage where required  
- ensure superseded ADRs are reflected in architecture docs and diagrams  
- ensure ADR consequences are visible in architecture views  
- emit `RealizesADR` and `ADRLineage` edges into the graph  

**Invariants:**

- no critical architecture node without ADR lineage (where governance requires it)  
- no active architecture pattern backed only by superseded ADRs  
- no ADR that claims an architecture change without corresponding architecture updates  

ADR and architecture become **mutually constraining**.

---

## 🖼️ 6. Diagram Integration Engine

Integrates **diagrams** as governed, graph‑backed architecture views.

**Diagram types:**

- context diagrams  
- container diagrams  
- component diagrams  
- deployment diagrams  
- sequence/interaction diagrams (for critical flows)

**Responsibilities:**

- validate that each diagram references exactly the architecture nodes it depicts  
- validate that diagram relationships match architecture edges  
- validate that diagram metadata (version, ADR references, governance level) is correct  
- emit `RenderedByDiagram` edges  
- detect **diagram drift** when architecture changes but diagrams do not

Diagrams become **views over the graph**, not separate truth.

---

## 🧪 7. Architecture Drift Detector

Specialized drift detector for architecture.

**Drift types:**

- **Model Drift:** architecture docs disagree with CanonicalArchitectureModel  
- **Code Drift:** code dependencies violate architecture boundaries  
- **Diagram Drift:** diagrams no longer match architecture model  
- **ADR Drift:** ADRs and architecture disagree on decisions or status  
- **Boundary Drift:** domain/layer/platform boundaries violated or missing  
- **Topology Drift:** deployment/runtime docs diverge from governed topology  

**Responsibilities:**

- consume events (DocumentUpdated, ADRChanged, DiagramChanged, DependencyDriftDetected, ArchitectureDriftDetected)  
- recompute architecture invariants  
- emit **ArchitectureDriftDetected** and **DriftDetected** events  
- attach severity and impact (domains, services, critical paths)

This plugs directly into the **Documentation Drift Remediation Engine**.

---

## 🛠️ 8. Architecture Remediation Bridge

Connects architecture drift to **governed remediation**.

**Responsibilities:**

- map architecture drift → remediation strategies:  
  - update architecture docs  
  - update code boundaries (imports, module placement)  
  - update diagrams  
  - update ADRs  
  - update governance rules (if architecture change is intentional)  
- generate **ArchitectureRemediationUnits** for the Drift Remediation Engine  
- ensure remediation ordering:  
  1. ADRs  
  2. governance rules  
  3. architecture model  
  4. diagrams  
  5. code boundaries  
  6. documentation  

Outputs become **ChangePlans** applied via the Execution Agent and enforced in CI.

---

## 🔗 9. Integration points

**With Documentation System:**

- architecture docs are governed artifacts  
- architecture nodes live in the same graph as docs, ADRs, glossary, standards  
- architecture drift is part of the global drift model  

**With Code Linting Integration:**

- architectural boundary rules are enforced by linting  
- lint violations become architecture drift events  
- code structure validator uses architecture graph as source of truth  

**With CI Integration Layer:**

- CI runs architecture validation as a first‑class pipeline  
- merges are blocked on architecture drift or boundary violations  

**With Docs Agent:**

- Docs Agent uses architecture model to generate architecture summaries, module READMEs, and diagram references  
- Docs Agent updates architecture docs structurally, not semantically, under governance rules  

---

## 🧠 Non‑Obvious Insight

The Architecture Integration Layer is not “architecture docs support.”  
It is the **institutional architecture governance system** that:

- makes architecture **executable** as rules  
- makes architecture **visible** as a graph  
- makes architecture **enforceable** in code and CI  
- makes architecture **traceable** through ADRs and diagrams  
- makes architecture **remediable** when drift occurs  

It turns architecture from *slides and diagrams* into a **governed, living, enforceable substrate** of the monorepo.

---

If you want to go deeper next, we can define one of these as a full subsystem:

- **Architecture Knowledge Graph Schema**  
- **Code‑to‑Architecture Alignment Engine**  
- **Architecture Drift Detection Model**  
- **Architecture Remediation Strategy Engine**