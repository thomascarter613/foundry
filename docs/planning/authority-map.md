authority-map.md

Thomas — let’s put the power map on the table.

Here is the **canonical, governance‑grade, institutionally complete specification** for the **Authority Map**: the explicit, graph‑encoded model of **who can do what, to which artifacts, under which constraints, and through which mechanisms**.

This is not “roles and permissions.”  
This is the **institutional power topology** of the monorepo.

---

# 🏛️ Authority Map (Canonical Specification)  
**The deterministic, graph‑encoded model of governance authority, decision rights, approval chains, and enforcement powers across all artifacts, agents, and lifecycle stages.**

The Authority Map ensures:

- authority is **explicit**, not implied  
- decision rights are **bounded**, not fuzzy  
- approvals are **traceable**, not tribal  
- enforcement is **structured**, not ad‑hoc  
- agents operate **under mandate**, not discretion  
- every mutation has a **legible chain of authority**  

It is the **power graph** of the governed monorepo.

---

## 🧩 1. Authority model architecture

The Authority Map is represented as a **governed subgraph** of the Documentation Knowledge Graph, composed of:

- **Authority Nodes** — actors, roles, bodies, agents  
- **Governed Artifact Nodes** — things over which authority is exercised  
- **Authority Edges** — relationships that encode power, constraints, and flows  

It is consumed by:

- Governance Interpreter  
- Docs Agent  
- Execution Agent  
- CI Integration Layer  
- Dashboard Authority Model Viewer  

---

## 🧱 2. Authority node taxonomy

**2.1 Actor & role nodes**

- `ConstitutionalAuthorityNode` — the Governance Charter  
- `GovernanceBodyNode` — PSG, Working Groups  
- `RoleNode` — “Principal Engineer”, “Domain Steward”, “Platform Steward”, “Reviewer”  
- `AgentNode` — Docs Agent, Execution Agent, Drift Remediation Engine  
- `SystemNode` — CI Constitutional Pipeline, Documentation Service, Background Daemon  

**2.2 Governed artifact nodes**

- `GovernanceRuleNode`  
- `StandardNode`  
- `ADRNode`  
- `LifecycleRuleNode`  
- `PlatformRuleNode`  
- `ArchitectureNode` (domain/service/module/boundary)  
- `DocumentationNode`  
- `ChangePlanNode`  

Authority is always **actor/role → artifact**, never free‑floating.

---

## 🔗 3. Authority edge model

Core edge types:

- `HasConstitutionalAuthority` (Charter → GovernanceBodyNode)  
- `DelegatesAuthorityTo` (GovernanceBodyNode/RoleNode → RoleNode/AgentNode)  
- `OwnsDomain` (RoleNode → ArchitectureDomainNode)  
- `OwnsArtifact` (RoleNode → DocumentationNode/StandardNode/PlatformModuleNode)  
- `MustApprove` (RoleNode/GovernanceBodyNode → ChangePlanNode/LifecycleTransitionNode)  
- `MayPropose` (RoleNode → ADRNode/StandardNode/GovernanceRuleNode)  
- `Enforces` (AgentNode/SystemNode → GovernanceRuleNode/StandardNode/LifecycleRuleNode)  
- `BoundBy` (AgentNode/SystemNode → GovernanceRuleNode/Charter)  
- `EscalatesTo` (RoleNode → GovernanceBodyNode/RoleNode)  

These edges encode:

- **who can propose**  
- **who must approve**  
- **who can execute**  
- **who can enforce**  
- **who is bound by what**  

---

## 🧭 4. Authority levels & scopes

**4.1 Authority levels**

From highest to lowest:

1. **Constitutional Authority** — Charter  
2. **Global Governance Authority** — PSG, global governance rules  
3. **Domain Governance Authority** — domain stewards, domain rules  
4. **Artifact Authority** — owners of specific standards, docs, modules  
5. **Agent Authority** — Docs Agent, Execution Agent, CI, etc.  

**4.2 Scopes**

- **Global Scope** — entire monorepo  
- **Domain Scope** — domain/vertical  
- **Service/Module Scope** — specific service/module  
- **Artifact Scope** — specific document, ADR, standard, ChangePlan  

Each authority edge is annotated with:

- `scope` (global/domain/service/artifact)  
- `lifecyclePhase` (Draft/Proposed/Approved/Active/Deprecated/Retired)  
- `governanceLevel` (binding/required/informational)  

---

## ⚖️ 5. Decision & approval model

Authority Map encodes **who can move what through which lifecycle**.

**5.1 Decision edges**

- `CanInitiateChange` (RoleNode → ChangePlanNode type)  
- `CanApproveChange` (RoleNode/GovernanceBodyNode → ChangePlanNode type)  
- `CanVetoChange` (GovernanceBodyNode → ChangePlanNode type)  
- `CanAmend` (RoleNode/GovernanceBodyNode → GovernanceRuleNode/StandardNode/Charter)  

**5.2 Approval chains**

Approval chains are explicit paths:

- `ChangePlanNode` → `MustApprove` → `RoleNode` → `EscalatesTo` → `GovernanceBodyNode`  

The system computes:

- **minimal approval set**  
- **escalation path**  
- **missing approvals**  

CI and Execution Agent must verify that **all required MustApprove edges are satisfied** before applying a ChangePlan.

---

## 🧬 6. Agent authority & constraints

Agents are **not peers**; they are **governed executors**.

**6.1 Docs Agent**

- `BoundBy` → Governance Rules, Standards, Architecture, Lifecycle  
- `Enforces` → documentation templates, structural rules  
- `Cannot` edges:  
  - `CannotModify` → ADRNode, GovernanceRuleNode, StandardNode (except via governed ChangePlans)  

**6.2 Execution Agent**

- `Enforces` → ChangePlan specification, forbidden paths, allowed roots  
- `BoundBy` → Charter, Governance Rules, Lifecycle Rules  
- `Cannot` edges:  
  - `CannotExecuteWithout` → required approvals, CI green status  

**6.3 CI Constitutional Pipeline**

- `Enforces` → governance, standards, lifecycle, architecture, platform  
- `CanBlock` → LifecycleTransitionNode, ChangePlanNode  

Agents operate **only within their authority envelope** as encoded in the graph.

---

## 🧱 7. Authority invariants

The Authority Map must uphold:

- **No Orphan Power:** no RoleNode or AgentNode with `Enforces` or `CanApprove` edges without being `BoundBy` Charter and Governance Rules.  
- **No Orphan Artifact:** no GovernanceRuleNode/StandardNode/ADRNode without at least one `OwnsArtifact` or `MustApprove` edge.  
- **No Circular Authority:** no cycles in `DelegatesAuthorityTo` that violate governance rules.  
- **Single Constitutional Root:** exactly one `ConstitutionalAuthorityNode`.  
- **Explicit Escalation:** every `MustApprove` chain must terminate in a GovernanceBodyNode with constitutional authority.  

Violations are surfaced as **AuthorityDriftDetected** events.

---

## 🧪 8. Authority drift detection

Authority drift types:

- **Unbounded Authority Drift:** new role/agent with enforcement power but no binding to Charter/governance.  
- **Orphan Artifact Drift:** governed artifact with no owner or approver.  
- **Broken Escalation Drift:** approval chain that cannot reach a constitutional body.  
- **Shadow Authority Drift:** enforcement happening outside encoded authority (e.g., ad‑hoc scripts).  
- **Stale Authority Drift:** role removed but still referenced in MustApprove/OwnsArtifact edges.  

Drift is detected by:

- scanning authority subgraph  
- validating invariants  
- comparing against governance rules and Charter  

Emits:

- `AuthorityDriftDetected`  
- `GovernanceViolation`  

---

## 🧠 9. Integration points

**With Governance Charter**

- Authority Map is the **operationalization** of Articles II & III.  
- Charter changes must update Authority Map via governed ChangePlans.

**With Governance Interpreter**

- Governance decisions are constrained by Authority Map (who may decide what).  

**With Docs Agent & Planning/Execution**

- ChangePlan generation and execution must respect `MustApprove`, `OwnsArtifact`, `CanInitiateChange`.  

**With CI Integration Layer**

- CI checks that all required approvals (per Authority Map) are satisfied before merge.  

**With Dashboard Authority Model Viewer**

- Visualizes authority graph, approval chains, escalation paths, and violations.

---

## 🧠 Non‑Obvious Insight

The Authority Map is not RBAC.  
It is a **graph‑encoded institutional power model** that:

- makes authority **visible**  
- makes decision rights **explicit**  
- makes approvals **traceable**  
- makes overreach **detectable**  
- makes governance **enforceable** at the level of *who is allowed to change what, when, and how*.

It turns “who’s allowed to do this?” from a Slack question into a **first‑class, queryable, governed artifact**.

If you want, next we can define the **Authority Graph Schema** or the **Approval Chain Evaluation Engine** as full subsystems.