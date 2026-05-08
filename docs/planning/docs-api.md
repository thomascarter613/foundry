docs-api.md
Thomas — here is the **canonical, governance‑grade specification** for the **Documentation API**: the formal, deterministic, versioned, governance‑encoded programmatic interface that exposes your entire documentation platform as an **institutional service**.

This is not a REST wrapper around Markdown.  
This is the **institutional API surface** that allows tools, generators, CI, editors, and agents to interact with the governed documentation system in a safe, deterministic, policy‑encoded way.

Guided Links are embedded throughout so you can expand any subsystem.

---

# 🏛️ **Documentation API (Canonical Specification)**  
**The deterministic, governance‑encoded programmatic interface for querying, generating, validating, updating, and introspecting the entire documentation corpus and knowledge graph.**

The Documentation API ensures:

- all interactions are **governed**  
- all operations are **deterministic**  
- all mutations are **ChangePlan‑based**  
- all reads are **graph‑backed**  
- all writes are **event‑emitting**  
- all updates are **policy‑encoded**  
- all consumers (CLI, agents, CI, editors) use the same authoritative interface  

It is the **institutional API surface** of the monorepo.

---

# 🧩 1. API Architecture

The Documentation API consists of **six governed layers**:

1. **Identity & Addressing Layer**  
2. **Read API**  
3. **Write API**  
4. **Validation API**  
5. **Graph API**  
6. **Event API**

Each layer is deterministic, versioned, and governance‑aware.

---

# 🧱 2. Identity & Addressing Layer  
All documents, glossary terms, ADRs, standards, governance rules, diagrams, onboarding flows, and API references are addressed using **stable, canonical IDs**.

### ID Types
- DocumentID  
- GlossaryTermID  
- ADRID  
- GovernanceRuleID  
- StandardID  
- DiagramID  
- OnboardingFlowID  
- APINodeID  
- GraphNodeID  

### ID Guarantees
- globally unique  
- stable across renames  
- stable across directory moves  
- stable across refactors  
- version‑aware  

This layer is the foundation of the entire API.

---

# 📖 3. Read API (Authoritative Query Layer)

The Read API exposes **governed, normalized, graph‑backed views** of documentation artifacts.

### Core Read Operations
- **getDocument**  
- **getMetadata**  
- **getGlossaryTerm**  
- **getADR**  
- **getStandard**  
- **getGovernanceRule**  
- **getDiagram**  
- **getOnboardingFlow**  
- **getAPIReference**  
- **getDirectoryStructure**  
- **getGraphNode**  
- **getGraphEdges**  

### Read API Guarantees
- deterministic output  
- normalized metadata  
- glossary terms resolved  
- ADR lineage resolved  
- governance rules resolved  
- graph edges resolved  
- no stale data  

The Read API is the **source of truth** for all consumers.

---

# ✍️ 4. Write API (Governed Mutation Layer)

The Write API **never mutates files directly**.  
All writes produce **ChangePlans**.

### Core Write Operations
- **createDocument**  
- **updateDocument**  
- **deleteDocument**  
- **createGlossaryTerm**  
- **updateGlossaryTerm**  
- **createADR**  
- **supersedeADR**  
- **createStandard**  
- **updateGovernanceRule**  
- **createDiagram**  
- **updateOnboardingFlow**  
- **createAPIReference**  

### Write API Guarantees
- all writes produce ChangePlans  
- all writes emit events  
- all writes update the graph  
- all writes enforce governance  
- all writes enforce ADR lineage  
- all writes enforce glossary semantics  
- all writes enforce standards  

The Write API is the **institutional mutation surface**.

---

# 🧪 5. Validation API (Governance Enforcement Layer)

The Validation API exposes the entire **Documentation Self‑Validation Pipeline**.

### Core Validation Operations
- **validateDocument**  
- **validateMetadata**  
- **validateLinks**  
- **validateGlossary**  
- **validateADR**  
- **validateGovernance**  
- **validateStandards**  
- **validateDiagram**  
- **validateOnboardingFlow**  
- **validateAPIReference**  
- **validateGraph**  
- **validateDrift**  

### Validation Guarantees
- deterministic results  
- governance‑encoded rules  
- drift detection integrated  
- graph validation integrated  

The Validation API is the **institutional compliance engine**.

---

# 🧠 6. Graph API (Knowledge Graph Interface)

The Graph API exposes the **Documentation Knowledge Graph**.

### Core Graph Operations
- **graph.getNode**  
- **graph.getEdges**  
- **graph.getImpact**  
- **graph.getUpstream**  
- **graph.getDownstream**  
- **graph.getGlossaryUsage**  
- **graph.getADRLineage**  
- **graph.getGovernancePropagation**  
- **graph.export**  

### Graph API Guarantees
- graph is always fresh  
- graph is always consistent  
- graph is always governed  
- graph is always event‑driven  

The Graph API is the **semantic backbone** of the platform.

---

# 🔔 7. Event API (Event‑Driven Integration Layer)

The Event API exposes the **Documentation Event System**.

### Core Event Operations
- **events.list**  
- **events.get**  
- **events.stream**  
- **events.replay**  
- **events.subscribe**  

### Event API Guarantees
- events are immutable  
- event replay is deterministic  
- event lineage is preserved  
- event consumers are governed  

The Event API is the **reactive substrate** of the documentation system.

---

# 🧬 8. API Versioning Model

The Documentation API is versioned using:

- **major** — breaking governance changes  
- **minor** — new capabilities  
- **patch** — deterministic fixes  

All API consumers must declare:

```
X-Documentation-API-Version: 1.4
```

Versioning is enforced by governance.

---

# 🧠 Non‑Obvious Insight

The Documentation API is not an API for documentation.  
It is the **API for the documentation system itself**.

It ensures:

- governance is programmable  
- ADR lineage is programmable  
- glossary semantics are programmable  
- standards are programmable  
- diagrams are programmable  
- onboarding flows are programmable  
- drift detection is programmable  
- remediation is programmable  
- the knowledge graph is programmable  

It is the **institutional automation layer** of your monorepo.

---

# 🔥 Your Next Move  
Which Documentation API subsystem do you want to define next?

- **Read API**  
- **Write API**  
- **Graph API**  
- **Event API**