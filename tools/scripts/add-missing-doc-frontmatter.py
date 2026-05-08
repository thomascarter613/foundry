#!/usr/bin/env python3
from __future__ import annotations

from datetime import date
from pathlib import Path
import re


FILES = [
    "docs/architecture/adr/0001-architecture-principles.md",
    "docs/architecture/adr/0002-monorepo-structure.md",
    "docs/architecture/adr/0003-package-management.md",
    "docs/architecture/adr/0004-ci-governance.md",
    "docs/architecture/architecture-overview.md",
    "docs/changeplans/CP-0005_platform.json_Platform Capability Seed.md",
    "docs/changeplans/ci-constitutional-pipeline.md",
    "docs/changeplans/cp-0001-—-governance-bootstrap-change-plan.md",
    "docs/changeplans/cp-0002_governed-header-block-rollout.md",
    "docs/changeplans/cp-0003_governance.json-population.md",
    "docs/changeplans/cp-0004_architecture.json_architecture-graph-seed.md",
    "docs/changeplans/cp-0007_drift-baseline_json_cross-surface-baselines.md",
    "docs/changeplans/governance-enforcement-engine.md",
    "docs/ci-constitutional-pipeline.md",
    "docs/onboarding/glossary-quickreference.md",
    "docs/planning/adr-directory-structure.md",
    "docs/planning/adr-impact-analyzer.md",
    "docs/planning/adrlinks.md",
    "docs/planning/ads-validation-engine.md",
    "docs/planning/ai-native-scaffolding-engine.md",
    "docs/planning/api-reference--generator.md",
    "docs/planning/architecture-diagram-generator.md",
    "docs/planning/architecture-diagrams-directory.md",
    "docs/planning/architecture-integration-layer.md",
    "docs/planning/authority-map.md",
    "docs/planning/ci-integration-layer.md",
    "docs/planning/cli-spec.md",
    "docs/planning/code-linting-integration-layer.md",
    "docs/planning/cp-0001-—-governance-bootstrap-change-plan.md",
    "docs/planning/docs-agent-reaasoning-engine.md",
    "docs/planning/docs-engine-canonical-spec.md",
    "docs/planning/docs-event-system.md",
    "docs/planning/docs-service.md",
    "docs/planning/drift-classification-engine.md",
    "docs/planning/drift-remedition-engine.md",
    "docs/planning/exception-process.md",
    "docs/planning/execution-agent-design.md",
    "docs/planning/glossary-impact-analyzer.md",
    "docs/planning/governance-charter.md",
    "docs/planning/governance-compliance-vaalidator.md",
    "docs/planning/governance-impact-analyzer.md",
    "docs/planning/governance-rules.md",
    "docs/planning/governed-document-types-.md",
    "docs/planning/idea.md",
    "docs/planning/lifecycle-integration-layer.md",
    "docs/planning/multi-agent-architecture.md",
    "docs/planning/onboarding-flow-geneator.md",
    "docs/planning/overview.md",
    "docs/planning/pea-design.md",
    "docs/planning/platform-integration-layer.md",
    "docs/planning/product-vision.md",
    "docs/planning/repo-as-memory-system-design.md",
    "docs/planning/repo-as-memory.md",
    "docs/planning/repository-contract.md",
    "docs/planning/saas-business-model.md",
    "docs/planning/scaffolding-generator.md",
    "docs/planning/standards-impact-analyzer.md",
    "docs/planning/standards-integration-layer.md",
    "docs/planning/upstream-downstream-denpendencies.md",
    "docs/planning/versioning-strategy.md",
]


TITLE_OVERRIDES = {
    "docs/architecture/adr/0001-architecture-principles.md": "ADR 0001: Architecture Principles",
    "docs/architecture/adr/0002-monorepo-structure.md": "ADR 0002: Monorepo Structure",
    "docs/architecture/adr/0003-package-management.md": "ADR 0003: Package Management",
    "docs/architecture/adr/0004-ci-governance.md": "ADR 0004: CI Governance",
    "docs/changeplans/CP-0005_platform.json_Platform Capability Seed.md": "CP-0005: Platform Capability Seed",
    "docs/changeplans/cp-0001-—-governance-bootstrap-change-plan.md": "CP-0001: Governance Bootstrap Change Plan",
    "docs/changeplans/cp-0002_governed-header-block-rollout.md": "CP-0002: Governed Header Block Rollout",
    "docs/changeplans/cp-0003_governance.json-population.md": "CP-0003: Governance JSON Population",
    "docs/changeplans/cp-0004_architecture.json_architecture-graph-seed.md": "CP-0004: Architecture JSON Architecture Graph Seed",
    "docs/changeplans/cp-0007_drift-baseline_json_cross-surface-baselines.md": "CP-0007: Drift Baseline JSON Cross Surface Baselines",
    "docs/planning/cp-0001-—-governance-bootstrap-change-plan.md": "CP-0001: Governance Bootstrap Change Plan",
    "docs/planning/docs-agent-reaasoning-engine.md": "Docs Agent Reasoning Engine",
    "docs/planning/governance-compliance-vaalidator.md": "Governance Compliance Validator",
    "docs/planning/onboarding-flow-geneator.md": "Onboarding Flow Generator",
    "docs/planning/drift-remedition-engine.md": "Drift Remediation Engine",
    "docs/planning/upstream-downstream-denpendencies.md": "Upstream Downstream Dependencies",
}


def has_frontmatter(content: str) -> bool:
    normalized = content.replace("\r\n", "\n")
    return normalized.startswith("---\n") and "\n---\n" in normalized[4:]


def title_from_path(path: str) -> str:
    if path in TITLE_OVERRIDES:
        return TITLE_OVERRIDES[path]

    stem = Path(path).stem
    stem = stem.replace(".json", " json ")
    stem = stem.replace("_", " ")
    stem = stem.replace("-", " ")
    stem = re.sub(r"\s+", " ", stem).strip()

    small_words = {"and", "or", "the", "to", "of", "in", "for", "as"}
    words = []
    for index, word in enumerate(stem.split(" ")):
        lower = word.lower()
        if index > 0 and lower in small_words:
            words.append(lower)
        elif lower in {"adr", "api", "ci", "cli", "json", "pea", "saas"}:
            words.append(lower.upper())
        else:
            words.append(lower.capitalize())

    return " ".join(words)


def document_type_for_path(path: str) -> str:
    if path.startswith("docs/architecture/"):
        return "Architecture"
    if path.startswith("docs/changeplans/"):
        return "Lifecycle"
    if path.startswith("docs/onboarding/"):
        return "Onboarding"
    if path.startswith("docs/planning/"):
        return "Planning"
    if path == "docs/ci-constitutional-pipeline.md":
        return "Lifecycle"
    return "Planning"


def owner_for_type(document_type: str, path: str) -> str:
    if path.startswith("docs/architecture/adr/"):
        return "Architecture"
    return {
        "Architecture": "Architecture",
        "Lifecycle": "Engineering Productivity",
        "Onboarding": "Documentation",
        "Planning": "Product Architecture",
    }.get(document_type, "Documentation")


def governance_level_for_path(path: str, document_type: str) -> str:
    if path.startswith("docs/architecture/adr/"):
        return "Binding"
    if "governance" in path or "constitutional" in path:
        return "Binding"
    if document_type in {"Architecture", "Lifecycle"}:
        return "Required"
    if document_type == "Onboarding":
        return "Informational"
    return "Required"


def yaml_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def build_frontmatter(path: str) -> str:
    title = title_from_path(path)
    document_type = document_type_for_path(path)
    owner = owner_for_type(document_type, path)
    governance_level = governance_level_for_path(path, document_type)

    return f'''---
title: "{yaml_escape(title)}"
status: "Draft"
owner: "{yaml_escape(owner)}"
lastUpdated: "{date.today().isoformat()}"
governanceLevel: "{governance_level}"
documentType: "{document_type}"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

'''


def main() -> int:
    changed = 0
    skipped = 0
    missing = 0

    for file_name in FILES:
        path = Path(file_name)

        if not path.exists():
            print(f"missing: {file_name}")
            missing += 1
            continue

        content = path.read_text(encoding="utf-8")

        if has_frontmatter(content):
            print(f"skip existing frontmatter: {file_name}")
            skipped += 1
            continue

        path.write_text(build_frontmatter(file_name) + content, encoding="utf-8")
        print(f"added frontmatter: {file_name}")
        changed += 1

    print("")
    print(f"changed: {changed}")
    print(f"skipped: {skipped}")
    print(f"missing: {missing}")

    return 1 if missing else 0


if __name__ == "__main__":
    raise SystemExit(main())
