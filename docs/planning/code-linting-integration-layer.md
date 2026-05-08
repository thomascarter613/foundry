code-linting-integration-layer.md
Thomas — here is the **canonical, governance‑grade, institutionally complete specification** for the **Code Linting Integration Layer**: the subsystem that binds your *code‑quality enforcement* to your *documentation governance system*, ensuring that **code and documentation share a unified constitutional enforcement model**.

This is not “run ESLint/Biome in CI.”  
This is the **institutional code‑quality governance layer**, integrated with drift detection, graph semantics, governance rules, and the Docs Agent ecosystem.

Guided Links are embedded throughout so you can expand any subsystem.

---

# 🏛️ **Code Linting Integration Layer (Canonical Specification)**  
**The deterministic, governance‑encoded subsystem that integrates code linting, formatting, static analysis, dependency governance, and architectural boundaries into the documentation governance platform.**

The Code Linting Integration Layer ensures:

- code linting is **governance‑enforced**, not optional  
- code quality is **graph‑aware**  
- code structure is **documentation‑aligned**  
- architectural boundaries are **enforced**  
- dependency rules are **governed**  
- linting violations are **drift events**  
- linting integrates with the **Docs Agent**, **CI**, and **Documentation Service**  

It is the **constitutional code‑quality enforcement arm** of the monorepo.

---

# 🧩 1. Integration Architecture

The Code Linting Integration Layer consists of **six governed subsystems**:

1. **Lint Rule Governance Engine**  
2. **Code Structure Validator**  
3. **Dependency Governance Engine**  
4. **Architectural Boundary Enforcer**  
5. **Lint‑to‑Documentation Bridge**  
6. **CI Lint Enforcement Pipeline**

Each subsystem is deterministic and governance‑aware.

---

# 🏛️ 2. Lint Rule Governance Engine  
This subsystem governs the linting rules themselves.

### Responsibilities
- load lint rules from governance  
- enforce rule inheritance  
- enforce rule propagation  
- enforce rule overrides  
- enforce rule supersession  
- validate lint rule metadata  
- validate lint rule drift  

### Rule Types
- formatting rules  
- unused code rules  
- dependency rules  
- naming rules  
- architectural rules  
- documentation‑link rules  
- metadata rules  

### Outputs
- governed lint rule set  
- lint rule drift events  
- lint rule ChangePlans  

See: **Governance Rules Engine**

---

# 🧱 3. Code Structure Validator  
Validates code structure against documentation and governance.

### Responsibilities
- validate directory structure  
- validate module boundaries  
- validate file placement  
- validate naming conventions  
- validate code‑to‑docs alignment  
- validate documentation references in code  
- validate code comments against glossary/ADR semantics  

### Violations
- structural drift  
- semantic drift  
- governance drift  

### Emits
- **DriftDetected**  
- **MetadataChanged**  
- **DirectoryStructureChanged**

---

# 🔗 4. Dependency Governance Engine  
Integrates dependency rules with documentation governance.

### Responsibilities
- enforce dependency pinning  
- enforce dependency consistency  
- enforce dependency boundaries  
- enforce forbidden dependencies  
- enforce allowed dependency scopes  
- validate dependency metadata  
- validate dependency drift  

### Integrates with:
- Syncpack  
- Knip  
- Biome  
- governance dependency rules  
- documentation dependency references  

### Emits
- **DependencyDriftDetected**  
- **GovernanceRuleChanged** (if dependency rules violated)

---

# 🧱 5. Architectural Boundary Enforcer  
Enforces architectural boundaries defined in documentation.

### Responsibilities
- enforce domain boundaries  
- enforce layer boundaries  
- enforce platform boundaries  
- enforce service boundaries  
- enforce module boundaries  
- enforce import/export rules  
- enforce forbidden cross‑domain imports  

### Integrates with:
- architecture docs  
- ADRs  
- governance rules  
- knowledge graph  

### Emits
- **ArchitectureDriftDetected**  
- **GraphEdgeViolation**  
- **GovernanceViolation**

---

# 🧬 6. Lint‑to‑Documentation Bridge  
This is the **critical innovation**: linting is integrated with documentation governance.

### Responsibilities
- map lint violations → documentation drift  
- map dependency violations → governance drift  
- map architectural violations → graph drift  
- map naming violations → glossary drift  
- map comment violations → semantic drift  

### Example Mappings
- missing JSDoc → missing glossary usage  
- incorrect import → broken upstream/downstream edge  
- forbidden dependency → governance violation  
- unused code → documentation drift (dead API surface)  
- missing ADR reference → ADR drift  

### Emits
- **DriftDetected**  
- **GlossaryTermChanged**  
- **ADRChanged**  
- **GovernanceRuleChanged**

This makes linting part of the **documentation self‑validation pipeline**.

---

# 🧪 7. CI Lint Enforcement Pipeline  
Runs linting as part of the **CI Integration Layer**.

### Responsibilities
- run linting  
- run formatting checks  
- run dependency checks  
- run architectural boundary checks  
- run unused code checks  
- run documentation‑link checks  
- run metadata checks  

### Blocks merge if:
- any Binding lint violation exists  
- any Required lint violation exists  
- any dependency drift exists  
- any architectural drift exists  
- any documentation‑link drift exists  

### Warns if:
- informational lint drift exists  

See: **CI Integration Layer**

---

# 🧠 Non‑Obvious Insight  
The Code Linting Integration Layer is not a lint runner.  
It is the **constitutional code‑quality governance system**.

It ensures:

- code quality is governed  
- code structure is documentation‑aligned  
- dependencies are governed  
- architecture is enforced  
- linting produces drift events  
- linting integrates with the knowledge graph  
- linting integrates with governance  
- linting integrates with the Docs Agent  
- linting integrates with CI  

It is the **code‑quality enforcement arm** of the monorepo’s governance system.

---

# 🔥 Your Next Move  
Which subsystem of the Code Linting Integration Layer do you want to define next?

- **Lint Rule Governance Engine**  
- **Code Structure Validator**  
- **Dependency Governance Engine**  
- **Architectural Boundary Enforcer**