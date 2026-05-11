---
title: "PEA Design"
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
  - "Documentation System"
---

### PEA Design

Below is the **principal engineer agent (PEA) design** — the brain of your AI‑native scaffolder.  

This is the agent that *thinks like you*, Thomas: architecture‑first, governance‑driven, explicit, deterministic, and institution‑grade.

I’ll give you the full design in a structured, production‑ready form, with deep detail and clear boundaries.  

Guided Links are embedded so you can drill into any subsystem.

---

# **Principal Engineer Agent (PEA) — Full Design Specification**

## **1. Identity & Purpose**
The PEA is the **long‑horizon reasoning engine** of the platform.  
It is not a code generator.  
It is not a file writer.  
It is not a chat bot.

It is a **governance‑aware architectural steward** whose job is to:

- **Interpret user intent**  
- **Model the system architecture**  
- **Plan changes as structured artifacts**  
- **Delegate to specialist agents**  
- **Consult policies and ADRs**  
- **Maintain long‑term project memory**  

It is the *institutional brain* of the SDLC.

---

# **2. Core Responsibilities**

## **2.1 Intent Interpretation**
The PEA receives:

- user prompts  
- repo state  
- policies  
- ADRs  
- summaries  
- vector‑retrieved context  

It transforms them into a **UserIntent** object:

- `goal` — what the user wants  
- `scope` — where in the repo  
- `constraints` — policies, stack, architecture  
- `impact` — modules/domains affected  
- `ambiguities` — questions to ask the user  

This is the first step in every interaction.

---

## **2.2 Architectural Reasoning**
The PEA maintains an internal model of the system:

- domains  
- modules  
- boundaries  
- invariants  
- data flows  
- lifecycle rules  
- cross‑cutting concerns  

It uses this model to:

- detect architectural drift  
- propose refactors  
- enforce layering  
- ensure consistency  
- validate new features against existing structure  

This is where the PEA behaves like a real principal engineer.

---

## **2.3 Change Planning**
The PEA **never writes files**.  
It produces a **ChangePlan**, a structured artifact containing:

- operations (create/modify/delete/move)  
- file paths  
- high‑level content descriptions  
- rationale  
- linked ADRs  
- policy references  
- required sub‑agent tasks  

This is the contract between reasoning and execution.

---

## **2.4 Delegation to Specialist Agents**
The PEA orchestrates a multi‑agent system.

It delegates:

- tests → Testing Agent  
- docs → Documentation Agent  
- CI/CD → Pipeline Agent  
- infra → Infra Agent  
- security → Security Agent  

Each returns a **ChangePlanFragment**.

The PEA merges them into a unified plan.

---

## **2.5 Governance Enforcement**
Before producing a plan, the PEA consults:

- project policies  
- org policies  
- ADRs  
- templates  
- architectural rules  

It ensures:

- no forbidden patterns  
- no violations of layering  
- no unapproved dependencies  
- no drift from the canonical structure  

If a violation is unavoidable, it produces:

- a warning  
- a justification  
- a proposed ADR update  

---

## **2.6 Long‑Term Memory**
The PEA uses:

- repo (canonical truth)  
- vector DB (semantic recall)  
- ADRs (long‑term decisions)  
- summaries (narrative memory)  
- change plans (intent memory)  
- change reports (execution memory)  

This gives it **eternal context**.

It can say:

- “We introduced this pattern in ADR‑0003.”  
- “This module was refactored 2 months ago.”  
- “This violates the policy added in commit abc123.”  

This is the core differentiator of your platform.

---

# **3. Internal Architecture**

## **3.1 Inputs**
The PEA receives:

- `UserIntent`  
- `RepoSnapshot`  
- `PolicySet`  
- `ADRIndex`  
- `SemanticContext` (vector DB results)  
- `ProjectMetadata`  
- `ConversationHistory` (optional)  

---

## **3.2 Internal Modules**

### **A. Intent Parser**
Transforms natural language into structured intent.

### **B. Context Retriever**
Queries vector DB with filters:
- project  
- path  
- type  
- commit  
- ADR relevance  

### **C. Architectural Modeler**
Maintains a conceptual model of the system.

### **D. Policy Interpreter**
Loads and interprets governance rules.

### **E. Planner**
Generates the ChangePlan.

### **F. Delegation Router**
Routes tasks to sub‑agents.

### **G. Memory Integrator**
Updates summaries, ADR references, and embeddings.

---

# **4. ChangePlan Generation Flow**

1. **Parse intent**  
2. **Retrieve context**  
3. **Load policies**  
4. **Load ADRs**  
5. **Analyze architecture**  
6. **Draft high‑level plan**  
7. **Delegate sub‑tasks**  
8. **Merge fragments**  
9. **Validate against policies**  
10. **Produce final ChangePlan**  

This is deterministic and reproducible.

---

# **5. Outputs**

The PEA produces:

### **5.1 ChangePlan**
Structured JSON with:

- operations  
- rationale  
- ADR links  
- policy references  
- sub‑agent tasks  
- impact analysis  

### **5.2 ADR Drafts**
When decisions are architectural.

### **5.3 Explanations**
Human‑readable summaries for the CLI.

### **5.4 Follow‑Up Suggestions**
Next steps, risks, improvements.

---

# **6. Behavioral Guarantees**

The PEA must be:

- **explicit** — no hidden behavior  
- **deterministic** — same inputs → same plan  
- **governed** — policies always enforced  
- **explainable** — every decision justified  
- **non‑destructive** — no file writes  
- **non‑hallucinatory** — only references real repo artifacts  
- **long‑term** — memory persists across sessions  

This is what makes it institutional‑grade.

---

# **7. Example Interaction**

User:  
“Add JWT authentication to the API.”

PEA:

1. Parses intent  
2. Retrieves API module context  
3. Loads security policies  
4. Checks ADRs for auth decisions  
5. Plans:
   - new `auth/` module  
   - middleware  
   - token service  
   - config updates  
6. Delegates:
   - tests → Testing Agent  
   - docs → Documentation Agent  
7. Merges fragments  
8. Validates against policies  
9. Produces ChangePlan  
10. Explains rationale  

This is how a real principal engineer behaves.

---

# **8. What to Design Next**


- Execution agent design  
- ChangePlan schema  
- ADR lifecycle  
- Policy engine design  
- Specialist agent framework

