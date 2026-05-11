#!/usr/bin/env python3
from __future__ import annotations

from datetime import date
from pathlib import Path


TODAY = date.today().isoformat()

WORK_PACKET_PATH = Path("docs/work-packets/WP-0004-add-init-workspace-smoke-fixture.md")
CHECK_SCRIPT_PATH = Path("tools/scripts/check-foundry-init-workspace.sh")


WORK_PACKET = f'''---
title: "WP-0004: Add Init Workspace Smoke Fixture"
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
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Work Packet"
  - "CLI"
  - "Scaffolding"
  - "Verification"
---

# WP-0004: Add Init Workspace Smoke Fixture

## Purpose

Add a disposable workspace smoke fixture for the `foundry init` MVP path.

## Problem

`foundry init --help` is reachable, but the product MVP requires more than help output.

The next validation question is:

> Can the init command create or plan a workspace in a disposable directory without crashing?

## Deliverables

This Work Packet delivers:

1. `tools/scripts/check-foundry-init-workspace.sh`
2. Disposable workspace creation under `.artifacts/foundry/init-workspace/`
3. Init help capture
4. Candidate init command execution
5. JSON summary output
6. A configurable override command for the exact init invocation

## Safety Rules

The fixture must:

1. Only write under `.artifacts/foundry/init-workspace/`.
2. Remove and recreate only its own disposable workspace directory.
3. Use timeouts to avoid hanging on interactive prompts.
4. Capture stdout and stderr for every candidate command.
5. Allow an explicit override via `FOUNDRY_INIT_SMOKE_COMMAND`.
6. Avoid touching the real repository workspace except for artifact output.

## Verification

Run:

~~~bash
tools/scripts/check-foundry-init-workspace.sh
~~~

Optional override example:

~~~bash
FOUNDRY_INIT_SMOKE_COMMAND='node packages/cli/bin/run.js init .artifacts/foundry/init-workspace/workspace --yes --no-install' \\
  tools/scripts/check-foundry-init-workspace.sh
~~~

## Acceptance Criteria

The fixture is accepted when:

1. CLI typecheck passes.
2. CLI build passes.
3. `init --help` passes.
4. The fixture creates `.artifacts/foundry/init-workspace/summary.json`.
5. The fixture reports whether any init candidate succeeded.
6. Failures are captured as actionable data rather than hidden terminal output.

## Change History

- Created init workspace smoke fixture Work Packet.
'''


CHECK_SCRIPT = r'''#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

ARTIFACT_DIR=".artifacts/foundry/init-workspace"
WORKSPACE_DIR="$ARTIFACT_DIR/workspace"
SUMMARY_JSON="$ARTIFACT_DIR/summary.json"
SUMMARY_TXT="$ARTIFACT_DIR/summary.txt"
HELP_TXT="$ARTIFACT_DIR/init-help.txt"
CANDIDATES_TXT="$ARTIFACT_DIR/candidates.txt"

mkdir -p "$ARTIFACT_DIR"
rm -rf "$WORKSPACE_DIR"
mkdir -p "$WORKSPACE_DIR"

: > "$SUMMARY_TXT"
: > "$CANDIDATES_TXT"

record_line() {
  printf '%s\n' "$1" | tee -a "$SUMMARY_TXT"
}

run_capture() {
  local name="$1"
  local outfile="$2"
  shift 2

  record_line ""
  record_line "==> $name"

  "$@" > "$outfile" 2>&1
  local status=$?

  record_line "status: $status"
  record_line "output: $outfile"

  return "$status"
}

record_line "Foundry init workspace smoke fixture"
record_line "repo root: $ROOT"
record_line "artifact dir: $ARTIFACT_DIR"
record_line "workspace dir: $WORKSPACE_DIR"

run_capture "typecheck cli" "$ARTIFACT_DIR/typecheck.log" \
  bun run --cwd packages/cli typecheck
TYPECHECK_STATUS=$?

run_capture "build cli" "$ARTIFACT_DIR/build.log" \
  bash -lc '( cd packages/cli && bun run build )'
BUILD_STATUS=$?

run_capture "init help" "$HELP_TXT" \
  node packages/cli/bin/run.js init --help
INIT_HELP_STATUS=$?

declare -a CANDIDATE_COMMANDS=()

if [ -n "${FOUNDRY_INIT_SMOKE_COMMAND:-}" ]; then
  CANDIDATE_COMMANDS+=("$FOUNDRY_INIT_SMOKE_COMMAND")
else
  CANDIDATE_COMMANDS+=("node packages/cli/bin/run.js init $WORKSPACE_DIR --yes --no-install")
  CANDIDATE_COMMANDS+=("node packages/cli/bin/run.js init $WORKSPACE_DIR --defaults --no-install")
  CANDIDATE_COMMANDS+=("node packages/cli/bin/run.js init --path $WORKSPACE_DIR --yes --no-install")
  CANDIDATE_COMMANDS+=("node packages/cli/bin/run.js init --name foundry-init-smoke --path $WORKSPACE_DIR --yes --no-install")
  CANDIDATE_COMMANDS+=("node packages/cli/bin/run.js init --dry-run --path $WORKSPACE_DIR")
  CANDIDATE_COMMANDS+=("node packages/cli/bin/run.js init --plan --path $WORKSPACE_DIR")
fi

index=0

for command in "${CANDIDATE_COMMANDS[@]}"; do
  index=$((index + 1))
  outfile="$ARTIFACT_DIR/candidate-$index.log"

  printf '%s\t%s\n' "$index" "$command" >> "$CANDIDATES_TXT"

  record_line ""
  record_line "==> candidate $index"
  record_line "$command"

  timeout 30s bash -lc "$command" > "$outfile" 2>&1
  status=$?

  record_line "status: $status"
  record_line "output: $outfile"

  if [ "$status" -eq 0 ]; then
    break
  fi
done

python3 - <<'PYTHON_SUMMARY'
from __future__ import annotations

import json
from pathlib import Path

artifact_dir = Path(".artifacts/foundry/init-workspace")
workspace_dir = artifact_dir / "workspace"
summary_txt = artifact_dir / "summary.txt"
summary_lines = summary_txt.read_text(encoding="utf-8").splitlines()


def read_status_from_summary(label: str) -> int | None:
    current = None

    for line in summary_lines:
        if line == f"==> {label}":
            current = label
            continue

        if current == label and line.startswith("status: "):
            raw = line.split(":", 1)[1].strip()
            return int(raw) if raw.isdigit() else None

    return None


candidates = []
candidates_path = artifact_dir / "candidates.txt"

if candidates_path.exists():
    for line in candidates_path.read_text(encoding="utf-8").splitlines():
        if "\t" not in line:
            continue

        index, command = line.split("\t", 1)
        status = None

        for i, item in enumerate(summary_lines):
            if item == f"==> candidate {index}":
                for next_item in summary_lines[i + 1 : i + 10]:
                    if next_item.startswith("status: "):
                        raw = next_item.split(":", 1)[1].strip()
                        status = int(raw) if raw.isdigit() else None
                        break

        candidates.append(
            {
                "index": int(index),
                "command": command,
                "status": status,
                "log": str(artifact_dir / f"candidate-{index}.log"),
            }
        )

successful = [candidate for candidate in candidates if candidate["status"] == 0]

workspace_files = []
if workspace_dir.exists():
    workspace_files = sorted(
        str(path.relative_to(workspace_dir))
        for path in workspace_dir.rglob("*")
        if path.is_file()
    )

report = {
    "ok": (
        read_status_from_summary("typecheck cli") == 0
        and read_status_from_summary("build cli") == 0
        and read_status_from_summary("init help") == 0
        and len(successful) > 0
    ),
    "typecheckStatus": read_status_from_summary("typecheck cli"),
    "buildStatus": read_status_from_summary("build cli"),
    "initHelpStatus": read_status_from_summary("init help"),
    "candidateCount": len(candidates),
    "successfulCandidate": successful[0] if successful else None,
    "candidates": candidates,
    "workspaceFileCount": len(workspace_files),
    "workspaceFiles": workspace_files[:200],
    "notes": [],
}

if not successful:
    report["notes"].append(
        "No default init smoke candidate succeeded. Inspect candidate logs and set FOUNDRY_INIT_SMOKE_COMMAND to the correct non-interactive init invocation."
    )

if report["workspaceFileCount"] == 0:
    report["notes"].append(
        "No workspace files were produced. This may be expected if the successful command is a dry-run or plan mode."
    )

(artifact_dir / "summary.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

print("")
print("Foundry init workspace smoke summary")
print("====================================")
print("ok:", report["ok"])
print("typecheck:", report["typecheckStatus"])
print("build:", report["buildStatus"])
print("init help:", report["initHelpStatus"])
print("candidate count:", report["candidateCount"])
print("successful candidate:", report["successfulCandidate"])
print("workspace file count:", report["workspaceFileCount"])

for note in report["notes"]:
    print("note:", note)

print("")
print("Wrote:")
print("- .artifacts/foundry/init-workspace/summary.json")
print("- .artifacts/foundry/init-workspace/summary.txt")
print("- .artifacts/foundry/init-workspace/init-help.txt")
print("- .artifacts/foundry/init-workspace/candidates.txt")
PYTHON_SUMMARY
'''


def write(path: Path, content: str, executable: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")

    if executable:
        path.chmod(0o755)

    print(f"wrote {path}")


def add_index_row(index_path: Path, marker: str, row: str) -> None:
    if not index_path.exists():
        return

    content = index_path.read_text(encoding="utf-8")

    if row in content:
        return

    if marker in content:
        content = content.replace(marker, marker + "\n" + row)
    else:
        content += "\n" + row + "\n"

    index_path.write_text(content, encoding="utf-8")
    print(f"updated {index_path}")


def main() -> int:
    write(WORK_PACKET_PATH, WORK_PACKET)
    write(CHECK_SCRIPT_PATH, CHECK_SCRIPT, executable=True)

    add_index_row(
        Path("docs/work-packets/index.md"),
        "| --- | --- | --- | --- |",
        '| WP-0004 | Add Init Workspace Smoke Fixture | Draft | `docs/work-packets/WP-0004-add-init-workspace-smoke-fixture.md` |',
    )

    print("")
    print("Next:")
    print("  bun run --cwd packages/cli typecheck")
    print("  ( cd packages/cli && bun run build )")
    print("  tools/scripts/check-foundry-init-workspace.sh")
    print("  cat .artifacts/foundry/init-workspace/summary.json")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
