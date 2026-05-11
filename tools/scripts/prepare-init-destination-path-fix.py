#!/usr/bin/env python3
from __future__ import annotations

from datetime import date
from pathlib import Path


TODAY = date.today().isoformat()

WORK_PACKET_PATH = Path("docs/work-packets/WP-0005-fix-init-destination-path-handling.md")
WORK_PACKET_INDEX = Path("docs/work-packets/index.md")
SMOKE_SCRIPT = Path("tools/scripts/check-foundry-init-workspace.sh")
INSPECT_SCRIPT = Path("tools/scripts/inspect-init-path-validation.sh")


WORK_PACKET = f'''---
title: "WP-0005: Fix Init Destination Path Handling"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "{TODAY}"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
downstream:
  - "tools/scripts/check-foundry-init-workspace.sh"
  - "tools/scripts/inspect-init-path-validation.sh"
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Work Packet"
  - "CLI"
  - "Scaffolding"
  - "Verification"
---

# WP-0005: Fix Init Destination Path Handling

## Purpose

Repair `foundry init` so the documented `[DESTINATION]` argument behaves as a repository-relative workspace path.

## Problem

The init command help documents `[DESTINATION]` as a repository-relative workspace directory, but the current validation path treats the full destination string as the project name.

This causes a valid invocation such as:

~~~bash
node packages/cli/bin/run.js init .artifacts/foundry/init-workspace/workspace --yes --no-install --no-database
~~~

to fail with:

~~~text
project-name-path-separator
Project name must not contain path separators.
~~~

## Required Behavior

The init command must distinguish:

- destination path: may contain path separators
- project name: must not contain path separators

When a destination path is supplied, the default project name should be derived from the destination basename.

Examples:

| Destination | Derived Project Name |
| --- | --- |
| `myapp` | `myapp` |
| `.artifacts/foundry/init-workspace/workspace` | `workspace` |
| `examples/demo-app` | `demo-app` |

## Acceptance Criteria

1. CLI typecheck passes.
2. CLI build passes.
3. `init --help` passes.
4. This command exits `0`:

~~~bash
node packages/cli/bin/run.js init .artifacts/foundry/init-workspace/workspace --yes --no-install --no-database
~~~

5. The workspace smoke fixture reports `"ok": true`.
6. The generated workspace contains at least one file.
7. Existing `foundry init myapp --yes --no-install` behavior remains valid.

## Verification

Run:

~~~bash
bun run --cwd packages/cli typecheck
( cd packages/cli && bun run build )
tools/scripts/check-foundry-init-workspace.sh
cat .artifacts/foundry/init-workspace/summary.json
~~~

## Change History

- Created Work Packet for init destination path handling fix.
'''


INSPECT_SCRIPT_CONTENT = r'''#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

ARTIFACT_DIR=".artifacts/foundry/init-path-fix"
REPORT="$ARTIFACT_DIR/source-inspection.txt"

mkdir -p "$ARTIFACT_DIR"

{
  echo "# Init Destination Path Validation Inspection"
  echo
  echo "## Known failing invocation"
  echo
  echo 'node packages/cli/bin/run.js init .artifacts/foundry/init-workspace/workspace --yes --no-install --no-database'
  echo
  echo "## Init help"
  echo
  node packages/cli/bin/run.js init --help || true
  echo

  echo "## project-name-path-separator locations"
  grep -R "project-name-path-separator" -n packages/cli/src || true
  echo

  echo "## path separator validation locations"
  grep -R "Project name must not contain path separators" -n packages/cli/src || true
  grep -R "path separators" -n packages/cli/src || true
  echo

  echo "## init command files"
  find packages/cli/src/commands -maxdepth 5 -type f | sort | grep -E 'init|workspace' || true
  echo

  echo "## init implementation files"
  find packages/cli/src/init -maxdepth 8 -type f | sort 2>/dev/null || true
  echo

  echo "## Source context for project-name-path-separator"
  while IFS=: read -r file line rest; do
    [ -n "$file" ] || continue
    echo
    echo "### $file:$line"
    start=$((line - 40))
    end=$((line + 60))
    [ "$start" -lt 1 ] && start=1
    sed -n "${start},${end}p" "$file"
  done < <(grep -R "project-name-path-separator" -n packages/cli/src || true)

  echo
  echo "## Source context for init command files"
  for file in $(find packages/cli/src/commands -maxdepth 5 -type f | sort | grep -E 'init|workspace' || true); do
    echo
    echo "### $file"
    sed -n '1,260p' "$file"
  done
} > "$REPORT"

echo "wrote $REPORT"
'''


def write(path: Path, content: str, executable: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")

    if executable:
        path.chmod(0o755)

    print(f"wrote {path}")


def update_work_packet_index() -> None:
    if not WORK_PACKET_INDEX.exists():
        print(f"skipped missing {WORK_PACKET_INDEX}")
        return

    row = "| WP-0005 | Fix Init Destination Path Handling | Draft | `docs/work-packets/WP-0005-fix-init-destination-path-handling.md` |"
    content = WORK_PACKET_INDEX.read_text(encoding="utf-8")

    if row in content:
        print(f"{WORK_PACKET_INDEX} already contains WP-0005")
        return

    marker = "| --- | --- | --- | --- |"
    if marker in content:
        content = content.replace(marker, marker + "\n" + row)
    else:
        content += "\n" + row + "\n"

    WORK_PACKET_INDEX.write_text(content, encoding="utf-8")
    print(f"updated {WORK_PACKET_INDEX}")


def update_smoke_candidate() -> None:
    if not SMOKE_SCRIPT.exists():
        print(f"skipped missing {SMOKE_SCRIPT}")
        return

    content = SMOKE_SCRIPT.read_text(encoding="utf-8")

    old = "node packages/cli/bin/run.js init $WORKSPACE_DIR --yes --no-install"
    new = "node packages/cli/bin/run.js init $WORKSPACE_DIR --yes --no-install --no-database"

    if new in content:
        print(f"{SMOKE_SCRIPT} already uses --no-database for canonical candidate")
        return

    if old not in content:
        print(f"warning: did not find canonical candidate in {SMOKE_SCRIPT}")
        return

    content = content.replace(old, new)
    SMOKE_SCRIPT.write_text(content, encoding="utf-8")
    print(f"updated {SMOKE_SCRIPT}")


def main() -> int:
    write(WORK_PACKET_PATH, WORK_PACKET)
    update_work_packet_index()
    update_smoke_candidate()
    write(INSPECT_SCRIPT, INSPECT_SCRIPT_CONTENT, executable=True)

    print("")
    print("Next:")
    print("  tools/scripts/inspect-init-path-validation.sh")
    print("  sed -n '1,260p' .artifacts/foundry/init-path-fix/source-inspection.txt")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
