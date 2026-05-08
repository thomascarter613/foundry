#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from datetime import date
from pathlib import Path

TODAY = date.today().isoformat()

STATUS_MAP = {
    "draft": "Draft",
    "planned": "Draft",
    "plan": "Draft",
    "todo": "Draft",
    "accepted": "Approved",
    "approved": "Approved",
    "complete": "Approved",
    "completed": "Approved",
    "done": "Approved",
    "deprecated": "Deprecated",
    "superseded": "Deprecated",
}


def has_frontmatter(content: str) -> bool:
    normalized = content.replace("\r\n", "\n")
    return normalized.startswith("---\n") and "\n---\n" in normalized[4:]


def split_frontmatter(content: str) -> tuple[str | None, str]:
    normalized = content.replace("\r\n", "\n")

    if not has_frontmatter(normalized):
        return None, normalized

    closing = normalized.index("\n---\n", 4)
    frontmatter = normalized[4:closing]
    body = normalized[closing + len("\n---\n") :]

    return frontmatter, body.lstrip("\n")


def parse_simple_frontmatter(frontmatter: str | None) -> dict[str, str]:
    if not frontmatter:
        return {}

    data: dict[str, str] = {}

    for line in frontmatter.splitlines():
        match = re.match(r"^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$", line)

        if not match:
            continue

        key = match.group(1)
        value = match.group(2).strip()

        if (
            (value.startswith('"') and value.endswith('"'))
            or (value.startswith("'") and value.endswith("'"))
        ):
            value = value[1:-1]

        data[key] = value

    return data


def yaml_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def title_from_body(body: str) -> str | None:
    for line in body.splitlines():
        match = re.match(r"^#\s+(.+?)\s*$", line)
        if match:
            return match.group(1).strip()

    return None


def title_from_path(path: Path) -> str:
    stem = path.stem
    stem = stem.replace(".json", " json ")
    stem = stem.replace("_", " ")
    stem = stem.replace("-", " ")
    stem = stem.replace("—", " ")
    stem = re.sub(r"\s+", " ", stem).strip()

    if not stem:
        return "Untitled Document"

    uppercase = {"adr", "api", "ci", "cli", "json", "pea", "saas", "wp", "cp", "mvp"}
    small = {"and", "or", "the", "to", "of", "in", "for", "as"}

    words: list[str] = []
    for index, word in enumerate(stem.split(" ")):
        lower = word.lower()

        if lower in uppercase:
            words.append(lower.upper())
        elif index > 0 and lower in small:
            words.append(lower)
        else:
            words.append(lower.capitalize())

    return " ".join(words)


def infer_document_type(path: Path) -> str:
    value = path.as_posix()

    if value.startswith("docs/architecture/adr/"):
        return "ADR"

    if value.startswith("docs/adr/"):
        return "ADR"

    if value.startswith("docs/architecture/"):
        return "Architecture"

    if value.startswith("docs/changeplans/"):
        return "ChangePlan"

    if value.startswith("docs/work-packets/"):
        return "ChangePlan"

    if value.startswith("docs/governance/"):
        return "Governance"

    if value.startswith("docs/lifecycle/"):
        return "Lifecycle"

    if value.startswith("docs/onboarding/"):
        return "Onboarding"

    if value.startswith("docs/platform/"):
        return "Platform"

    if value.startswith("docs/standards/"):
        return "Standard"

    if value.startswith("docs/scaffolding/"):
        return "Platform"

    if value.startswith("docs/product/"):
        return "Planning"

    if value.startswith("docs/.ideas/"):
        return "Planning"

    if value.startswith("docs/planning/"):
        return "Planning"

    if "ci" in value.lower() or "constitutional" in value.lower():
        return "Lifecycle"

    return "Planning"


def infer_owner(path: Path, document_type: str) -> str:
    value = path.as_posix().lower()

    if document_type in {"ADR", "Architecture"}:
        return "Architecture"

    if document_type == "Governance":
        return "Governance"

    if document_type in {"ChangePlan", "Lifecycle"}:
        return "Engineering Productivity"

    if document_type == "Standard":
        return "Standards"

    if document_type == "Platform":
        return "Platform"

    if document_type == "Onboarding":
        return "Documentation"

    if "governance" in value:
        return "Governance"

    return "Product Architecture"


def infer_governance_level(path: Path, document_type: str) -> str:
    value = path.as_posix().lower()

    if document_type in {"ADR", "Governance", "Standard"}:
        return "Binding"

    if "constitutional" in value or "governance" in value or "policy" in value:
        return "Binding"

    if document_type in {"Architecture", "ChangePlan", "Lifecycle", "Platform"}:
        return "Required"

    if document_type == "Onboarding":
        return "Informational"

    return "Required"


def normalize_status(raw_status: str | None) -> str:
    if not raw_status:
        return "Draft"

    normalized = raw_status.strip().lower()

    return STATUS_MAP.get(normalized, "Draft")


def build_frontmatter(path: Path, existing: dict[str, str], body: str) -> str:
    document_type = existing.get("documentType") or infer_document_type(path)
    owner = existing.get("owner") or infer_owner(path, document_type)
    governance_level = existing.get("governanceLevel") or infer_governance_level(path, document_type)
    status = normalize_status(existing.get("status"))

    title = (
        existing.get("title")
        or title_from_body(body)
        or title_from_path(path)
    )

    return f"""---
title: "{yaml_escape(title)}"
status: "{status}"
owner: "{yaml_escape(owner)}"
lastUpdated: "{existing.get("lastUpdated") or TODAY}"
governanceLevel: "{governance_level}"
documentType: "{document_type}"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

"""


def repair_file(path: Path, apply: bool) -> bool:
    content = path.read_text(encoding="utf-8")
    frontmatter, body = split_frontmatter(content)
    existing = parse_simple_frontmatter(frontmatter)
    new_frontmatter = build_frontmatter(path, existing, body)
    repaired = new_frontmatter + body

    if repaired == content:
        return False

    if apply:
        path.write_text(repaired, encoding="utf-8")

    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Write changes.")
    args = parser.parse_args()

    docs_dir = Path("docs")

    if not docs_dir.exists():
        print("Missing docs/ directory. Run from repo root.")
        return 2

    changed = 0

    for path in sorted(docs_dir.glob("**/*.md")):
        did_change = repair_file(path, args.apply)

        if did_change:
            changed += 1
            action = "repaired" if args.apply else "would repair"
            print(f"{action}: {path.as_posix()}")

    print("")
    print(f"files changed: {changed}")

    if not args.apply:
        print("Dry run only. Re-run with --apply to write changes.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
