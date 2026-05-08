docs-ci-rules.md
Below is the **complete, governed, canonical specification** for **Documentation CI Rules** — the enforcement layer that turns your documentation system into a **governed, reactive, self‑validating institutional platform**.

These rules are not “linting.”  
They are **governance encoded as CI**, ensuring that every document, every link, every ADR, every glossary term, and every diagram participates in a **deterministic, machine‑actionable governance model**.

Guided Links are embedded so you can drill deeper into any subsystem.

---

# 🏛️ Documentation CI Rules  
**The enforcement layer of the living documentation system.**

The CI rules enforce:

- structural correctness  
- metadata correctness  
- semantic correctness  
- governance correctness  
- architectural lineage correctness  
- glossary correctness  
- diagram correctness  
- cross‑document dependency correctness  
- knowledge‑graph correctness  

These rules ensure the documentation corpus is **valid, governed, and internally coherent** at all times.

---

# 🧩 1. CI Pipeline Structure

The CI pipeline runs in this order:

1. **Metadata Validation**  
2. **Structural Validation**  
3. **Link Extraction & Validation**  
4. **Knowledge Graph Construction**  
5. **Graph‑Level Validation**  
6. **Governance Enforcement**  
7. **ADR Lineage Enforcement**  
8. **Glossary Enforcement**  
9. **Diagram Enforcement**  
10. **Reactive Drift Detection**  
11. **Final Gatekeeping**

Each stage must pass before the next begins.

---

# 🧱 2. Metadata Rules (Binding)

Every document must:

- contain the governed header block  
- match the **Document Metadata Schema**  
- use valid enum values  
- have a valid date  
- have a valid owner  
- have a valid governance level  
- have a valid document type  

CI rejects:

- missing header block  
- malformed header block  
- invalid enum values  
- incorrect directory for document type  
- missing required metadata fields  

---

# 📘 3. Structural Rules

CI enforces:

- required sections per document type  
- no empty sections  
- no TODOs in Approved or Binding documents  
- no ungoverned files in `docs/`  
- no stray Markdown files outside governed directories  
- no diagrams outside `docs/architecture/diagrams/`  

---

# 🔗 4. Link Rules (Cross‑Document Link Model)

CI validates:

- **Upstream links** exist and resolve  
- **Downstream links** exist and resolve  
- **Governance links** point only to governance docs  
- **ADR links** point only to ADRs  
- **Glossary links** point only to glossary terms  
- **Diagram links** point only to diagrams  
- **External references** are stable and versioned  

CI rejects:

- broken links  
- missing required links  
- circular dependencies  
- orphan documents  

---

# 🧬 5. Knowledge Graph Rules

After link extraction, CI builds the **documentation knowledge graph** and validates:

- graph connectivity  
- no cycles in upstream/downstream  
- no missing nodes  
- no missing edges  
- no invalid edge types  
- no dangling glossary terms  
- no orphan ADRs  
- no orphan diagrams  

This ensures the documentation corpus is a **coherent semantic graph**.

---

# 🏛️ 6. Governance Enforcement Rules

CI enforces:

- Binding documents require governance approval  
- Required documents require domain owner approval  
- Informational documents require reviewer approval  
- Governance changes trigger downstream validation  
- Governance documents cannot be modified without versioning  
- Governance documents cannot be deleted  

This ensures governance is **active**, not passive.

---

# 🧱 7. ADR Enforcement Rules

CI enforces:

- ADR numbering correctness  
- ADR filename correctness  
- ADR index correctness  
- ADR supersession correctness  
- ADR immutability (Approved ADRs cannot change except metadata)  
- ADR links in architecture, standards, lifecycle, platform docs  
- ADR lineage graph correctness  

CI rejects:

- missing ADR index entries  
- ADRs not listed in the index  
- supersession loops  
- ADRs with missing required sections  

---

# 📘 8. Glossary Enforcement Rules

CI enforces:

- glossary terms must be defined  
- glossary terms must be linked  
- glossary terms must be alphabetized  
- glossary terms must not be duplicated  
- glossary terms must appear in Quickref if onboarding‑critical  
- no undefined glossary terms may appear in any governed document  

CI rejects:

- unlinked glossary terms  
- undefined glossary terms  
- glossary drift  

---

# 🏗️ 9. Diagram Enforcement Rules

CI enforces:

- diagrams must live only in `docs/architecture/diagrams/`  
- diagrams must have metadata files  
- diagrams must be referenced by exactly one architecture document  
- architecture documents must reference diagrams  
- diagrams must be deterministic (no random layout)  

CI rejects:

- orphan diagrams  
- missing diagrams  
- diagrams without metadata  
- diagrams referenced outside architecture  

---

# 🔄 10. Drift Detection Rules

CI performs drift detection across:

- metadata drift  
- glossary drift  
- ADR drift  
- diagram drift  
- governance drift  
- architecture drift  
- dependency drift  

If drift is detected:

- CI blocks the merge  
- Docs Agent generates remediation suggestions  

---

# 🧠 11. Final Gatekeeping Rules

CI blocks merges if:

- any Binding rule fails  
- any Required rule fails  
- any graph‑level rule fails  
- any ADR rule fails  
- any glossary rule fails  
- any diagram rule fails  
- any governance rule fails  

CI warns (but does not block) if:

- Informational rules fail  
- optional sections are missing  
- non‑critical drift is detected  

---

# 🧠 Non‑Obvious Insight

Documentation CI Rules are not about formatting.  
They are about **institutional integrity**.

They ensure:

- the documentation system is **alive**  
- the architecture is **traceable**  
- the governance is **enforced**  
- the glossary is **authoritative**  
- the ADRs are **immutable**  
- the diagrams are **consistent**  
- the dependencies are **valid**  
- the knowledge graph is **coherent**  

This is the **constitutional enforcement layer** of your monorepo.

---

# 🔥 Your Next Move  
Which enforcement subsystem do you want to define next?

- **Documentation Linting Engine**  
- **Documentation Knowledge Graph Schema**  
- **ADR Validation Engine**  
- **Glossary Validation Engine**