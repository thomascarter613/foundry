#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path


RENAMES = {
    "docs/architecture/adr/0001a-architecture-principles.md": {
        "target": "docs/architecture/adr/0004-architecture-principles.md",
        "old_number": "0001",
        "new_number": "0004",
        "title": "Architecture Principles",
    },
    "docs/architecture/adr/0001b-documentation-system-topology.md": {
        "target": "docs/architecture/adr/0005-documentation-system-topology.md",
        "old_number": "0001",
        "new_number": "0005",
        "title": "Documentation System Topology",
    },
    "docs/architecture/adr/0002a-governed-document-metadata.md": {
        "target": "docs/architecture/adr/0006-governed-document-metadata.md",
        "old_number": "0002",
        "new_number": "0006",
        "title": "Governed Document Metadata",
    },
    "docs/architecture/adr/0002b-monorepo-structure.md": {
        "target": "docs/architecture/adr/0007-monorepo-structure.md",
        "old_number": "0002",
        "new_number": "0007",
        "title": "Monorepo Structure",
    },
    "docs/architecture/adr/0003a-documentation-knowledge-graph.md": {
        "target": "docs/architecture/adr/0008-documentation-knowledge-graph.md",
        "old_number": "0003",
        "new_number": "0008",
        "title": "Documentation Knowledge Graph",
    },
    "docs/architecture/adr/0003b-package-management.md": {
        "target": "docs/architecture/adr/0009-package-management.md",
        "old_number": "0003",
        "new_number": "0009",
        "title": "Package Management",
    },
    "docs/architecture/adr/0004a-ci-governance.md": {
        "target": "docs/architecture/adr/0010-ci-governance.md",
        "old_number": "0004",
        "new_number": "0010",
        "title": "CI Governance",
    },
    "docs/architecture/adr/0004b-documentation-ci-validation.md": {
        "target": "docs/architecture/adr/0011-documentation-ci-validation.md",
        "old_number": "0004",
        "new_number": "0011",
        "title": "Documentation CI Validation",
    },
}


TITLE_REFERENCE_REPLACEMENTS = {
    "ADR 0001 - Architecture Principles": "ADR 0004 - Architecture Principles",
    "ADR 0001 – Architecture Principles": "ADR 0004 - Architecture Principles",
    "ADR 0001: Architecture Principles": "ADR 0004: Architecture Principles",

    "ADR 0001 - Documentation System Topology": "ADR 0005 - Documentation System Topology",
    "ADR 0001 – Documentation System Topology": "ADR 0005 - Documentation System Topology",
    "ADR 0001: Documentation System Topology": "ADR 0005: Documentation System Topology",

    "ADR 0002 - Governed Document Metadata": "ADR 0006 - Governed Document Metadata",
    "ADR 0002 – Governed Document Metadata": "ADR 0006 - Governed Document Metadata",
    "ADR 0002: Governed Document Metadata": "ADR 0006: Governed Document Metadata",

    "ADR 0002 - Monorepo Structure": "ADR 0007 - Monorepo Structure",
    "ADR 0002 – Monorepo Structure": "ADR 0007 - Monorepo Structure",
    "ADR 0002: Monorepo Structure": "ADR 0007: Monorepo Structure",

    "ADR 0003 - Documentation Knowledge Graph": "ADR 0008 - Documentation Knowledge Graph",
    "ADR 0003 – Documentation Knowledge Graph": "ADR 0008 - Documentation Knowledge Graph",
    "ADR 0003: Documentation Knowledge Graph": "ADR 0008: Documentation Knowledge Graph",

    "ADR 0003 - Package Management": "ADR 0009 - Package Management",
    "ADR 0003 – Package Management": "ADR 0009 - Package Management",
    "ADR 0003: Package Management": "ADR 0009: Package Management",

    "ADR 0004 - CI Governance": "ADR 0010 - CI Governance",
    "ADR 0004 – CI Governance": "ADR 0010 - CI Governance",
    "ADR 0004: CI Governance": "ADR 0010: CI Governance",

    "ADR 0004 - Documentation CI Validation": "ADR 0011 - Documentation CI Validation",
    "ADR 0004 – Documentation CI Validation": "ADR 0011 - Documentation CI Validation",
    "ADR 0004: Documentation CI Validation": "ADR 0011: Documentation CI Validation",
}


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def rename_adr_files() -> None:
    for source_name, metadata in RENAMES.items():
        source = Path(source_name)
        target = Path(metadata["target"])

        if source.exists() and target.exists():
            raise SystemExit(
                f"Refusing to rename because both source and target exist:\n"
                f"- source: {source}\n"
                f"- target: {target}"
            )

        if source.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            source.rename(target)
            print(f"renamed: {source} -> {target}")
        elif target.exists():
            print(f"already renamed: {target}")
        else:
            print(f"missing source and target, skipped: {source}")


def update_renamed_adr_content() -> None:
    for metadata in RENAMES.values():
        target = Path(metadata["target"])

        if not target.exists():
            continue

        content = read(target)
        new_number = metadata["new_number"]
        title = metadata["title"]

        content = re.sub(
            r'title:\s*["\']?ADR\s+\d{4}[A-Za-z]?:\s*([^"\']+)["\']?',
            f'title: "ADR {new_number}: {title}"',
            content,
            count=1,
        )

        content = re.sub(
            r"^#\s+ADR\s+\d{4}[A-Za-z]?:\s+.*$",
            f"# ADR {new_number}: {title}",
            content,
            count=1,
            flags=re.MULTILINE,
        )

        content = re.sub(
            r"^#\s+ADR-\d{4}[A-Za-z]?:\s+.*$",
            f"# ADR {new_number}: {title}",
            content,
            count=1,
            flags=re.MULTILINE,
        )

        write(target, content)
        print(f"updated ADR content: {target}")


def update_markdown_references() -> None:
    path_replacements: dict[str, str] = {}

    for source_name, metadata in RENAMES.items():
        target_name = metadata["target"]
        path_replacements[source_name] = target_name
        path_replacements[Path(source_name).name] = Path(target_name).name

    replacements = {
        **path_replacements,
        **TITLE_REFERENCE_REPLACEMENTS,
    }

    for path in sorted(Path("docs").glob("**/*.md")):
        content = read(path)
        updated = content

        for old, new in replacements.items():
            updated = updated.replace(old, new)

        if updated != content:
            write(path, updated)
            print(f"updated references: {path}")


def extract_frontmatter_value(content: str, key: str) -> str | None:
    pattern = rf"^{re.escape(key)}:\s*[\"']?(.+?)[\"']?\s*$"
    match = re.search(pattern, content, flags=re.MULTILINE)

    if not match:
        return None

    return match.group(1).strip().strip('"').strip("'")


def extract_h1(content: str) -> str | None:
    match = re.search(r"^#\s+(.+?)\s*$", content, flags=re.MULTILINE)
    return match.group(1).strip() if match else None


def adr_number_from_path(path: Path) -> str | None:
    match = re.match(r"^(?:ADR-)?(\d{4})[-_]", path.name, flags=re.IGNORECASE)
    return match.group(1) if match else None


def adr_number_from_text(text: str) -> str | None:
    match = re.search(r"ADR[-\s_]*(\d{1,4})|(?:^|\D)(\d{4})(?:\D|$)", text, flags=re.IGNORECASE)
    if not match:
        return None

    raw = match.group(1) or match.group(2)
    return raw.zfill(4)

def discover_adrs() -> list[dict[str, str]]:
    candidates: list[Path] = []

    legacy_adr_dir = Path("docs/adr")
    architecture_adr_dir = Path("docs/architecture/adr")

    if legacy_adr_dir.exists():
        candidates.extend(legacy_adr_dir.glob("ADR-*.md"))

    if architecture_adr_dir.exists():
        candidates.extend(architecture_adr_dir.glob("*.md"))

    adrs: list[dict[str, str]] = []

    for path in sorted(candidates):
        if path.name in {"index.md", "_template.md", "_supersession.md"}:
            continue

        content = read(path)
        title = extract_frontmatter_value(content, "title") or extract_h1(content) or path.stem
        status = extract_frontmatter_value(content, "status") or "Draft"
        number = adr_number_from_path(path) or adr_number_from_text(title)

        if not number:
            continue

        clean_title = re.sub(
            r"^ADR[-\s_]*\d{1,4}:?\s*",
            "",
            title,
            flags=re.IGNORECASE,
        ).strip()

        adrs.append(
            {
                "number": number,
                "title": clean_title,
                "status": status,
                "path": path.as_posix(),
            }
        )

    return sorted(adrs, key=lambda item: (item["number"], item["path"]))

def regenerate_adr_index() -> None:
    index_path = Path("docs/architecture/adr/index.md")
    adrs = discover_adrs()

    rows = "\n".join(
        f'| {adr["number"]} | {adr["title"]} | {adr["status"]} | — | `{adr["path"]}` |'
        for adr in adrs
    )

    content = f"""---
title: "Architecture Decision Record Index"
status: "Draft"
owner: "Architecture"
lastUpdated: "{__import__("datetime").date.today().isoformat()}"
governanceLevel: "Binding"
documentType: "ADR"
upstream:
  - "docs/architecture/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "ADR"
---

# Architecture Decision Record Index

## Purpose

Provide the authoritative ledger of active Architecture Decision Records across the Foundry documentation corpus.

## ADR List

| Number | Title | Status | Superseded By | File |
| --- | --- | --- | --- | --- |
{rows}

## Governance Links

- docs/governance/documentation-governance.md

## Change History

- Regenerated after ADR numbering normalization.
"""

    write(index_path, content)
    print(f"regenerated ADR index: {index_path}")


def main() -> int:
    rename_adr_files()
    update_renamed_adr_content()
    update_markdown_references()
    regenerate_adr_index()

    print("")
    print("ADR numbering repair complete.")
    print("Next:")
    print("  bun run docs:adr:validate")
    print("  bun run verify:docs")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
