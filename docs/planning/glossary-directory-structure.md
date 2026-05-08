glossary-directory-structure.md
Below is the **complete, governed, canonical specification** for the **Glossary + Glossary Quickref subsystem** — one of the most important semantic components of your living documentation platform.

This subsystem is not “a glossary.”  
It is a **typed, governed, machine‑actionable linguistic authority** that:

- defines institutional vocabulary  
- enforces semantic consistency  
- powers the documentation knowledge graph  
- drives glossary linting  
- updates Quickref reactively  
- constrains ADRs, architecture, governance, and standards  
- provides a human‑readable and machine‑readable semantic layer  

Guided Links are embedded throughout so you can expand any part of the system.

---

# 🏛️ **1. Glossary Directory Structure (Canonical)**

```
docs/planning/glossary.md
docs/onboarding/glossary-quickref.md
```

- `glossary.md` → **the canonical source of truth**  
- `glossary-quickref.md` → **the curated onboarding subset**

Both are governed artifacts with strict templates and strict CI enforcement.

---

# 📘 **2. Canonical Glossary (`glossary.md`)**

This is the **authoritative semantic ledger** for the entire monorepo.

### **Location**
```
docs/planning/glossary.md
```

### **Governed Header Block**
```markdown
Status: Approved
Owner: Architecture
Last Updated: YYYY-MM-DD
Governance Level: Binding
Document Type: Planning
```

### **Canonical Structure**
```markdown
# Glossary

Status: Approved  
Owner: Architecture  
Last Updated: YYYY-MM-DD  
Governance Level: Binding  
Document Type: Planning

## Purpose
Define the authoritative vocabulary for the monorepo.

## Terms
### <Term>
Definition.  
Required cross-links.  
Domain context.  
Constraints.

### <Term>
Definition.  
…

## Related Documents
- ../architecture/principles.md
- ../governance/documentation-governance.md

## Change History
- YYYY-MM-DD: Initial creation
```

### **Machine‑Actionable Semantics**
The glossary is:

- a **typed node** in the documentation knowledge graph  
- the **source of truth** for all terminology  
- the **validation dictionary** for glossary linting  
- the **semantic authority** for ADRs, standards, and architecture  

Every term becomes a **graph node** with:

- definition  
- domain  
- cross‑links  
- usage references  

This enables:

- semantic drift detection  
- term lineage  
- term dependency mapping  
- Quickref generation  
- Docs Agent semantic reasoning  

---

# 🧭 **3. Glossary Quickref (`glossary-quickref.md`)**

This is the **curated onboarding subset** of the glossary.

### **Location**
```
docs/onboarding/glossary-quickref.md
```

### **Governed Header Block**
```markdown
Status: Approved
Owner: Architecture
Last Updated: YYYY-MM-DD
Governance Level: Informational
Document Type: Onboarding
```

### **Canonical Structure**
```markdown
# Glossary Quick Reference

Status: Approved  
Owner: Architecture  
Last Updated: YYYY-MM-DD  
Governance Level: Informational  
Document Type: Onboarding

## Purpose
Provide a curated subset of the full glossary for rapid onboarding.

## Key Terms
- <Term>: Short definition. See full glossary for details.
- <Term>: Short definition.
- <Term>: Short definition.

## Navigation
For full definitions, see `../planning/glossary.md`.

## Related Documents
- ../planning/glossary.md  
- system-overview.md  

## Change History
- YYYY-MM-DD: Initial creation
```

### **Machine‑Actionable Semantics**
The Quickref is:

- a **derived artifact**  
- **automatically updated** when glossary changes  
- validated by CI  
- validated by the glossary linting engine  
- used by onboarding flows  
- used by the Docs Agent for human‑friendly explanations  

---

# 🔗 **4. Cross‑Link Rules (Governed, Enforced)**

Every glossary term must:

- link to the canonical glossary  
- be referenced consistently  
- be validated by the glossary engine  
- appear in the Quickref if marked “onboarding‑critical”  

Cross‑links are required in:

- architecture docs  
- governance docs  
- lifecycle docs  
- standards  
- ADRs  
- onboarding docs  

This creates the **semantic backbone** of the documentation knowledge graph.

---

# 🧪 **5. Glossary Validation Engine (Machine Rules)**

The glossary subsystem is validated by:

- **Glossary Validation Engine**  
- **Documentation Linting Engine**  
- **Documentation CI Rules**  

### **Validation Rules**
- All glossary terms must be defined in `glossary.md`  
- All glossary terms used in docs must link to the glossary  
- No undefined terms allowed  
- Quickref must contain all onboarding‑critical terms  
- Quickref must not contain terms not in the glossary  
- Glossary must be alphabetized  
- Glossary must have no duplicate terms  
- Glossary must have no empty definitions  
- Glossary must include change history entries  

---

# 🔄 **6. Reactive Behavior (Living System)**

When `glossary.md` changes:

- Quickref updates  
- Cross‑link graph updates  
- Docs Agent updates semantic model  
- Drift detection runs  
- ADRs referencing changed terms are flagged  
- Standards referencing changed terms are flagged  
- Architecture docs referencing changed terms are flagged  

This is how the glossary becomes a **reactive subsystem**.

---

# 🧠 **7. Non‑Obvious Insight**

The glossary is not a dictionary.  
It is the **semantic constitution** of your monorepo.

It governs:

- language  
- meaning  
- architecture  
- governance  
- standards  
- lifecycle  
- onboarding  
- ADRs  
- the Docs Agent  

It is the **linguistic authority** of the entire system.

Without a governed glossary:

- terms drift  
- architecture becomes ambiguous  
- governance becomes unclear  
- standards become inconsistent  
- onboarding becomes chaotic  
- ADRs lose precision  
- the knowledge graph collapses  

The glossary is the **semantic root** of your living documentation organism.

---

# 🔥 Your Next Move  
Which part of the glossary subsystem do you want to build next?

- **Glossary Validation Engine**  
- **Documentation Knowledge Graph Schema**  
- **Docs Agent Semantic Reasoning Engine**  
- **Generate a canonical glossary with initial terms**