---
title: "Execution Agent Design"
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
  - "Planning"
  - "Execution"
  - "Agent"
---

### Execution agent design

The execution agent is the **hands** of the system—purely operational, strictly governed, and never “creative”. It turns **ChangePlans** into real file changes, nothing more.

---

## 1. Role and boundaries

**Role:**  
- Take a validated `ChangePlan` and apply it to a working tree.  
- Ensure changes are atomic, policy‑compliant, and reproducible.

**Hard boundaries:**  
- Does **not** talk to users.  
- Does **not** call LLMs.  
- Does **not** invent files or content.  
- Only acts on what’s explicitly described in the `ChangePlan`.

---

## 2. Inputs and outputs

**Inputs:**

- `ChangePlan` (or merged `ChangePlan` + fragments)  
- Current repo state (working tree + HEAD commit)  
- `PolicySet` (for write‑time enforcement)  
- Project metadata (`.scaffolder/project.yaml`)

**Outputs:**

- Updated working tree  
- Optional commits/branches (via VCS agent)  
- `ChangeReport` (structured JSON) with:
  - status (success/partial/failure)  
  - applied operations  
  - skipped operations  
  - errors  
  - follow‑up suggestions (e.g., “re‑run plan after resolving conflicts”)

---

## 3. Internal pipeline

### 3.1 Plan validation

Before touching the filesystem, the agent:

- Verifies:
  - plan schema  
  - plan version compatibility  
  - all paths are within allowed roots  
  - no forbidden operations (e.g., deleting protected files)  
- Checks policies:
  - directory rules  
  - naming conventions  
  - file type restrictions  
- Checks repo state:
  - files expected to exist actually exist  
  - no unexpected local modifications (unless allowed)

If validation fails → no writes, return `ChangeReport` with errors.

---

### 3.2 Diff synthesis

For each operation in the plan:

- **Create:**
  - Ensure parent directories exist or are allowed to be created.  
  - Write file with provided content (or template reference resolved by scaffolder).  

- **Modify:**
  - Load current file content.  
  - Apply patch:
    - either full replacement, or  
    - structured patch (e.g., “insert here”, “replace block”).  
  - If patch fails (content drift), mark as conflict.

- **Delete:**
  - Ensure file exists and is not protected.  
  - Remove file.

- **Move/Rename:**
  - Ensure source exists and target is allowed.  
  - Move file, update references if specified in plan.

All diffs are computed in memory first.

---

### 3.3 Atomic application

- If any operation is in **conflict** or **policy violation**:
  - Do **not** apply partial changes (unless plan explicitly allows partial).  
  - Return `ChangeReport` with detailed errors.

- If all operations are valid:
  - Apply all changes to the working tree.  
  - Optionally stage them (if configured).

This ensures **atomicity**: either the plan is applied coherently, or not at all.

---

### 3.4 Formatting and linting

After applying changes (but before commit):

- Run configured tools:
  - formatters (e.g., `prettier`, `black`, `gofmt`)  
  - linters (optional)  

- Respect:
  - project config (`.scaffolder/project.yaml`)  
  - per‑language conventions  

If tools fail:
- Include failures in `ChangeReport`.  
- Optionally revert or keep changes depending on configuration.

---

### 3.5 VCS integration (via VCS agent)

The execution agent itself doesn’t decide commit strategy; it delegates:

- “Here are the applied changes” → VCS agent.  
- VCS agent:
  - creates commits  
  - names branches  
  - opens PRs/MRs  
  - tags releases  

The execution agent just passes a **change summary**.

---

## 4. Policy enforcement

At write time, the execution agent enforces:

- **Path constraints:**
  - no writes outside allowed roots (e.g., `src/`, `apps/`, `packages/`)  
  - no touching `.git/`, `.scaffolder/` internals unless explicitly allowed.

- **File type constraints:**
  - only allowed extensions  
  - no binary writes unless specified.

- **Protected resources:**
  - certain files (e.g., `policy.yaml`, core infra) may be read‑only.

If a policy is violated:
- Reject the operation.  
- Annotate `ChangeReport` with:
  - rule id  
  - description  
  - suggested fix (e.g., “use `apps/api/` instead of root”).

---

## 5. `ChangeReport` structure (high level)

```json
{
  "id": "run-2026-05-07T00-40-00Z",
  "plan_id": "plan-2026-05-07T00-35-00Z",
  "status": "success | partial | failure",
  "summary": {
    "created": ["path/to/file.ts"],
    "modified": ["path/to/other.ts"],
    "deleted": [],
    "moved": []
  },
  "errors": [
    {
      "operation": "modify",
      "path": "src/user.ts",
      "reason": "content_drift",
      "details": "Patch did not apply cleanly; file changed since plan was generated."
    }
  ],
  "policy_violations": [
    {
      "rule_id": "paths.no-root-files",
      "path": "index.ts",
      "message": "Files must live under src/."
    }
  ],
  "formatting": {
    "ran": true,
    "status": "success | failure",
    "tool_outputs": {}
  },
  "vcs": {
    "branch": "feature/add-auth",
    "commit_sha": "abc123",
    "pr_url": null
  }
}
```

This becomes part of the repo’s **operational memory** under `.scaffolder/runs/`.

---

## 6. Non‑functional guarantees

- **Deterministic:**  
  Same `ChangePlan` + same repo state → same result.

- **Safe:**  
  No writes without explicit plan; no “best guesses”.

- **Auditable:**  
  Every operation is logged in `ChangeReport`.

- **Isolated:**  
  No LLM calls, no user interaction, no hidden state.

- **Composable:**  
  Works with any reasoning agent that can emit a valid `ChangePlan`.

---

next define the **exact `ChangePlan` schema** so the execution agent, PEA, and CLI all share a single, governed contract.