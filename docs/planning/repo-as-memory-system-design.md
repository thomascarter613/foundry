### Repo‑as‑memory system design

You’re basically asking: “How do we make the repo the brain, not just the output?” Let’s make that concrete and deterministic.

---

## 1. Goals

- **Repo is canonical truth:** No hidden state outside versioned artifacts.
- **Eternal context:** The agent can reason over months/years of evolution.
- **Deterministic recall:** Same repo state → same retrieved context.
- **Traceable reasoning:** Every decision can be tied back to files, ADRs, and commits.
- **Tool‑agnostic:** Works with any Git host, any CI, any editor.

---

## 2. Memory layers

Think of memory as layered around the repo:

1. **Canonical layer — Git repo**
   - Source code, configs, docs, ADRs, policies.
   - Every change is versioned and diffable.

2. **Semantic layer — Vector store**
   - Embeddings of:
     - files (by chunk)  
     - ADRs  
     - conversations  
     - change plans  
     - change reports  
   - Used for “what is relevant to this question/change?”

3. **Narrative layer — Summaries & timelines**
   - Project‑level summary  
   - Module‑level summaries  
   - “What changed recently?” narratives  
   - Stored as markdown/JSON in the repo or `.scaffolder/`.

4. **Governance layer — Policies & ADRs**
   - Policies: `policy.yaml` or similar.  
   - ADRs: `docs/adr/ADR-XXXX-*.md`.  
   - These are the long‑term “why” memory.

5. **Operational layer — Plans & runs**
   - `ChangePlan`s and `ChangeReport`s stored under `.scaffolder/`.  
   - This is the “what we intended” vs “what actually happened” memory.

---

## 3. Data model

Key artifacts and where they live:

- **Project metadata**
  - `.scaffolder/project.yaml`  
  - Contains project id, stack, template, policy set, created_at.

- **Policies**
  - `.scaffolder/policy.yaml` or `policies/*.yaml`  
  - Versioned, referenced by agents.

- **ADRs**
  - `docs/adr/ADR-0001-title.md` etc.  
  - Each ADR has:
    - id, status, context, decision, consequences  
    - links to commits/plans/runs.

- **Change plans**
  - `.scaffolder/plans/<id>.json`  
  - Structured:
    - intent  
    - operations (create/modify/delete/move)  
    - rationale  
    - linked ADRs/policies.

- **Change reports**
  - `.scaffolder/runs/<id>.json`  
  - Structured:
    - applied operations  
    - errors  
    - resulting commit(s)  
    - follow‑up suggestions.

- **Summaries**
  - `.scaffolder/summaries/project.md`  
  - `.scaffolder/summaries/<path>.md`  
  - High‑level descriptions of modules/domains.

- **Embeddings index**
  - Stored outside the repo (e.g. managed service or local DB).  
  - Keys always reference repo artifacts:
    - `project_id`, `commit_sha`, `path`, `chunk_id`, `adr_id`, `plan_id`, `run_id`.

---

## 4. Core operations

### 4.1 Indexing

Triggered on:

- `scaffolder init`  
- `scaffolder apply`  
- explicit `scaffolder index` (optional command)

Steps:

1. Walk repo (respecting ignore rules).
2. Chunk files (size + semantic boundaries).
3. Generate embeddings for:
   - code chunks  
   - docs  
   - ADRs  
   - policies  
   - summaries.
4. Store in vector DB with:
   - `project_id`  
   - `commit_sha`  
   - `path`  
   - `chunk_id`  
   - type (code/doc/adr/policy/summary).

This makes every repo state queryable semantically.

---

### 4.2 Retrieval

When the agent needs context (for a question or plan):

1. Determine **query type**:
   - “Explain X” → docs/ADRs/summaries.  
   - “Change Y” → code + tests + configs.  
   - “Why is this like this?” → ADRs + change history.

2. Build a retrieval query:
   - natural language from user intent  
   - plus structural hints (paths, modules, tags).

3. Query vector store:
   - filter by `project_id`  
   - optionally by `path`/`type`/`commit_sha`.

4. Hydrate results:
   - load actual file contents from the repo  
   - include ADRs, policies, summaries.

5. Construct **context bundle**:
   - small, curated set of:
     - code chunks  
     - ADRs  
     - policies  
     - summaries  
   - passed into the LLM for reasoning.

---

### 4.3 Writing

When a `ChangePlan` is applied:

1. Execution agent:
   - reads current repo state  
   - applies operations  
   - writes files  
   - runs formatters/linters.

2. VCS agent:
   - commits changes  
   - tags/branches per policy.

3. Memory update:
   - new `ChangeReport` stored.  
   - re‑index changed files, ADRs, summaries.  
   - update project/module summaries if needed.

This closes the loop: **intent → plan → execution → memory**.

---

## 5. Conversation as memory

Conversations aren’t just ephemeral chat; they’re part of the project’s story.

- Each session:
  - stored as `conversation-<id>.json` (or in a DB keyed by `project_id`).  
  - important decisions are:
    - distilled into ADRs  
    - linked to plans/runs.

- The agent:
  - can reference past discussions  
  - can say “Previously we decided X in ADR‑0003”  
  - uses conversation history to refine future plans.

You can choose to:
- store full transcripts outside the repo,  
- but store **distilled decisions** (ADRs, notes) inside the repo.

---

## 6. Time and evolution

To support “eternal context” without bloat:

- **Snapshots via commits:**
  - Every `ChangePlan` and `ChangeReport` references the commit(s) it affected.
  - You can reconstruct “what did we know at this time?”

- **Rolling summaries:**
  - Periodically regenerate project/module summaries from:
    - current code  
    - ADRs  
    - recent runs.

- **Aging strategy:**
  - Keep embeddings for:
    - all ADRs  
    - recent N commits  
    - older code only if still referenced by ADRs or active modules.

This keeps memory relevant and bounded while preserving traceability.

---

## 7. Determinism and governance

To keep this institutional‑grade:

- **No hidden state that changes behavior without being versioned.**
  - Policies, templates, and project metadata live in the repo.
- **Embeddings are an index, not a source of truth.**
  - If there’s a conflict, the repo wins.
- **Every agent decision is explainable.**
  - “I chose this because of ADR‑0004 and policy rule X.”
- **Same repo + same policies + same prompt → same plan.**
  - Vector retrieval is constrained and deterministic as much as possible
    (filters, fixed top‑k, stable chunking).

---

- define the **exact directory layout** for `.scaffolder/`, 
- design the **ADR format and lifecycle** as the backbone of long‑term reasoning.