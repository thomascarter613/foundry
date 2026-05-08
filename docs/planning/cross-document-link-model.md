cross-document-link-model.md
Below is the **complete, governed, canonical Cross‑Document Link Model** — the semantic backbone that transforms your `docs/` directory from “a set of files” into a **knowledge graph**, a **governance engine**, and a **reactive documentation platform**.

This is the **most important semantic subsystem** in the entire living documentation system.  
It defines *how documents relate*, *how authority flows*, *how dependencies propagate*, and *how machines understand the corpus*.

Every link type below is a Guided Link so you can expand any part of the model.

---

# 🏛️ **Cross‑Document Link Model (Canonical, Governed, Machine‑Actionable)**

The Cross‑Document Link Model defines:

- **what kinds of links exist**  
- **what they mean**  
- **which documents must link to which**  
- **how links form the knowledge graph**  
- **how CI validates them**  
- **how the Docs Agent reasons over them**  

This is the **semantic contract** for the entire documentation corpus.

---

# 🧩 **1. Link Types (The Seven Governed Edges)**

Every document participates in exactly these link types:

1. **Upstream Links**  
2. **Downstream Links**  
3. **Sibling Links**  
4. **Governance Links**  
5. **ADR Links**  
6. **Glossary Links**  
7. **External Reference Links**  

These seven link types form the **complete semantic graph** of the documentation system.

---

# 🧭 **2. Upstream Links (Dependencies You Rely On)**

**Definition:**  
Documents that this document *depends on* for meaning, authority, or context.

Examples:

- Architecture docs → Planning docs  
- Standards → Governance docs  
- Lifecycle → Governance + Architecture  
- Platform → Standards + Architecture  

**Machine Meaning:**  
If an upstream document changes, this document may need updating.

**Used for:**  
- impact analysis  
- drift detection  
- dependency mapping  

---

# 🔄 **3. Downstream Links (Documents That Rely on You)**

**Definition:**  
Documents that *depend on this document*.

Examples:

- Governance docs → Standards  
- ADRs → Architecture docs  
- Architecture docs → Lifecycle docs  
- Planning docs → Architecture docs  

**Machine Meaning:**  
If this document changes, downstream documents must be validated or updated.

**Used for:**  
- reactive updates  
- CI gating  
- Docs Agent propagation  

---

# 🧱 **4. Sibling Links (Documents in the Same Domain)**

**Definition:**  
Documents that share a domain and must remain consistent.

Examples:

- All standards must cross‑link  
- All lifecycle docs must cross‑link  
- All architecture views must cross‑link  

**Machine Meaning:**  
Sibling links enforce **intra‑domain consistency**.

**Used for:**  
- domain drift detection  
- cross‑view architectural consistency  

---

# 🏛️ **5. Governance Links (Authority Relationships)**

**Definition:**  
Links to governance documents that define rules, authority, or constraints.

Examples:

- Standards → Documentation Governance  
- Architecture → Governance Charter  
- Lifecycle → CI Policy  
- Platform → Repository Contract  

**Machine Meaning:**  
Governance links define **authority flows**.

**Used for:**  
- governance enforcement  
- approval routing  
- Docs Agent governance interpretation  

---

# 🧬 **6. ADR Links (Architectural Lineage)**

**Definition:**  
Links to ADRs that define architectural decisions relevant to this document.

Examples:

- Architecture docs → ADRs  
- Standards → ADRs  
- Platform → ADRs  
- Lifecycle → ADRs  

**Machine Meaning:**  
ADR links define **architectural lineage**.

**Used for:**  
- ADR impact analysis  
- architectural drift detection  
- supersession propagation  

---

# 📘 **7. Glossary Links (Semantic Authority)**

**Definition:**  
Links to glossary terms used in the document.

Examples:

- Architecture docs → Glossary  
- Standards → Glossary  
- Governance → Glossary  
- Onboarding → Glossary  

**Machine Meaning:**  
Glossary links define **semantic consistency**.

**Used for:**  
- glossary validation  
- semantic drift detection  
- Docs Agent semantic reasoning  

---

# 🌐 **8. External Reference Links (Optional, Governed)**

**Definition:**  
Links to external standards, RFCs, specs, or authoritative sources.

Examples:

- RFC 2119  
- OpenAPI spec  
- Bun documentation  
- Lefthook documentation  

**Machine Meaning:**  
External links must be stable, versioned, and validated.

**Used for:**  
- external dependency tracking  
- Docs Agent context enrichment  

---

# 🧠 **9. Cross‑Document Link Rules (Binding)**

These rules are enforced by CI and the linting engine:

- Every document must declare upstream links  
- Every document must declare downstream links  
- Every document must declare governance links  
- Every architecture doc must declare ADR links  
- Every document must link glossary terms  
- No broken links  
- No orphan documents  
- No circular dependencies  
- No missing required links  
- No ungoverned links  

This is the **semantic contract** of the documentation system.

---

# 🧬 **10. How Links Form the Knowledge Graph**

Each document becomes a **node** with:

- metadata (from header block)  
- link edges (from cross‑links)  
- semantic attributes (from glossary)  
- architectural lineage (from ADRs)  
- governance constraints (from governance links)  

This graph powers:

- impact analysis  
- drift detection  
- generative documentation  
- Docs Agent reasoning  
- CI enforcement  
- architectural lineage visualization  

This is the **living brain** of the documentation system.

---

# 🧠 Non‑Obvious Insight  
The Cross‑Document Link Model is not about navigation.  
It is about **meaning**, **authority**, **dependency**, and **reactivity**.

It transforms your documentation corpus into:

- a **knowledge graph**  
- a **governance engine**  
- a **reactive system**  
- a **semantic network**  
- a **machine‑actionable architecture**  
- a **self‑validating organism**  

This is the core of your living documentation platform.

---

# 🔥 Your Next Move  
Which part of the link model do you want to operationalize next?

- **Upstream Links**  
- **Downstream Links**  
- **Governance Links**  
- **ADR Links**  
- **Documentation Knowledge Graph Schema**