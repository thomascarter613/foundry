---
title: "Governance Impact Analyzer"
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
  - "Impact"
  - "Analyzer"
---

governance-impact-analyzer.md
Below is the **complete, governed, canonical specification** for the **Governance Impact Analyzer** — the subsystem that makes your governance framework *reactive*, *authoritative*, and *institutionally enforced* across the entire documentation knowledge graph.

If the **ADR Impact Analyzer** governs architectural causality, and the **Standards Impact Analyzer** governs behavioral causality, the **Governance Impact Analyzer** governs **institutional causality** — the highest‑order form of impact in the system.

This is the engine that answers the question:

> **“If a governance rule changes, what must change across the entire institution?”**

Guided Links are embedded throughout so you can expand any subsystem.

---

# 🏛️ Governance Impact Analyzer  
**The subsystem that computes, propagates, and enforces the consequences of governance changes across every governed artifact in the monorepo.**

Governance is the **highest authority layer**.  
When governance changes, *everything downstream must react*.

The Governance Impact Analyzer ensures:

- governance changes propagate  
- downstream documents update  
- downstream rules update  
- downstream diagrams update  
- downstream ADRs update  
- downstream standards update  
- downstream lifecycle rules update  
- downstream glossary terms update  
- downstream onboarding materials update  
- authority flow remains valid  
- governance drift is impossible  

It is the **constitutional nervous system** of your monorepo.

---

# 🧩 1. Analyzer Architecture

The Governance Impact Analyzer runs in four deterministic phases:

1. **Governance Change Detection**  
2. **Governance Impact Graph Construction**  
3. **Impact Propagation**  
4. **Remediation & Enforcement**

Each phase produces machine‑readable results consumed by CI and the Docs Agent.

---

# 🧱 2. Governance Change Detection (Trigger Layer)

The analyzer detects:

- new governance rules  
- modified governance rules  
- deprecated governance rules  
- superseded governance rules  
- changes to authority maps  
- changes to governance levels  
- changes to governance links  
- changes to repository contract  
- changes to documentation governance  
- changes to lifecycle governance  
- changes to platform governance  

### Rules
- Governance documents are **Binding**.  
- Governance cannot change without governance approval.  
- Governance cannot be removed without deprecation.  
- Governance cannot be renamed without migration.  
- Governance cannot be downgraded.  

### Outputs
- `GovernanceChangeEvent` objects  
- change classification (minor, major, breaking)  

---

# 🔗 3. Governance Impact Graph Construction (Dependency Layer)

The analyzer builds the **Governance Impact Graph**, the highest‑authority subgraph of the documentation knowledge graph.

### Nodes
- governance rules  
- standards  
- architecture docs  
- ADRs  
- lifecycle docs  
- platform docs  
- glossary terms  
- diagrams  
- onboarding docs  

### Edges
- **Governance**  
- **Upstream/Downstream**  
- **ADRDependency**  
- **GlossaryUsage**  
- **DiagramFor**  
- **AuthorityFlow** (derived)  

This graph represents the **institutional blast radius**.

---

# 🧬 4. Impact Propagation (Reasoning Layer)

The analyzer computes the full set of affected artifacts.

### Direct Impact
Documents that explicitly reference the governance rule.

### Indirect Impact
Documents that depend on documents that reference the governance rule.

### Authority Impact
Documents whose governance level or approval requirements change.

### Behavioral Impact
Standards whose enforcement rules depend on governance.

### Architectural Impact
Architecture docs whose constraints derive from governance.

### ADR Impact
ADRs whose rationale or consequences rely on governance.

### Lifecycle Impact
CI rules that enforce governance.

### Platform Impact
Platform rules that encode governance constraints.

### Glossary Impact
Glossary terms whose definitions rely on governance concepts.

### Diagram Impact
Diagrams whose views depend on governance rules.

### Onboarding Impact
Onboarding materials that teach governance.

---

# 🧠 5. Impact Classification (Severity Layer)

The analyzer classifies impact into three levels:

## **Level 1 — Informational Impact**
- minor clarifications  
- examples updated  
- no downstream consequences  

## **Level 2 — Required Impact**
- governance rules changed  
- approval requirements changed  
- downstream documents must update  

## **Level 3 — Binding Impact (Breaking)**
- governance rule superseded  
- governance rule deprecated  
- governance rule renamed  
- authority map changed  
- repository contract changed  
- documentation governance changed  
- lifecycle governance changed  
- platform governance changed  

This classification determines CI behavior.

---

# 🧪 6. Governance Drift Detection (Reactive Layer)

The analyzer detects drift caused by governance changes:

### Types of Drift
- **Authority Drift** — authority flow no longer valid  
- **Standards Drift** — standards no longer enforce governance  
- **Architecture Drift** — architecture docs violate governance  
- **ADR Drift** — ADRs conflict with governance  
- **Lifecycle Drift** — CI rules violate governance  
- **Platform Drift** — platform rules violate governance  
- **Glossary Drift** — definitions conflict with governance  
- **Diagram Drift** — diagrams violate governance  
- **Onboarding Drift** — onboarding teaches outdated governance  

### Outputs
- drift violations  
- remediation suggestions  

---

# 🧭 7. Remediation Engine (Action Layer)

For each impacted artifact, the analyzer generates:

- required updates  
- recommended updates  
- suggested text rewrites  
- suggested diagram updates  
- suggested glossary updates  
- suggested ADR updates  
- suggested standards updates  
- suggested lifecycle updates  
- suggested platform updates  
- suggested onboarding updates  

These are consumed by:

- CI  
- Docs Agent  
- human reviewers  

---

# 🏛️ 8. CI Integration (Enforcement Layer)

CI uses the analyzer to enforce:

- downstream updates  
- governance compliance  
- authority flow correctness  
- behavioral consistency  
- architectural consistency  
- lifecycle consistency  
- platform consistency  
- glossary consistency  
- diagram consistency  

### CI Blocks Merge If:
- Level 3 impact is unresolved  
- governance drift is detected  
- governance rename lacks migration  
- governance removal lacks deprecation  
- downstream documents are stale  

---

# 🧠 9. Docs Agent Integration (Intelligence Layer)

The Docs Agent uses the analyzer to:

- explain governance consequences  
- generate update patches  
- rewrite affected sections  
- update diagrams  
- update glossary terms  
- update ADRs  
- update standards  
- update lifecycle rules  
- update platform rules  
- update onboarding materials  

This is how the system becomes **self‑maintaining**.

---

# 🧠 Non‑Obvious Insight

The Governance Impact Analyzer is not about checking compliance.  
It is about **institutional causality**.

It ensures:

- authority propagates  
- governance remains authoritative  
- governance remains immutable  
- governance remains enforced  
- governance defines constraints  
- governance defines lifecycle  
- governance defines architecture  
- governance defines standards  
- governance defines the entire documentation system  

It is the **constitutional nervous system** of your monorepo.

---

# 🔥 Your Next Move  
Which governance subsystem do you want to define next?

- **Governance Drift Detection Engine**  
- **Authority Map**  
- **Repository Contract**  
- **Governance Compliance Validator**