#!/usr/bin/env python3
from __future__ import annotations

from datetime import date
from pathlib import Path
import re


TODAY = date.today().isoformat()

RENAMES = {
    "docs/changeplans/ci-constitutional-pipeline.md": {
        "target": "docs/changeplans/cp-0006-ci-constitutional-pipeline.md",
        "number": "0006",
        "title": "CI Constitutional Pipeline",
    },
    "docs/changeplans/governance-enforcement-engine.md": {
        "target": "docs/changeplans/cp-0008-governance-enforcement-engine.md",
        "number": "0008",
        "title": "Governance Enforcement Engine",
    },
}

LEGACY_DUPLICATE = {
    "source": "docs/planning/cp-0001-—-governance-bootstrap-change-plan.md",
    "target": "docs/planning/governance-bootstrap-change-plan-legacy-reference.md",
    "canonical": "docs/changeplans/cp-0001-—-governance-bootstrap-change-plan.md",
}


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def split_frontmatter(content: str) -> tuple[str | None, str]:
    normalized = content.replace("\r\n", "\n")

    if not normalized.startswith("---\n"):
        return None, normalized

    closing = normalized.find("\n---\n", 4)

    if closing < 0:
        return None, normalized

    return normalized[4:closing], normalized[closing + len("\n---\n"):].lstrip("\n")


def unquote(value: str) -> str:
    value = value.strip()

    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]

    return value


def parse_frontmatter(raw: str | None) -> dict[str, object]:
    if raw is None:
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

        key = match.group(1)
        value = match.group(2).strip()

        if value == "" or value == "[]":
            data[key] = []
            active_key = key
        else:
            data[key] = unquote(value)
            active_key = None

    return data


def yaml_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


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
            continue

        lines.append(f'{key}: "{yaml_escape(str(value))}"')

    lines.append("---")
    return "\n".join(lines)


def ensure_array(data: dict[str, object], key: str) -> list[str]:
    value = data.get(key)

    if isinstance(value, list):
        return [str(item) for item in value]

    data[key] = []
    return []


def normalize_changeplan_frontmatter(
    path: Path,
    number: str,
    title: str,
    body: str,
    existing: dict[str, object],
) -> str:
    existing["title"] = f"CP-{number}: {title}"
    existing["status"] = existing.get("status") or "Draft"
    existing["owner"] = existing.get("owner") or "Engineering Productivity"
    existing["lastUpdated"] = TODAY
    existing["governanceLevel"] = "Required"
    existing["documentType"] = "ChangePlan"

    upstream = ensure_array(existing, "upstream")
    if "docs/changeplans/index.md" not in upstream:
        upstream.insert(0, "docs/changeplans/index.md")
    existing["upstream"] = ordered_unique(upstream)

    governance_links = ensure_array(existing, "governanceLinks")
    if "docs/governance/documentation-governance.md" not in governance_links:
        governance_links.append("docs/governance/documentation-governance.md")
    existing["governanceLinks"] = ordered_unique(governance_links)

    glossary_terms = ensure_array(existing, "glossaryTerms")
    for term in ["ChangePlan", "Lifecycle"]:
        if term not in glossary_terms:
            glossary_terms.append(term)
    existing["glossaryTerms"] = ordered_unique(glossary_terms)

    body = re.sub(
        r"^#\s+.*$",
        f"# CP-{number}: {title}",
        body,
        count=1,
        flags=re.MULTILINE,
    )

    if not body.startswith("# "):
        body = f"# CP-{number}: {title}\n\n{body}"

    return serialize_frontmatter(existing) + "\n\n" + body


def ordered_unique(values: list[str]) -> list[str]:
    result: list[str] = []

    for value in values:
        if value not in result:
            result.append(value)

    return result


def rename_and_normalize_numbered_changeplans() -> dict[str, str]:
    replacements: dict[str, str] = {}

    for source_name, metadata in RENAMES.items():
        source = Path(source_name)
        target = Path(metadata["target"])

        if source.exists() and target.exists():
            raise SystemExit(f"Refusing rename because target already exists: {target}")

        if source.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            source.rename(target)
            print(f"renamed: {source} -> {target}")
        elif target.exists():
            print(f"already renamed: {target}")
        else:
            print(f"missing source and target, skipped: {source}")
            continue

        content = read(target)
        raw, body = split_frontmatter(content)
        data = parse_frontmatter(raw)

        write(
            target,
            normalize_changeplan_frontmatter(
                path=target,
                number=metadata["number"],
                title=metadata["title"],
                body=body,
                existing=data,
            ),
        )

        replacements[source_name] = target.as_posix()
        replacements[source.name] = target.name

    return replacements


def move_legacy_duplicate() -> dict[str, str]:
    source = Path(LEGACY_DUPLICATE["source"])
    target = Path(LEGACY_DUPLICATE["target"])
    canonical = LEGACY_DUPLICATE["canonical"]

    replacements = {
        source.as_posix(): canonical,
        source.name: Path(canonical).name,
    }

    if source.exists() and target.exists():
        print(f"legacy duplicate source and target both exist; leaving source untouched: {source}")
        return replacements

    if source.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        source.rename(target)
        print(f"moved legacy duplicate: {source} -> {target}")

        content = read(target)
        raw, body = split_frontmatter(content)
        data = parse_frontmatter(raw)

        data["title"] = "Governance Bootstrap Change Plan Legacy Reference"
        data["status"] = "Deprecated"
        data["owner"] = "Product Architecture"
        data["lastUpdated"] = TODAY
        data["governanceLevel"] = "Informational"
        data["documentType"] = "Planning"
        data["upstream"] = ["docs/planning/index.md"]
        data["downstream"] = [canonical]
        data["governanceLinks"] = ["docs/governance/documentation-governance.md"]
        data["adrLinks"] = []
        data["glossaryTerms"] = ["ChangePlan", "Lifecycle"]

        if not body.startswith("# "):
            body = "# Governance Bootstrap Change Plan Legacy Reference\n\n" + body
        else:
            body = re.sub(
                r"^#\s+.*$",
                "# Governance Bootstrap Change Plan Legacy Reference",
                body,
                count=1,
                flags=re.MULTILINE,
            )

        notice = (
            "> This is a deprecated legacy planning reference. "
            f"The canonical ChangePlan is `{canonical}`.\n\n"
        )

        write(target, serialize_frontmatter(data) + "\n\n" + notice + body)
    else:
        print(f"legacy duplicate not present, skipped: {source}")

    return replacements


def update_references(replacements: dict[str, str]) -> None:
    for path in sorted(Path("docs").glob("**/*.md")):
        content = read(path)
        updated = content

        for old, new in replacements.items():
            updated = updated.replace(old, new)

        if updated != content:
            write(path, updated)
            print(f"updated references: {path}")


def cp_number_from_path(path: Path) -> str | None:
    match = re.match(r"^(?:CP|cp)-?(\d{4})[-_]", path.name)
    return match.group(1) if match else None


def frontmatter_value(content: str, key: str) -> str | None:
    match = re.search(rf"^{re.escape(key)}:\s*[\"']?(.+?)[\"']?\s*$", content, flags=re.MULTILINE)

    if not match:
        return None

    return match.group(1).strip().strip('"').strip("'")


def h1(content: str) -> str | None:
    match = re.search(r"^#\s+(.+?)\s*$", content, flags=re.MULTILINE)
    return match.group(1).strip() if match else None


def clean_cp_title(value: str, number: str) -> str:
    value = re.sub(rf"^(?:CP|cp)-?{number}:?\s*", "", value).strip()
    return value or f"ChangePlan {number}"


def discover_canonical_changeplans() -> list[dict[str, str]]:
    records: list[dict[str, str]] = []

    for path in sorted(Path("docs/changeplans").glob("*.md")):
        if path.name == "index.md":
            continue

        number = cp_number_from_path(path)
        if not number:
            continue

        content = read(path)
        title = frontmatter_value(content, "title") or h1(content) or path.stem
        status = frontmatter_value(content, "status") or "Draft"

        records.append(
            {
                "number": number,
                "title": clean_cp_title(title, number),
                "status": status,
                "path": path.as_posix(),
            }
        )

    return sorted(records, key=lambda record: record["number"])


def regenerate_changeplan_index() -> None:
    records = discover_canonical_changeplans()

    rows = "\n".join(
        f'| CP-{record["number"]} | {record["title"]} | {record["status"]} | `{record["path"]}` |'
        for record in records
    )

    content = f"""---
title: "ChangePlan Index"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "{TODAY}"
governanceLevel: "Required"
documentType: "ChangePlan"
upstream:
  - "docs/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "ChangePlan"
  - "Lifecycle"
---

# ChangePlan Index

## Purpose

Provide the authoritative index of governed ChangePlan documents.

## ChangePlans

| Number | Title | Status | File |
| --- | --- | --- | --- |
{rows}

## Change History

- Regenerated ChangePlan index after ChangePlan corpus repair.
"""

    write(Path("docs/changeplans/index.md"), content)
    print("regenerated docs/changeplans/index.md")


def main() -> int:
    replacements: dict[str, str] = {}

    replacements.update(rename_and_normalize_numbered_changeplans())
    replacements.update(move_legacy_duplicate())

    update_references(replacements)
    regenerate_changeplan_index()

    print("")
    print("ChangePlan corpus repair complete.")
    print("")
    print("Next:")
    print("  node packages/cli/bin/run.js docs changeplans validate")
    print("  node packages/cli/bin/run.js docs verify")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
