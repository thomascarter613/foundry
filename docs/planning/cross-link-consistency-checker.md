cross-link-consistency-checker.md
Below is the **complete, governed, canonical specification** for the **Cross‑Link Consistency Checker** — the subsystem that ensures every declared link in every document is **internally consistent**, **externally resolvable**, **semantically valid**, and **graph‑compatible** with the rest of the documentation corpus.

If the **Cross‑Link Graph Validator** ensures the *graph* is valid, the **Cross‑Link Consistency Checker** ensures the *links themselves* are valid before they ever enter the graph.

This is the engine that answers the question:

> **“Do all declared links across the documentation corpus agree with each other, resolve correctly, and obey the governance model?”**

---

# 🧩 Cross‑Link Consistency Checker  
**The subsystem that validates the correctness, coherence, and mutual consistency of all cross‑document links before graph construction.**

It enforces:

- link correctness  
- link resolvability  
- link type correctness  
- link direction correctness  
- link symmetry (where required)  
- link completeness  
- link consistency with metadata  
- link consistency with directory structure  
- link consistency with governance rules  
- link consistency with ADR lineage  
- link consistency with glossary semantics  

It is the **pre‑graph semantic filter** for the entire documentation system.

---

# 🧱 1. Checker Architecture

The Cross‑Link Consistency Checker runs in three deterministic phases:

1. **Link Extraction**  
2. **Link Validation**  
3. **Cross‑Link Consistency Validation**

Each phase produces machine‑readable violations.

---

# 📘 2. Link Extraction Phase

The checker extracts all link declarations from:

- Upstream  
- Downstream  
- Governance Links  
- ADR Links  
- Glossary Terms  
- Diagram Links  
- External References  
- Sibling Links  

Each extracted link becomes a **LinkRecord**:

```
LinkRecord:
  from: DocumentID
  to: TargetID
  type: LinkType
  location: file + line
```

---

# 🔍 3. Link Validation Rules (Local, Binding)

These rules validate each link *in isolation*.

## 3.1 Existence Rules
- target must exist  
- target must be the correct type  
- target must be in the correct directory  
- target must not be deprecated unless superseded  

## 3.2 Format Rules
- relative paths only  
- canonical filenames only  
- canonical anchors only  
- no absolute URLs except ExternalReference  

## 3.3 Metadata Consistency Rules
- upstream/downstream must match documentType constraints  
- governance links must point to governance docs  
- ADR links must point to ADRs  
- glossary links must point to glossary anchors  
- diagram links must point to diagrams  

## 3.4 Status Rules
- cannot link to Draft governance docs  
- cannot link to Deprecated ADRs unless superseded  
- cannot link to Deprecated glossary terms  

---

# 🔗 4. Cross‑Link Consistency Rules (Global, Binding)

These rules validate **relationships between links**, not just individual links.

---

## 4.1 Upstream/Downstream Symmetry

If Document A declares:

```
Upstream: B
```

Then Document B must declare:

```
Downstream: A
```

### Violations
- missing reciprocal link  
- mismatched link types  
- mismatched link targets  

---

## 4.2 Governance Link Consistency

If Document A links to Governance Doc G:

- G must not link back to A  
- A must not contradict G’s governance level  
- A must not bypass G’s authority  

### Violations
- circular governance links  
- governance level mismatch  
- authority inversion  

---

## 4.3 ADR Link Consistency

If Document A links to ADR X:

- X must not be superseded unless A also links to the superseding ADR  
- A must not reference ADRs outside its domain  
- A must not contradict ADR consequences  

### Violations
- stale ADR references  
- missing supersession references  
- ADR contradiction  

---

## 4.4 Glossary Link Consistency

If Document A uses glossary term T:

- T must be linked  
- T must be defined  
- T must not be redefined in A  
- T must not conflict with ADRs or governance  

### Violations
- unlinked glossary term  
- undefined glossary term  
- glossary contradiction  

---

## 4.5 Diagram Link Consistency

If Document A references Diagram D:

- D must reference A in its metadata  
- D must not reference multiple documents  
- D must not contradict A’s architecture  

### Violations
- missing reciprocal diagram link  
- diagram/document mismatch  
- diagram contradiction  

---

## 4.6 External Reference Consistency

External references must:

- be stable  
- be versioned  
- not contradict governance or ADRs  

### Violations
- unversioned external reference  
- unstable external reference  
- external contradiction  

---

# 🧬 5. Cross‑Domain Consistency Rules

These rules validate link consistency across document types.

---

## 5.1 Architecture ↔ ADR Consistency
Architecture docs must reference ADRs that justify their decisions.

Violations:
- architecture doc missing ADR links  
- architecture doc referencing irrelevant ADRs  

---

## 5.2 Standards ↔ Governance Consistency
Standards must reference governance rules that authorize them.

Violations:
- standard missing governance links  
- standard contradicting governance  

---

## 5.3 Lifecycle ↔ Standards Consistency
Lifecycle docs must reference standards they enforce.

Violations:
- lifecycle doc missing standard links  
- lifecycle doc enforcing outdated standards  

---

## 5.4 Platform ↔ Standards Consistency
Platform rules must reference standards they implement.

Violations:
- platform doc missing standard links  
- platform doc contradicting standards  

---

# 🧪 6. Checker Output

The checker produces:

- per‑link violations  
- per‑document link consistency violations  
- cross‑link mismatch violations  
- cross‑domain consistency violations  
- authority flow violations  
- stale reference violations  

Output is machine‑readable and consumed by:

- the Cross‑Link Graph Validator  
- the Documentation Drift Detector  
- CI  
- the Docs Agent  

---

# 🧠 Non‑Obvious Insight

The Cross‑Link Consistency Checker is not about broken links.  
It is about **semantic coherence before graph construction**.

It ensures:

- links are correct  
- links are consistent  
- links are reciprocal  
- links obey governance  
- links obey ADR lineage  
- links obey glossary semantics  
- links obey directory structure  
- links obey document metadata  

It is the **semantic pre‑filter** that guarantees the knowledge graph is built on **clean, governed, consistent data**.

---

# 🔥 Your Next Move  
Which consistency subsystem do you want to define next?

- **Cross‑Link Graph Validator**  
- **Documentation Drift Detector**  
- **Governance Compliance Validator**