glossary-validation-engine.md
Below is the **complete, governed, canonical specification** of the **Glossary Validation Engine** — the subsystem that ensures your glossary is **authoritative**, **machine‑actionable**, **semantically consistent**, and **reactively integrated** with the entire documentation knowledge graph.

This engine is the **semantic integrity layer** of your monorepo.  
It guarantees that every term has **one definition**, **one meaning**, **one anchor**, and **one authoritative source**.

Guided Links are embedded so you can expand any subsystem.

---

# 🧠 **Glossary Validation Engine**  
**The semantic governance subsystem that enforces linguistic consistency across the entire documentation corpus.**

The Glossary Validation Engine validates:

- glossary structure  
- glossary metadata  
- glossary term definitions  
- glossary anchors  
- glossary ordering  
- glossary uniqueness  
- glossary → quickref consistency  
- glossary → document usage consistency  
- glossary → knowledge graph integration  

It is the **semantic enforcement layer** of the living documentation system.

---

# 🧩 **1. Engine Architecture**

The engine runs in five deterministic phases:

1. **Glossary Parsing**  
2. **Glossary Structure Validation**  
3. **Glossary Term Validation**  
4. **Quickref Validation**  
5. **Corpus‑Wide Glossary Usage Validation**

Each phase produces machine‑readable violations.

---

# 🏛️ **2. Glossary Parsing**

The engine extracts:

- glossary metadata  
- glossary sections  
- glossary terms  
- glossary anchors  
- glossary definitions  
- onboarding‑critical flags  
- cross‑links  

It produces a **GlossaryTerm[]** node set for the knowledge graph.

---

# 🧱 **3. Glossary Structure Validation (Binding)**

The glossary must follow the canonical structure:

- Purpose  
- Terms  
- Related Documents  
- Change History  

### Rules
- Glossary must contain a `## Terms` section.  
- Terms must be grouped under `### <Term>` headings.  
- No empty definitions.  
- No missing definitions.  
- No inline glossary definitions in other documents.  
- Glossary must be alphabetized.  

### Violations
- Missing sections  
- Empty definitions  
- Out‑of‑order terms  
- Duplicate headings  

---

# 🔤 **4. Glossary Term Validation (Binding)**

Each term must satisfy:

### **Term Format Rules**
- Term must be Title Case.  
- Anchor must be lowercase with hyphens.  
- Anchor must match the term.  
- Term must be unique.  
- Anchor must be unique.  

### **Definition Rules**
- Definition must be non‑empty.  
- Definition must not reference undefined terms.  
- Definition must not contain TODOs.  
- Definition must not contradict ADRs.  
- Definition must not contradict governance docs.  

### **Cross‑Link Rules**
- Terms referenced in definitions must link to other glossary terms.  
- No broken glossary links.  
- No circular glossary definitions.  

---

# 🧭 **5. Quickref Validation (Derived Artifact Enforcement)**

The Quickref is a **derived artifact** and must reflect the glossary.

### Rules
- All onboarding‑critical terms must appear in Quickref.  
- Quickref must not contain terms not in the glossary.  
- Quickref definitions must be short summaries.  
- Quickref must link back to the canonical glossary.  

### Violations
- Missing onboarding‑critical terms  
- Extra terms not in glossary  
- Broken links  
- Out‑of‑sync definitions  

---

# 📘 **6. Corpus‑Wide Glossary Usage Validation**

This is the **most important phase**: validating glossary usage across the entire documentation corpus.

### Rules
- All glossary terms used in governed documents must be linked.  
- No undefined glossary terms may appear.  
- No glossary term may appear with multiple meanings.  
- No glossary term may appear with alternate spellings.  
- No glossary term may appear unlinked in Architecture, Governance, Standards, Lifecycle, Platform, ADRs.  

### Violations
- Unlinked glossary terms  
- Undefined glossary terms  
- Semantic drift  
- Conflicting definitions  

---

# 🧬 **7. Knowledge Graph Integration**

The engine emits:

### **GlossaryTerm Nodes**
Each term becomes a node with:

- term  
- anchor  
- definition  
- domain  
- onboardingCritical  
- references  

### **GlossaryUsage Edges**
Each usage becomes an edge:

- from: document  
- to: glossary term  
- occurrences: count  

This enables:

- semantic drift detection  
- term lineage  
- dependency mapping  
- Docs Agent semantic reasoning  

---

# 🔄 **8. Reactive Behavior (Living System)**

When the glossary changes:

- Quickref updates  
- GlossaryUsage edges update  
- Drift detection runs  
- ADRs referencing changed terms are flagged  
- Standards referencing changed terms are flagged  
- Architecture docs referencing changed terms are flagged  
- Docs Agent updates semantic model  

This makes the glossary a **reactive subsystem**, not a static file.

---

# 🧪 **9. Immutability & Governance Rules**

### Rules
- Glossary is a **Binding** document.  
- Changes require governance approval.  
- Terms cannot be removed without deprecation.  
- Terms cannot be renamed without migration.  
- Definitions cannot change without downstream validation.  

### Violations
- Unauthorized glossary changes  
- Missing migration notes  
- Missing downstream updates  

---

# 🧠 **10. Engine Output**

The engine produces:

- per‑term violations  
- per‑document glossary usage violations  
- Quickref violations  
- semantic drift violations  
- graph‑level glossary violations  

Output is machine‑readable and consumed by CI.

---

# 🧠 Non‑Obvious Insight  
The Glossary Validation Engine is not about spelling or formatting.  
It is about **semantic governance**.

It ensures:

- one meaning  
- one definition  
- one vocabulary  
- one semantic model  
- one institutional language  

It is the **linguistic constitution** of your monorepo.

Without it, architecture becomes ambiguous.  
With it, the system becomes **semantically coherent**.

---

# 🔥 Your Next Move  
Which semantic subsystem do you want to define next?

- **Glossary Term Linking**  
- **Documentation Knowledge Graph Schema**  
- **Docs Agent Semantic Reasoning Engine**