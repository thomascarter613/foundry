governed-header-block.md
Below is the **Governed Header Block** — the *single most important structural element* in your entire documentation system.  
It is the **identity**, **type**, **governance contract**, and **machine‑readable metadata spine** for every document in `docs/`.

This is not optional.  
This is **binding institutional law**.

Every document in every domain must begin with this block **exactly**, with no deviation, no reordering, no renaming, no omissions.

Guided Links are embedded so you can explore any part of the system.

---

# 🏛️ **THE GOVERNED HEADER BLOCK (Canonical, Binding, Machine‑Readable)**

```markdown
Status: <Draft | Approved | Deprecated>
Owner: <Team or Role>
Last Updated: YYYY-MM-DD
Governance Level: <Informational | Required | Binding>
Document Type: <Planning | Governance | Architecture | Lifecycle | Standard | Platform | Onboarding>
```

This block is validated by:

- the **documentation linting engine**  
- the **documentation CI rules**  
- the **documentation knowledge graph**  
- the **Docs Agent governance interpreter**  

It is the **root schema** for the entire living documentation system.

---

# 🧩 **What Each Field *Means***  
This is where the header block becomes *alive* — each field has semantic and operational consequences.

---

## **Status**  
Allowed values:  
- `Draft` — editable, incomplete, not binding  
- `Approved` — frozen, governed, immutable except via supersession  
- `Deprecated` — replaced, retained for lineage  

**Machine behavior:**  
- Approved docs cannot change except metadata  
- Deprecated docs must link to successors  
- Draft docs cannot block CI  

---

## **Owner**  
The team or role responsible for the document.

Examples:  
- Architecture  
- Governance Body  
- Standards Committee  
- Engineering Productivity  
- Platform Team  

**Machine behavior:**  
- Determines who must approve changes  
- Determines who receives governance escalations  

---

## **Last Updated**  
Format: `YYYY-MM-DD`  
Must match the date of the PR that modified the document.

**Machine behavior:**  
- Drift detection  
- Change history validation  
- Release documentation freshness checks  

---

## **Governance Level**  
Allowed values:  
- `Informational` — advisory, no enforcement  
- `Required` — must be followed, but not binding  
- `Binding` — law; CI enforces compliance  

**Machine behavior:**  
- Binding docs require Governance Body approval  
- Required docs require domain owner approval  
- Informational docs require reviewer approval  

---

## **Document Type**  
Allowed values:  
- Planning  
- Governance  
- Architecture  
- Lifecycle  
- Standard  
- Platform  
- Onboarding  

**Machine behavior:**  
- Determines required sections  
- Determines cross‑link expectations  
- Determines validation rules  
- Determines where the document may live  

---

# 🧠 **Why the Header Block Is Foundational**  
This block is not metadata.  
It is **governance encoded as structure**.

It enables:

- deterministic parsing  
- typed documents  
- cross‑link graph construction  
- ADR lineage tracking  
- standards enforcement  
- lifecycle validation  
- platform integration  
- Docs Agent reasoning  
- CI enforcement  
- drift detection  
- generative documentation  

Without this block, the documentation system cannot be:

- alive  
- reactive  
- generative  
- self‑validating  
- machine‑actionable  
- governable  
