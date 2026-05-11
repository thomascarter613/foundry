#!/usr/bin/env python3
from __future__ import annotations

from datetime import date
from pathlib import Path
import re


TODAY = date.today().isoformat()

CONTROLLED_TERMS = [
    "ADR",
    "AI Provider",
    "API",
    "Architecture",
    "Audit Log",
    "Authority",
    "ChangePlan",
    "CI",
    "CLI",
    "Code Linting",
    "Compliance",
    "Configuration",
    "Contract",
    "Dashboard",
    "Documentation Engine",
    "Documentation System",
    "Drift",
    "Governance",
    "Governed Metadata",
    "Graph Validation",
    "Knowledge Graph",
    "Lifecycle",
    "Manifest",
    "Monorepo",
    "Onboarding",
    "Package Management",
    "Pipeline",
    "Platform",
    "Policy",
    "Product",
    "Repository Contract",
    "Scaffolding",
    "Standard",
    "Toolchain",
    "Validation",
    "Verification",
    "Work Packet",
]

TERM_DEFINITIONS = {
    "ADR": "An Architecture Decision Record that captures a durable architectural decision, its context, rationale, and consequences.",
    "AI Provider": "A hosted, local, or self-managed model provider integrated through a provider-agnostic boundary.",
    "API": "A documented programmatic interface used by applications, services, CLIs, agents, or generated clients.",
    "Architecture": "The structural design of the system, including components, boundaries, dependencies, constraints, and runtime behavior.",
    "Audit Log": "An append-oriented record of significant actions, decisions, generator executions, and validation events.",
    "Authority": "The role, rule, document, or governance body empowered to approve, constrain, or interpret a decision.",
    "ChangePlan": "A governed plan describing proposed repository changes before they are applied.",
    "CI": "Continuous integration automation used to verify repository health, contracts, tests, documentation, and governance rules.",
    "CLI": "The command-line interface used to operate Foundry capabilities from a terminal.",
    "Code Linting": "Automated checks that enforce code quality, formatting, and repository rules.",
    "Compliance": "Conformance with documented governance, architecture, lifecycle, security, and repository rules.",
    "Configuration": "Explicit settings that control generator, validation, platform, or repository behavior.",
    "Contract": "A machine-readable or human-readable agreement describing expected structure, behavior, interface, or policy.",
    "Dashboard": "A visual or interactive surface for inspecting system status, validation results, or repository intelligence.",
    "Documentation Engine": "The implementation layer that scans, parses, validates, reports on, and eventually repairs the documentation corpus.",
    "Documentation System": "The governed documentation corpus and its validation, graph, glossary, ADR, and lifecycle machinery.",
    "Drift": "A divergence between documentation, implementation, decisions, standards, or governance expectations.",
    "Governance": "The rules, authorities, processes, and enforcement mechanisms that constrain repository evolution.",
    "Governed Metadata": "Required frontmatter fields that make documents typed, machine-readable, and validation-ready.",
    "Graph Validation": "Validation of documentation graph integrity, including nodes, edges, references, cycles, and orphans.",
    "Knowledge Graph": "A graph of documentation nodes and semantic edges derived from governed metadata and relationships.",
    "Lifecycle": "The controlled flow by which work moves from idea through planning, implementation, verification, and release.",
    "Manifest": "A structured file that declares repository, generator, lifecycle, or capability state.",
    "Monorepo": "A repository containing multiple applications, services, packages, tools, templates, and documentation under one governed root.",
    "Onboarding": "The documents and flows that help a new contributor understand and navigate the repository.",
    "Package Management": "The strategy and tooling used to install, resolve, version, and operate dependencies.",
    "Pipeline": "An ordered sequence of validation, generation, build, test, or release stages.",
    "Platform": "The internal developer platform capabilities that support generation, validation, CI, observability, and operations.",
    "Policy": "A documented rule or constraint enforced by governance, tooling, CI, or review.",
    "Product": "The user-facing or market-facing concept, capability, or operating model being designed and delivered.",
    "Repository Contract": "The declared structure, rules, and expectations that define a valid repository state.",
    "Scaffolding": "Generated repository structure, files, configuration, and starter artifacts.",
    "Standard": "A binding or required rule for how work must be implemented, documented, tested, or operated.",
    "Toolchain": "The collection of tools used to build, test, generate, validate, and operate the repository.",
    "Validation": "Checks that determine whether files, metadata, relationships, and artifacts satisfy required rules.",
    "Verification": "A repeatable command or process that proves the repository is in an expected valid state.",
    "Work Packet": "A bounded implementation unit with scope, requirements, verification, and commit guidance.",
}

PATH_TERM_RULES = [
    ("docs/adr/", ["ADR", "Architecture"]),
    ("docs/architecture/adr/", ["ADR", "Architecture"]),
    ("docs/architecture/", ["Architecture"]),
    ("docs/changeplans/", ["ChangePlan", "Lifecycle"]),
    ("docs/governance/", ["Governance", "Authority"]),
    ("docs/lifecycle/", ["Lifecycle"]),
    ("docs/onboarding/", ["Onboarding"]),
    ("docs/platform/", ["Platform"]),
    ("docs/product/", ["Product"]),
    ("docs/scaffolding/", ["Scaffolding", "Platform"]),
    ("docs/standards/", ["Standard"]),
    ("docs/work-packets/", ["Work Packet", "ChangePlan"]),
]

KEYWORD_RULES = [
    ("adr", "ADR"),
    ("ai-provider", "AI Provider"),
    ("api", "API"),
    ("architecture", "Architecture"),
    ("audit", "Audit Log"),
    ("authority", "Authority"),
    ("changeplan", "ChangePlan"),
    ("change-plan", "ChangePlan"),
    ("ci", "CI"),
    ("cli", "CLI"),
    ("lint", "Code Linting"),
    ("compliance", "Compliance"),
    ("config", "Configuration"),
    ("contract", "Contract"),
    ("dashboard", "Dashboard"),
    ("docs-engine", "Documentation Engine"),
    ("documentation", "Documentation System"),
    ("drift", "Drift"),
    ("governance", "Governance"),
    ("metadata", "Governed Metadata"),
    ("graph", "Knowledge Graph"),
    ("lifecycle", "Lifecycle"),
    ("manifest", "Manifest"),
    ("monorepo", "Monorepo"),
    ("onboarding", "Onboarding"),
    ("package", "Package Management"),
    ("pipeline", "Pipeline"),
    ("platform", "Platform"),
    ("policy", "Policy"),
    ("product", "Product"),
    ("repository", "Repository Contract"),
    ("scaffold", "Scaffolding"),
    ("standard", "Standard"),
    ("toolchain", "Toolchain"),
    ("validation", "Validation"),
    ("validator", "Validation"),
    ("verification", "Verification"),
    ("verify", "Verification"),
    ("work-packet", "Work Packet"),
]


def split_frontmatter(content: str) -> tuple[str | None, str]:
    normalized = content.replace("\r\n", "\n")

    if not normalized.startswith("---\n"):
        return None, normalized

    closing = normalized.find("\n---\n", 4)

    if closing == -1:
        return None, normalized

    return normalized[4:closing], normalized[closing + len("\n---\n"):].lstrip("\n")


def parse_frontmatter(raw: str | None) -> dict[str, object]:
    if not raw:
        return {}

    data: dict[str, object] = {}
    active_key: str | None = None

    for line in raw.splitlines():
        if not line.strip() or line.strip().startswith("#"):
            continue

        item = re.match(r"^\s*-\s+(.*)$", line)
        if item and active_key:
            value = data.setdefault(active_key, [])
            if isinstance(value, list):
                value.append(unquote(item.group(1)))
            continue

        match = re.match(r"^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$", line)
        if not match:
            active_key = None
            continue

        key, value = match.group(1), match.group(2).strip()

        if value == "" or value == "[]":
            data[key] = []
            active_key = key
        else:
            data[key] = unquote(value)
            active_key = None

    return data


def unquote(value: str) -> str:
    value = value.strip()
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]
    return value


def yaml_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def infer_terms(path: Path) -> list[str]:
    path_text = path.as_posix().lower()
    terms: list[str] = []

    for prefix, prefix_terms in PATH_TERM_RULES:
        if path.as_posix().startswith(prefix):
            terms.extend(prefix_terms)

    for keyword, term in KEYWORD_RULES:
        if keyword in path_text:
            terms.append(term)

    if path.as_posix() == "docs/planning/glossary.md":
        terms.extend(["Documentation System", "Governance", "Knowledge Graph"])

    if not terms:
        terms.append("Documentation System")

    return ordered_unique([term for term in terms if term in CONTROLLED_TERMS])


def ordered_unique(values: list[str]) -> list[str]:
    result: list[str] = []
    for value in values:
        if value not in result:
            result.append(value)
    return result


def serialize_frontmatter(data: dict[str, object]) -> str:
    order = [
        "title",
        "status",
        "owner",
        "lastUpdated",
        "governanceLevel",
        "documentType",
        "upstream",
        "downstream",
        "governanceLinks",
        "adrLinks",
        "glossaryTerms",
    ]

    keys = [key for key in order if key in data]
    keys.extend(sorted(key for key in data if key not in keys))

    lines = ["---"]

    for key in keys:
        value = data[key]

        if isinstance(value, list):
            if not value:
                lines.append(f"{key}: []")
            else:
                lines.append(f"{key}:")
                for item in value:
                    lines.append(f'  - "{yaml_escape(str(item))}"')
        else:
            lines.append(f'{key}: "{yaml_escape(str(value))}"')

    lines.append("---")
    return "\n".join(lines)


def repair_doc_frontmatter(path: Path) -> bool:
    content = path.read_text(encoding="utf-8")
    raw, body = split_frontmatter(content)

    if raw is None:
        return False

    data = parse_frontmatter(raw)
    new_terms = infer_terms(path)

    before = data.get("glossaryTerms")
    data["glossaryTerms"] = new_terms

    updated = serialize_frontmatter(data) + "\n\n" + body

    if updated == content:
        return False

    path.write_text(updated, encoding="utf-8")
    return before != new_terms


def write_glossary() -> None:
    lines = [
        "---",
        'title: "Glossary"',
        'status: "Draft"',
        'owner: "Product Architecture"',
        f'lastUpdated: "{TODAY}"',
        'governanceLevel: "Required"',
        'documentType: "Planning"',
        "upstream:",
        '  - "docs/planning/index.md"',
        "downstream:",
        '  - "docs/onboarding/glossary-quickref.md"',
        "governanceLinks:",
        '  - "docs/governance/documentation-governance.md"',
        "adrLinks: []",
        "glossaryTerms:",
        '  - "Documentation System"',
        '  - "Governance"',
        '  - "Knowledge Graph"',
        "---",
        "",
        "# Glossary",
        "",
        "## Purpose",
        "",
        "Define the controlled vocabulary used by the governed documentation system.",
        "",
        "## Terms",
        "",
    ]

    for term in CONTROLLED_TERMS:
        lines.extend(
            [
                f"## {term}",
                "",
                TERM_DEFINITIONS[term],
                "",
            ]
        )

    lines.extend(
        [
            "## Change History",
            "",
            "- Regenerated controlled glossary vocabulary.",
            "",
        ]
    )

    Path("docs/planning/glossary.md").write_text("\n".join(lines), encoding="utf-8")


def write_quickref() -> None:
    quickref_path = Path("docs/onboarding/glossary-quickref.md")
    quickref_path.parent.mkdir(parents=True, exist_ok=True)

    quick_terms = [
        "ADR",
        "Architecture",
        "ChangePlan",
        "Documentation System",
        "Governance",
        "Governed Metadata",
        "Knowledge Graph",
        "Lifecycle",
        "Monorepo",
        "Scaffolding",
        "Validation",
        "Verification",
    ]

    lines = [
        "---",
        'title: "Glossary Quickref"',
        'status: "Draft"',
        'owner: "Documentation"',
        f'lastUpdated: "{TODAY}"',
        'governanceLevel: "Informational"',
        'documentType: "Onboarding"',
        "upstream:",
        '  - "docs/planning/glossary.md"',
        "downstream: []",
        "governanceLinks:",
        '  - "docs/governance/documentation-governance.md"',
        "adrLinks: []",
        "glossaryTerms:",
        '  - "Onboarding"',
        '  - "Documentation System"',
        "---",
        "",
        "# Glossary Quickref",
        "",
        "## Purpose",
        "",
        "Provide a short onboarding reference for the most important glossary terms.",
        "",
        "## Terms",
        "",
    ]

    for term in quick_terms:
        lines.extend(
            [
                f"## {term}",
                "",
                TERM_DEFINITIONS[term],
                "",
            ]
        )

    lines.extend(
        [
            "## Change History",
            "",
            "- Regenerated onboarding glossary quick reference.",
            "",
        ]
    )

    quickref_path.write_text("\n".join(lines), encoding="utf-8")


def remove_legacy_quickreference_if_duplicate() -> None:
    legacy = Path("docs/onboarding/glossary-quickreference.md")
    canonical = Path("docs/onboarding/glossary-quickref.md")

    if legacy.exists() and canonical.exists():
        legacy.unlink()
        print(f"removed duplicate quickref: {legacy}")


def main() -> int:
    changed = 0

    write_glossary()
    print("wrote docs/planning/glossary.md")

    write_quickref()
    print("wrote docs/onboarding/glossary-quickref.md")

    remove_legacy_quickreference_if_duplicate()

    for path in sorted(Path("docs").glob("**/*.md")):
        if repair_doc_frontmatter(path):
            changed += 1
            print(f"normalized glossaryTerms: {path}")

    print("")
    print(f"normalized files: {changed}")
    print("")
    print("Next:")
    print("  bun run docs:glossary:validate")
    print("  bun run verify:docs")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
