docs-agent-execution-engine.md
Thomas — here is the **canonical, governance‑grade, institutionally complete specification** for the **Docs Agent Execution Engine**.  
This is the *final operational layer* of the Docs Agent: the subsystem that takes the Planning Engine’s deterministic, governance‑sequenced plan and executes it through the **Execution Agent Protocol**, producing real, governed, auditable repository changes.

If the **Reasoning Engine** is cognition, and the **Planning Engine** is executive sequencing, then the **Execution Engine** is the **judicial executor** — the only part of the Docs Agent allowed to *request* repository mutations (but never perform them directly).

Guided Links are embedded throughout so you can expand any subsystem.

---

# 🏛️ **Docs Agent Execution Engine (Canonical Specification)**  
**The deterministic, governance‑encoded execution subsystem that transforms a PlanningOutput into ExecutionRequests, validates them, sequences them, and submits them to the Execution Agent for atomic, auditable application.**

The Execution Engine ensures:

- execution is **deterministic**  
- execution is **governance‑encoded**  
- execution is **non‑mutative** (Docs Agent never writes files)  
- execution is **ChangePlan‑based**  
- execution is **atomic**  
- execution is **auditable**  
- execution is **drift‑resistant**  
- execution is **graph‑integrated**  

It is the **judicial executor** of the Docs Agent.

---

# 🧩 1. Execution Engine Architecture

The Execution Engine consists of **five governed subsystems**:

1. **Execution Normalizer**  
2. **Execution Validator**  
3. **Execution Sequencer**  
4. **ExecutionRequest Builder**  
5. **Execution Handoff Layer**

Each subsystem is deterministic and versioned.

---

# 🧱 2. Execution Normalizer  
Normalizes the PlanningOutput into a canonical execution structure.

### Responsibilities
- normalize action formats  
- normalize file paths  
- normalize metadata blocks  
- normalize graph update blocks  
- normalize drift baseline updates  
- normalize rationale blocks  

### Guarantees
- deterministic ordering  
- canonical formatting  
- stable diffs  

### Output
A **NormalizedExecutionPlan**.

See: **Plan Normalizer**

---

# 🧪 3. Execution Validator  
Validates the execution plan against governance, policy, and repository constraints.

### Responsibilities
- validate allowed roots  
- validate forbidden paths  
- validate governance mode  
- validate directory rules  
- validate metadata correctness  
- validate glossary/ADR/governance references  
- validate graph update correctness  
- validate drift baseline correctness  
- validate deterministic ordering  

### Violations
- structural violations  
- semantic violations  
- governance violations  
- graph violations  
- drift violations  

### Output
A **ValidatedExecutionPlan** or a **GovernanceViolationReport**.

If violations exist, the Docs Agent must return a **failure** to the Principal Engineer Agent.

---

# 🧭 4. Execution Sequencer  
Applies final ordering rules before execution.

### Responsibilities
- enforce governance ordering  
- enforce dependency ordering  
- enforce graph update ordering  
- enforce drift baseline ordering  
- enforce metadata‑before‑content ordering  
- enforce directory‑before‑file ordering  

### Governance Ordering Rules (Final)
1. governance metadata  
2. ADR lineage  
3. glossary semantics  
4. standards/lifecycle  
5. architecture/diagrams  
6. onboarding  
7. API docs  
8. local documentation  
9. drift baselines  
10. graph updates  

### Output
A **SequencedExecutionPlan**.

See: **Governance Sequencer**

---

# 🏗️ 5. ExecutionRequest Builder  
Transforms the SequencedExecutionPlan into **ExecutionRequests** for the Execution Agent.

### Responsibilities
- convert actions into ExecutionRequest operations  
- attach governance metadata  
- attach ADR lineage metadata  
- attach glossary semantic metadata  
- attach drift baseline metadata  
- attach graph update metadata  
- attach rationale blocks  

### ExecutionRequest Schema
```
ExecutionRequest:
  id: string
  actions: [...]
  metadata:
    governance: [...]
    adr: [...]
    glossary: [...]
    drift: [...]
    graph: [...]
  rationale:
    governanceJustification: ...
    adrJustification: ...
    glossaryJustification: ...
```

### Guarantees
- no direct file writes  
- no direct graph writes  
- no direct metadata writes  
- all mutations go through the Execution Agent  

### Output
A **ReadyForExecutionBundle**.

See: **Execution Agent Protocol**

---

# 🔄 6. Execution Handoff Layer  
Submits the ReadyForExecutionBundle to the Execution Agent.

### Responsibilities
- submit ExecutionRequests  
- await ChangeReport  
- validate ChangeReport  
- validate drift baselines  
- validate graph updates  
- validate metadata updates  
- validate deterministic application  

### ChangeReport Validation
- all actions applied  
- no forbidden mutations  
- no governance violations  
- no drift introduced  
- graph updated correctly  
- metadata updated correctly  

### If validation fails
- emit **ExecutionFailure**  
- return failure to Principal Engineer Agent  
- do not retry unless explicitly instructed  

### If validation succeeds
- emit **ExecutionSuccess**  
- return success to Principal Engineer Agent  

---

# 🧬 7. Execution Engine Guarantees

The Docs Agent Execution Engine guarantees:

- **no direct writes** — all writes go through the Execution Agent  
- **atomicity** — Execution Agent applies all or nothing  
- **auditability** — every action is logged  
- **determinism** — same plan → same result  
- **governance compliance** — no forbidden actions  
- **graph consistency** — graph updates validated  
- **drift resistance** — drift baselines updated  
- **reversibility** — Execution Agent can roll back  

This makes the Docs Agent safe to run in institutional environments.

---

# 🧠 Non‑Obvious Insight  
The Docs Agent Execution Engine is not an executor.  
It is a **governed execution coordinator**.

It ensures:

- the Docs Agent never mutates the repository  
- all mutations are governed  
- all mutations are validated  
- all mutations are atomic  
- all mutations are auditable  
- all mutations are graph‑integrated  
- all mutations are drift‑resistant  

It is the **judicial layer** that guarantees correctness, safety, and institutional integrity.

---

# 🔥 Your Next Move  
Which execution subsystem do you want to define next?

- **Execution Normalizer**  
- **Execution Validator**  
- **Execution Sequencer**  
- **ExecutionRequest Builder**