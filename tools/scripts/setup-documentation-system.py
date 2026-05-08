#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import shutil
from datetime import date
from pathlib import Path


TODAY = date.today().isoformat()

TYPO_RENAMES = {
    "docs/planning/docs-agent-reaasoning-engine.md": "docs/planning/docs-agent-reasoning-engine.md",
    "docs/planning/governance-compliance-vaalidator.md": "docs/planning/governance-compliance-validator.md",
    "docs/planning/onboarding-flow-geneator.md": "docs/planning/onboarding-flow-generator.md",
    "docs/planning/drift-remedition-engine.md": "docs/planning/drift-remediation-engine.md",
    "docs/planning/upstream-downstream-denpendencies.md": "docs/planning/upstream-downstream-dependencies.md",
    "docs/planning/ads-validation-engine.md": "docs/planning/adr-validation-engine.md",
    "docs/planning/governed-document-types-.md": "docs/planning/governed-document-types.md",
    "docs/onboarding/glossary-quickreference.md": "docs/onboarding/glossary-quickref.md",
}

CANONICAL_DIRS = [
    "docs/planning",
    "docs/governance",
    "docs/architecture",
    "docs/architecture/adr",
    "docs/architecture/diagrams",
    "docs/changeplans",
    "docs/lifecycle",
    "docs/standards",
    "docs/platform",
    "docs/onboarding",
    ".github/workflows",
    "tools/scripts",
]

INDEX_FILES = {
    "docs/index.md": {
        "title": "Documentation Index",
        "document_type": "Onboarding",
        "owner": "Documentation",
        "governance_level": "Informational",
        "body": """# Documentation Index

## Purpose

Provide the root entrypoint for the governed documentation system.

## Navigation

- [Planning](planning/index.md)
- [Governance](governance/index.md)
- [Architecture](architecture/index.md)
- [Architecture Decision Records](architecture/adr/index.md)
- [ChangePlans](changeplans/index.md)
- [Lifecycle](lifecycle/index.md)
- [Standards](standards/index.md)
- [Platform](platform/index.md)
- [Onboarding](onboarding/index.md)

## Upstream

- None

## Downstream

- docs/planning/index.md
- docs/governance/index.md
- docs/architecture/index.md
- docs/changeplans/index.md

## Governance Links

- docs/governance/documentation-governance.md

## Change History

- Initial governed index scaffold.
""",
    },
    "docs/planning/index.md": {
        "title": "Planning Index",
        "document_type": "Planning",
        "owner": "Product Architecture",
        "governance_level": "Required",
        "body": """# Planning Index

## Purpose

Provide the governed index for planning documents.

## Documents

<!-- Generated or manually maintained planning document list. -->

## Upstream

- docs/index.md

## Downstream

- docs/architecture/index.md
- docs/governance/index.md

## Governance Links

- docs/governance/documentation-governance.md

## Change History

- Initial governed planning index scaffold.
""",
    },
    "docs/governance/index.md": {
        "title": "Governance Index",
        "document_type": "Governance",
        "owner": "Governance",
        "governance_level": "Binding",
        "body": """# Governance Index

## Purpose

Provide the governed index for governance documents.

## Documents

- governance-charter.md
- authority-map.md
- repository-contract.md
- contribution-model.md
- versioning-strategy.md
- ci-policy.md
- documentation-governance.md
- documentation-ci-rules.md

## Upstream

- docs/index.md

## Downstream

- docs/standards/index.md
- docs/lifecycle/index.md
- docs/platform/index.md

## Governance Links

- docs/governance/governance-charter.md

## Change History

- Initial governed governance index scaffold.
""",
    },
    "docs/architecture/index.md": {
        "title": "Architecture Index",
        "document_type": "Architecture",
        "owner": "Architecture",
        "governance_level": "Required",
        "body": """# Architecture Index

## Purpose

Provide the governed index for architecture documents.

## Documents

- architecture-overview.md
- principles.md
- system-context.md
- constraints.md
- adr/index.md
- diagrams/

## Related ADRs

- ADR 0001 - Architecture Principles
- ADR 0002 - Monorepo Structure
- ADR 0003 - Package Management
- ADR 0004 - CI Governance

## Upstream

- docs/planning/index.md

## Downstream

- docs/lifecycle/index.md
- docs/platform/index.md
- docs/standards/index.md

## Governance Links

- docs/governance/documentation-governance.md

## Change History

- Initial governed architecture index scaffold.
""",
    },
    "docs/architecture/adr/index.md": {
        "title": "Architecture Decision Record Index",
        "document_type": "ADR",
        "owner": "Architecture",
        "governance_level": "Binding",
        "body": """# Architecture Decision Record Index

## Purpose

Provide the authoritative ledger of architecture decisions.

## ADR List

| Number | Title | Status | Superseded By |
| --- | --- | --- | --- |
| 0001 | Architecture Principles | Draft | — |
| 0002 | Monorepo Structure | Draft | — |
| 0003 | Package Management | Draft | — |
| 0004 | CI Governance | Draft | — |

## Upstream

- docs/architecture/index.md

## Downstream

- docs/architecture/architecture-overview.md

## Governance Links

- docs/governance/documentation-governance.md

## Change History

- Initial governed ADR index scaffold.
""",
    },
    "docs/changeplans/index.md": {
        "title": "ChangePlan Index",
        "document_type": "ChangePlan",
        "owner": "Engineering Productivity",
        "governance_level": "Required",
        "body": """# ChangePlan Index

## Purpose

Provide the governed index for ChangePlan documents.

## Documents

<!-- Generated or manually maintained ChangePlan list. -->

## Upstream

- docs/index.md
- docs/lifecycle/change-management.md

## Downstream

- docs/lifecycle/index.md

## Governance Links

- docs/governance/documentation-governance.md
- docs/governance/ci-policy.md

## Change History

- Initial governed ChangePlan index scaffold.
""",
    },
    "docs/lifecycle/index.md": {
        "title": "Lifecycle Index",
        "document_type": "Lifecycle",
        "owner": "Engineering Productivity",
        "governance_level": "Required",
        "body": """# Lifecycle Index

## Purpose

Provide the governed index for lifecycle documents.

## Documents

- development-lifecycle.md
- branching-strategy.md
- release-lifecycle.md
- change-management.md
- incident-response.md

## Upstream

- docs/governance/index.md
- docs/architecture/index.md

## Downstream

- docs/platform/index.md

## Governance Links

- docs/governance/documentation-governance.md

## Change History

- Initial governed lifecycle index scaffold.
""",
    },
    "docs/standards/index.md": {
        "title": "Standards Index",
        "document_type": "Standard",
        "owner": "Standards",
        "governance_level": "Binding",
        "body": """# Standards Index

## Purpose

Provide the governed index for standards documents.

## Documents

- coding-standards.md
- api-standards.md
- testing-standards.md
- documentation-standards.md

## Upstream

- docs/governance/index.md
- docs/architecture/index.md

## Downstream

- docs/platform/index.md

## Governance Links

- docs/governance/documentation-governance.md

## Change History

- Initial governed standards index scaffold.
""",
    },
    "docs/platform/index.md": {
        "title": "Platform Index",
        "document_type": "Platform",
        "owner": "Platform",
        "governance_level": "Required",
        "body": """# Platform Index

## Purpose

Provide the governed index for platform documents.

## Documents

- overview.md
- tooling.md
- ci-cd.md
- observability.md

## Upstream

- docs/architecture/index.md
- docs/standards/index.md
- docs/lifecycle/index.md

## Downstream

- docs/onboarding/index.md

## Governance Links

- docs/governance/documentation-governance.md

## Change History

- Initial governed platform index scaffold.
""",
    },
    "docs/onboarding/index.md": {
        "title": "Onboarding Index",
        "document_type": "Onboarding",
        "owner": "Documentation",
        "governance_level": "Informational",
        "body": """# Onboarding Index

## Purpose

Provide the governed index for onboarding documents.

## Documents

- README.md
- system-overview.md
- how-to-navigate-the-repo.md
- glossary-quickref.md

## Upstream

- docs/index.md
- docs/platform/index.md

## Downstream

- None

## Governance Links

- docs/governance/documentation-governance.md

## Change History

- Initial governed onboarding index scaffold.
""",
    },
}

DOCS_LINT_CONFIG = """version: 1
mode: bootstrap

roots:
  docs: docs

documentTypes:
  Planning: docs/planning
  Governance: docs/governance
  Architecture: docs/architecture
  ADR: docs/architecture/adr
  ChangePlan: docs/changeplans
  Lifecycle: docs/lifecycle
  Standard: docs/standards
  Platform: docs/platform
  Onboarding: docs/onboarding

rules:
  requireFrontmatter: true
  rejectContentReferenceArtifacts: true
  rejectMergeConflictMarkers: true
  requireRequiredFields: true
  requireValidEnums: true
  requireValidDate: true
  requireCanonicalDocumentTypeDirectories: false
  requireUpstreamDownstreamLinks: false
  requireGovernanceLinks: false
  requireAdrLinks: false
  requireGlossaryTerms: false
  validateGraph: false
  validateDrift: false
"""

VERIFY_DOCS_TS = r'''import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

type VerificationFailure = {
  file: string;
  reason: string;
};

type VerificationWarning = {
  file: string;
  reason: string;
};

type Frontmatter = Record<string, string | string[]>;

const repoRoot = process.cwd();
const docsDir = join(repoRoot, "docs");

const failures: VerificationFailure[] = [];
const warnings: VerificationWarning[] = [];

const requiredFields = [
  "title",
  "status",
  "owner",
  "lastUpdated",
  "governanceLevel",
  "documentType",
];

const validStatuses = new Set(["Draft", "Approved", "Deprecated"]);
const validGovernanceLevels = new Set(["Informational", "Required", "Binding"]);
const validDocumentTypes = new Set([
  "Planning",
  "Governance",
  "Architecture",
  "ADR",
  "ChangePlan",
  "Lifecycle",
  "Standard",
  "Platform",
  "Onboarding",
]);

function walkMarkdownFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return walkMarkdownFiles(absolutePath);
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      return [absolutePath];
    }

    return [];
  });
}

function extractYamlFrontmatter(content: string): string | null {
  const normalized = content.replace(/\r\n/g, "\n");

  if (!normalized.startsWith("---\n")) {
    return null;
  }

  const closingMarkerIndex = normalized.indexOf("\n---\n", 4);

  if (closingMarkerIndex <= 0) {
    return null;
  }

  return normalized.slice(4, closingMarkerIndex);
}

function unquote(value: string): string {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseSimpleYaml(frontmatter: string): Frontmatter {
  const result: Frontmatter = {};
  const lines = frontmatter.replace(/\r\n/g, "\n").split("\n");

  let activeArrayKey: string | null = null;

  for (const line of lines) {
    if (line.trim() === "" || line.trim().startsWith("#")) {
      continue;
    }

    const arrayItemMatch = line.match(/^\s*-\s+(.*)$/);

    if (arrayItemMatch && activeArrayKey) {
      const currentValue = result[activeArrayKey];

      if (Array.isArray(currentValue)) {
        currentValue.push(unquote(arrayItemMatch[1] ?? ""));
      }

      continue;
    }

    const keyValueMatch = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);

    if (!keyValueMatch) {
      activeArrayKey = null;
      continue;
    }

    const key = keyValueMatch[1] ?? "";
    const rawValue = keyValueMatch[2] ?? "";

    if (rawValue.trim() === "[]") {
      result[key] = [];
      activeArrayKey = key;
      continue;
    }

    if (rawValue.trim() === "") {
      result[key] = [];
      activeArrayKey = key;
      continue;
    }

    result[key] = unquote(rawValue);
    activeArrayKey = null;
  }

  return result;
}

function expectedDocumentTypesForPath(relativePath: string): string[] {
  if (relativePath.startsWith("docs/architecture/adr/")) {
    return ["ADR", "Architecture"];
  }

  if (relativePath.startsWith("docs/architecture/")) {
    return ["Architecture"];
  }

  if (relativePath.startsWith("docs/changeplans/")) {
    return ["ChangePlan", "Lifecycle"];
  }

  if (relativePath.startsWith("docs/governance/")) {
    return ["Governance"];
  }

  if (relativePath.startsWith("docs/lifecycle/")) {
    return ["Lifecycle"];
  }

  if (relativePath.startsWith("docs/onboarding/")) {
    return ["Onboarding"];
  }

  if (relativePath.startsWith("docs/planning/")) {
    return ["Planning"];
  }

  if (relativePath.startsWith("docs/platform/")) {
    return ["Platform"];
  }

  if (relativePath.startsWith("docs/standards/")) {
    return ["Standard"];
  }

  if (relativePath === "docs/index.md" || relativePath === "docs/README.md") {
    return ["Onboarding", "Planning"];
  }

  return [];
}

function addFailure(file: string, reason: string): void {
  failures.push({ file, reason });
}

function addWarning(file: string, reason: string): void {
  warnings.push({ file, reason });
}

function validateFrontmatter(relativePath: string, metadata: Frontmatter): void {
  for (const field of requiredFields) {
    if (!(field in metadata)) {
      addFailure(relativePath, `missing required frontmatter field: ${field}`);
    }
  }

  const status = metadata.status;
  const governanceLevel = metadata.governanceLevel;
  const documentType = metadata.documentType;
  const lastUpdated = metadata.lastUpdated;

  if (typeof status === "string" && !validStatuses.has(status)) {
    addFailure(relativePath, `invalid status: ${status}`);
  }

  if (
    typeof governanceLevel === "string" &&
    !validGovernanceLevels.has(governanceLevel)
  ) {
    addFailure(relativePath, `invalid governanceLevel: ${governanceLevel}`);
  }

  if (typeof documentType === "string" && !validDocumentTypes.has(documentType)) {
    addFailure(relativePath, `invalid documentType: ${documentType}`);
  }

  if (
    typeof lastUpdated === "string" &&
    !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(lastUpdated)
  ) {
    addFailure(relativePath, `invalid lastUpdated date: ${lastUpdated}`);
  }

  const expectedTypes = expectedDocumentTypesForPath(relativePath);

  if (
    expectedTypes.length > 0 &&
    typeof documentType === "string" &&
    !expectedTypes.includes(documentType)
  ) {
    addWarning(
      relativePath,
      `documentType ${documentType} does not match expected type(s): ${expectedTypes.join(", ")}`,
    );
  }
}

function verifyMarkdownFile(filePath: string): void {
  const relativePath = relative(repoRoot, filePath);
  const content = readFileSync(filePath, "utf8");

  const frontmatter = extractYamlFrontmatter(content);

  if (!frontmatter) {
    addFailure(relativePath, "missing YAML frontmatter block");
  } else {
    validateFrontmatter(relativePath, parseSimpleYaml(frontmatter));
  }

  if (content.includes("contentReference[oaicite:")) {
    addFailure(relativePath, "contains forbidden contentReference citation artifact");
  }

  if (
    content.includes("<<<<<<<") ||
    content.includes("=======") ||
    content.includes(">>>>>>>")
  ) {
    addFailure(relativePath, "contains possible merge conflict marker");
  }
}

function main(): void {
  if (!existsSync(docsDir)) {
    console.error("Docs verification failed.");
    console.error("Missing docs/ directory.");
    process.exit(1);
  }

  if (!statSync(docsDir).isDirectory()) {
    console.error("Docs verification failed.");
    console.error("docs exists but is not a directory.");
    process.exit(1);
  }

  const markdownFiles = walkMarkdownFiles(docsDir).sort();

  if (markdownFiles.length === 0) {
    console.error("Docs verification failed.");
    console.error("No Markdown files found under docs/.");
    process.exit(1);
  }

  for (const filePath of markdownFiles) {
    verifyMarkdownFile(filePath);
  }

  if (warnings.length > 0) {
    console.warn("Docs verification warnings.");
    console.warn("");

    for (const warning of warnings) {
      console.warn(`- ${warning.file}: ${warning.reason}`);
    }

    console.warn("");
  }

  if (failures.length > 0) {
    console.error("Docs verification failed.");
    console.error("");

    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.reason}`);
    }

    console.error("");
    console.error(`Checked ${markdownFiles.length} Markdown file(s).`);
    console.error(`${failures.length} failure(s) found.`);
    console.error(`${warnings.length} warning(s) found.`);

    process.exit(1);
  }

  console.log("Docs verification passed.");
  console.log(`Checked ${markdownFiles.length} Markdown file(s).`);
  console.log(`${warnings.length} warning(s) found.`);
}

main();
'''

DOCS_WORKFLOW = """name: Docs

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  verify-docs:
    name: Verify documentation
    runs-on: ubuntu-latest

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Bun
        uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install

      - name: Verify docs
        run: bun run verify:docs
"""


def yaml_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def has_frontmatter(content: str) -> bool:
    normalized = content.replace("\r\n", "\n")
    return normalized.startswith("---\n") and "\n---\n" in normalized[4:]


def title_from_path(path: Path) -> str:
    path_string = path.as_posix()

    overrides = {
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
    }

    if path_string in overrides:
        return overrides[path_string]

    stem = path.stem
    stem = stem.replace(".json", " json ")
    stem = stem.replace("_", " ")
    stem = stem.replace("-", " ")
    stem = re.sub(r"\s+", " ", stem).strip()

    if not stem:
        return "Untitled Document"

    uppercase_words = {"adr", "api", "ci", "cli", "json", "pea", "saas", "slo", "sla"}
    small_words = {"and", "or", "the", "to", "of", "in", "for", "as"}

    words: list[str] = []

    for index, word in enumerate(stem.split(" ")):
        lower = word.lower()

        if lower in uppercase_words:
            words.append(lower.upper())
        elif index > 0 and lower in small_words:
            words.append(lower)
        else:
            words.append(lower.capitalize())

    return " ".join(words)


def document_type_for_path(path: Path) -> str:
    path_string = path.as_posix()

    if path_string.startswith("docs/architecture/adr/"):
        return "ADR"

    if path_string.startswith("docs/architecture/"):
        return "Architecture"

    if path_string.startswith("docs/changeplans/"):
        return "ChangePlan"

    if path_string.startswith("docs/governance/"):
        return "Governance"

    if path_string.startswith("docs/lifecycle/"):
        return "Lifecycle"

    if path_string.startswith("docs/onboarding/"):
        return "Onboarding"

    if path_string.startswith("docs/planning/"):
        return "Planning"

    if path_string.startswith("docs/platform/"):
        return "Platform"

    if path_string.startswith("docs/standards/"):
        return "Standard"

    if path_string in {"docs/index.md", "docs/README.md"}:
        return "Onboarding"

    if "changeplan" in path_string.lower() or path_string.lower().startswith("docs/cp-"):
        return "ChangePlan"

    if "ci" in path_string.lower() or "lifecycle" in path_string.lower():
        return "Lifecycle"

    return "Planning"


def owner_for_path(path: Path, document_type: str) -> str:
    path_string = path.as_posix()

    if document_type in {"ADR", "Architecture"}:
        return "Architecture"

    if document_type == "ChangePlan":
        return "Engineering Productivity"

    if document_type == "Governance":
        return "Governance"

    if document_type == "Lifecycle":
        return "Engineering Productivity"

    if document_type == "Standard":
        return "Standards"

    if document_type == "Platform":
        return "Platform"

    if document_type == "Onboarding":
        return "Documentation"

    if "governance" in path_string:
        return "Governance"

    return "Product Architecture"


def governance_level_for_path(path: Path, document_type: str) -> str:
    path_string = path.as_posix().lower()

    if document_type in {"ADR", "Governance", "Standard"}:
        return "Binding"

    if "governance" in path_string or "constitutional" in path_string:
        return "Binding"

    if document_type in {"Architecture", "ChangePlan", "Lifecycle", "Platform", "Planning"}:
        return "Required"

    return "Informational"


def frontmatter_for_path(path: Path) -> str:
    title = title_from_path(path)
    document_type = document_type_for_path(path)
    owner = owner_for_path(path, document_type)
    governance_level = governance_level_for_path(path, document_type)

    return f"""---
title: "{yaml_escape(title)}"
status: "Draft"
owner: "{yaml_escape(owner)}"
lastUpdated: "{TODAY}"
governanceLevel: "{governance_level}"
documentType: "{document_type}"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

"""


class DocumentationSetup:
    def __init__(self, root: Path, apply: bool, force_generated: bool) -> None:
        self.root = root
        self.apply = apply
        self.force_generated = force_generated
        self.changed = 0
        self.skipped = 0
        self.missing = 0

    def log(self, message: str) -> None:
        prefix = "APPLY" if self.apply else "DRY-RUN"
        print(f"[{prefix}] {message}")

    def write_text(self, path: Path, content: str, force: bool = False) -> None:
        absolute = self.root / path

        if absolute.exists() and not force:
            self.skipped += 1
            self.log(f"skip existing: {path.as_posix()}")
            return

        self.log(f"write: {path.as_posix()}")

        if self.apply:
            absolute.parent.mkdir(parents=True, exist_ok=True)
            absolute.write_text(content, encoding="utf-8")

        self.changed += 1

    def mkdir(self, path: Path) -> None:
        self.log(f"mkdir -p: {path.as_posix()}")

        if self.apply:
            (self.root / path).mkdir(parents=True, exist_ok=True)

    def rename(self, source: Path, target: Path) -> None:
        absolute_source = self.root / source
        absolute_target = self.root / target

        if not absolute_source.exists():
            self.skipped += 1
            self.log(f"skip missing rename source: {source.as_posix()}")
            return

        if absolute_target.exists():
            self.skipped += 1
            self.log(f"skip rename because target exists: {target.as_posix()}")
            return

        self.log(f"rename: {source.as_posix()} -> {target.as_posix()}")

        if self.apply:
            absolute_target.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(absolute_source), str(absolute_target))

        self.changed += 1

    def update_markdown_references(self) -> None:
        markdown_files = sorted((self.root / "docs").glob("**/*.md"))

        replacements: dict[str, str] = {}

        for source, target in TYPO_RENAMES.items():
            replacements[source] = target
            replacements[Path(source).name] = Path(target).name

        for absolute_path in markdown_files:
            content = absolute_path.read_text(encoding="utf-8")
            updated = content

            for source, target in replacements.items():
                updated = updated.replace(source, target)

            if updated == content:
                continue

            relative_path = absolute_path.relative_to(self.root)
            self.log(f"update references: {relative_path.as_posix()}")

            if self.apply:
                absolute_path.write_text(updated, encoding="utf-8")

            self.changed += 1

    def ensure_dirs(self) -> None:
        for directory in CANONICAL_DIRS:
            self.mkdir(Path(directory))

    def rename_typos(self) -> None:
        for source, target in TYPO_RENAMES.items():
            self.rename(Path(source), Path(target))

        self.update_markdown_references()

    def add_missing_frontmatter(self) -> None:
        docs_root = self.root / "docs"

        if not docs_root.exists():
            self.missing += 1
            self.log("missing docs/ directory")
            return

        for absolute_path in sorted(docs_root.glob("**/*.md")):
            relative_path = absolute_path.relative_to(self.root)
            content = absolute_path.read_text(encoding="utf-8")

            if has_frontmatter(content):
                self.skipped += 1
                self.log(f"frontmatter exists: {relative_path.as_posix()}")
                continue

            updated = frontmatter_for_path(relative_path) + content
            self.log(f"add frontmatter: {relative_path.as_posix()}")

            if self.apply:
                absolute_path.write_text(updated, encoding="utf-8")

            self.changed += 1

    def create_docs_lint_config(self) -> None:
        self.write_text(Path(".docs-lint.yml"), DOCS_LINT_CONFIG, force=self.force_generated)

    def create_indexes(self) -> None:
        for path_string, data in INDEX_FILES.items():
            path = Path(path_string)
            frontmatter = f"""---
title: "{yaml_escape(data["title"])}"
status: "Draft"
owner: "{yaml_escape(data["owner"])}"
lastUpdated: "{TODAY}"
governanceLevel: "{data["governance_level"]}"
documentType: "{data["document_type"]}"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

"""
            self.write_text(path, frontmatter + data["body"], force=False)

    def upgrade_verify_docs(self) -> None:
        self.write_text(Path("tools/scripts/verify-docs.ts"), VERIFY_DOCS_TS, force=True)

    def create_ci_workflow(self) -> None:
        self.write_text(Path(".github/workflows/docs.yml"), DOCS_WORKFLOW, force=self.force_generated)

    def run(self) -> None:
        self.ensure_dirs()
        self.rename_typos()
        self.add_missing_frontmatter()
        self.create_docs_lint_config()
        self.create_indexes()
        self.upgrade_verify_docs()
        self.create_ci_workflow()

        print("")
        print("Documentation setup complete.")
        print(f"changed operations: {self.changed}")
        print(f"skipped operations: {self.skipped}")
        print(f"missing items: {self.missing}")

        if not self.apply:
            print("")
            print("Dry run only. Re-run with --apply to write changes.")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Set up the governed Foundry documentation system."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write changes. Without this flag, the script performs a dry run.",
    )
    parser.add_argument(
        "--force-generated",
        action="store_true",
        help="Overwrite generated support files such as .docs-lint.yml and docs workflow.",
    )

    args = parser.parse_args()

    root = Path.cwd()

    if not (root / "package.json").exists():
        print("Error: run this script from the repository root.")
        return 2

    setup = DocumentationSetup(
        root=root,
        apply=args.apply,
        force_generated=args.force_generated,
    )
    setup.run()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
