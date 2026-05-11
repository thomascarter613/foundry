#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


FILES_TO_PATCH = [
    Path("packages/cli/src/docs/directory-validator.ts"),
    Path("packages/cli/src/docs/directory-repair.ts"),
]


def patch_directory_validator(path: Path) -> None:
    content = path.read_text(encoding="utf-8")

    content = content.replace(
        '''  "docs/changeplans",
  "docs/lifecycle",''',
        '''  "docs/changeplans",
  "docs/work-packets",
  "docs/lifecycle",''',
    )

    content = content.replace(
        '''  "docs/changeplans/index.md",
  "docs/lifecycle/index.md",''',
        '''  "docs/changeplans/index.md",
  "docs/work-packets/index.md",
  "docs/lifecycle/index.md",''',
    )

    content = content.replace('  "docs/work-packets",\n', "")

    path.write_text(content, encoding="utf-8")
    print(f"patched {path}")


def patch_directory_repair(path: Path) -> None:
    content = path.read_text(encoding="utf-8")

    content = content.replace(
        '''  "docs/changeplans",
  "docs/lifecycle",''',
        '''  "docs/changeplans",
  "docs/work-packets",
  "docs/lifecycle",''',
    )

    content = content.replace('  "docs/work-packets",\n', "")

    if '"docs/work-packets/index.md"' not in content:
        marker = '''  {
    path: "docs/lifecycle/index.md",
    title: "Lifecycle Index",'''

        insertion = '''  {
    path: "docs/work-packets/index.md",
    title: "Work Packet Index",
    owner: "Engineering Productivity",
    governanceLevel: "Required",
    documentType: "ChangePlan",
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

    content = content.replace(
        '''      "docs/changeplans/index.md",
      "docs/lifecycle/index.md",''',
        '''      "docs/changeplans/index.md",
      "docs/work-packets/index.md",
      "docs/lifecycle/index.md",''',
    )

    path.write_text(content, encoding="utf-8")
    print(f"patched {path}")


def main() -> int:
    validator = Path("packages/cli/src/docs/directory-validator.ts")
    repair = Path("packages/cli/src/docs/directory-repair.ts")

    if validator.exists():
        patch_directory_validator(validator)
    else:
        print(f"missing {validator}")

    if repair.exists():
        patch_directory_repair(repair)
    else:
        print(f"missing {repair}")

    print("")
    print("Next:")
    print("  bun run --cwd packages/cli typecheck")
    print("  cd packages/cli && bun run build && cd ../..")
    print("  node packages/cli/bin/run.js docs directory validate")
    print("  node packages/cli/bin/run.js docs verify")
    print("  tools/scripts/check-docs-mvp.sh")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
