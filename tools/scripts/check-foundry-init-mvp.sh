#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

ARTIFACT_DIR=".artifacts/foundry/init-mvp"
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

record "Foundry init MVP verification gate"
record "repo root: $ROOT"
record "artifact dir: $ARTIFACT_DIR"

run_step "typecheck cli" "$ARTIFACT_DIR/typecheck.log" \
  bun run --cwd packages/cli typecheck

run_step "build cli" "$ARTIFACT_DIR/build.log" \
  bash -lc '( cd packages/cli && bun run build )'

run_step "docs verify" "$ARTIFACT_DIR/docs-verify.log" \
  node packages/cli/bin/run.js docs verify

run_step "docs readiness artifact" "$ARTIFACT_DIR/docs-readiness.log" \
  node packages/cli/bin/run.js docs readiness --report-path .artifacts/docs/readiness-report.json

run_step "cli help" "$ARTIFACT_DIR/cli-help.log" \
  node packages/cli/bin/run.js --help

run_step "init help" "$ARTIFACT_DIR/init-help.log" \
  node packages/cli/bin/run.js init --help

run_step "init workspace smoke" "$ARTIFACT_DIR/init-workspace-smoke.log" \
  tools/scripts/check-foundry-init-workspace.sh

run_step "generated workspace contract" "$ARTIFACT_DIR/generated-workspace-contract.log" \
  tools/scripts/check-generated-workspace-contract.sh

run_step "generated workspace self verification" "$ARTIFACT_DIR/generated-workspace-verification.log" \
  tools/scripts/check-generated-workspace-verification.sh

python3 - <<'PYTHON_SUMMARY'
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


artifact_dir = Path(".artifacts/foundry/init-mvp")
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


required_checks = {
    "typecheckCli": read_status("typecheck cli"),
    "buildCli": read_status("build cli"),
    "docsVerify": read_status("docs verify"),
    "docsReadinessArtifact": read_status("docs readiness artifact"),
    "cliHelp": read_status("cli help"),
    "initHelp": read_status("init help"),
    "initWorkspaceSmoke": read_status("init workspace smoke"),
    "generatedWorkspaceContract": read_status("generated workspace contract"),
    "generatedWorkspaceSelfVerification": read_status("generated workspace self verification"),
}

init_workspace_summary = load_json(".artifacts/foundry/init-workspace/summary.json")
contract_summary = load_json(".artifacts/foundry/generated-workspace-contract/summary.json")
verification_summary = load_json(".artifacts/foundry/generated-workspace-verification/summary.json")
readiness_summary = load_json(".artifacts/docs/readiness-report.json")

all_required_statuses_ok = all(status == 0 for status in required_checks.values())

nested_summaries_ok = (
    bool(init_workspace_summary and init_workspace_summary.get("ok") is True)
    and bool(contract_summary and contract_summary.get("ok") is True)
    and bool(verification_summary and verification_summary.get("ok") is True)
)

report = {
    "ok": all_required_statuses_ok and nested_summaries_ok,
    "checks": required_checks,
    "nestedSummaries": {
        "initWorkspace": {
            "path": ".artifacts/foundry/init-workspace/summary.json",
            "ok": init_workspace_summary.get("ok") if init_workspace_summary else None,
        },
        "generatedWorkspaceContract": {
            "path": ".artifacts/foundry/generated-workspace-contract/summary.json",
            "ok": contract_summary.get("ok") if contract_summary else None,
        },
        "generatedWorkspaceVerification": {
            "path": ".artifacts/foundry/generated-workspace-verification/summary.json",
            "ok": verification_summary.get("ok") if verification_summary else None,
        },
        "docsReadiness": {
            "path": ".artifacts/docs/readiness-report.json",
            "status": readiness_summary.get("status") if readiness_summary else None,
            "bootstrapComplete": (
                readiness_summary.get("bootstrap", {}).get("complete")
                if readiness_summary and isinstance(readiness_summary.get("bootstrap"), dict)
                else None
            ),
            "strictReady": (
                readiness_summary.get("strict", {}).get("complete")
                if readiness_summary and isinstance(readiness_summary.get("strict"), dict)
                else None
            ),
        },
    },
    "logs": {
        "typecheckCli": str(artifact_dir / "typecheck.log"),
        "buildCli": str(artifact_dir / "build.log"),
        "docsVerify": str(artifact_dir / "docs-verify.log"),
        "docsReadiness": str(artifact_dir / "docs-readiness.log"),
        "cliHelp": str(artifact_dir / "cli-help.log"),
        "initHelp": str(artifact_dir / "init-help.log"),
        "initWorkspaceSmoke": str(artifact_dir / "init-workspace-smoke.log"),
        "generatedWorkspaceContract": str(artifact_dir / "generated-workspace-contract.log"),
        "generatedWorkspaceVerification": str(artifact_dir / "generated-workspace-verification.log"),
    },
    "notes": [],
}

if not all_required_statuses_ok:
    report["notes"].append("One or more required init MVP gate commands failed. Inspect the corresponding log.")

if not nested_summaries_ok:
    report["notes"].append("One or more nested init MVP summaries did not report ok=true.")

summary_json.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

print("")
print("Foundry init MVP verification summary")
print("=====================================")
print("ok:", report["ok"])
print("checks:", report["checks"])
print("nested summaries:", report["nestedSummaries"])

for note in report["notes"]:
    print("note:", note)

print("")
print("Wrote:")
print("- .artifacts/foundry/init-mvp/summary.txt")
print("- .artifacts/foundry/init-mvp/summary.json")

if not report["ok"]:
    raise SystemExit(1)
PYTHON_SUMMARY
