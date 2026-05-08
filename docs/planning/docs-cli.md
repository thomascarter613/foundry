docs-cli.md
Thomas — here is the **canonical, governance‑grade specification** for the **Documentation CLI**: the command‑line interface that operationalizes your entire documentation platform. This is the **front door** to the governed, deterministic, self‑validating documentation system you’ve been architecting.

This is not a “docs tool.”  
This is the **institutional command surface** that encodes governance, scaffolding, validation, drift detection, remediation, graph introspection, and event‑driven intelligence into a single, authoritative CLI.

Guided Links are embedded throughout so you can expand any subsystem.

---

# 🏛️ **Documentation CLI (Canonical Specification)**  
**The deterministic, governance‑encoded command interface that manages, validates, generates, analyzes, and repairs the entire documentation corpus and knowledge graph.**

The Documentation CLI ensures:

- every action is **governed**  
- every output is **deterministic**  
- every artifact is **validated**  
- every change is **event‑emitting**  
- every update is **graph‑integrated**  
- every drift is **detectable and remediable**  
- every generator is **policy‑encoded**  
- every subsystem is **reachable from one command surface**  

It is the **institutional control plane** for documentation.

---

# 🧩 1. CLI Architecture

The Documentation CLI consists of **nine governed command groups**:

1. **init** — initialize documentation systems  
2. **generate** — create governed artifacts  
3. **validate** — run structural, semantic, and governance validation  
4. **graph** — inspect and query the documentation knowledge graph  
5. **drift** — detect and remediate drift  
6. **events** — inspect and replay documentation events  
7. **policy** — inspect governance, standards, ADR lineage, glossary semantics  
8. **doctor** — diagnose systemic issues  
9. **apply** — apply ChangePlans

Each command is deterministic, versioned, and governance‑aware.

---

# 🏗️ 2. Command Group: `init`

Initializes the documentation system.

### Commands
- `docs init` — initialize docs directory structure  
- `docs init governance` — install governance baseline  
- `docs init glossary` — install glossary baseline  
- `docs init adr` — install ADR directory + index  
- `docs init diagrams` — install diagram directory  
- `docs init onboarding` — install onboarding directory  

### Guarantees
- directory structure is canonical  
- metadata files are created  
- governance baseline is installed  
- event system is initialized  

---

# 🧬 3. Command Group: `generate`

Runs all governed generators.

### Generators
- **generate adr**  
- **generate glossary‑term**  
- **generate standard**  
- **generate governance‑rule**  
- **generate diagram**  
- **generate onboarding‑flow**  
- **generate api‑reference**  
- **generate docs‑module**  
- **generate index** (ADR index, glossary index, standards index)

### Guarantees
- all generated artifacts are deterministic  
- all artifacts include metadata  
- all artifacts include governance links  
- all artifacts emit events  
- all artifacts update the knowledge graph  

---

# 🧪 4. Command Group: `validate`

Runs the **Documentation Self‑Validation Pipeline**.

### Validators
- structural validator  
- metadata validator  
- link model validator  
- semantic validator  
- governance validator  
- ADR validator  
- glossary validator  
- standards validator  
- diagram validator  
- onboarding validator  
- API validator  
- graph validator  

### Modes
- `validate full` — run entire pipeline  
- `validate fast` — skip heavy semantic passes  
- `validate file <path>` — validate one file  

### Guarantees
- no drift  
- no broken links  
- no governance violations  
- no ADR lineage issues  
- no glossary semantic issues  
- no graph inconsistencies  

---

# 🧭 5. Command Group: `graph`

Interacts with the documentation knowledge graph.

### Commands
- `graph show` — print graph summary  
- `graph node <id>` — inspect a node  
- `graph edges <id>` — inspect edges  
- `graph impact <id>` — run impact analysis  
- `graph drift` — show drift nodes  
- `graph export` — export graph to JSON  

### Guarantees
- graph is always fresh  
- graph is always consistent  
- graph is always governed  

---

# 🔥 6. Command Group: `drift`

Runs drift detection and remediation.

### Commands
- `drift detect` — run drift detector  
- `drift explain <id>` — explain drift  
- `drift plan <id>` — generate remediation plan  
- `drift apply <plan>` — apply remediation ChangePlan  

### Guarantees
- drift is never ignored  
- remediation is deterministic  
- remediation is governance‑encoded  
- remediation updates the graph  

---

# 🔔 7. Command Group: `events`

Interacts with the **Documentation Event System**.

### Commands
- `events log` — show event history  
- `events tail` — stream events  
- `events replay` — rebuild graph from events  
- `events inspect <id>` — inspect event  

### Guarantees
- event store is append‑only  
- replay is deterministic  
- event lineage is preserved  

---

# 🧠 8. Command Group: `policy`

Interacts with governance, standards, ADR lineage, glossary semantics.

### Commands
- `policy show governance`  
- `policy show standards`  
- `policy show glossary`  
- `policy show adr-lineage`  
- `policy show authority-map`  
- `policy explain <rule>`  

### Guarantees
- governance is transparent  
- authority flow is inspectable  
- ADR lineage is inspectable  
- glossary semantics are inspectable  

---

# 🩺 9. Command Group: `doctor`

Diagnoses systemic issues.

### Commands
- `doctor health` — overall health  
- `doctor governance` — governance issues  
- `doctor graph` — graph issues  
- `doctor drift` — drift issues  
- `doctor links` — link model issues  
- `doctor metadata` — metadata issues  

### Guarantees
- systemic issues are surfaced  
- remediation suggestions are provided  

---

# 🧱 10. Command Group: `apply`

Applies ChangePlans.

### Commands
- `apply <changeplan>` — apply governed ChangePlan  
- `apply dry-run <changeplan>` — preview changes  

### Guarantees
- changes are deterministic  
- changes are reversible  
- changes are auditable  
- changes emit events  
- changes update the graph  

---

# 🧠 Non‑Obvious Insight

The Documentation CLI is not a utility.  
It is the **institutional command surface** for the entire documentation platform.

It ensures:

- governance is enforced  
- drift is remediated  
- ADR lineage is preserved  
- glossary semantics propagate  
- standards remain aligned  
- diagrams remain accurate  
- onboarding remains correct  
- API docs remain consistent  
- the knowledge graph remains valid  

It is the **operational backbone** of your monorepo.

---

# 🔥 Your Next Move  
Which CLI subsystem do you want to define next?

- **CLI Command Surface Specification**  
- **CLI Interactive Mode**  
- **CLI Policy Engine Integration**  
- **CLI ChangePlan Application Engine**