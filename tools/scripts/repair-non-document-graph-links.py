#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


RELATIONSHIP_FIELDS = {
    "upstream",
    "downstream",
    "governanceLinks",
    "adrLinks",
}

NON_DOCUMENT_PREFIXES = (
    "tools/",
    "packages/",
    ".github/",
    "scripts/",
)

NON_DOCUMENT_SUFFIXES = (
    ".sh",
    ".ts",
    ".js",
    ".json",
    ".yml",
    ".yaml",
    ".toml",
)


def split_frontmatter(content: str) -> tuple[str | None, str]:
    normalized = content.replace("\r\n", "\n")

    if not normalized.startswith("---\n"):
        return None, normalized

    end = normalized.find("\n---\n", 4)

    if end < 0:
        return None, normalized

    return normalized[4:end], normalized[end + len("\n---\n"):]


def is_non_document_graph_value(value: str) -> bool:
    cleaned = value.strip().strip('"').strip("'")

    if cleaned.endswith(".md"):
        return False

    if cleaned.startswith(NON_DOCUMENT_PREFIXES):
        return True

    if cleaned.endswith(NON_DOCUMENT_SUFFIXES):
        return True

    return False


def repair_frontmatter(raw: str) -> tuple[str, list[str]]:
    lines = raw.splitlines()
    output: list[str] = []
    removed: list[str] = []

    active_field: str | None = None

    for line in lines:
        stripped = line.strip()

        if ":" in line and not line.startswith(" ") and not line.startswith("-"):
            key = line.split(":", 1)[0].strip()
            active_field = key if key in RELATIONSHIP_FIELDS else None
            output.append(line)
            continue

        if active_field and stripped.startswith("- "):
            value = stripped[2:].strip()

            if is_non_document_graph_value(value):
                removed.append(f"{active_field}: {value}")
                continue

        output.append(line)

    return "\n".join(output), removed


def main() -> int:
    changed_files = 0
    removed_total = 0

    for path in sorted(Path("docs").glob("**/*.md")):
        content = path.read_text(encoding="utf-8")
        raw, body = split_frontmatter(content)

        if raw is None:
            continue

        repaired, removed = repair_frontmatter(raw)

        if not removed:
            continue

        path.write_text(f"---\n{repaired}\n---\n{body}", encoding="utf-8")
        changed_files += 1
        removed_total += len(removed)

        print(f"patched {path}")
        for item in removed:
            print(f"  removed {item}")

    print("")
    print(f"changed files: {changed_files}")
    print(f"removed non-document graph links: {removed_total}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
