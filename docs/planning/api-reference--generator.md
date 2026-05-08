api-reference--generator.md
Thomas — here is the **canonical, governance‑grade specification** for the **API Reference Generator**: the subsystem that produces **deterministic, governed, OpenAPI‑driven, knowledge‑graph‑integrated API reference documentation** for every service, package, or platform module in your hybrid‑grade monorepo.

This is not a “Swagger UI wrapper.”  
This is the **institutional API documentation engine** that ensures API references are **authoritative**, **versioned**, **graph‑linked**, **glossary‑aligned**, **ADR‑aligned**, and **governance‑compliant**.

Guided Links are embedded so you can expand any subsystem.

---

# 🏛️ **API Reference Generator (Canonical Specification)**  
**The governed, deterministic engine that transforms OpenAPI specifications into fully‑integrated, versioned, cross‑linked API reference documentation.**

The API Reference Generator ensures:

- API references are **deterministic**  
- API references are **governed artifacts**  
- API references are **OpenAPI‑driven**  
- API references are **versioned**  
- API references are **graph‑integrated**  
- API references are **glossary‑linked**  
- API references are **ADR‑linked**  
- API references are **standards‑linked**  
- API references are **platform‑aligned**  
- API references are **drift‑detectable**  

It is the **institutional API documentation engine** of your monorepo.

---

# 🧩 1. Generator Architecture

The API Reference Generator consists of **seven governed subsystems**:

1. **Spec Resolver**  
2. **Schema Normalizer**  
3. **Template Loader**  
4. **Reference Synthesizer**  
5. **Metadata Generator**  
6. **Knowledge Graph Integrator**  
7. **ChangePlan Builder**

Each subsystem is deterministic and versioned.

---

# 🧱 2. Spec Resolver

Inputs include:

- OpenAPI spec (YAML or JSON)  
- service/package name  
- version (semantic versioning)  
- domain (optional)  
- API category (public, internal, platform)  
- governance level  
- ADR references  
- glossary terms  

The resolver:

- validates OpenAPI structure  
- validates naming rules  
- validates versioning rules  
- resolves domain placement  
- resolves glossary terms  
- resolves ADR lineage  
- resolves governance constraints  
- resolves upstream/downstream relationships  

---

# 🔧 3. Schema Normalizer

The normalizer:

- dereferences `$ref`  
- canonicalizes schema ordering  
- canonicalizes parameter ordering  
- canonicalizes response ordering  
- canonicalizes error model ordering  
- canonicalizes tags  
- canonicalizes operation IDs  
- enforces naming rules  
- enforces determinism  

This ensures **same spec → same output**.

---

# 📦 4. Template Loader

Templates live under:

```
tools/generators/templates/api-reference/
```

Each template includes:

- endpoint documentation template  
- schema documentation template  
- error model template  
- authentication template  
- pagination template  
- rate‑limit template  
- glossary injection rules  
- ADR injection rules  
- governance injection rules  

Templates are:

- immutable  
- versioned  
- deterministic  

---

# 🧠 5. Reference Synthesizer

The synthesizer produces the **full API reference** as governed Markdown.

### It generates:

- endpoint list  
- endpoint detail pages  
- request/response examples  
- schema documentation  
- error documentation  
- authentication section  
- pagination section  
- rate‑limit section  
- versioning section  
- changelog section  

### It injects:

- glossary links  
- ADR references  
- governance links  
- standards references  
- upstream/downstream links  
- domain boundaries  
- platform boundaries  

### It enforces:

- deterministic ordering  
- deterministic section structure  
- deterministic schema formatting  
- deterministic example formatting  

---

# 🧬 6. Metadata Generator

Every API reference includes a governed metadata block:

- service/package name  
- API version  
- OpenAPI version  
- governance level  
- owner  
- last updated  
- glossary terms  
- ADRs  
- governance rules  
- standards  
- diagrams  
- generator version  

This metadata powers:

- drift detection  
- graph validation  
- API versioning  
- governance propagation  

---

# 🔗 7. Knowledge Graph Integrator

The generator emits:

### API Nodes
- API version  
- API endpoints  
- API schemas  
- API errors  

### API Edges
- **APIImplements → Standards**  
- **APIJustifiedBy → ADRs**  
- **APIUses → Glossary Terms**  
- **APIConstrainedBy → Governance Rules**  
- **APIProvidedBy → Service/Package**  

This makes API references **first‑class graph citizens**.

---

# 🏗️ 8. ChangePlan Builder

The generator outputs a **ChangePlan**, not raw files.

Example ChangePlan:

- create API reference directory  
- create endpoint files  
- create schema files  
- update service documentation  
- update glossary quickref (if needed)  
- update ADR references  
- update knowledge graph metadata  

The ChangePlan is:

- deterministic  
- reversible  
- auditable  
- diff‑friendly  

---

# 🧠 9. Governance Integration

The generator enforces:

- API references must live under `docs/platform/api/` or service‑specific docs  
- API references must include governance links  
- API references must include glossary links  
- API references must include ADR lineage  
- API references must include standards references  
- API references must include versioning metadata  

It also updates:

- governance propagation  
- authority flow  
- compliance metadata  

---

# 🧪 10. CI Integration

Generated API references automatically include:

- metadata compliance  
- link compliance  
- glossary compliance  
- ADR compliance  
- governance compliance  
- standards compliance  
- drift detection baseline  

CI blocks merges if:

- API version missing  
- glossary terms missing  
- ADR lineage missing  
- governance links missing  
- standards missing  
- metadata incomplete  
- spec normalization inconsistent  

---

# 🧠 Non‑Obvious Insight

The API Reference Generator is not a documentation formatter.  
It is a **governance‑encoded API knowledge engine**.

It ensures:

- API references are authoritative  
- API references are reproducible  
- API references are lineage‑aware  
- API references are semantically integrated  
- API references are governance‑aligned  
- API references are standards‑aligned  
- API references are platform‑aligned  
- API references are drift‑detectable  

It is the **institutional API memory constructor** of your monorepo.

---

# 🔥 Your Next Move  
Which API subsystem do you want to define next?

- **OpenAPI Normalization Rules**  
- **API Versioning Model**  
- **API Drift Detector**  
- **API Documentation Directory Structure**