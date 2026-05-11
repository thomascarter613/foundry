---
title: "CLI Spec"
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
  - "CLI"
---

### CLI specification for the AI‑native scaffolder

---

## 1. Design principles

- **Explicit over magic:** No hidden behavior; every action is visible and explainable.  
- **Deterministic:** Same inputs → same scaffold/plan.  
- **Repo‑centric:** The repo is the source of truth; CLI never bypasses it.  
- **Agent‑aware:** CLI talks in terms of *plans*, *agents*, and *runs*, not just “generate code”.  
- **Safe by default:** No destructive operations without explicit confirmation or `--yes`.

---

## 2. Top‑level command

Binary name: `scaffolder`

```bash
scaffolder <command> [subcommand] [options]
```

Core commands:

- `init`      — Initialize a new project with AI‑guided scaffolding  
- `plan`      — Ask the principal agent to propose a change plan  
- `apply`     — Apply a previously generated change plan  
- `chat`      — Conversational interface with the principal engineer agent  
- `status`    — Show project/agent state  
- `inspect`   — Inspect plans, runs, and agent decisions  
- `policy`    — Manage governance policies  
- `agent`     — Manage agents and capabilities  
- `config`    — Configure CLI and project defaults

---

## 3. Command details

### 3.1 `scaffolder init`

**Purpose:** Create a new, governed, AI‑scaffolded project.

```bash
scaffolder init [path] [options]
```

**Key options:**

- `--template <name>`        — Base template (e.g. `node-service`, `react-app`, `monorepo`)  
- `--stack <stack-id>`       — Opinionated stack (e.g. `bun-next`, `python-fastapi`)  
- `--policy-set <file|id>`   — Policy set to apply (org or local)  
- `--non-interactive`        — Use defaults; no prompts  
- `--yes`                    — Skip confirmations  
- `--dry-run`                — Show plan only; do not write files  

**Flow:**

1. Collect intent (interactive or via flags).  
2. Principal Engineer Agent generates an initial `ChangePlan`.  
3. CLI shows summary (files, layout, tech stack, policies).  
4. On confirmation, `apply` is invoked internally to materialize the repo.  
5. Initial ADR and `scaffolder.yaml` are created.

---

### 3.2 `scaffolder plan`

**Purpose:** Ask the agent to propose changes without applying them.

```bash
scaffolder plan [options] [prompt...]
```

**Examples:**

```bash
scaffolder plan "Add JWT-based authentication"
scaffolder plan --scope api "Add rate limiting"
```

**Key options:**

- `--scope <path|tag>`       — Limit to a directory/module/tag  
- `--id <plan-id>`           — Re-open or refine an existing plan  
- `--non-interactive`        — No follow-up questions  
- `--output <file>`          — Save plan JSON to file  

**Behavior:**

- Sends current repo snapshot + policies + user prompt to PEA.  
- Receives a `ChangePlan` (structured JSON).  
- Displays:
  - summary of intent  
  - files to create/modify/delete  
  - ADRs to add/update  
  - tests/docs/CI changes  
- Stores plan under `.scaffolder/plans/<id>.json`.

---

### 3.3 `scaffolder apply`

**Purpose:** Apply a `ChangePlan` via the Execution Agent.

```bash
scaffolder apply <plan-id|file> [options]
```

**Key options:**

- `--dry-run`          — Show diffs only; no writes  
- `--yes`              — Apply without confirmation  
- `--no-format`        — Skip formatters/linters  
- `--branch <name>`    — Apply on a new branch (via VCS agent)  

**Behavior:**

- Validates plan against current repo and policies.  
- Shows a summary and optional unified diff.  
- On confirmation:
  - applies changes atomically  
  - runs formatters/linters (unless disabled)  
  - records a `ChangeReport` under `.scaffolder/runs/<id>.json`.  
- Optionally triggers VCS agent to commit and/or open a PR.

---

### 3.4 `scaffolder chat`

**Purpose:** Conversational interface with the principal engineer agent, bound to the repo.

```bash
scaffolder chat [options]
```

**Key options:**

- `--session <id>`      — Continue an existing session  
- `--no-plan`           — Disallow plan generation (Q&A only)  
- `--read-only`         — No file‑changing suggestions  

**Behavior:**

- Opens an interactive REPL.  
- User messages can:
  - ask questions  
  - request features  
  - request refactors  
- Agent responses may:
  - explain architecture  
  - propose `ChangePlan`s  
  - link to existing ADRs, runs, commits.  
- When a plan is proposed, user can:
  - `save` → creates a plan (`scaffolder plan` equivalent)  
  - `apply` → runs `scaffolder apply` on that plan  
  - `discard`.

---

### 3.5 `scaffolder status`

**Purpose:** Show current project and agent state.

```bash
scaffolder status
```

**Displays:**

- Project metadata (name, stack, template, policy set).  
- Active agent sessions.  
- Pending plans.  
- Recent runs (applied plans).  
- Policy violations (if any).  

---

### 3.6 `scaffolder inspect`

**Purpose:** Inspect internal artifacts.

```bash
scaffolder inspect <type> <id>
```

**Types:**

- `plan`      — Show a `ChangePlan`  
- `run`       — Show a `ChangeReport`  
- `policy`    — Show effective policies  
- `adr`       — Show ADRs known to the agent  

**Examples:**

```bash
scaffolder inspect plan 2025-05-06T12-30-01Z
scaffolder inspect run last
scaffolder inspect policy active
```

---

### 3.7 `scaffolder policy`

**Purpose:** Manage governance policies at project level.

```bash
scaffolder policy <subcommand> [options]
```

Subcommands:

- `show`              — Show effective policy set  
- `edit`              — Open policy file in editor  
- `validate`          — Validate policy syntax and constraints  
- `set <file|id>`     — Attach a policy set to this project  

Policies are stored in e.g. `.scaffolder/policy.yaml` and/or referenced from an org registry.

---

### 3.8 `scaffolder agent`

**Purpose:** Manage agents and capabilities.

```bash
scaffolder agent <subcommand> [options]
```

Subcommands:

- `list`              — List available agents (principal, test, docs, etc.)  
- `enable <name>`     — Enable an agent for this project  
- `disable <name>`    — Disable an agent  
- `config <name>`     — Configure agent‑specific settings  

---

### 3.9 `scaffolder config`

**Purpose:** Configure CLI and global defaults.

```bash
scaffolder config <subcommand> [options]
```

Subcommands:

- `set <key> <value>`  
- `get <key>`  
- `edit`  

Keys include:

- `llm.provider`  
- `llm.model`  
- `telemetry.enabled`  
- `default.policy-set`  
- `default.template`  

---

## 4. Project metadata and internal files

Within a project, the CLI manages:

- `.scaffolder/project.yaml`  
  - project id  
  - template  
  - stack  
  - policy set reference  

- `.scaffolder/plans/*.json`  
  - stored `ChangePlan`s  

- `.scaffolder/runs/*.json`  
  - `ChangeReport`s  

- `.scaffolder/policy.yaml`  
  - effective project policy (or pointer to org policy)  

These are all version‑controllable and auditable.

---

## 5. Example workflows

### 5.1 New project

```bash
scaffolder init my-service --template node-service --stack bun-express
cd my-service
scaffolder status
```

### 5.2 Add a feature

```bash
scaffolder plan "Add JWT-based authentication"
# review plan summary
scaffolder apply <plan-id> --yes
```

### 5.3 Conversational evolution

```bash
scaffolder chat
# "Refactor the user module into hexagonal architecture and add tests."
# Accept proposed plan → apply
```

---

define the **exact `ChangePlan` JSON schema** so the CLI, agents, and execution layer all speak the same deterministic language.