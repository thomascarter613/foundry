#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re


RELATIONSHIP_FIELDS = {
    "upstream",
    "downstream",
    "governanceLinks",
    "adrLinks",
    "glossaryTerms",
}


def split_frontmatter(content: str) -> tuple[str | None, str]:
    normalized = content.replace("\r\n", "\n")

    if not normalized.startswith("---\n"):
        return None, normalized

    closing = normalized.find("\n---\n", 4)

    if closing < 0:
        return None, normalized

    return normalized[4:closing], normalized[closing + len("\n---\n") :].lstrip("\n")


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

        item_match = re.match(r"^\s*-\s+(.*)$", line)
        if item_match and active_key:
            existing = data.setdefault(active_key, [])
            if isinstance(existing, list):
                existing.append(unquote(item_match.group(1)))
            continue

        key_match = re.match(r"^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$", line)
        if not key_match:
            active_key = None
            continue

        key = key_match.group(1)
        raw_value = key_match.group(2).strip()

        if raw_value == "" or raw_value == "[]":
            data[key] = []
            active_key = key
            continue

        data[key] = unquote(raw_value)
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


def normalize_path_reference(value: str) -> str:
    value = value.strip()
    value = re.sub(r"^\[.*?\]\((.*?)\)$", r"\1", value)
    value = value.split("#", 1)[0]
    value = value.removeprefix("./")
    return value.replace("\\", "/")


def adr_number_from_reference(value: str) -> str | None:
    match = re.search(
        r"ADR[-\s_]*(\d{1,4})|(?:^|/)(\d{4})[-_]",
        value,
        flags=re.IGNORECASE,
    )
    raw = match.group(1) or match.group(2) if match else None
    return raw.zfill(4) if raw else None


def adr_number_from_path(path: Path) -> str | None:
    match = re.match(r"^(?:ADR-)?(\d{4})[-_]", path.name, flags=re.IGNORECASE)
    return match.group(1) if match else None


def discover_adrs() -> tuple[set[str], dict[str, str], dict[str, str]]:
    adr_paths: set[str] = set()
    basename_to_path: dict[str, str] = {}
    number_to_path: dict[str, str] = {}

    candidates: list[Path] = []

    if Path("docs/adr").exists():
        candidates.extend(Path("docs/adr").glob("ADR-*.md"))

    if Path("docs/architecture/adr").exists():
        candidates.extend(Path("docs/architecture/adr").glob("*.md"))

    for path in sorted(candidates):
        if path.name in {"index.md", "_template.md", "_supersession.md"}:
            continue

        path_text = path.as_posix()
        number = adr_number_from_path(path)

        adr_paths.add(path_text)
        basename_to_path[path.name] = path_text

        if number:
            number_to_path.setdefault(number, path_text)

    return adr_paths, basename_to_path, number_to_path


def resolve_adr_link(
    value: str,
    adr_paths: set[str],
    basename_to_path: dict[str, str],
    number_to_path: dict[str, str],
) -> str | None:
    normalized = normalize_path_reference(value)

    if normalized in adr_paths:
        return normalized

    basename = Path(normalized).name

    if basename in basename_to_path:
        return basename_to_path[basename]

    number = adr_number_from_reference(value)

    if number and number in number_to_path:
        return number_to_path[number]

    return None


def ordered_unique(values: list[str]) -> list[str]:
    result: list[str] = []

    for value in values:
        normalized = str(value).strip()

        if normalized and normalized not in result:
            result.append(normalized)

    return result


def cleanup_relationship_array(values: object) -> list[str]:
    if not isinstance(values, list):
        return []

    cleaned: list[str] = []

    for value in values:
        normalized = str(value).strip()

        if not normalized:
            continue

        if normalized == "docs/onboarding/glossary-quickreference.md":
            normalized = "docs/onboarding/glossary-quickref.md"

        cleaned.append(normalized)

    return ordered_unique(cleaned)


def cleanup_adr_links(
    current_path: str,
    values: object,
    adr_paths: set[str],
    basename_to_path: dict[str, str],
    number_to_path: dict[str, str],
) -> list[str]:
    if not isinstance(values, list):
        return []

    cleaned: list[str] = []
    seen_targets: set[str] = set()

    for raw_value in values:
        value = str(raw_value).strip()

        if not value:
            continue

        resolved_target = resolve_adr_link(
            value,
            adr_paths,
            basename_to_path,
            number_to_path,
        )

        if resolved_target == current_path:
            continue

        if resolved_target:
            if resolved_target in seen_targets:
                continue

            seen_targets.add(resolved_target)
            cleaned.append(resolved_target)
            continue

        if value not in cleaned:
            cleaned.append(value)

    return cleaned


def repair_markdown_file(
    path: Path,
    adr_paths: set[str],
    basename_to_path: dict[str, str],
    number_to_path: dict[str, str],
) -> bool:
    content = path.read_text(encoding="utf-8")
    raw_frontmatter, body = split_frontmatter(content)

    if raw_frontmatter is None:
        return False

    data = parse_frontmatter(raw_frontmatter)
    original_data = dict(data)

    for field in RELATIONSHIP_FIELDS:
        if field not in data:
            continue

        if field == "adrLinks":
            data[field] = cleanup_adr_links(
                path.as_posix(),
                data[field],
                adr_paths,
                basename_to_path,
                number_to_path,
            )
        else:
            data[field] = cleanup_relationship_array(data[field])

    updated = serialize_frontmatter(data) + "\n\n" + body

    if updated == content:
        return False

    path.write_text(updated, encoding="utf-8")
    return data != original_data


def patch_graph_builder_edge_dedupe() -> bool:
    path = Path("packages/cli/src/docs/graph.ts")

    if not path.exists():
        print("missing graph builder, skipped patch")
        return False

    content = path.read_text(encoding="utf-8")

    if "function uniqueEdgesById" in content:
        print("graph builder already has edge de-duplication")
        return False

    old = "edges: edges.sort((left, right) => left.id.localeCompare(right.id))"
    new = "edges: uniqueEdgesById(edges).sort((left, right) => left.id.localeCompare(right.id))"

    if old not in content:
        print("could not find graph edge sort expression; skipped graph builder patch")
        return False

    content = content.replace(old, new)

    content += r'''

function uniqueEdgesById(edges: readonly DocsGraphEdge[]): DocsGraphEdge[] {
  const result: DocsGraphEdge[] = [];
  const seen = new Set<string>();

  for (const edge of edges) {
    if (seen.has(edge.id)) {
      continue;
    }

    seen.add(edge.id);
    result.push(edge);
  }

  return result;
}
'''

    path.write_text(content, encoding="utf-8")
    print("patched graph builder edge de-duplication")
    return True


def main() -> int:
    adr_paths, basename_to_path, number_to_path = discover_adrs()
    changed_files = 0

    for path in sorted(Path("docs").glob("**/*.md")):
        if repair_markdown_file(path, adr_paths, basename_to_path, number_to_path):
            changed_files += 1
            print(f"repaired graph metadata: {path}")

    patched_builder = patch_graph_builder_edge_dedupe()

    print("")
    print("Graph issue repair complete.")
    print(f"metadata files changed: {changed_files}")
    print(f"graph builder patched: {patched_builder}")
    print("")
    print("Next:")
    print("  bun run typecheck")
    print("  bun run docs:verify")
    print("  bun run verify:docs")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
