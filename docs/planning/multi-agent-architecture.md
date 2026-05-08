---
title: "Multi Agent Architecture"
status: "Draft"
owner: "Product Architecture"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "Planning"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

### Multi‑agent architecture for the AI‑native scaffolder

---

## 1. High‑level topology

- **User interface layer:**  
  **CLI** (primary), optional API/GUI later.
- **Reasoning layer:**  
  **Principal Engineer Agent (PEA)** — long‑horizon reasoning, SDLC guidance.  
  **Specialist Sub‑agents** (optional, pluggable) — tests, docs, infra, etc.
- **Execution layer:**  
  **Execution Agent (EA)** — deterministic file/diff writer.  
  **VCS Agent** — commits, branches, PRs, tags.
- **Memory & state layer:**  
  **Repo Store** (Git) — canonical truth.  
  **Vector Store** — semantic memory.  
  **Relational/Key‑Value Store** — sessions, runs, policies, metadata.
- **Governance layer:**  
  **Policy Engine** — enforces rules, templates, constraints across agents.

---

## 2. Core agents and responsibilities

### 2.1 Principal engineer agent (PEA)

**Role:** Brain of the system.

**Responsibilities:**
- **Architecture & design:**  
  Proposes structures, patterns, boundaries, layering, domain modeling.
- **SDLC orchestration:**  
  Breaks work into milestones, tasks, and change sets.
- **Conversation & intent:**  
  Interprets user goals from CLI, maintains project narrative.
- **Change planning:**  
  Produces *change plans* (not code):  
  - files to create/modify/delete  
  - high‑level content descriptions  
  - rationale and links to ADRs.
- **Delegation:**  
  Routes sub‑tasks to specialist agents (tests, docs, infra).
- **Governance awareness:**  
  Consults policy engine before proposing changes.

**Outputs (never raw file writes):**
- **ChangePlan:** structured spec of intended modifications.  
- **ADRs / design notes:** markdown artifacts to be materialized by EA.  
- **Tasks:** typed units for specialist agents.

---

### 2.2 Specialist sub‑agents

All follow the same pattern: they **consume context + constraints**, and emit **ChangePlan fragments**, never touching the filesystem.

Examples:

- **Testing Agent:**
  - Generates/updates test files.
  - Ensures coverage for new/changed modules.
  - Aligns with test strategy policy.

- **Documentation Agent:**
  - Generates/updates README, architecture docs, API docs.
  - Maintains docs index and navigation.
  - Produces ADR drafts from PEA decisions.

- **CI/CD Agent:**
  - Proposes pipelines, workflows, quality gates.
  - Aligns with org’s CI/CD policy templates.

- **Infra/Config Agent:**
  - Manages IaC, environment configs, secrets interfaces.
  - Ensures consistency across environments.

Each sub‑agent:
- **Input:** Scoped repo context, relevant files, policies, and a task.  
- **Output:** `ChangePlanFragment` (files + diffs + rationale).

---

### 2.3 Execution agent (EA)

**Role:** Hands of the system.

**Responsibilities:**
- **Plan validation:**  
  Validate `ChangePlan` against:
  - repo state  
  - policies  
  - invariants (e.g., no writes outside allowed roots).
- **Diff synthesis:**  
  Convert high‑level plan into concrete diffs:
  - new files with full content  
  - patch existing files  
  - delete/move files.
- **Atomic application:**  
  Apply changes to a working tree atomically:
  - fail fast on conflicts  
  - rollback on partial failure.
- **Formatting & linting:**  
  Run formatters/linters as configured.
- **Reporting:**  
  Return a **ChangeReport** to PEA + CLI:
  - what changed  
  - what failed  
  - follow‑up suggestions.

**Strict constraints:**
- No free‑form generation; only implements plans.  
- No deviation from policy engine decisions.  
- No direct user interaction.

---

### 2.4 VCS agent

**Role:** Version control steward.

**Responsibilities:**
- **Branching strategy:**  
  Create feature branches, release branches per policy.
- **Commit orchestration:**  
  Group changes into logical commits with structured messages.
- **PR/MR creation:**  
  Open PRs with:
  - summary  
  - linked ADRs  
  - change impact notes.
- **Tagging & releases:**  
  Tag versions, generate release notes from change history.

**Inputs:**
- ChangeReports from EA  
- Policy rules for branching/commit conventions.

---

## 3. Shared services and data contracts

### 3.1 Memory layer

- **Repo store (Git):**
  - Canonical state of code, docs, configs.
  - Source for all context snapshots.

- **Vector store:**
  - Embeddings for:
    - files  
    - ADRs  
    - conversations  
    - change plans  
  - Used by PEA and sub‑agents for semantic recall.

- **Relational/Key‑Value store:**
  - Projects, sessions, runs, policies, agent configs.
  - Links between:
    - conversations ↔ change plans ↔ commits ↔ ADRs.

---

### 3.2 Policy engine

**Scope:**
- Allowed languages, frameworks, layouts.
- Directory and naming conventions.
- Security and compliance rules.
- CI/CD and testing requirements.
- Governance rules for approvals, reviews.

**Usage:**
- PEA queries it before proposing architecture or changes.
- Sub‑agents query it for domain‑specific constraints.
- EA enforces it at write time.
- VCS agent enforces it at commit/branch/PR time.

---

### 3.3 Data contracts (key types)

- **UserIntent:** parsed from CLI input; includes goal, scope, constraints.
- **ChangePlan:**  
  - `id`  
  - `origin_agent`  
  - `rationale`  
  - `operations[]` (create/modify/delete/move)  
  - `links` (ADRs, issues, tasks).
- **ChangePlanFragment:** same as above, but scoped; merged into a full plan.
- **ChangeReport:**  
  - `status` (success/partial/failure)  
  - `applied_operations[]`  
  - `errors[]`  
  - `follow_up_suggestions[]`.
- **PolicySet:** versioned set of rules applied to a project.

---

## 4. Core interaction flows

### 4.1 New project scaffolding

1. **CLI → PEA:**  
   User runs `scaffolder init`. CLI sends `UserIntent(project_type, constraints)`.
2. **PEA:**  
   - Consults Policy Engine.  
   - Designs architecture + layout.  
   - Emits `ChangePlan` for initial repo.
3. **EA:**  
   - Validates plan.  
   - Generates files, applies diffs.  
   - Runs formatters.  
   - Returns `ChangeReport`.
4. **VCS Agent:**  
   - Initializes repo, first commit, branch per policy.
5. **PEA → CLI:**  
   - Summarizes architecture, next steps, ADRs.

---

### 4.2 Feature evolution

1. **CLI → PEA:**  
   User: “Add user authentication with JWT.”
2. **PEA:**  
   - Queries vector store + repo.  
   - Plans changes (domains, modules, routes, tests, docs).  
   - Delegates:
     - Auth logic → PEA or Domain Agent  
     - Tests → Testing Agent  
     - Docs → Documentation Agent.
3. **Sub‑agents:**  
   - Each returns `ChangePlanFragment`.
4. **PEA:**  
   - Merges fragments into a single `ChangePlan`.  
   - Validates with Policy Engine.
5. **EA:**  
   - Applies plan, returns `ChangeReport`.
6. **VCS Agent:**  
   - Commits, opens PR if configured.
7. **PEA → CLI:**  
   - Explains what changed, how to verify, and follow‑up work.

---

### 4.3 Governance enforcement

- Any agent proposing a change must:
  - query Policy Engine  
  - annotate `ChangePlan` with policy references.
- EA:
  - rejects operations violating policies.  
  - returns structured errors for PEA to explain and adjust.
- VCS Agent:
  - blocks commits/PRs that violate commit/branch/review policies.

---

## 5. Non‑functional properties

- **Determinism:**  
  - Same inputs (repo state, policies, intent) → same `ChangePlan`.
- **Traceability:**  
  - Every change linked: intent → plan → execution → commit → ADR.
- **Extensibility:**  
  - New specialist agents plug in via the same `ChangePlanFragment` contract.
- **Isolation:**  
  - Reasoning agents never write files.  
  - Execution agent never free‑forms code or talks to users.
- **Auditability:**  
  - All plans, reports, and policy decisions are stored and versioned.

---

next:

- define the **exact `ChangePlan` schema**, 
- design the **CLI flows** that map cleanly onto this architecture.