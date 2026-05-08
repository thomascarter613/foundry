docs-agent-planning-engine.md
Thomas — here is the **canonical, governance‑grade, institutionally complete specification** for the **Docs Agent Planning Engine**.  
This is the subsystem that transforms the Reasoning Engine’s outputs into a **sequenced, governed, dependency‑aware, deterministic execution plan** — the plan that ultimately becomes a ChangePlanFragment.

If the **Reasoning Engine** is the *brain*, the **Planning Engine** is the *executive function* that turns cognition into governed action.

Guided Links are embedded throughout so you can expand any subsystem.

---

# 🏛️ **Docs Agent Planning Engine (Canonical Specification)**  
**The deterministic, dependency‑aware, governance‑encoded planning subsystem that sequences documentation actions, resolves ordering constraints, merges structural and semantic updates, and produces an execution‑ready plan for ChangePlanFragment assembly.**

The Planning Engine ensures:

- planning is **deterministic**  
- planning is **governance‑encoded**  
- planning is **dependency‑aware**  
- planning is **graph‑aware**  
- planning is **non‑creative**  
- planning is **reversible**  
- planning is **drift‑resistant**  
- planning is **reproducible**  

It is the **execution orchestrator** of the Docs Agent.

---

# 🧩 1. Planning Engine Architecture

The Planning Engine consists of **five governed subsystems**:

1. **Action Graph Builder**  
2. **Dependency Resolver**  
3. **Governance Sequencer**  
4. **Plan Normalizer**  
5. **Plan Assembler**

Each subsystem is deterministic and versioned.

---

# 🧱 2. Action Graph Builder  
Transforms the Reasoning Engine outputs into a **Directed Acyclic Action Graph (DAAG)**.

### Inputs
- ResolvedScope  
- PolicyPlan  
- TemplatePlan  
- DocumentationStructure  
- GraphUpdatePlan  

### Responsibilities
- convert structural updates into actions  
- convert metadata updates into actions  
- convert graph updates into actions  
- convert navigation/index updates into actions  
- convert drift baseline updates into actions  

### Action Types
- `createFile`  
- `modifyFile`  
- `deleteFile`  
- `insertBlock`  
- `replaceBlock`  
- `appendBlock`  
- `updateMetadata`  
- `updateGraph`  
- `updateNavigation`  
- `updateDriftBaseline`  

### Output
A **raw action graph** with nodes = actions and edges = dependencies.

---

# 🧭 3. Dependency Resolver  
Ensures the action graph is **acyclic**, **complete**, and **correctly ordered**.

### Dependency Types
- **Structural Dependencies**  
  - file must exist before modification  
  - directory must exist before file creation  
  - metadata must exist before update  

- **Semantic Dependencies**  
  - glossary usage requires glossary term  
  - ADR reference requires ADR existence  
  - governance reference requires rule existence  

- **Graph Dependencies**  
  - graph nodes must exist before edges  
  - drift baselines must update after content  

- **Governance Dependencies**  
  - governance metadata must be validated before writing  
  - forbidden paths must be excluded  

### Guarantees
- no cycles  
- no missing prerequisites  
- no invalid ordering  
- no governance violations  

### Output
A **dependency‑resolved action graph**.

---

# 🏛️ 4. Governance Sequencer  
Applies governance‑encoded ordering rules.

### Governance Ordering Rules
1. **Governance metadata first**  
2. **ADR lineage second**  
3. **Glossary semantics third**  
4. **Standards and lifecycle fourth**  
5. **Architecture and diagrams fifth**  
6. **Onboarding sixth**  
7. **API references seventh**  
8. **Local documentation last**

### Responsibilities
- reorder actions to satisfy governance  
- enforce forbidden/required ordering  
- enforce governance mode (strict/standard/experimental)  
- enforce template lineage rules  

### Output
A **governance‑sequenced action list**.

See: **Policy Resolution Engine**

---

# 🧼 5. Plan Normalizer  
Ensures the plan is **canonical**, **minimal**, and **diff‑friendly**.

### Responsibilities
- merge adjacent actions  
- remove redundant actions  
- collapse multi‑step updates  
- normalize ordering  
- normalize formatting  
- normalize metadata blocks  
- normalize reference blocks  
- normalize drift baseline updates  

### Guarantees
- deterministic output  
- minimal action set  
- stable diffs  
- reproducible planning  

### Output
A **NormalizedPlan**.

---

# 🏗️ 6. Plan Assembler  
Converts the NormalizedPlan into a **ChangePlanFragment‑ready structure**.

### Responsibilities
- convert actions into ChangePlanFragment actions  
- attach governance justification  
- attach ADR lineage justification  
- attach glossary semantic justification  
- attach drift baseline fingerprints  
- attach graph update metadata  
- attach navigation/index updates  

### Output
A **PlanningOutput** object containing:

- ordered actions  
- metadata updates  
- graph updates  
- drift baseline updates  
- rationale blocks  

This is passed to the **ChangePlanFragment Assembly Engine**.

---

# 🧠 Non‑Obvious Insight  
The Docs Agent Planning Engine is not a scheduler.  
It is a **governed execution planner** that ensures:

- documentation updates occur in the correct order  
- governance is enforced at the planning level  
- ADR lineage is preserved  
- glossary semantics propagate  
- standards remain aligned  
- drift baselines remain accurate  
- the knowledge graph remains consistent  

It is the **execution orchestrator** that guarantees the Docs Agent never produces invalid or unordered documentation changes.

---

# 🔥 Your Next Move  
Which subsystem of the Planning Engine do you want to define next?

- **Action Graph Builder**  
- **Dependency Resolver**  
- **Governance Sequencer**  
- **Plan Normalizer**