#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re


WORK_PACKET_DIR = '  "docs/work-packets",'
WORK_PACKET_INDEX = '  "docs/work-packets/index.md",'


def ensure_in_const_array(content: str, const_name: str, value_line: str, after_line: str) -> str:
    pattern = re.compile(
        rf"(const {re.escape(const_name)} = \[\n)(.*?)(\n\] as const;)",
        re.DOTALL,
    )

    match = pattern.search(content)

    if not match:
        return content

    prefix, body, suffix = match.groups()

    if value_line in body:
        return content

    lines = body.splitlines()
    result: list[str] = []
    inserted = False

    for line in lines:
        result.append(line)

        if line.strip() == after_line.strip():
            result.append(value_line)
            inserted = True

    if not inserted:
        result.append(value_line)

    return content[: match.start()] + prefix + "\n".join(result) + suffix + content[match.end():]


def remove_from_new_set(content: str, const_name: str, value_line: str) -> str:
    pattern = re.compile(
        rf"(const {re.escape(const_name)} = new Set\(\[\n)(.*?)(\n\]\);)",
        re.DOTALL,
    )

    match = pattern.search(content)

    if not match:
        return content

    prefix, body, suffix = match.groups()
    lines = [line for line in body.splitlines() if line.strip() != value_line.strip()]

    return content[: match.start()] + prefix + "\n".join(lines) + suffix + content[match.end():]


def patch_directory_validator() -> None:
    path = Path("packages/cli/src/docs/directory-validator.ts")

    if not path.exists():
        print(f"missing {path}")
        return

    content = path.read_text(encoding="utf-8")

    content = ensure_in_const_array(
        content,
        "canonicalDirectories",
        WORK_PACKET_DIR,
        '  "docs/changeplans",',
    )

    content = ensure_in_const_array(
        content,
        "requiredIndexFiles",
        WORK_PACKET_INDEX,
        '  "docs/changeplans/index.md",',
    )

    content = remove_from_new_set(
        content,
        "allowedLegacyDirectories",
        WORK_PACKET_DIR,
    )

    path.write_text(content, encoding="utf-8")
    print(f"patched {path}")


def patch_directory_repair() -> None:
    path = Path("packages/cli/src/docs/directory-repair.ts")

    if not path.exists():
        print(f"missing {path}")
        return

    content = path.read_text(encoding="utf-8")

    content = ensure_in_const_array(
        content,
        "canonicalDirectories",
        WORK_PACKET_DIR,
        '  "docs/changeplans",',
    )

    content = remove_from_new_set(
        content,
        "legacyDirectories",
        WORK_PACKET_DIR,
    )

    if '| "WorkPacket";' not in content:
        content = content.replace(
            '| "Onboarding";',
            '| "Onboarding"\n    | "WorkPacket";',
        )

    if 'path: "docs/work-packets/index.md"' not in content:
        marker = '''  {
    path: "docs/lifecycle/index.md",
    title: "Lifecycle Index",'''

        insertion = '''  {
    path: "docs/work-packets/index.md",
    title: "Work Packet Index",
    owner: "Engineering Productivity",
    governanceLevel: "Required",
    documentType: "WorkPacket",
    upstream: ["docs/index.md"],
    downstream: [],
    body: `# Work Packet Index

## Purpose

Provide the governed index for Work Packet documents.

## Change History

- Created by the directory topology repair command.
`
  },
'''

        content = content.replace(marker, insertion + marker)

    if '"docs/work-packets/index.md"' not in content:
        content = content.replace(
            '"docs/changeplans/index.md",',
            '"docs/changeplans/index.md",\n      "docs/work-packets/index.md",',
        )

    path.write_text(content, encoding="utf-8")
    print(f"patched {path}")


def repair_stale_graph_references() -> None:
    replacements = {
        "docs/cp-0006-ci-constitutional-pipeline.md": "docs/changeplans/cp-0006-ci-constitutional-pipeline.md",
        "./cp-0006-ci-constitutional-pipeline.md": "docs/changeplans/cp-0006-ci-constitutional-pipeline.md",
    }

    changed = 0

    for path in sorted(Path("docs").glob("**/*.md")):
        content = path.read_text(encoding="utf-8")
        updated = content

        for old, new in replacements.items():
            updated = updated.replace(old, new)

        if updated != content:
            path.write_text(updated, encoding="utf-8")
            changed += 1
            print(f"repaired stale graph reference: {path}")

    print(f"stale graph reference files changed: {changed}")


def main() -> int:
    patch_directory_validator()
    patch_directory_repair()
    repair_stale_graph_references()

    print("")
    print("Next:")
    print("  bun run --cwd packages/cli typecheck")
    print("  cd packages/cli && bun run build && cd ../..")
    print("  node packages/cli/bin/run.js docs directory validate")
    print("  node packages/cli/bin/run.js docs graph validate --skip-orphan-warnings --skip-reciprocal-warnings")
    print("  node packages/cli/bin/run.js docs verify")
    print("  tools/scripts/check-docs-mvp.sh")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
