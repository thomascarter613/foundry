#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

ARTIFACT_DIR=".artifacts/foundry/evolve-plan"
SUMMARY_TXT="$ARTIFACT_DIR/summary.txt"
SUMMARY_JSON="$ARTIFACT_DIR/summary.json"
PLAN_JSON=".artifacts/foundry/evolve/plan.json"

mkdir -p "$ARTIFACT_DIR" ".artifacts/foundry/evolve"
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

record "Foundry evolve plan smoke gate"
record "repo root: $ROOT"
record "artifact dir: $ARTIFACT_DIR"

run_capture "typecheck cli" "$ARTIFACT_DIR/typecheck.log" \
  bun run --cwd packages/cli typecheck

run_capture "build cli" "$ARTIFACT_DIR/build.log" \
  bash -lc '( cd packages/cli && bun run build )'

run_capture "evolve plan text" "$ARTIFACT_DIR/evolve-plan-text.log" \
  node packages/cli/bin/run.js evolve --plan

run_capture "evolve plan json" "$ARTIFACT_DIR/evolve-plan-json.log" \
  node packages/cli/bin/run.js evolve --plan --json --report-path "$PLAN_JSON"

python3 - <<'PYTHON_SUMMARY'
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


artifact_dir = Path(".artifacts/foundry/evolve-plan")
summary_txt = artifact_dir / "summary.txt"
summary_json = artifact_dir / "summary.json"
plan_json_path = Path(".artifacts/foundry/evolve/plan.json")
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


def load_json(path: Path) -> tuple[dict[str, Any] | None, str | None]:
    if not path.is_file():
        return None, "file is missing"

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        return None, str(error)

    if not isinstance(data, dict):
        return None, "top-level JSON value must be an object"

    return data, None


typecheck_status = read_status("typecheck cli")
build_status = read_status("build cli")
text_status = read_status("evolve plan text")
json_status = read_status("evolve plan json")

plan, plan_error = load_json(plan_json_path)
actions = plan.get("actions") if plan else None
summary = plan.get("summary") if plan else None

actions_valid = isinstance(actions, list) and len(actions) > 0
summary_valid = isinstance(summary, dict) and isinstance(summary.get("actionCount"), int)
capabilities_valid = isinstance(summary, dict) and isinstance(summary.get("capabilities"), list)

report = {
    "ok": (
        typecheck_status == 0
        and build_status == 0
        and text_status == 0
        and json_status == 0
        and plan_error is None
        and actions_valid
        and summary_valid
        and capabilities_valid
    ),
    "checks": {
        "typecheckCli": typecheck_status,
        "buildCli": build_status,
        "evolvePlanText": text_status,
        "evolvePlanJson": json_status,
    },
    "plan": {
        "path": str(plan_json_path),
        "validJson": plan_error is None and plan is not None,
        "error": plan_error,
        "kind": plan.get("kind") if plan else None,
        "mode": plan.get("mode") if plan else None,
        "actionCount": len(actions) if isinstance(actions, list) else None,
        "summaryValid": summary_valid,
        "actionsValid": actions_valid,
        "capabilitiesValid": capabilities_valid,
    },
    "logs": {
        "typecheckCli": str(artifact_dir / "typecheck.log"),
        "buildCli": str(artifact_dir / "build.log"),
        "evolvePlanText": str(artifact_dir / "evolve-plan-text.log"),
        "evolvePlanJson": str(artifact_dir / "evolve-plan-json.log"),
    },
    "notes": [],
}

if not report["ok"]:
    report["notes"].append("Evolve plan smoke gate failed. Inspect logs and plan JSON.")

summary_json.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

print("")
print("Foundry evolve plan smoke summary")
print("=================================")
print("ok:", report["ok"])
print("checks:", report["checks"])
print("plan:", report["plan"])

for note in report["notes"]:
    print("note:", note)

print("")
print("Wrote:")
print("- .artifacts/foundry/evolve-plan/summary.txt")
print("- .artifacts/foundry/evolve-plan/summary.json")

if not report["ok"]:
    raise SystemExit(1)
PYTHON_SUMMARY
