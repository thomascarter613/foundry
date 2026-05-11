#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

ARTIFACT_DIR=".artifacts/foundry/upgrade-evolve-plans"
SUMMARY_TXT="$ARTIFACT_DIR/summary.txt"
SUMMARY_JSON="$ARTIFACT_DIR/summary.json"

mkdir -p "$ARTIFACT_DIR"
: > "$SUMMARY_TXT"

record() {
  printf '%s\n' "$1" | tee -a "$SUMMARY_TXT"
}

run_step() {
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

record "Foundry upgrade/evolve integrated plan gate"
record "repo root: $ROOT"
record "artifact dir: $ARTIFACT_DIR"

run_step "upgrade evolve baseline" "$ARTIFACT_DIR/upgrade-evolve-baseline.log" \
  tools/scripts/check-foundry-upgrade-evolve-baseline.sh

run_step "upgrade plan" "$ARTIFACT_DIR/upgrade-plan.log" \
  tools/scripts/check-foundry-upgrade-plan.sh

run_step "evolve plan" "$ARTIFACT_DIR/evolve-plan.log" \
  tools/scripts/check-foundry-evolve-plan.sh

python3 - <<'PYTHON_SUMMARY'
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


artifact_dir = Path(".artifacts/foundry/upgrade-evolve-plans")
summary_txt = artifact_dir / "summary.txt"
summary_json = artifact_dir / "summary.json"

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


def load_json(path: str) -> dict[str, Any] | None:
    file_path = Path(path)

    if not file_path.is_file():
        return None

    try:
        data = json.loads(file_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None

    return data if isinstance(data, dict) else None


baseline = load_json(".artifacts/foundry/upgrade-evolve-baseline/summary.json")
upgrade_plan = load_json(".artifacts/foundry/upgrade-plan/summary.json")
evolve_plan = load_json(".artifacts/foundry/evolve-plan/summary.json")

checks = {
    "upgradeEvolveBaseline": read_status("upgrade evolve baseline"),
    "upgradePlan": read_status("upgrade plan"),
    "evolvePlan": read_status("evolve plan"),
}

nested = {
    "baseline": {
        "path": ".artifacts/foundry/upgrade-evolve-baseline/summary.json",
        "ok": baseline.get("ok") if baseline else None,
        "coreOk": baseline.get("coreOk") if baseline else None,
        "commandSurfaceReady": baseline.get("commandSurfaceReady") if baseline else None,
    },
    "upgradePlan": {
        "path": ".artifacts/foundry/upgrade-plan/summary.json",
        "ok": upgrade_plan.get("ok") if upgrade_plan else None,
    },
    "evolvePlan": {
        "path": ".artifacts/foundry/evolve-plan/summary.json",
        "ok": evolve_plan.get("ok") if evolve_plan else None,
    },
}

report = {
    "ok": (
        checks["upgradeEvolveBaseline"] == 0
        and checks["upgradePlan"] == 0
        and checks["evolvePlan"] == 0
        and nested["baseline"]["ok"] is True
        and nested["baseline"]["commandSurfaceReady"] is True
        and nested["upgradePlan"]["ok"] is True
        and nested["evolvePlan"]["ok"] is True
    ),
    "checks": checks,
    "nestedSummaries": nested,
    "logs": {
        "upgradeEvolveBaseline": str(artifact_dir / "upgrade-evolve-baseline.log"),
        "upgradePlan": str(artifact_dir / "upgrade-plan.log"),
        "evolvePlan": str(artifact_dir / "evolve-plan.log"),
    },
    "notes": [],
}

if not report["ok"]:
    report["notes"].append(
        "Integrated upgrade/evolve plan gate failed. Inspect nested summaries and logs."
    )

summary_json.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

print("")
print("Foundry upgrade/evolve integrated plan summary")
print("==============================================")
print("ok:", report["ok"])
print("checks:", report["checks"])
print("nested summaries:", report["nestedSummaries"])

for note in report["notes"]:
    print("note:", note)

print("")
print("Wrote:")
print("- .artifacts/foundry/upgrade-evolve-plans/summary.txt")
print("- .artifacts/foundry/upgrade-evolve-plans/summary.json")

if not report["ok"]:
    raise SystemExit(1)
PYTHON_SUMMARY
