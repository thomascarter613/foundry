#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from datetime import date
from pathlib import Path
from typing import Any


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

FRONTMATTER_ORDER = [
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


def split_frontmatter(content: str) -> tuple[dict[str, Any], str]:
    normalized = content.replace("\r\n", "\n")

    if not normalized.startswith("---\n"):
        return {}, normalized.lstrip("\n")

    closing = normalized.find("\n---\n", 4)

    if closing == -1:
        return {}, normalized.lstrip("\n")

    raw_frontmatter = normalized[4:closing]
    body = normalized[closing + len("\n---\n") :].lstrip("\n")

    return parse_simple_yaml(raw_frontmatter), body


def parse_simple_yaml(raw: str) -> dict[str, Any]:
    data: dict[str, Any] = {}
    active_array_key: str | None = None

    for line in raw.splitlines():
        if not line.strip() or line.strip().startswith("#"):
            continue

        item_match = re.match(r"^\s*-\s+(.*)$", line)

        if item_match and active_array_key:
            current = data.setdefault(active_array_key, [])
            if isinstance(current, list):
                current.append(unquote(item_match.group(1)))
            continue

        key_match = re.match(r"^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$", line)

        if not key_match:
            active_array_key = None
            continue

        key = key_match.group(1)
        raw_value = key_match.group(2).strip()

        if raw_value == "" or raw_value == "[]":
            data[key] = []
            active_array_key = key
            continue

        if raw_value.startswith("[") and raw_value.endswith("]"):
            inner = raw_value[1:-1].strip()
            data[key] = [] if not inner else [unquote(part.strip()) for part in inner.split(",")]
            active_array_key = None
            continue

        data[key] = unquote(raw_value)
        active_array_key = None

    return data


def unquote(value: str) -> str:
    value = value.strip()

    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]

    return value


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

    uppercase = {"adr", "api", "ci", "cli", "json", "mvp", "wp", "cp", "ai"}
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
        return "WorkPacket"

    if value.startswith("docs/governance/"):
        return "Governance"

    if value.startswith("docs/lifecycle/"):
        return "Lifecycle"

    if value.startswith("docs/onboarding/"):
        return "Onboarding"

    if value.startswith("docs/platform/"):
        return "Platform"

    if value.startswith("docs/product/"):
        return "Product"

    if value.startswith("docs/scaffolding/"):
        return "Scaffolding"

    if value.startswith("docs/standards/"):
        return "Standard"

    if value.startswith("docs/.ideas/"):
        return "Idea"

    if value.startswith("docs/planning/"):
        return "Planning"

    if value in {"docs/index.md", "docs/README.md"}:
        return "Onboarding"

    return "Planning"


def infer_owner(document_type: str, path: Path) -> str:
    if document_type in {"ADR", "Architecture"}:
        return "Architecture"

    if document_type == "Governance":
        return "Governance"

    if document_type in {"ChangePlan", "WorkPacket", "Lifecycle"}:
        return "Engineering Productivity"

    if document_type == "Standard":
        return "Standards"

    if document_type in {"Platform", "Scaffolding"}:
        return "Platform"

    if document_type == "Onboarding":
        return "Documentation"

    if document_type == "Product":
        return "Product Architecture"

    if document_type == "Idea":
        return "Product Architecture"

    if "governance" in path.as_posix().lower():
        return "Governance"

    return "Product Architecture"


def infer_governance_level(document_type: str, path: Path) -> str:
    lower_path = path.as_posix().lower()

    if document_type in {"ADR", "Governance", "Standard"}:
        return "Binding"

    if "policy" in lower_path or "constitutional" in lower_path or "governance" in lower_path:
        return "Binding"

    if document_type in {"Onboarding", "Idea"}:
        return "Informational"

    return "Required"


def normalize_status(value: Any) -> str:
    if not isinstance(value, str):
        return "Draft"

    return STATUS_MAP.get(value.strip().lower(), "Draft")


def normalize_array(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    result: list[str] = []

    for item in value:
        if not isinstance(item, str):
            continue

        normalized = item.strip()

        if normalized and normalized not in result:
            result.append(normalized)

    return result


def valid_date(value: Any) -> bool:
    return isinstance(value, str) and re.match(r"^\d{4}-\d{2}-\d{2}$", value) is not None


def yaml_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def reconcile_metadata(path: Path, data: dict[str, Any], body: str) -> dict[str, Any]:
    document_type = infer_document_type(path)

    reconciled = dict(data)

    reconciled["title"] = (
        data.get("title")
        if isinstance(data.get("title"), str) and str(data.get("title")).strip()
        else title_from_body(body) or title_from_path(path)
    )

    reconciled["status"] = normalize_status(data.get("status"))
    reconciled["owner"] = (
        data.get("owner")
        if isinstance(data.get("owner"), str) and str(data.get("owner")).strip()
        else infer_owner(document_type, path)
    )

    reconciled["lastUpdated"] = data.get("lastUpdated") if valid_date(data.get("lastUpdated")) else TODAY
    reconciled["governanceLevel"] = infer_governance_level(document_type, path)

    # Path-derived document type is authoritative. This fixes ADR graph classification.
    reconciled["documentType"] = document_type

    reconciled["upstream"] = normalize_array(data.get("upstream"))
    reconciled["downstream"] = normalize_array(data.get("downstream"))
    reconciled["governanceLinks"] = normalize_array(data.get("governanceLinks"))
    reconciled["adrLinks"] = normalize_array(data.get("adrLinks"))
    reconciled["glossaryTerms"] = normalize_array(data.get("glossaryTerms"))

    return reconciled


def serialize_frontmatter(data: dict[str, Any]) -> str:
    keys = FRONTMATTER_ORDER + sorted(key for key in data if key not in FRONTMATTER_ORDER)

    lines = ["---"]

    for key in keys:
        if key not in data:
            continue

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


def reconcile_file(path: Path, apply: bool) -> bool:
    original = path.read_text(encoding="utf-8")
    data, body = split_frontmatter(original)
    reconciled = reconcile_metadata(path, data, body)
    updated = f"{serialize_frontmatter(reconciled)}\n\n{body}"

    if updated == original:
        return False

    if apply:
        path.write_text(updated, encoding="utf-8")

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
        if reconcile_file(path, args.apply):
            changed += 1
            print(("reconciled: " if args.apply else "would reconcile: ") + path.as_posix())

    print("")
    print(f"files changed: {changed}")

    if not args.apply:
        print("Dry run only. Re-run with --apply to write changes.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
