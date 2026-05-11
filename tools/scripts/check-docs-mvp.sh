#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

mkdir -p .artifacts/docs

SUMMARY_TXT=".artifacts/docs/mvp-stabilization-summary.txt"
SUMMARY_JSON=".artifacts/docs/mvp-stabilization-summary.json"

: > "$SUMMARY_TXT"

record() {
  local name="$1"
  local status="$2"

  printf '%s\t%s\n' "$name" "$status" >> "$SUMMARY_TXT"
}

run_step() {
  local name="$1"
  shift

  echo ""
  echo "==> $name"
  echo "==> $name" >> "$SUMMARY_TXT"

  "$@"
  local status=$?

  echo "status: $status"
  echo "status: $status" >> "$SUMMARY_TXT"
  echo "" >> "$SUMMARY_TXT"

  record "$name" "$status"

  return 0
}

run_step "typecheck" bun run --cwd packages/cli typecheck
run_step "build" bash -lc 'cd packages/cli && bun run build'
run_step "docs verify" node packages/cli/bin/run.js docs verify
run_step "docs readiness" node packages/cli/bin/run.js docs readiness
run_step "root docs verifier" bun run tools/scripts/verify-docs.ts
run_step "directory validation" node packages/cli/bin/run.js docs directory validate
run_step "graph validation" node packages/cli/bin/run.js docs graph validate --skip-orphan-warnings --skip-reciprocal-warnings
run_step "adr validation" node packages/cli/bin/run.js docs adr validate
run_step "glossary validation" node packages/cli/bin/run.js docs glossary validate
run_step "changeplan validation" node packages/cli/bin/run.js docs changeplans validate
run_step "work packet validation" node packages/cli/bin/run.js docs work-packets validate

python3 - <<'PY'
from __future__ import annotations

import json
from pathlib import Path

artifacts = Path(".artifacts/docs")

report_files = {
    "directory": artifacts / "directory-validation-report.json",
    "metadata": artifacts / "validation-report.json",
    "graph": artifacts / "graph-validation-report.json",
    "adr": artifacts / "adr-validation-report.json",
    "glossary": artifacts / "glossary-validation-report.json",
    "changeplans": artifacts / "changeplan-validation-report.json",
    "workPackets": artifacts / "work-packet-validation-report.json",
    "pipeline": artifacts / "verification-pipeline-report.json",
    "readiness": artifacts / "readiness-report.json",
}

summary: dict[str, object] = {
    "ok": True,
    "reports": {},
    "missingReports": [],
    "recommendations": [],
}

def load_json(path: Path) -> object | None:
    if not path.exists():
        return None

    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError as error:
        return {"jsonError": str(error)}

for name, path in report_files.items():
    data = load_json(path)

    if data is None:
        summary["missingReports"].append(str(path))
        summary["ok"] = False
        continue

    if isinstance(data, dict) and "summary" in data and isinstance(data["summary"], dict):
        report_summary = data["summary"]
        errors = report_summary.get("errorCount", 0)
        warnings = report_summary.get("warningCount", 0)

        summary["reports"][name] = {
            "errors": errors,
            "warnings": warnings,
            "path": str(path),
        }

        if errors:
            summary["ok"] = False
            summary["recommendations"].append(f"Repair {name} errors reported in {path}.")
        elif warnings:
            summary["recommendations"].append(f"Review {name} warnings reported in {path}.")

    elif isinstance(data, dict) and name == "pipeline":
        summary["reports"][name] = {
            "ok": data.get("ok"),
            "path": str(path),
        }

        if not data.get("ok"):
            summary["ok"] = False
            summary["recommendations"].append("Inspect verification-pipeline-report.json for subsystem failures.")

    elif isinstance(data, dict) and name == "readiness":
        summary["reports"][name] = {
            "status": data.get("status"),
            "score": data.get("score"),
            "path": str(path),
        }
        if data.get("status") == "blocked":
            summary["recommendations"].append("Strict-mode readiness is blocked. This does not block MVP bootstrap if the pipeline is passing and all validator error counts are zero.")
    else:
        summary["reports"][name] = {
            "path": str(path),
            "note": "Report exists but did not match expected summary shape.",
        }
pipeline = summary["reports"].get("pipeline", {})
validator_reports = [
    value
    for key, value in summary["reports"].items()
    if key not in {"pipeline", "readiness"}
]

summary["bootstrapOk"] = bool(pipeline.get("ok")) and all(
    isinstance(report, dict) and report.get("errors", 0) == 0
    for report in validator_reports
)

readiness = summary["reports"].get("readiness", {})
summary["strictReady"] = readiness.get("status") == "ready"

summary["ok"] = summary["bootstrapOk"]

Path(".artifacts/docs/mvp-stabilization-summary.json").write_text(
    json.dumps(summary, indent=2) + "\n"
)

print("")
print("MVP stabilization summary")
print("=========================")
print("ok:", summary["ok"])

for name, value in summary["reports"].items():
    print(f"{name}: {value}")

if summary["missingReports"]:
    print("")
    print("Missing reports:")
    for item in summary["missingReports"]:
        print("-", item)

if summary["recommendations"]:
    print("")
    print("Recommendations:")
    for item in dict.fromkeys(summary["recommendations"]):
        print("-", item)

print("")
print("Wrote:")
print("- .artifacts/docs/mvp-stabilization-summary.txt")
print("- .artifacts/docs/mvp-stabilization-summary.json")
PY
