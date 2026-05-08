### Repo-as-memory system design

You’re basically turning the repo into the *brain* of the system—everything else (LLM, agents, vector DB) is just ways of reading and writing that brain. Let’s make that explicit and deterministic.

---

## 1. Objectives

- **Repo is canonical truth:** No hidden behavioral state outside versioned artifacts.
- **Eternal context:** The project’s history, decisions, and structure remain queryable over time.
- **Deterministic behavior:** Same repo + same policies + same prompt → same plan.
- **Traceable reasoning:** Every agent decision can be traced back to files, ADRs, policies, and commits.
- **Tool-agnostic:** Works with any Git host, CI, or editor.

---

## 2. Memory layers

#### 2.1 Canonical layer — Git repo

Versioned artifacts:

- **Source code:** `src/`, `apps/`, `packages/`, etc.
- **Configs:** `scaffolder.yaml`, `tsconfig.json`, `eslint.config`, etc.
- **Docs:** `docs/`, `README.md`, `CONTRIBUTING.md`.
- **ADRs:** `docs/adr/ADR-XXXX-*.md`.
- **Policies:** `.scaffolder/policy.yaml` or `policies/*.yaml`.
- **Operational artifacts:** `.scaffolder/plans/`, `.scaffolder/runs/`, `.scaffolder/summaries/`.

This is the only place that defines behavior.

---

#### 2.2 Semantic layer — Vector store

Stores embeddings for:

- Code chunks (by file + chunk id).
- Docs and READMEs.
- ADRs.
- Policies.
- Summaries.
- ChangePlans and ChangeReports (optional).

Each embedding is keyed by:

- `project_id`
- `commit_sha`
- `path`
- `chunk_id`
- `type` (code/doc/adr/policy/summary/plan/run)

The vector store is an **index**, not a source of truth.

---

#### 2.3 Narrative layer — Summaries & timelines

Stored in the repo:

- `.scaffolder/summaries/project.md` — high-level project summary.
- `.scaffolder/summaries/<path>.md` — module/domain summaries.
- Optional `.scaffolder/timeline.md` — major events and refactors.

These give the agent a compressed narrative of the system.

---

#### 2.4 Governance layer — Policies & ADRs

- **Policies:**  
  `.scaffolder/policy.yaml` or `policies/*.yaml`  
  Define allowed stacks, layouts, naming, security rules, etc.

- **ADRs:**  
  `docs/adr/ADR-0001-title.md`  
  Each ADR includes:
  - context  
  - decision  
  - consequences  
  - status  
  - links to commits/plans/runs  

These are the long-term “why” memory.

---

#### 2.5 Operational layer — Plans & runs

- **ChangePlans:** `.scaffolder/plans/<id>.json`  
  - intent  
  - operations  
  - rationale  
  - linked ADRs/policies  

- **ChangeReports:** `.scaffolder/runs/<id>.json`  
  - what was applied  
  - errors  
  - policy violations  
  - resulting commits  

This is the “what we intended” vs “what actually happened” memory.

---

## 3. Directory layout

A concrete layout might look like:

```text
.
├─ src/                      # code
├─ apps/                     # optional
├─ packages/                 # optional
├─ docs/
│  ├─ adr/
│  │  ├─ ADR-0001-initial-architecture.md
│  │  └─ ADR-0002-auth-strategy.md
│  └─ architecture.md
├─ .scaffolder/
│  ├─ project.yaml           # project id, stack, template, etc.
│  ├─ policy.yaml            # effective policy set (or pointer)
│  ├─ plans/
│  │  └─ plan-2026-05-07T00-35-00Z.json
│  ├─ runs/
│  │  └─ run-2026-05-07T00-40-00Z.json
│  ├─ summaries/
│  │  ├─ project.md
│  │  └─ src-user.md
│  └─ index-meta.json        # optional: last indexed commit, etc.
└─ scaffolder.yaml           # top-level config (optional)
```

Everything that affects behavior is versionable and inspectable.

---

## 4. Core operations

### 4.1 Indexing

Triggered on:

- `scaffolder init`
- `scaffolder apply`
- explicit `scaffolder index` (if you want a command)

Steps:

1. Walk repo (respect `.gitignore` and `.scaffolderignore`).
2. Chunk files (size + semantic boundaries).
3. Generate embeddings for:
   - code chunks  
   - docs  
   - ADRs  
   - policies  
   - summaries  
4. Store in vector DB with keys:
   - `project_id`, `commit_sha`, `path`, `chunk_id`, `type`.

Optionally store a small `.scaffolder/index-meta.json` with:

- last indexed commit
- index version
- embedding schema version

---

### 4.2 Retrieval

When the principal engineer agent needs context:

1. Build a **retrieval query** from:
   - user intent  
   - scope (paths/modules)  
   - type (code/docs/ADRs/policies)  

2. Query vector store with filters:
   - `project_id`  
   - optional `path` prefix  
   - `type` filters  

3. Hydrate results:
   - load actual file contents from the repo  
   - load ADRs, policies, summaries  

4. Construct a **context bundle**:
   - small, curated set of:
     - code chunks  
     - ADRs  
     - policies  
     - summaries  

This bundle is what goes into the LLM context.

---

### 4.3 Writing & evolution

When a `ChangePlan` is applied:

1. Execution agent:
   - applies file operations  
   - runs formatters/linters  

2. VCS agent:
   - commits changes  
   - optionally opens PR  

3. Memory update:
   - new `ChangeReport` written to `.scaffolder/runs/`  
   - changed files re-indexed  
   - ADRs updated/added if needed  
   - summaries refreshed (project/module-level)

This closes the loop: **intent → plan → execution → memory → new context**.

---

## 5. Conversation as memory

Conversations are part of the project’s story, but you don’t want raw chat logs to drive behavior.

Recommended pattern:

- Store full transcripts outside the repo (DB keyed by `project_id`).
- Distill important decisions into:
  - ADRs  
  - notes in `.scaffolder/summaries/`  
  - references in ChangePlans  

The agent can then say:

- “We discussed this in a previous session; see ADR‑0003.”

You keep **behavioral memory** in the repo, **narrative detail** outside.

---

## 6. Determinism & governance

To keep this institutional-grade:

- **No hidden behavioral state:**
  - Policies, templates, and project metadata live in the repo.
- **Vector DB is advisory:**
  - It helps find relevant context; it never overrides repo truth.
- **Stable chunking & retrieval:**
  - Fixed chunking strategy, fixed top‑k, consistent filters.
- **Versioned policies & templates:**
  - Changes to policies/templates are committed and visible.
- **Traceable decisions:**
  - ChangePlans and ChangeReports link to ADRs and policies by id.

Result: same repo + same policies + same prompt → same ChangePlan.

---

- define the **exact `.scaffolder/` file formats**, 
- design the **ADR format and lifecycle** as the backbone of long-term reasoning.