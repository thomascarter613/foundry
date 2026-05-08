docs-knowledge-graph-schema.md
### Documentation knowledge graph schema

Here’s the **canonical, implementation‑ready schema** for the docs knowledge graph—expressed as types, node kinds, and edge kinds you can encode in JSON/YAML/TypeScript/SQL.

---

## 1. Core graph model

```yaml
Graph:
  nodes: Node[]
  edges: Edge[]

Node:
  id: string              # stable, unique (e.g. "doc:docs/planning/glossary.md")
  kind: NodeKind
  metadata: NodeMetadata
  attributes: NodeAttributes

Edge:
  id: string              # stable, unique
  type: EdgeType
  from: string            # Node.id
  to: string              # Node.id
  attributes: EdgeAttributes
```

---

## 2. Node kinds

```yaml
NodeKind:
  enum:
    - Document
    - ADR
    - GlossaryTerm
    - Diagram
    - GovernanceRule
    - ExternalReference
```

### 2.1 Document node

```yaml
NodeMetadata (for kind=Document):
  path: string                # "docs/architecture/system-context.md"
  title: string
  status: string              # Draft | Approved | Deprecated
  owner: string
  lastUpdated: string         # YYYY-MM-DD
  governanceLevel: string     # Informational | Required | Binding
  documentType: string        # Planning | Governance | Architecture | Lifecycle | Standard | Platform | Onboarding
```

### 2.2 ADR node

```yaml
NodeMetadata (for kind=ADR):
  number: integer             # 1, 2, 3...
  slug: string                # "package-management"
  path: string                # "docs/architecture/adr/0003-package-management.md"
  status: string              # Draft | Approved | Deprecated
  owner: string
  lastUpdated: string
  governanceLevel: string     # Binding (normally)
```

### 2.3 Glossary term node

```yaml
NodeMetadata (for kind=GlossaryTerm):
  term: string                # "Monorepo"
  anchor: string              # "monorepo"
  path: string                # "docs/planning/glossary.md#monorepo"
  domain: string | null       # optional domain/bounded context
  onboardingCritical: boolean
```

### 2.4 Diagram node

```yaml
NodeMetadata (for kind=Diagram):
  path: string                # "docs/architecture/diagrams/system-context.drawio"
  diagramType: string         # SystemContext | Container | Component | Runtime | DataFlow | Integration | Other
  owner: string
  lastUpdated: string
```

### 2.5 Governance rule node

```yaml
NodeMetadata (for kind=GovernanceRule):
  path: string                # "docs/governance/documentation-governance.md"
  title: string
  ruleId: string | null       # optional stable rule identifier
  status: string
  owner: string
  lastUpdated: string
  governanceLevel: string     # Binding, etc.
```

### 2.6 External reference node

```yaml
NodeMetadata (for kind=ExternalReference):
  uri: string                 # URL or identifier (e.g. "rfc:2119")
  label: string
  version: string | null
```

---

## 3. Edge types

```yaml
EdgeType:
  enum:
    - Upstream
    - Downstream
    - Governance
    - ADRDependency
    - ADRSupersedes
    - GlossaryUsage
    - DiagramFor
    - ExternalReference
    - Sibling
```

### 3.1 Upstream / Downstream

```yaml
Edge (Upstream):
  type: Upstream
  from: Document
  to: Document

Edge (Downstream):
  type: Downstream
  from: Document
  to: Document
```

> These are duals; you can either store both or derive `Downstream` from `Upstream`.

### 3.2 Governance

```yaml
Edge (Governance):
  type: Governance
  from: Document | ADR | Diagram
  to: GovernanceRule
```

### 3.3 ADR dependency & supersession

```yaml
Edge (ADRDependency):
  type: ADRDependency
  from: Document | GovernanceRule | Diagram
  to: ADR

Edge (ADRSupersedes):
  type: ADRSupersedes
  from: ADR        # newer ADR
  to: ADR          # older ADR
```

### 3.4 Glossary usage

```yaml
Edge (GlossaryUsage):
  type: GlossaryUsage
  from: Document | ADR | GovernanceRule | Diagram
  to: GlossaryTerm
  attributes:
    occurrences: integer      # optional count
```

### 3.5 Diagram relationships

```yaml
Edge (DiagramFor):
  type: DiagramFor
  from: Diagram
  to: Document                # the view doc (system-context.md, etc.)
```

### 3.6 External references

```yaml
Edge (ExternalReference):
  type: ExternalReference
  from: Document | ADR | GovernanceRule | Standard
  to: ExternalReference
```

### 3.7 Sibling

```yaml
Edge (Sibling):
  type: Sibling
  from: Document
  to: Document
  attributes:
    domain: string            # e.g. "standards", "lifecycle"
```

---

## 4. Minimal per‑document extraction contract

From each `docs/**.md`, your extractor must at least produce:

```json
{
  "node": {
    "id": "doc:docs/architecture/system-context.md",
    "kind": "Document",
    "metadata": {
      "path": "docs/architecture/system-context.md",
      "title": "System Context",
      "status": "Approved",
      "owner": "Architecture",
      "lastUpdated": "2026-05-01",
      "governanceLevel": "Required",
      "documentType": "Architecture"
    }
  },
  "edges": [
    { "type": "Upstream", "from": "doc:docs/architecture/system-context.md", "to": "doc:docs/planning/architecture-overview.md" },
    { "type": "Governance", "from": "doc:docs/architecture/system-context.md", "to": "doc:docs/governance/governance-charter.md" },
    { "type": "ADRDependency", "from": "doc:docs/architecture/system-context.md", "to": "adr:0002" },
    { "type": "GlossaryUsage", "from": "doc:docs/architecture/system-context.md", "to": "term:monorepo" },
    { "type": "DiagramFor", "from": "diagram:docs/architecture/diagrams/system-context.drawio", "to": "doc:docs/architecture/system-context.md" }
  ]
}
```

---

If you want, next step we can:  
**(a)** map this to a concrete TypeScript interface set, or  
**(b)** design the linter’s “graph build” step that turns `docs/**` into this schema deterministically.