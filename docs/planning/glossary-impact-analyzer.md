glossary-impact-analyzer.md
Below is the **complete, governed, canonical specification** for the **Glossary Impact Analyzer** — the subsystem that makes your glossary *reactive*, *semantic*, and *institutionally enforced* across the entire documentation knowledge graph.

If the **Glossary Validation Engine** ensures the glossary is *correct*, the **Glossary Impact Analyzer** ensures the glossary is *consequential*.

This is the engine that answers the question:

> **“If this glossary term changes, what must change with it?”**

Guided Links are embedded so you can expand any subsystem.

---

# 🧠 **Glossary Impact Analyzer**  
**The subsystem that computes, propagates, and enforces the semantic consequences of glossary term changes across the entire documentation knowledge graph.**

The Glossary Impact Analyzer:

- identifies all documents affected by glossary term changes  
- computes the semantic blast radius  
- detects semantic drift  
- enforces downstream updates  
- integrates with ADRs, governance, standards, architecture, lifecycle, diagrams  
- updates the Docs Agent semantic model  
- ensures the glossary remains the authoritative semantic source of truth  

It is the **semantic nervous system** of your monorepo.

---

# 🧩 1. Analyzer Architecture

The Glossary Impact Analyzer runs in four deterministic phases:

1. **Glossary Change Detection**  
2. **Semantic Impact Graph Construction**  
3. **Impact Propagation**  
4. **Remediation & Enforcement**

Each phase produces machine‑readable results consumed by CI and the Docs Agent.

---

# 🧱 2. Glossary Change Detection (Trigger Layer)

The analyzer detects:

- new glossary terms  
- renamed glossary terms  
- removed glossary terms  
- modified definitions  
- modified anchors  
- modified onboarding‑critical flags  
- modified cross‑links  

### Rules
- Glossary is a **Binding** document.  
- Terms cannot be renamed without migration.  
- Terms cannot be removed without deprecation.  
- Definitions cannot change without downstream validation.  

### Outputs
- `GlossaryChangeEvent` objects  
- change classification (minor, major, breaking)  

---

# 🔗 3. Semantic Impact Graph Construction (Dependency Layer)

The analyzer builds the **Glossary Impact Graph**, a semantic subgraph of the full documentation knowledge graph.

### Nodes
- glossary terms  
- documents using those terms  
- ADRs referencing those terms  
- governance rules referencing those terms  
- standards referencing those terms  
- architecture docs referencing those terms  
- diagrams referencing those terms  

### Edges
- **GlossaryUsage**  
- **Upstream/Downstream**  
- **ADRDependency**  
- **Governance**  
- **DiagramFor**  

This graph represents the **semantic blast radius**.

---

# 🧬 4. Impact Propagation (Reasoning Layer)

The analyzer computes the full set of affected artifacts.

### Direct Impact
Documents that explicitly use the term.

### Indirect Impact
Documents that depend on documents that use the term.

### Semantic Impact
Definitions of other glossary terms that reference the changed term.

### ADR Impact
ADRs whose rationale or consequences rely on the term.

### Governance Impact
Governance rules that incorporate the term.

### Standards Impact
Standards that enforce rules using the term.

### Architecture Impact
Architecture docs that rely on the term for conceptual clarity.

### Diagram Impact
Diagrams whose labels or semantics depend on the term.

---

# 🧠 5. Impact Classification (Severity Layer)

The analyzer classifies impact into three levels:

## **Level 1 — Informational Impact**
- minor definition clarifications  
- anchor unchanged  
- no downstream semantic consequences  

## **Level 2 — Required Impact**
- definition meaning changed  
- onboarding‑critical flag changed  
- downstream documents must update wording  

## **Level 3 — Binding Impact (Breaking)**
- term renamed  
- term deprecated  
- term removed  
- definition fundamentally changed  
- ADRs, governance, standards, architecture must update  

This classification determines CI behavior.

---

# 🧪 6. Semantic Drift Detection (Reactive Layer)

The analyzer detects drift caused by glossary changes:

### Types of Drift
- **Definition Drift** — definition no longer matches usage  
- **Document Drift** — document uses term inconsistently  
- **ADR Drift** — ADR rationale conflicts with new definition  
- **Governance Drift** — governance rules conflict with new definition  
- **Standards Drift** — standards enforce outdated semantics  
- **Architecture Drift** — architecture docs use outdated meaning  
- **Diagram Drift** — diagrams use outdated labels  

### Outputs
- drift violations  
- remediation suggestions  

---

# 🧭 7. Remediation Engine (Action Layer)

For each impacted artifact, the analyzer generates:

- required updates  
- recommended updates  
- suggested text rewrites  
- suggested glossary cross‑link updates  
- suggested ADR updates  
- suggested governance updates  
- suggested diagram updates  

These are consumed by:

- CI  
- Docs Agent  
- human reviewers  

---

# 🏛️ 8. CI Integration (Enforcement Layer)

CI uses the analyzer to enforce:

- downstream updates  
- glossary consistency  
- semantic correctness  
- ADR semantic alignment  
- governance semantic alignment  
- standards semantic alignment  
- architecture semantic alignment  

### CI Blocks Merge If:
- Level 3 impact is unresolved  
- semantic drift is detected  
- glossary term rename lacks migration  
- glossary term removal lacks deprecation  
- downstream documents are stale  

---

# 🧠 9. Docs Agent Integration (Intelligence Layer)

The Docs Agent uses the analyzer to:

- explain semantic consequences  
- generate update patches  
- rewrite affected sections  
- update glossary cross‑links  
- update ADRs  
- update governance rules  
- update standards  
- update architecture docs  
- update diagrams  

This is how the system becomes **self‑maintaining**.

---

# 🧠 Non‑Obvious Insight

The Glossary Impact Analyzer is not about checking links.  
It is about **semantic causality**.

It ensures:

- meaning propagates  
- definitions remain authoritative  
- documents stay semantically aligned  
- ADRs remain conceptually coherent  
- governance rules remain linguistically correct  
- standards remain enforceable  
- architecture remains unambiguous  
- diagrams remain semantically accurate  

It is the **semantic nervous system** of your monorepo.

---

# 🔥 Your Next Move  
Which semantic subsystem do you want to define next?

- **Glossary Drift Detection Engine**  
- **Docs Agent Semantic Reasoning Engine**  
- **Documentation Knowledge Graph Schema**