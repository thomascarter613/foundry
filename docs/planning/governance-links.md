governance-links.md
Below is the **complete, governed, canonical definition of Governance Links** — the link type that gives your documentation system **authority**, **legitimacy**, **enforcement power**, and **institutional coherence**.

Governance Links are the **most powerful edges** in the entire documentation knowledge graph.  
They define *who rules what*, *what rules apply*, and *how authority flows* across the monorepo.

Every Governance Link below is a Guided Link so you can expand any part of the system.

---

# 🏛️ Governance Links  
**The authority edges that bind the entire documentation system together.**

Governance Links are **mandatory**, **binding**, and **machine‑actionable**.  
They connect every document to the governance artifacts that define:

- rules  
- authority  
- constraints  
- enforcement  
- versioning  
- exceptions  
- lifecycle  
- approvals  

They are the **institutional backbone** of the monorepo.

---

# 🧩 What a Governance Link *Is*  
A Governance Link is a **direct reference** from any document to the governance artifact(s) that define the rules under which that document operates.

Examples:

- Standards → Documentation Governance  
- Architecture → Governance Charter  
- Lifecycle → CI Policy  
- Platform → Repository Contract  
- ADRs → Versioning Strategy  

Governance Links are **not optional**.  
They are **binding** and **CI‑enforced**.

---

# 🧭 Why Governance Links Exist  
Governance Links ensure that:

- every document knows **which rules govern it**  
- every domain knows **who has authority**  
- every change knows **what approvals are required**  
- every artifact is **legally grounded** in the governance model  
- the Docs Agent can **interpret authority flows**  
- CI can **enforce governance**  

Without Governance Links, the documentation system has **no institutional structure**.

---

# 🧱 Governance Link Types (Canonical)

Every document must include one or more of the following Governance Link types:

- **Governance Charter**  
- **Authority Map**  
- **Repository Contract**  
- **Documentation Governance**  
- **CI Policy**  
- **Versioning Strategy**  
- **Exception Process**  

These documents define the **legal framework** of the monorepo.

---

# 🔗 How Governance Links Are Declared  
Every governed document must include a section like:

```markdown
## Governance Links
- ../governance/documentation-governance.md
- ../governance/ci-policy.md
- ../governance/versioning-strategy.md
```

This section is **mandatory** and validated by CI.

---

# 🧬 Machine‑Actionable Semantics  
Governance Links are not navigation.  
They are **authority edges**.

When a governance document changes:

- all downstream documents must be revalidated  
- CI may block merges  
- the Docs Agent triggers governance impact analysis  
- drift detection runs  
- lifecycle rules may change  
- standards may change  
- architecture may change  

This is how governance becomes **active**, not passive.

---

# 🧪 CI Enforcement Rules (Binding)

CI validates:

- every document has governance links  
- governance links point only to governance documents  
- no broken governance links  
- no missing governance links  
- no circular governance dependencies  
- governance changes trigger downstream validation  
- binding governance docs require governance approval  

This is defined in the **documentation CI rules**.

---

# 🧠 How Governance Links Fit Into the Knowledge Graph  
Governance Links create the **authority layer** of the documentation knowledge graph.

Each governance document becomes a **root node** with:

- downstream edges to standards  
- downstream edges to lifecycle  
- downstream edges to architecture  
- downstream edges to platform  
- downstream edges to planning  
- downstream edges to onboarding  

This allows:

- authority flow analysis  
- governance impact analysis  
- Docs Agent governance reasoning  
- CI enforcement  
- drift detection  
- dependency mapping  

Governance Links are the **constitutional law** of the monorepo.

---

# 🧠 Non‑Obvious Insight  
Governance Links are not “references.”  
They are **institutional contracts**.

They define:

- who has authority  
- what rules apply  
- how rules propagate  
- how changes cascade  
- how CI enforces governance  
- how the Docs Agent interprets decisions  
- how the architecture remains coherent  
- how standards remain binding  
- how lifecycle remains consistent  

Governance Links are the **legal system** of your documentation universe.

Without them, the system is not governed.  
With them, the system becomes **institutional**.

---

# 🔥 Your Next Move  
Which governance subsystem do you want to operationalize next?

- **Authority Map**  
- **Repository Contract**  
- **Documentation Governance Rules**  
- **Documentation Knowledge Graph Schema**