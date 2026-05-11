#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

ARTIFACT_DIR=".artifacts/foundry/init-mvp"
SUMMARY_TXT="$ARTIFACT_DIR/summary.txt"
mkdir -p "$ARTIFACT_DIR"
: > "$SUMMARY_TXT"

run_step() {
    local name="$1"
    shift
    echo "==> $name"
    echo "==> $name" >> "$SUMMARY_TXT"
    "$@" >> "$SUMMARY_TXT" 2>&1
    local status=$?
    printf '%s\t%s\n' "$name" "$status" >> "$SUMMARY_TXT"
    return 0
}

run_step "typecheck cli" bun run --cwd packages/cli typecheck
run_step "build cli" bash -lc '( cd packages/cli && bun run build )'
run_step "docs verify" node packages/cli/bin/run.js docs verify
run_step "docs readiness artifact" node packages/cli/bin/run.js docs readiness --report-path .artifacts/docs/readiness-report.json
run_step "cli help" node packages/cli/bin/run.js --help
run_step "init help" node packages/cli/bin/run.js init --help

python3 - <<'PY'
import json
from pathlib import Path

summary_txt = Path(".artifacts/foundry/init-mvp/summary.txt")
summary_json = Path(".artifacts/foundry/init-mvp/summary.json")

results = {}
if summary_txt.exists():
    for line in summary_txt.read_text().splitlines():
        if "\t" in line:
            name, status = line.split("\t", 1)
            results[name.strip()] = int(status.strip())

required = ["typecheck cli", "build cli", "docs verify", "docs readiness artifact", "cli help"]
optional = ["init help"]

report = {
    "ok": all(results.get(name) == 0 for name in required),
    "required": {name: results.get(name) for name in required},
    "optional": {name: results.get(name) for name in optional},
    "notes": [],
}

if results.get("init help") != 0:
    report["notes"].append("init help is not currently passing.")

summary_json.write_text(json.dumps(report, indent=2) + "\n")
print(f"Summary: {'OK' if report['ok'] else 'FAILED'}")
if not report["ok"]: exit(1)
PY
