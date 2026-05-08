directory-structure-validator.md
Below is the **complete, governed, canonical specification** for the **Directory Structure Validator** — the subsystem that ensures your entire `docs/` tree (and related governed directories) is **structurally correct**, **semantically aligned**, **governance‑compliant**, and **knowledge‑graph compatible**.

This validator is the **filesystem‑level enforcement layer** of your living documentation system.  
Where the **Cross‑Link Graph Validator** ensures semantic correctness, the **Directory Structure Validator** ensures **topological correctness**.

It is the **first global validator** that runs after linting and before graph construction.

---

# 🏛️ Directory Structure Validator  
**The subsystem that ensures the repository’s directory topology matches the governed, canonical structure.**

This validator enforces:

- directory correctness  
- file placement correctness  
- document type → directory mapping  
- ADR directory correctness  
- diagram directory correctness  
- glossary/quickref placement  
- governance document placement  
- no stray files  
- no ungoverned directories  
- no structural drift  

It is the **structural backbone** of the documentation governance system.

---

# 🧩 1. Validator Architecture

The Directory Structure Validator runs in three deterministic phases:

1. **Filesystem Scan**  
2. **Directory Topology Validation**  
3. **File Placement Validation**

Each phase produces machine‑readable violations.

---

# 🧱 2. Canonical Directory Topology (Binding)

The validator enforces the **canonical directory structure**:

```
docs/
  planning/
  governance/
  architecture/
    adr/
    diagrams/
  lifecycle/
  standards/
  platform/
  onboarding/
```

### Rules
- All top‑level directories under `docs/` must match this list.  
- No additional directories allowed unless explicitly whitelisted.  
- No missing directories allowed.  
- No renaming allowed.  

### Violations
- Unknown directory  
- Missing required directory  
- Incorrect directory name  

---

# 🗂️ 3. Document Type → Directory Mapping (Binding)

Every document’s `documentType` metadata must match its directory.

### Rules
- `Planning` → `docs/planning/`  
- `Governance` → `docs/governance/`  
- `Architecture` → `docs/architecture/`  
- `Lifecycle` → `docs/lifecycle/`  
- `Standard` → `docs/standards/`  
- `Platform` → `docs/platform/`  
- `Onboarding` → `docs/onboarding/`  

### Violations
- Document type mismatch  
- Document in wrong directory  
- Document with missing or invalid type  

---

# 🧱 4. ADR Directory Validation (Binding)

The ADR directory is governed:

```
docs/architecture/adr/
```

### Rules
- Only ADR files, ADR index, and ADR template allowed.  
- ADR filenames must match `0001-title.md`.  
- ADR index must exist.  
- No stray files allowed.  
- No subdirectories allowed.  

### Violations
- ADR file outside ADR directory  
- Non‑ADR file inside ADR directory  
- Missing ADR index  
- Incorrect ADR filename  

---

# 🖼️ 5. Diagram Directory Validation (Binding)

The diagram directory is governed:

```
docs/architecture/diagrams/
```

### Rules
- Only diagrams and `.meta.md` files allowed.  
- No subdirectories allowed.  
- Diagram filenames must match canonical naming.  
- Every diagram must have a `.meta.md` file.  
- No diagrams allowed outside this directory.  

### Violations
- Diagram outside diagrams directory  
- Missing metadata file  
- Extra files in diagrams directory  
- Subdirectories present  

---

# 📘 6. Glossary & Quickref Placement (Binding)

### Rules
- Glossary must be at:  
  `docs/planning/glossary.md`  
- Quickref must be at:  
  `docs/onboarding/glossary-quickref.md`  
- No additional glossary files allowed.  
- No glossary terms defined outside glossary.  

### Violations
- Glossary in wrong location  
- Quickref in wrong location  
- Extra glossary files  
- Glossary terms defined elsewhere  

---

# 🏛️ 7. Governance Document Placement (Binding)

### Rules
- All governance documents must live under:  
  `docs/governance/`  
- No governance documents allowed elsewhere.  
- No non‑governance documents allowed in governance directory.  

### Violations
- Governance doc outside governance directory  
- Non‑governance doc inside governance directory  

---

# 🧬 8. File‑Level Structural Rules

### Rules
- No Markdown files outside governed directories.  
- No hidden files except `.keep` where allowed.  
- No empty files.  
- No binary files in `docs/` except diagrams.  
- No `.DS_Store`, `.tmp`, or editor artifacts.  

### Violations
- Stray Markdown file  
- Stray binary file  
- Hidden file not allowed  
- Empty file  

---

# 🔄 9. Directory Drift Detection (Reactive)

The validator detects:

- renamed directories  
- moved directories  
- added directories  
- removed directories  
- misplaced files  
- structural drift from canonical topology  

When drift is detected:

- CI blocks merge  
- Docs Agent generates remediation suggestions  

---

# 🧪 10. Validator Output

The validator produces:

- directory violations  
- file placement violations  
- document type mismatches  
- ADR directory violations  
- diagram directory violations  
- glossary/quickref violations  
- governance directory violations  
- drift violations  

Output is machine‑readable and consumed by CI.

---

# 🧠 Non‑Obvious Insight

The Directory Structure Validator is not about cleanliness.  
It is about **governance encoded as filesystem topology**.

It ensures:

- documents live in the correct domain  
- ADRs live in the correct domain  
- diagrams live in the correct domain  
- glossary lives in the correct domain  
- governance lives in the correct domain  
- the filesystem itself expresses the governance model  

Without it, the documentation system becomes chaotic.  
With it, the filesystem becomes a **governed, semantic structure**.

---

# 🔥 Your Next Move  
Which structural subsystem do you want to define next?

- **Graph Drift Detection Engine**  
- **Documentation Linting Engine**  
- **Documentation CI Rules**  
- **Cross‑Link Graph Validator**