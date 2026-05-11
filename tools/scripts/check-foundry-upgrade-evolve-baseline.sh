#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

ARTIFACT_DIR=".artifacts/foundry/upgrade-evolve-baseline"
SUMMARY_TXT="$ARTIFACT_DIR/summary.txt"
SUMMARY_JSON="$ARTIFACT_DIR/summary.json"

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

record "Foundry upgrade/evolve baseline smoke gate"
record "repo root: $ROOT"
record "artifact dir: $ARTIFACT_DIR"

run_capture "typecheck cli" "$ARTIFACT_DIR/typecheck.log" \
  bun run --cwd packages/cli typecheck

run_capture "build cli" "$ARTIFACT_DIR/build.log" \
  bash -lc '( cd packages/cli && bun run build )'

run_capture "cli help" "$ARTIFACT_DIR/cli-help.log" \
  node packages/cli/bin/run.js --help

run_capture "upgrade help" "$ARTIFACT_DIR/upgrade-help.log" \
  node packages/cli/bin/run.js upgrade --help

run_capture "evolve help" "$ARTIFACT_DIR/evolve-help.log" \
  node packages/cli/bin/run.js evolve --help

python3 - <<'PYTHON_SUMMARY'
from __future__ import annotations

import json
from pathlib import Path


artifact_dir = Path(".artifacts/foundry/upgrade-evolve-baseline")
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


def read_log(path: Path) -> str:
    if not path.is_file():
        return ""

    return path.read_text(encoding="utf-8", errors="replace")


def command_exists(status: int | None, log_text: str) -> bool:
    if status == 0:
        return True

    lowered = log_text.lower()

    missing_markers = [
        "command not found",
        "not a foundry command",
        "not found",
        "unknown command",
        "command .* not found",
    ]

    return not any(marker in lowered for marker in missing_markers)


typecheck_status = read_status("typecheck cli")
build_status = read_status("build cli")
cli_help_status = read_status("cli help")
upgrade_help_status = read_status("upgrade help")
evolve_help_status = read_status("evolve help")

upgrade_log = read_log(artifact_dir / "upgrade-help.log")
evolve_log = read_log(artifact_dir / "evolve-help.log")

upgrade_surface_exists = command_exists(upgrade_help_status, upgrade_log)
evolve_surface_exists = command_exists(evolve_help_status, evolve_log)

core_ok = (
    typecheck_status == 0
    and build_status == 0
    and cli_help_status == 0
)

report = {
    "ok": core_ok,
    "coreOk": core_ok,
    "commandSurfaceReady": upgrade_help_status == 0 and evolve_help_status == 0,
    "checks": {
        "typecheckCli": typecheck_status,
        "buildCli": build_status,
        "cliHelp": cli_help_status,
        "upgradeHelp": upgrade_help_status,
        "evolveHelp": evolve_help_status,
    },
    "commandSurfaces": {
        "upgrade": {
            "helpStatus": upgrade_help_status,
            "exists": upgrade_surface_exists,
            "helpLog": str(artifact_dir / "upgrade-help.log"),
        },
        "evolve": {
            "helpStatus": evolve_help_status,
            "exists": evolve_surface_exists,
            "helpLog": str(artifact_dir / "evolve-help.log"),
        },
    },
    "logs": {
        "typecheckCli": str(artifact_dir / "typecheck.log"),
        "buildCli": str(artifact_dir / "build.log"),
        "cliHelp": str(artifact_dir / "cli-help.log"),
        "upgradeHelp": str(artifact_dir / "upgrade-help.log"),
        "evolveHelp": str(artifact_dir / "evolve-help.log"),
    },
    "notes": [],
}

if not core_ok:
    report["notes"].append(
        "Core CLI verification failed. Repair typecheck/build/top-level help before upgrade/evolve implementation."
    )

if upgrade_help_status != 0:
    report["notes"].append(
        "Upgrade command help is not passing yet. Next slice should add or repair upgrade command registration."
    )

if evolve_help_status != 0:
    report["notes"].append(
        "Evolve command help is not passing yet. Next slice should add or repair evolve command registration."
    )

summary_json.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

print("")
print("Foundry upgrade/evolve baseline summary")
print("=======================================")
print("ok:", report["ok"])
print("core ok:", report["coreOk"])
print("command surface ready:", report["commandSurfaceReady"])
print("checks:", report["checks"])
print("command surfaces:", report["commandSurfaces"])

for note in report["notes"]:
    print("note:", note)

print("")
print("Wrote:")
print("- .artifacts/foundry/upgrade-evolve-baseline/summary.txt")
print("- .artifacts/foundry/upgrade-evolve-baseline/summary.json")

if not report["ok"]:
    raise SystemExit(1)
PYTHON_SUMMARY
