---
title: "Adrlinks"
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
  - "ADR"
  - "Adrlinks"
---

adrlinks.md
Below is the **complete, governed, canonical definition of ADR Links** — the link type that gives your architecture **lineage**, **memory**, **traceability**, and **machine‑actionable authority**.

ADR Links are the **architectural DNA strands** of your documentation system.  
They connect every architectural artifact to the decisions that justify it, constrain it, and define its evolution.

Every concept below is a Guided Link so you can expand any part of the system.

---

# 🏛️ ADR Links  
**The architectural lineage edges that bind decisions to design.**

ADR Links ensure that:

- every architectural document is grounded in explicit decisions  
- every standard is justified by architectural rationale  
- every lifecycle rule reflects architectural constraints  
- every platform rule aligns with architectural decisions  
- every planning artifact is traceable to decisions  
- every ADR forms part of a coherent lineage  

They are the **architectural authority edges** in the knowledge graph.

---

# 🧩 **1. What an ADR Link *Is***  
An ADR Link is a **mandatory reference** from any document that relies on architectural decisions to the ADR(s) that define those decisions.

Examples:

- Architecture docs → ADRs  
- Standards → ADRs  
- Platform → ADRs  
- Lifecycle → ADRs  
- Planning → ADRs  
- Onboarding → ADRs (when explaining architecture)  

ADR Links are **binding** and **CI‑enforced**.

---

# 🧭 **2. Why ADR Links Exist**  
ADR Links ensure:

- **architectural traceability**  
- **decision lineage**  
- **change propagation**  
- **governance enforcement**  
- **semantic grounding**  
- **machine‑actionable architecture**  

Without ADR Links:

- architecture becomes ambiguous  
- standards drift  
- lifecycle rules lose grounding  
- platform rules become inconsistent  
- onboarding becomes misleading  
- the Docs Agent cannot reason about architecture  

ADR Links are the **architectural constitution** of the monorepo.

---

# 🧱 **3. How ADR Links Are Declared**

Every document that depends on architectural decisions must include:

```markdown
## Related ADRs
- ADR 0001 – Architecture Principles
- ADR 0002 – Monorepo Structure
- ADR 0003 – Package Management (bun-only)
```

This section is **mandatory** for:

- architecture documents  
- standards  
- lifecycle documents  
- platform documents  
- ADRs themselves (cross‑linking)  

---

# 🧬 **4. Machine‑Actionable Semantics**

ADR Links are not navigation.  
They are **architectural dependency edges**.

When an ADR changes:

- all downstream documents must be revalidated  
- CI may block merges  
- the Docs Agent triggers architectural impact analysis  
- drift detection runs  
- diagrams may need updating  
- standards may need updating  
- lifecycle rules may need updating  

This is how architecture becomes **reactive** and **governed**.

---

# 🔄 **5. ADR Link Types (Canonical)**

There are three types of ADR Links:

### **1. Direct ADR Links**  
A document explicitly depends on the decision.

Example:  
Architecture → ADR 0002 (Monorepo Structure)

### **2. Indirect ADR Links**  
A document depends on another document that depends on an ADR.

Example:  
Lifecycle → Architecture → ADR 0004 (CI Governance)

### **3. Supersession Links**  
ADR → ADR (lineage)

Example:  
ADR 0010 supersedes ADR 0007

These links form the **architectural lineage graph**.

---

# 🧪 **6. CI Enforcement Rules (Binding)**

CI validates:

- every architecture doc has ADR links  
- every standard has ADR links  
- every lifecycle doc has ADR links  
- ADR links reference valid ADR numbers  
- ADR links reference existing ADR files  
- ADR links match the ADR index  
- no broken ADR links  
- no missing ADR links  
- no circular ADR dependencies  
- supersession chains are valid  

This is defined in the **documentation CI rules**.

---

# 🧠 **7. How ADR Links Fit Into the Knowledge Graph**

ADR Links create the **architectural layer** of the documentation knowledge graph.

Each ADR becomes a **root node** with:

- upstream edges to planning  
- downstream edges to architecture  
- downstream edges to standards  
- downstream edges to lifecycle  
- downstream edges to platform  
- sibling edges to other ADRs  
- supersession edges to older ADRs  

This enables:

- architectural impact analysis  
- drift detection  
- Docs Agent architectural reasoning  
- lineage visualization  
- dependency mapping  

ADR Links are the **architectural nervous system** of the monorepo.

---

# 🧠 Non‑Obvious Insight  
ADR Links are not “references.”  
They are **architectural contracts**.

They define:

- why the architecture is the way it is  
- how decisions propagate  
- how standards derive authority  
- how lifecycle rules reflect architecture  
- how platform rules align with decisions  
- how onboarding explains architecture  
- how the Docs Agent reasons about design  

ADR Links are the **living memory** of your architecture.

Without them, architecture becomes folklore.  
With them, architecture becomes **institutional law**.

---

# 🔥 Your Next Move  
Which part of the ADR subsystem do you want to operationalize next?

- **ADR Validation Engine**  
- **ADR Impact Analyzer**  
- **Documentation Knowledge Graph Schema**  
- **Generate ADR 0001–0004 with full content**