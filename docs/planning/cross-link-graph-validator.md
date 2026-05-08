cross-link-graph-validator.md
Below is the **complete, governed, canonical specification** for the **Cross‑Link Graph Validator** — the subsystem that ensures your documentation corpus forms a **valid, coherent, acyclic, governed knowledge graph** according to the **Cross‑Document Link Model**, the **Document Metadata Schema**, and all domain‑specific link rules (ADR, Governance, Glossary, Diagrams, etc.).

This validator is the **graph‑level enforcement layer** that runs *after* linting and *before* CI gatekeeping.  
It is the **semantic auditor** of the entire documentation system.

Guided Links are embedded so you can expand any subsystem.

---

# 🏛️ **Cross‑Link Graph Validator**  
**The subsystem that validates the entire documentation knowledge graph for structural, semantic, and governance correctness.**

The validator ensures:

- every node is valid  
- every edge is valid  
- every dependency is valid  
- every governance relationship is valid  
- every ADR lineage is valid  
- every glossary usage is valid  
- every diagram relationship is valid  
- the entire graph is acyclic, connected, and internally coherent  

This is the **final semantic integrity check** before CI enforcement.

---

# 🧩 **1. Validator Architecture**

The Cross‑Link Graph Validator runs in four deterministic phases:

1. **Graph Construction**  
2. **Node Validation**  
3. **Edge Validation**  
4. **Graph‑Level Validation**

Each phase produces machine‑readable violations.

---

# 🧱 **2. Graph Construction Phase**

The validator consumes:

- parsed documents  
- extracted metadata  
- extracted links  
- glossary terms  
- ADR metadata  
- diagram metadata  

It constructs the **documentation knowledge graph** with:

- **nodes** (documents, ADRs, glossary terms, diagrams, governance rules)  
- **edges** (upstream, downstream, governance, ADRDependency, ADRSupersedes, GlossaryUsage, DiagramFor, ExternalReference, Sibling)  

This graph is the input to all subsequent validation phases.

---

# 🧩 **3. Node Validation Rules (Binding)**

Each node must satisfy the rules for its type.

## **Document Nodes**
- must have valid metadata  
- must have valid documentType  
- must have valid governanceLevel  
- must have valid status  
- must have at least one upstream or downstream link  
- must not be orphaned  

## **ADR Nodes**
- must have valid ADR number  
- must appear in ADR index  
- must have valid supersession metadata  

## **GlossaryTerm Nodes**
- must have valid anchor  
- must have unique term  
- must have unique anchor  

## **Diagram Nodes**
- must have metadata file  
- must be referenced by exactly one architecture document  

## **GovernanceRule Nodes**
- must be Binding or Required  
- must not be orphaned  

---

# 🔗 **4. Edge Validation Rules (Binding)**

Each edge type has strict rules.

## **Upstream / Downstream**
- must resolve to existing documents  
- must not form cycles  
- must not contradict metadata  
- must not create orphan nodes  

## **Governance**
- must point only to governance documents  
- must not form cycles  
- must not be missing for governed document types  

## **ADRDependency**
- must point only to ADR nodes  
- must not reference deprecated ADRs unless superseded  
- must not form cycles  

## **ADRSupersedes**
- must match ADR metadata  
- must not form loops  
- must not skip numbers  

## **GlossaryUsage**
- must point only to glossary terms  
- must not reference undefined terms  

## **DiagramFor**
- must point only to architecture documents  
- must not be duplicated  

## **ExternalReference**
- must be stable and versioned  

## **Sibling**
- must be within same domain  
- must not form cycles  

---

# 🧬 **5. Graph‑Level Validation Rules (Global, Binding)**

These rules validate the **entire graph**, not individual nodes or edges.

## **5.1 Connectivity Rules**
- no orphan documents  
- no orphan ADRs  
- no orphan glossary terms  
- no orphan diagrams  
- no orphan governance rules  

## **5.2 Acyclicity Rules**
- upstream/downstream graph must be acyclic  
- ADR supersession graph must be acyclic  
- glossary definition graph must be acyclic  

## **5.3 Authority Flow Rules**
- governance links must form a valid authority tree  
- no document may bypass governance  
- governance changes must propagate downstream  

## **5.4 Architectural Lineage Rules**
- every architecture doc must link to at least one ADR  
- every standard must link to at least one ADR  
- every lifecycle doc must link to at least one ADR  

## **5.5 Semantic Consistency Rules**
- glossary terms must be used consistently  
- glossary definitions must not conflict with ADRs  
- glossary definitions must not conflict with governance docs  

## **5.6 Diagram Consistency Rules**
- every architecture doc must reference diagrams  
- every diagram must reference exactly one architecture doc  

---

# 🔄 **6. Reactive Behavior (Graph‑Driven Enforcement)**

When the graph changes:

- drift detection runs  
- downstream documents are flagged  
- ADR lineage is revalidated  
- glossary usage is revalidated  
- governance propagation is revalidated  
- diagram/document relationships are revalidated  
- Docs Agent updates its semantic model  

This makes the graph validator a **reactive subsystem**.

---

# 🧪 **7. Validator Output**

The validator produces:

- **node violations**  
- **edge violations**  
- **graph‑level violations**  
- **authority flow violations**  
- **lineage violations**  
- **semantic drift violations**  

Output is machine‑readable and consumed by CI.

---

# 🧠 **Non‑Obvious Insight**

The Cross‑Link Graph Validator is not a linter.  
It is the **semantic auditor** of your documentation universe.

It ensures:

- the graph is valid  
- the graph is governed  
- the graph is acyclic  
- the graph is authoritative  
- the graph is semantically coherent  
- the graph is machine‑actionable  

Without it, your documentation becomes a collection of files.  
With it, your documentation becomes a **living, governed knowledge system**.

---

# 🔥 Your Next Move  
Which graph subsystem do you want to define next?

- **Graph Drift Detection Engine**  
- **Docs Agent Reasoning Engine**  
- **Documentation Knowledge Graph Schema**