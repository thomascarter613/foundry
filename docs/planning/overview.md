---
title: "Overview"
status: "Draft"
owner: "Product Architecture"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "Planning"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

### Overview

The documentation linting engine is the **governance-grade validator** for your docs corpus: it parses documents, builds the knowledge graph, and enforces structure, semantics, and authority—deterministically.

---

### 1. High-level architecture

```text
docs/ → Parser → Metadata Extractor → Link Extractor → Graph Builder → Rule Engine → Report
```

- **Parser:** Reads `docs/**/*.md`, splits header block vs body.
- **Metadata Extractor:** Validates governed header block against the Document Metadata Schema.
- **Link Extractor:** Finds upstream/downstream, governance, ADR, glossary, diagram, and external links.
- **Graph Builder:** Produces the Documentation Knowledge Graph (nodes + edges).
- **Rule Engine:** Runs rule sets over documents and graph.
- **Report:** Emits machine-readable + human-readable results; CI consumes machine-readable.

---

### 2. Input/Output contract

**Input:**

- File tree rooted at `docs/`
- Config file (optional), e.g. `.docs-lint.yml` for thresholds/toggles

**Output:**

- Exit code: `0` (pass) / `1` (fail)
- JSON report:
  - per-file violations
  - per-rule summary
  - graph-level violations (cycles, orphans, etc.)

---

### 3. Rule categories

#### 3.1 Structural rules

- **Header block presence:** Every `docs/**/*.md` must start with the governed header block.
- **Header schema compliance:** `Status`, `Owner`, `Last Updated`, `Governance Level`, `Document Type` must match the metadata schema.
- **Directory placement:** `documentType` must match its directory:
  - `Planning` → `docs/planning/`
  - `Governance` → `docs/governance/`
  - `Architecture` → `docs/architecture/`
  - `Lifecycle` → `docs/lifecycle/`
  - `Standard` → `docs/standards/`
  - `Platform` → `docs/platform/`
  - `Onboarding` → `docs/onboarding/`

#### 3.2 Governance rules

- **Governance links required:** Every document must have a `Governance Links` section with at least one valid governance doc.
- **Governance target type:** Governance links must point only to `documentType = Governance`.
- **Governance level vs approvals:** `Binding` docs must be marked as such and (optionally) tagged for stricter review in CI.

#### 3.3 Dependency rules

- **Upstream/Downstream sections required:** Every document must declare `Upstream` and `Downstream` (even if empty).
- **No orphans:** Every document must have at least one upstream or downstream edge.
- **No cycles:** Graph must be acyclic for upstream/downstream dependencies (or cycles must be explicitly whitelisted).
- **Valid targets:** All upstream/downstream links must resolve to existing docs.

#### 3.4 ADR rules

- **ADR index consistency:** All ADR files must appear in `docs/architecture/adr/index.md` and vice versa.
- **ADR filename/number match:** `0003-package-management.md` → ADR number `3`.
- **ADR links required:** Architecture, Standards, Lifecycle, Platform docs must have a `Related ADRs` section with valid ADR references.
- **Supersession correctness:** `ADRSupersedes` edges must form valid chains; no loops; superseded ADRs must be marked `Deprecated`.

#### 3.5 Glossary rules

- **Glossary term definition:** All linked glossary anchors must exist in `docs/planning/glossary.md`.
- **Glossary term linking:** Key terms in governed domains (Architecture, Governance, Standards, Lifecycle, Platform, ADRs) must be linked to the glossary.
- **Quickref consistency:** Terms marked onboarding-critical must appear in `docs/onboarding/glossary-quickref.md`.

#### 3.6 Diagram rules

- **Diagram location:** All diagrams must live under `docs/architecture/diagrams/`.
- **1:1 mapping:** For each architecture view doc that declares a diagram, a corresponding diagram file must exist, and vice versa.
- **Metadata presence:** Each diagram must have a `.meta.md` file with required fields (diagram type, related doc, related ADRs).

---

### 4. Rule engine design

- **Rule unit:** Each rule is a pure function over:
  - a single document, or
  - the full graph, or
  - a subset (e.g., all ADR nodes).
- **Execution model:**
  - Run **document-level rules** in parallel (per file).
  - Build graph.
  - Run **graph-level rules** (cycles, orphans, ADR lineage, governance propagation).
- **Configuration:**
  - Severity: `error | warning | info`
  - Scope: enable/disable specific rules (for bootstrapping phases).

Example rule signature (conceptual):

```ts
type DocRule = (doc: DocumentNode, graph: Graph) => Violation[];
type GraphRule = (graph: Graph) => Violation[];
```

---

### 5. CI integration

- **Pre-commit / pre-push:** Fast subset (header, links, basic structure).
- **CI full run:** All rules, including graph-level checks.
- **Fail conditions:**
  - Any `error` severity violation.
  - Optional thresholds for `warning` counts.

---

### 6. Developer ergonomics

- **CLI:** `docs-lint` with commands:
  - `docs-lint check` — full run
  - `docs-lint file <path>` — focused run
  - `docs-lint graph` — dump current graph as JSON
- **Output:**
  - Human-readable summary (file:line:rule:message).
  - Machine-readable JSON for dashboards/PR annotations.

---

If you want, next step we can define a **concrete rule catalog** (with IDs, messages, severities) or a **TypeScript interface set** for implementing this engine.