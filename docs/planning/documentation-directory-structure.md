documentation-directory-structure.md
Below is the **complete, governed, canonical Documentation Directory Structure** — not just the folders, but the *institutional logic* behind them, the *governance boundaries* they enforce, and the *machine‑actionable semantics* they encode.

This is the **structural substrate** of your living documentation system.  
Every directory is a **typed domain**, every file is a **governed artifact**, and the entire structure is designed to be consumed by the **documentation knowledge graph**, the **linting engine**, and the **Docs Agent**.

---

# 🏛️ **Documentation Directory Structure (Canonical, Governed, Machine‑Readable)**

```
docs/
  README.md
  index.md

  planning/
    vision.md
    scope.md
    glossary.md
    domain-map.md
    nonfunctional-requirements.md
    risks-and-assumptions.md
    architecture-overview.md
    api-overview.md
    release-plan.md
    implementation-sequencing.md

  governance/
    governance-charter.md
    authority-map.md
    repository-contract.md
    contribution-model.md
    versioning-strategy.md
    ci-policy.md
    documentation-governance.md
    documentation-ci-rules.md

  architecture/
    principles.md
    system-context.md
    container-diagram.md
    component-diagram.md
    runtime-views.md
    data-flow.md
    integration-map.md
    constraints.md
    diagrams/
    adr/
      index.md
      _template.md
      _supersession.md
      0001-architecture-principles.md
      0002-monorepo-structure.md
      0003-package-management.md
      0004-ci-governance.md

  lifecycle/
    development-lifecycle.md
    branching-strategy.md
    release-lifecycle.md
    change-management.md
    incident-response.md

  standards/
    coding-standards.md
    api-standards.md
    testing-standards.md
    documentation-standards.md

  platform/
    overview.md
    tooling.md
    ci-cd.md
    observability.md

  onboarding/
    README.md
    system-overview.md
    how-to-navigate-the-repo.md
    glossary-quickref.md
```

---

# 🧩 **What each directory *means* (the semantic layer)**

This is where the structure becomes **alive** — each directory is a *typed domain* with explicit governance.

---

## 📘 **`planning/` — Intent, direction, and constraints**  
Defines *why* the system exists and *what* it must achieve.

- Vision  
- Scope  
- Glossary  
- Domain map  
- NFRs  
- Risks  
- Architecture overview  
- API overview  
- Release plan  
- Implementation sequencing  

This directory feeds the **architecture knowledge graph**.

---

## 🏛️ **`governance/` — Authority, rules, and enforcement**  
Defines *who decides what*, *how*, and *under what constraints*.

- Governance charter  
- Authority map  
- Repository contract  
- Contribution model  
- Versioning strategy  
- CI policy  
- Documentation governance  
- Documentation CI rules  

This directory powers the **governance engine**.

---

## 🏗️ **`architecture/` — System design, decisions, and diagrams**  
Defines *how the system works* and *why it works that way*.

- Principles  
- System context  
- Container diagram  
- Component diagram  
- Runtime views  
- Data flow  
- Integration map  
- Constraints  
- Diagrams/  
- ADRs/  

This directory is the backbone of the **ADR lineage system**.

---

## 🔄 **`lifecycle/` — How work flows through the system**  
Defines *how changes move* from idea → production.

- Development lifecycle  
- Branching strategy  
- Release lifecycle  
- Change management  
- Incident response  

This directory integrates with the **CI integration layer**.

---

## 🧪 **`standards/` — Binding rules for code, APIs, tests, docs**  
Defines *how things must be done*.

- Coding standards  
- API standards  
- Testing standards  
- Documentation standards  

This directory drives the **standards impact analyzer**.

---

## ⚙️ **`platform/` — Tooling, CI/CD, observability**  
Defines the internal developer platform.

- Overview  
- Tooling  
- CI/CD  
- Observability  

This directory powers the **platform integration layer**.

---

## 🧭 **`onboarding/` — Human‑readable entrypoint**  
Defines how humans enter the system.

- Onboarding overview  
- System overview  
- How to navigate the repo  
- Glossary quickref  

This directory is the human interface to the **living documentation system**.

---

# 🧠 **Non‑Obvious Insight**  
This structure is not just organization — it is **governance encoded as filesystem topology**.

- Each directory is a *domain*.  
- Each file is a *typed artifact*.  
- Each artifact participates in the *knowledge graph*.  
- The graph powers *linting*, *generation*, *validation*, *governance*, and *reactivity*.  

This is the same philosophy behind:

- Google’s EngProd documentation systems  
- Stripe’s platform governance  
- Microsoft’s internal architecture governance  

You are building a **documentation platform**, not a folder.