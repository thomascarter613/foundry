#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

WORKSPACE_DIR=".artifacts/foundry/init-workspace/workspace"
ARTIFACT_DIR=".artifacts/foundry/generated-workspace-verification"
SUMMARY_JSON="$ARTIFACT_DIR/summary.json"
SUMMARY_TXT="$ARTIFACT_DIR/summary.txt"

mkdir -p "$ARTIFACT_DIR"
: > "$SUMMARY_TXT"

record() {
  printf '%s\n' "$1" | tee -a "$SUMMARY_TXT"
}

run_capture() {
  local name="$1"
  local outfile="$2"
  shift 2

  record ""
  record "==> $name"

  "$@" > "$outfile" 2>&1
  local status=$?

  record "status: $status"
  record "output: $outfile"

  return 0
}

record "Generated workspace self-verification"
record "repo root: $ROOT"
record "workspace dir: $WORKSPACE_DIR"

if [ ! -d "$WORKSPACE_DIR" ]; then
  record "workspace missing: $WORKSPACE_DIR"
else
  run_capture "generated verify script exists" "$ARTIFACT_DIR/verify-script-exists.log" \
    test -f "$WORKSPACE_DIR/tools/scripts/verify.sh"

  run_capture "generated verify script executable check" "$ARTIFACT_DIR/verify-script-executable.log" \
    test -x "$WORKSPACE_DIR/tools/scripts/verify.sh"

  run_capture "generated verify script run" "$ARTIFACT_DIR/verify-script-run.log" \
    bash -lc "cd '$WORKSPACE_DIR' && bash tools/scripts/verify.sh"

  run_capture "generated package foundry script check" "$ARTIFACT_DIR/package-foundry-script.log" \
    python3 - <<'PY'
import json
from pathlib import Path

package_json = Path(".artifacts/foundry/init-workspace/workspace/package.json")
data = json.loads(package_json.read_text())
scripts = data.get("scripts", {})

if "foundry" not in scripts:
    raise SystemExit("missing foundry script")

if "verify" not in scripts:
    raise SystemExit("missing verify script")

print("required package scripts present")
PY
fi

python3 - <<'PYTHON_SUMMARY'
from __future__ import annotations

import json
from pathlib import Path

artifact_dir = Path(".artifacts/foundry/generated-workspace-verification")
workspace = Path(".artifacts/foundry/init-workspace/workspace")
summary_txt = artifact_dir / "summary.txt"
summary_lines = summary_txt.read_text(encoding="utf-8").splitlines()


def read_status(label: str) -> int | None:
    active = False

    for line in summary_lines:
        if line == f"==> {label}":
            active = True
            continue

        if active and line.startswith("status: "):
            raw = line.split(":", 1)[1].strip()
            return int(raw) if raw.isdigit() else None

    return None


checks = {
    "workspaceExists": workspace.is_dir(),
    "verifyScriptExists": read_status("generated verify script exists"),
    "verifyScriptExecutable": read_status("generated verify script executable check"),
    "verifyScriptRun": read_status("generated verify script run"),
    "packageScripts": read_status("generated package foundry script check"),
}

report = {
    "ok": (
        checks["workspaceExists"] is True
        and checks["verifyScriptExists"] == 0
        and checks["verifyScriptExecutable"] == 0
        and checks["verifyScriptRun"] == 0
        and checks["packageScripts"] == 0
    ),
    "workspace": str(workspace),
    "checks": checks,
    "logs": {
        "verifyScriptExists": str(artifact_dir / "verify-script-exists.log"),
        "verifyScriptExecutable": str(artifact_dir / "verify-script-executable.log"),
        "verifyScriptRun": str(artifact_dir / "verify-script-run.log"),
        "packageScripts": str(artifact_dir / "package-foundry-script.log"),
    },
    "notes": [],
}

if not checks["workspaceExists"]:
    report["notes"].append("Generated workspace is missing. Run tools/scripts/check-foundry-init-workspace.sh first.")

if checks["verifyScriptRun"] not in (0, None):
    report["notes"].append("Generated workspace verify script failed. Inspect verify-script-run.log.")

(artifact_dir / "summary.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

print("")
print("Generated workspace self-verification summary")
print("=============================================")
print("ok:", report["ok"])
print("checks:", report["checks"])

for note in report["notes"]:
    print("note:", note)

print("")
print("Wrote:")
print("- .artifacts/foundry/generated-workspace-verification/summary.json")
print("- .artifacts/foundry/generated-workspace-verification/summary.txt")

if not report["ok"]:
    raise SystemExit(1)
PYTHON_SUMMARY
