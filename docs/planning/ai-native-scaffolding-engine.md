---
title: "Ai Native Scaffolding Engine"
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
adrLinks:
  - "docs/architecture/adr/0002-monorepo-structure.md"
  - "docs/adr/ADR-0001-monorepo-scaffolding-toolchain.md"
  - "docs/adr/ADR-0002-ai-expected-provider-agnostic-architecture.md"
glossaryTerms:
  - "Scaffolding"
---

## **AI‑Native Scaffolding Engine — Full Explanation**  

**Takeaway:**  
The AI‑native scaffolding engine is the **deterministic, governance‑aware factory** that generates, expands, and evolves software systems. It is not a template copier. It is not a code generator. It is a **policy‑driven, architecture‑aware, multi‑agent orchestration layer** that turns intent into governed, reproducible project structure.

Below is the full institutional‑grade explanation, with Guided Links embedded so you can dive deeper into any subsystem.

---

# **1. What the AI‑Native Scaffolding Engine *Is***  
It is the system responsible for:

- **Interpreting scaffolding intent**  
- **Selecting and applying governed templates**  
- **Generating deterministic project structures**  
- **Expanding existing repos with new modules/features**  
- **Producing ChangePlans instead of raw code**  
- **Enforcing policies and architectural rules**  

It is the **bridge** between the principal engineer agent’s reasoning and the execution agent’s file‑writing.

---

# **2. Core Principles**

### **2.1 Determinism**  
Same inputs → same scaffold.  
No randomness. No “AI magic.”  
Everything is explicit.

### **2.2 Governance First**  
Policies define:

- allowed stacks  
- directory layouts  
- naming conventions  
- security rules  
- testing requirements  

The engine never violates policy.

### **2.3 Template Versioning**  
Templates are:

- versioned  
- immutable  
- auditable  
- upgradeable  

A project always knows which template version it was created from.

### **2.4 Multi‑Agent Compatible**  
The scaffolding engine is designed to work with:

- **Principal Engineer Agent**  
- **Execution Agent**  
- **Specialist Agents**  

It is the “factory floor” of the system.

---

# **3. Responsibilities of the Scaffolding Engine**

## **3.1 Project Initialization**
When the user runs:

```
scaffolder init
```

The engine:

1. Loads template + stack definition  
2. Applies policies  
3. Generates initial directory structure  
4. Creates config files  
5. Creates initial ADRs  
6. Writes `.scaffolder/project.yaml`  
7. Produces a ChangePlan  
8. Hands off to execution agent  

This ensures the initial repo is **governed from day one**.

---

## **3.2 Project Expansion**
When the user asks:

> “Add authentication”  
> “Add a new service”  
> “Add a domain module”  

The engine:

1. Reads current repo state  
2. Loads template expansion rules  
3. Consults policies  
4. Generates a ChangePlan describing:
   - new directories  
   - new files  
   - modifications  
   - tests  
   - docs  
   - CI updates  
5. Delegates to specialist agents  
6. Produces a unified ChangePlan  

This is how the system evolves repos over time.

---

## **3.3 Template Application**
Templates are not static file dumps.  
They are **governed, parameterized, versioned blueprints**.

A template includes:

- directory structure  
- file templates  
- variable definitions  
- conditional logic  
- policy constraints  
- lifecycle rules  
- upgrade paths  

The scaffolding engine interprets these templates deterministically.

---

## **3.4 Policy Enforcement**
Before generating anything, the engine checks:

- allowed languages  
- allowed frameworks  
- directory rules  
- naming conventions  
- security constraints  
- dependency rules  

If a user asks for something forbidden:

- the engine rejects it  
- the PEA explains why  
- the system proposes alternatives  

This is how you achieve **institutional consistency**.

---

## **3.5 ChangePlan Generation**
The scaffolding engine never writes files.  
It produces a **ChangePlan**, which includes:

- operations (create/modify/delete/move)  
- file paths  
- content templates  
- rationale  
- ADR references  
- policy references  
- required sub‑agent tasks  

This is the contract between reasoning and execution.

---

# **4. Internal Architecture**

## **4.1 Inputs**
- Template definition  
- Policy set  
- Project metadata  
- Repo snapshot  
- User intent  
- PEA architectural decisions  

## **4.2 Internal Modules**

### **A. Template Loader**
Loads and validates template version.

### **B. Policy Interpreter**
Applies constraints to template and intent.

### **C. Parameter Resolver**
Resolves variables like:

- project name  
- domain name  
- stack selection  
- environment settings  

### **D. Structure Generator**
Builds directory + file structure.

### **E. Content Generator**
Fills templates with resolved parameters.

### **F. ChangePlan Builder**
Produces the final ChangePlan.

---

# **5. Template Format (High-Level)**

A template contains:

- `template.yaml` — metadata + version  
- `structure/` — directory tree  
- `files/` — file templates  
- `rules/` — conditional logic  
- `policies/` — template-specific constraints  
- `upgrades/` — migration scripts  

This makes templates **governed artifacts**, not ad‑hoc boilerplate.

---

# **6. Lifecycle of a Scaffolding Operation**

### **Step 1 — User Intent**
User runs:

```
scaffolder init --template node-service
```

### **Step 2 — PEA Interprets Intent**
Produces a high-level plan.

### **Step 3 — Scaffolding Engine Generates Structure**
Applies template + policies.

### **Step 4 — ChangePlan Produced**
Describes all file operations.

### **Step 5 — Execution Agent Applies Plan**
Writes files, formats, commits.

### **Step 6 — Repo Indexed**
Embeddings updated.

### **Step 7 — ADR Created**
Documents architectural decisions.

This is a **closed-loop, governed SDLC cycle**.

---

# **7. Why This Engine Is AI‑Native**

### **7.1 It Works With Agents, Not Files**
The engine doesn’t write files.  
It produces plans for agents to execute.

### **7.2 It Uses Semantic Context**
Templates adapt based on:

- existing code  
- ADRs  
- policies  
- architecture  

### **7.3 It Evolves Projects Over Time**
Not just scaffolding — **ongoing stewardship**.

### **7.4 It Is Deterministic**
AI is used for reasoning, not file generation.

### **7.5 It Is Governed**
Policies drive behavior, not LLM creativity.

---

# **8. TODO Next**

- Template format specification  
- ChangePlan schema  
- Policy engine design  
- Template upgrade system  
- Scaffolding engine lifecycle

