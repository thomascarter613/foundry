document-metadata-schema.md
Below is the **complete, governed, canonical Document Metadata Schema** — the schema that makes every document in your `docs/` directory **machine‑readable**, **machine‑actionable**, **governance‑enforced**, and **knowledge‑graph compatible**.

This schema is the **type system** of your entire documentation platform.  
It is the foundation that powers:

- the **documentation knowledge graph**  
- the **documentation linting engine**  
- the **documentation CI rules**  
- the **Docs Agent reasoning engine**  
- the **reactive update system**  
- the **drift detection engine**  

This is not optional metadata.  
This is **governance encoded as structure**.

---

# 🏛️ **Document Metadata Schema (Canonical, Binding, Machine‑Readable)**

Every document in `docs/` must begin with a governed header block.  
That block is the **human‑readable representation** of the metadata schema.

Below is the **machine‑readable schema** that defines the meaning, constraints, and validation rules for that header.

---

# 🧩 **1. Top‑Level Schema**

Every document must conform to this schema:

```yaml
DocumentMetadata:
  type: object
  required:
    - status
    - owner
    - lastUpdated
    - governanceLevel
    - documentType
  properties:
    status:
      type: string
      enum: [Draft, Approved, Deprecated]
    owner:
      type: string
    lastUpdated:
      type: string
      pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"
    governanceLevel:
      type: string
      enum: [Informational, Required, Binding]
    documentType:
      type: string
      enum: [Planning, Governance, Architecture, Lifecycle, Standard, Platform, Onboarding]
    upstream:
      type: array
      items:
        type: string
    downstream:
      type: array
      items:
        type: string
    governanceLinks:
      type: array
      items:
        type: string
    adrLinks:
      type: array
      items:
        type: string
    glossaryTerms:
      type: array
      items:
        type: string
```

This schema is consumed by:

- the knowledge graph  
- the linting engine  
- CI  
- the Docs Agent  

---

# 🧭 **2. Field‑by‑Field Meaning**

Below is the **semantic meaning** of each field — the part that makes the system *alive*.

---

## **status**
Allowed values: `Draft`, `Approved`, `Deprecated`

Machine behavior:

- `Approved` docs are immutable except metadata  
- `Deprecated` docs must link to successors  
- `Draft` docs cannot block CI  

---

## **owner**
The team or role responsible for the document.

Machine behavior:

- determines approval routing  
- determines governance escalation  
- determines who must update downstream docs  

---

## **lastUpdated**
Format: `YYYY-MM-DD`

Machine behavior:

- drift detection  
- freshness validation  
- release documentation checks  

---

## **governanceLevel**
Allowed values: `Informational`, `Required`, `Binding`

Machine behavior:

- `Binding` docs require governance approval  
- `Required` docs require domain owner approval  
- `Informational` docs require reviewer approval  

---

## **documentType**
Allowed values:  
`Planning`, `Governance`, `Architecture`, `Lifecycle`, `Standard`, `Platform`, `Onboarding`

Machine behavior:

- determines required sections  
- determines cross‑link expectations  
- determines validation rules  
- determines directory placement  

---

# 🔗 **3. Link Fields (The Knowledge Graph Edges)**

These fields define the **graph structure** of the documentation system.

---

## **upstream**
Documents this document depends on.

Machine behavior:

- upstream changes trigger downstream validation  
- used for impact analysis  
- used for drift detection  

---

## **downstream**
Documents that depend on this document.

Machine behavior:

- downstream docs must update when this doc changes  
- CI may block merges until downstream updates occur  

---

## **governanceLinks**
Governance documents that define authority over this document.

Machine behavior:

- determines which rules apply  
- determines approval requirements  
- determines governance propagation  

---

## **adrLinks**
Architectural decisions that justify or constrain this document.

Machine behavior:

- determines architectural lineage  
- triggers ADR impact analysis  
- enforces architectural consistency  

---

## **glossaryTerms**
Glossary terms used in this document.

Machine behavior:

- glossary validation  
- semantic drift detection  
- Docs Agent semantic reasoning  

---

# 🧬 **4. Why This Schema Matters**

This schema is the **type system** of your documentation platform.

It enables:

- deterministic parsing  
- typed documents  
- cross‑link graph construction  
- governance enforcement  
- ADR lineage  
- semantic drift detection  
- reactive updates  
- generative documentation  
- Docs Agent reasoning  

Without this schema, the documentation system cannot be:

- alive  
- reactive  
- generative  
- self‑validating  
- machine‑actionable  
- governable  

This schema is the **root of the living documentation organism**.

---

# 🔥 Your Next Move  
Which metadata subsystem do you want to activate next?

- **Documentation Knowledge Graph Schema**  
- **Documentation Linting Engine**  
- **Docs Agent Specification**