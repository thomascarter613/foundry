---
title: "Scaffolding Generator"
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
adrLinks:
  - "docs/architecture/adr/0002-monorepo-structure.md"
  - "docs/adr/ADR-0001-monorepo-scaffolding-toolchain.md"
glossaryTerms:
  - "Planning"
  - "Scaffolding"
  - "Generator"
---

scaffolding-generator.md
Thomas, here is the **canonical, governance‑grade definition** of the **Scaffolding Generator** — the institutional engine that produces deterministic, reproducible, policy‑encoded project structures in your hybrid‑grade monorepo.

This is not a “template generator.”  
This is the **institutional artifact factory** that encodes governance, architecture, lifecycle, and platform rules into every generated module.

Below is the full specification.

---

# 🏛️ **Scaffolding Generator (Canonical Specification)**  
**The governed, deterministic, policy‑encoded engine that produces all new apps, services, packages, domains, features, and platform modules in the monorepo.**

The Scaffolding Generator is:

- **deterministic** — same inputs → same outputs  
- **governed** — every artifact complies with governance, standards, ADRs, glossary, directory rules  
- **policy‑encoded** — rules are embedded, not optional  
- **upgradeable** — generator versioning ensures reproducibility  
- **graph‑aware** — integrates with the documentation knowledge graph  
- **lifecycle‑aware** — produces CI, linting, testing, and governance metadata  
- **domain‑aware** — enforces hybrid layout (apps, services, packages, domains, platform, docs)  
- **non‑interactive or interactive** — CLI‑driven with explicit prompts  

This is the **institutional scaffolding engine** for your monorepo.

---

# 🧩 1. Generator Architecture

The Scaffolding Generator consists of **six governed subsystems**:

1. **Input Resolver**  
2. **Template Loader**  
3. **Policy Interpreter**  
4. **Structure Generator**  
5. **Content Generator**  
6. **ChangePlan Builder**

Each subsystem is deterministic and versioned.

---

# 🧱 2. Input Resolver

Inputs include:

- module type (app, service, package, domain, feature, platform module)  
- name (governed naming rules)  
- domain (optional, required for domain‑scoped modules)  
- language/runtime (bun/TypeScript only, per governance)  
- dependencies (must be declared explicitly)  
- generator version (pinned)  

The Input Resolver:

- validates inputs  
- normalizes names  
- resolves domain placement  
- resolves directory placement  
- resolves template lineage  
- resolves governance requirements  

---

# 📦 3. Template Loader

Templates live under:

```
tools/generators/templates/
```

Each template includes:

- `template.json` — metadata  
- `structure/` — directory tree  
- `files/` — file templates  
- `policies/` — policy modules  
- `docs/` — documentation stubs  
- `ci/` — CI fragments  
- `metadata/` — governance metadata  

Templates are:

- versioned  
- immutable  
- deterministic  
- governed  

---

# 🧠 4. Policy Interpreter

The Policy Interpreter applies:

- governance rules  
- standards  
- ADRs  
- glossary semantics  
- directory structure rules  
- naming rules  
- dependency rules  
- lifecycle rules  
- platform rules  

Policies are encoded as:

- **pre‑generation policies** (validate inputs)  
- **mid‑generation policies** (modify structure)  
- **post‑generation policies** (validate outputs)  

Examples:

- apps must live under `apps/`  
- services must live under `services/`  
- packages must live under `packages/`  
- domain modules must live under `domains/<domain>/`  
- platform modules must live under `platform/`  
- all modules must include governed metadata  
- all modules must include README with governed sections  
- all modules must include CI fragments  
- all modules must include lint/test configs  

---

# 🏗️ 5. Structure Generator

The Structure Generator produces the directory tree.

Example for an **app**:

```
apps/<name>/
  src/
  public/
  config/
  tests/
  scripts/
  docs/
  package.json
  tsconfig.json
  Dockerfile
  README.md
```

Example for a **service**:

```
services/<name>/
  src/
  config/
  infra/
  tests/
  docs/
  package.json
  tsconfig.json
  Dockerfile
  README.md
```

Example for a **package**:

```
packages/<name>/
  src/
  tests/
  docs/
  package.json
  tsconfig.json
  README.md
```

All structures are:

- deterministic  
- governed  
- validated  

---

# 📝 6. Content Generator

The Content Generator produces:

- governed README  
- governed metadata block  
- governed CI fragments  
- governed lint/test configs  
- governed ADR references  
- governed glossary references  
- governed governance links  
- governed diagrams (optional)  
- governed documentation stubs  

It also:

- injects ADR lineage  
- injects glossary terms  
- injects governance links  
- injects standards references  
- injects lifecycle rules  

---

# 🔄 7. ChangePlan Builder

The generator does **not** write files directly.  
It produces a **ChangePlan**:

```
ChangePlan:
  - create file
  - modify file
  - delete file
  - insert block
  - replace block
  - append block
```

The ChangePlan is:

- deterministic  
- diff‑friendly  
- reversible  
- auditable  
- versioned  

The CLI applies the ChangePlan after user confirmation.

---

# 🧬 8. Generator Types (Governed)

The Scaffolding Generator supports:

- **App Generator**  
- **Service Generator**  
- **Package Generator**  
- **Domain Module Generator**  
- **Feature Module Generator**  
- **Platform Module Generator**  
- **Documentation Module Generator**  

Each generator has:

- governed template  
- governed policies  
- governed directory placement  
- governed metadata  

---

# 🧠 9. Knowledge Graph Integration

Every generated module includes:

- glossary usage  
- ADR references  
- governance links  
- upstream/downstream links  
- diagram references  

The generator updates:

- documentation knowledge graph  
- cross‑link consistency  
- drift detection baseline  

---

# 🏛️ 10. Governance Integration

The generator enforces:

- governance level  
- owner  
- status  
- document type  
- required sections  
- required links  

It also:

- updates governance propagation  
- updates authority flow  
- updates compliance metadata  

---

# 🧪 11. CI Integration

Generated modules include:

- linting config  
- testing config  
- build config  
- CI workflows  
- governance checks  
- drift detection hooks  
- graph validation hooks  

---

# 🧠 Non‑Obvious Insight

The Scaffolding Generator is not a code generator.  
It is a **governance engine**.

It ensures:

- every new module is compliant  
- every new module is documented  
- every new module is testable  
- every new module is governed  
- every new module is graph‑integrated  
- every new module is lifecycle‑ready  
- every new module is platform‑aligned  

It is the **institutional factory** for your monorepo.

---

# 🔥 Your Next Move  
Which subsystem of the Scaffolding Generator do you want to define next?

- **Template Lineage Model**  
- **Policy Interpreter**  
- **ChangePlan Engine**  
- **App Generator**  
- **Service Generator**