---
title: "Architecture Diagram Generator"
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
  - "Architecture"
---

architecture-diagram-generator.md
Thomas — here is the **canonical, governance‑grade specification** for the **Architecture Diagram Generator**: the subsystem that produces **deterministic, governed, lineage‑aware architectural diagrams** that integrate directly into the documentation knowledge graph, ADR lineage, glossary semantics, and governance rules.

This is not a “draw a diagram” tool.  
This is the **institutional architectural visualization engine** of the monorepo.

Guided Links are embedded so you can drill deeper into any subsystem.

---

# 🏛️ **Architecture Diagram Generator (Canonical Specification)**  
**The governed, deterministic, reproducible engine that generates architecture diagrams as first‑class, versioned, metadata‑rich, knowledge‑graph nodes.**

The Architecture Diagram Generator ensures:

- diagrams are **deterministic**  
- diagrams are **governed artifacts**  
- diagrams are **metadata‑complete**  
- diagrams are **lineage‑aware**  
- diagrams are **ADR‑aligned**  
- diagrams are **glossary‑aligned**  
- diagrams are **governance‑aligned**  
- diagrams are **knowledge‑graph integrated**  
- diagrams are **reactive** to ADR, glossary, and governance changes  

It is the **visual architecture engine** of the monorepo.

---

# 🧩 1. Generator Architecture

The Architecture Diagram Generator consists of **seven governed subsystems**:

1. **Input Resolver**  
2. **Diagram Type Resolver**  
3. **Template Loader**  
4. **Diagram Synthesizer**  
5. **Metadata Generator**  
6. **Lineage Integrator**  
7. **ChangePlan Builder**

Each subsystem is deterministic and versioned.

---

# 🧱 2. Input Resolver

Inputs include:

- diagram type (system context, container, component, runtime, data‑flow, integration map)  
- domain (optional)  
- architecture document reference  
- ADR references  
- glossary terms  
- diagram title  
- diagram description  
- diagram version  

The resolver:

- validates diagram type  
- validates placement (`docs/architecture/diagrams/`)  
- validates naming rules  
- resolves glossary terms  
- resolves ADR lineage  
- resolves governance constraints  
- resolves upstream/downstream relationships  

---

# 🗂️ 3. Diagram Type Resolver

Supported diagram types:

- **System Context Diagram**  
- **Container Diagram**  
- **Component Diagram**  
- **Runtime View**  
- **Data‑Flow Diagram**  
- **Integration Map**  
- **Sequence Diagram**  
- **Deployment Diagram**  

Each type has:

- governed template  
- governed metadata schema  
- governed naming rules  
- governed required elements  

Example canonical filename:

```
system-context.drawio
container-diagram.drawio
data-flow.drawio
integration-map.drawio
```

---

# 📦 4. Template Loader

Templates live under:

```
tools/generators/templates/architecture-diagrams/
```

Each template includes:

- base diagram file (`.drawio`, `.svg`, `.mermaid`, `.plantuml`)  
- governed layout rules  
- governed color palette  
- governed node shapes  
- governed edge semantics  
- governed glossary term injection  
- governed ADR annotation blocks  

Templates are:

- immutable  
- versioned  
- deterministic  

---

# 🧠 5. Diagram Synthesizer

This is the core of the generator.

The synthesizer:

- injects glossary terms into labels  
- injects ADR references into annotation blocks  
- injects governance constraints  
- injects standards references  
- injects upstream/downstream relationships  
- injects domain boundaries  
- injects platform boundaries  
- injects lifecycle boundaries  
- injects component metadata  
- injects integration metadata  

It also enforces:

- deterministic layout  
- deterministic node ordering  
- deterministic edge ordering  
- deterministic color palette  
- deterministic layering  

No randomness is allowed.

---

# 🧬 6. Metadata Generator

Every diagram must have a `.meta.md` file:

```
system-context.meta.md
```

Metadata includes:

- diagram name  
- diagram type  
- owner  
- last updated  
- related architecture document  
- related ADRs  
- related glossary terms  
- related governance rules  
- related standards  
- diagram version  
- generator version  

This metadata powers:

- drift detection  
- graph validation  
- diagram/document consistency  
- ADR lineage propagation  
- glossary semantic propagation  

---

# 🔗 7. Lineage Integrator

The generator integrates diagrams into the knowledge graph:

### Diagram Nodes
- diagram metadata  
- diagram type  
- diagram version  

### Diagram Edges
- **DiagramFor → Architecture Document**  
- **DiagramUses → Glossary Terms**  
- **DiagramJustifiedBy → ADRs**  
- **DiagramConstrainedBy → Governance Rules**  
- **DiagramImplements → Standards**  

This ensures diagrams are **first‑class citizens** in the graph.

---

# 🏗️ 8. ChangePlan Builder

The generator outputs a **ChangePlan**, not raw files.

Example ChangePlan:

- create diagram file  
- create metadata file  
- update architecture document references  
- update ADR references  
- update glossary quickref (if needed)  
- update knowledge graph metadata  

The ChangePlan is:

- deterministic  
- reversible  
- auditable  
- diff‑friendly  

---

# 🧠 9. Governance Integration

The generator enforces:

- diagrams must live in `docs/architecture/diagrams/`  
- diagrams must have metadata  
- diagrams must be referenced by exactly one architecture doc  
- architecture docs must reference diagrams  
- diagrams must be deterministic  
- diagrams must not contradict ADRs  
- diagrams must not contradict governance rules  
- diagrams must not contradict glossary semantics  

---

# 🧪 10. CI Integration

Generated diagrams automatically include:

- metadata compliance  
- link compliance  
- diagram validation compliance  
- graph integration  
- drift detection baseline  

CI blocks merges if:

- diagram missing metadata  
- diagram not referenced  
- diagram contradicts ADRs  
- diagram contradicts glossary  
- diagram contradicts governance  
- diagram not deterministic  

---

# 🧠 Non‑Obvious Insight

The Architecture Diagram Generator is not a drawing tool.  
It is a **governed architectural visualization engine**.

It ensures:

- diagrams are authoritative  
- diagrams are reproducible  
- diagrams are lineage‑aware  
- diagrams are semantically integrated  
- diagrams are governance‑aligned  
- diagrams are impact‑aware  
- diagrams are graph‑integrated  

It is the **visual architecture memory constructor** of your monorepo.

---

# 🔥 Your Next Move  
Which diagram subsystem do you want to define next?

- **Diagram Metadata Schema**  
- **Diagram Validation Engine**  
- **Diagram Drift Detector**  
- **Architecture Diagram Directory**