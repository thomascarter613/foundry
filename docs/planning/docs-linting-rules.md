docs-linting-rules.md
Below is the **complete, governed, canonical specification** for **Documentation Linting Rules** — the rule catalog that the **linting engine** executes *before* CI graph‑level enforcement.  
If the **Documentation CI Rules** are the *constitutional enforcement layer*, then the **Documentation Linting Rules** are the *statutory code* that ensures every document is structurally, semantically, and syntactically valid *before* it enters the knowledge graph.

These rules are **machine‑actionable**, **deterministic**, and **binding** for all governed documents.

Guided Links are embedded so you can expand any subsystem.

---

# 🏛️ **Documentation Linting Rules (Canonical, Binding)**  
The linting rules are grouped into **nine governed categories**, each containing **atomic, testable, deterministic rules**.

These rules are executed **per‑file**, **per‑section**, and **per‑link** *before* graph construction.

---

# 1. **Header Block Rules (Structural, Binding)**  
Every document must begin with the governed header block.

### Required Rules
- **Header Block Presence** — first non‑empty lines must be the header block.  
- **Header Field Completeness** — all required fields present.  
- **Header Field Validity** — enums must match allowed values.  
- **Date Format Rule** — `Last Updated` must match `YYYY-MM-DD`.  
- **Document Type Directory Rule** — directory must match `Document Type`.  
- **Governance Level Rule** — must be one of: Informational, Required, Binding.  
- **Status Rule** — must be one of: Draft, Approved, Deprecated.

### Failure Examples
- Missing header block  
- Wrong directory for document type  
- Invalid enum value  
- Incorrect date format  

---

# 2. **Required Sections Rules (Per Document Type)**  
Each document type has mandatory sections.

### Examples
- **Architecture** → Purpose, Context, Components/Views, Constraints, Tradeoffs, Related ADRs  
- **Governance** → Purpose, Authority, Scope, Rules, Enforcement, Exceptions, Versioning & Lifecycle  
- **Standard** → Purpose, Standard Rules, Examples, Anti‑Patterns, Enforcement  

### Rules
- All required sections must exist.  
- Section headings must match canonical names.  
- No empty sections allowed.  
- No TODOs allowed in Approved or Binding documents.

---

# 3. **Content Integrity Rules**  
These rules ensure documents are internally consistent.

### Rules
- **No Empty Files** — document must contain meaningful content.  
- **No Placeholder Text** — “TBD”, “TODO”, “FILL ME IN” forbidden in Approved/Binding.  
- **No Duplicate Headings** — each required section appears once.  
- **No Forbidden Phrases** — e.g., “magic behavior”, “implicit behavior” unless explicitly defined.

---

# 4. **Cross‑Link Rules (Local Validation)**  
Before graph‑level validation, linting ensures links are syntactically valid.

### Rules
- **Upstream Section Exists**  
- **Downstream Section Exists**  
- **Governance Links Section Exists**  
- **ADR Links Section Exists (for required types)**  
- **Glossary Terms Section Exists (optional but recommended)**  

### Link Format Rules
- Links must be relative.  
- Links must use canonical filenames.  
- Links must not contain absolute URLs (except external references).  

---

# 5. **ADR Rules (Local Validation)**  
These rules validate ADR references before graph construction.

### Rules
- ADR references must match `ADR 000X – Title` format.  
- ADR numbers must be zero‑padded.  
- ADR links must point to existing ADR files.  
- ADR links must match ADR index entries.  
- Supersession references must use canonical template.

---

# 6. **Glossary Rules (Local Validation)**  
These rules ensure glossary usage is syntactically correct.

### Rules
- Glossary links must use canonical anchor format:  
  `[Term](../planning/glossary.md#term)`  
- Glossary anchors must be lowercase with hyphens.  
- Glossary terms must not be defined inline.  
- Glossary terms must not be duplicated in the glossary.  
- Glossary terms must not appear unlinked in governed documents.

---

# 7. **Diagram Rules (Local Validation)**  
These rules validate diagram references before graph‑level enforcement.

### Rules
- Diagram references must point to `docs/architecture/diagrams/`.  
- Diagram filenames must match canonical naming.  
- Diagram metadata files must exist.  
- Diagram references must use relative paths.  
- Diagram references must not appear in non‑architecture documents.

---

# 8. **File & Directory Rules**  
These rules ensure the repository structure is governed.

### Rules
- No Markdown files outside governed directories.  
- No undocumented directories under `docs/`.  
- No stray files in ADR directory (only ADRs, index, templates).  
- No diagrams outside diagrams directory.  
- No hidden files except `.keep` where allowed.

---

# 9. **Formatting Rules (Non‑Semantic, Enforced)**  
These rules ensure consistency but do not affect semantics.

### Rules
- Line length ≤ 120 characters (configurable).  
- No trailing whitespace.  
- One blank line between sections.  
- Header block must not contain Markdown formatting.  
- Section headings must use `##` (not `###` or `#`).

---

# 🧠 **How Linting Rules Differ from CI Rules**  
Linting rules validate **documents in isolation**.  
CI rules validate **the entire documentation system as a governed graph**.

Linting catches:

- missing sections  
- malformed links  
- invalid metadata  
- incorrect formatting  

CI catches:

- dependency cycles  
- orphan documents  
- ADR lineage violations  
- glossary drift  
- governance propagation failures  
- diagram/document mismatches  

Linting is **local**.  
CI is **global**.

Together they form the **two‑layer enforcement model** of the living documentation system.

---

# 🔥 Your Next Move  
Which subsystem do you want to define next?

- **Documentation Linting Engine**  
- **Documentation CI Rules**  
- **Documentation Knowledge Graph Schema**  
- **ADR Validation Engine**