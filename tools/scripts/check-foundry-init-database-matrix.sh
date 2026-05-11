#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

ARTIFACT_DIR=".artifacts/foundry/init-database-matrix"
WORKSPACES_DIR="$ARTIFACT_DIR/workspaces"
SUMMARY_TXT="$ARTIFACT_DIR/summary.txt"
SUMMARY_JSON="$ARTIFACT_DIR/summary.json"

PROVIDERS=(
  "postgres:drizzle"
  "postgres:prisma"
  "sqlite:drizzle"
  "sqlite:prisma"
  "mongodb:native"
  "supabase:sql"
  "supabase:drizzle"
  "supabase:prisma"
  "supabase:client"
)

mkdir -p "$ARTIFACT_DIR"
rm -rf "$WORKSPACES_DIR"
mkdir -p "$WORKSPACES_DIR"
: > "$SUMMARY_TXT"

record() {
  printf '%s\n' "$1" | tee -a "$SUMMARY_TXT"
}

provider_slug() {
  printf '%s' "$1" | tr ':/' '__'
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

record "Foundry init database provider smoke matrix"
record "repo root: $ROOT"
record "artifact dir: $ARTIFACT_DIR"

run_capture "typecheck cli" "$ARTIFACT_DIR/typecheck.log" \
  bun run --cwd packages/cli typecheck

run_capture "build cli" "$ARTIFACT_DIR/build.log" \
  bash -lc '( cd packages/cli && bun run build )'

for provider in "${PROVIDERS[@]}"; do
  slug="$(provider_slug "$provider")"
  workspace="$WORKSPACES_DIR/$slug"
  log="$ARTIFACT_DIR/provider-$slug.log"

  record ""
  record "==> provider $provider"
  record "workspace: $workspace"

  node packages/cli/bin/run.js init "$workspace" \
    --yes \
    --no-install \
    --database-provider "$provider" > "$log" 2>&1
  status=$?

  record "status: $status"
  record "output: $log"

  if [ "$status" -eq 0 ] && [ -f "$workspace/tools/scripts/verify.sh" ]; then
    verify_log="$ARTIFACT_DIR/provider-$slug-verify.log"
    bash -lc "cd '$workspace' && bash tools/scripts/verify.sh" > "$verify_log" 2>&1
    verify_status=$?
    record "verify-status: $verify_status"
    record "verify-output: $verify_log"
  else
    record "verify-status: skipped"
  fi
done

python3 - <<'PYTHON_SUMMARY'
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


artifact_dir = Path(".artifacts/foundry/init-database-matrix")
workspaces_dir = artifact_dir / "workspaces"
summary_txt = artifact_dir / "summary.txt"
summary_json = artifact_dir / "summary.json"

providers = [
    "postgres:drizzle",
    "postgres:prisma",
    "sqlite:drizzle",
    "sqlite:prisma",
    "mongodb:native",
    "supabase:sql",
    "supabase:drizzle",
    "supabase:prisma",
    "supabase:client",
]

required_files = [
    "package.json",
    "db/provider.json",
    ".env.example",
    "tools/scripts/db-validate.sh",
    "tools/scripts/db-start.sh",
    "tools/scripts/db-stop.sh",
    "tools/scripts/verify.sh",
    ".foundry/init/provenance.json",
    ".foundry/init/audit.ndjson",
]

summary_lines = summary_txt.read_text(encoding="utf-8").splitlines()


def slug(provider: str) -> str:
    return provider.replace(":", "_").replace("/", "_")


def read_named_status(label: str, status_prefix: str = "status: ") -> int | str | None:
    active = False

    for line in summary_lines:
        if line == f"==> {label}":
            active = True
            continue

        if active and line.startswith(status_prefix):
            raw = line.split(":", 1)[1].strip()
            return int(raw) if raw.isdigit() else raw

    return None


def read_provider_status(provider: str) -> int | None:
    return read_named_status(f"provider {provider}")  # type: ignore[return-value]


def read_provider_verify_status(provider: str) -> int | str | None:
    active = False

    for line in summary_lines:
        if line == f"==> provider {provider}":
            active = True
            continue

        if active and line.startswith("verify-status: "):
            raw = line.split(":", 1)[1].strip()
            return int(raw) if raw.isdigit() else raw

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


typecheck_status = read_named_status("typecheck cli")
build_status = read_named_status("build cli")

provider_results = []

for provider in providers:
    provider_slug = slug(provider)
    workspace = workspaces_dir / provider_slug

    missing_files = [
        relative for relative in required_files if not (workspace / relative).is_file()
    ]

    package_json, package_json_error = load_json(workspace / "package.json")
    provider_json, provider_json_error = load_json(workspace / "db/provider.json")
    provenance_json, provenance_error = load_json(workspace / ".foundry/init/provenance.json")

    provider_json_matches = False
    provider_json_id = None

    if provider_json:
        for key in ["provider", "providerId", "id", "databaseProvider", "databaseProviderId"]:
            value = provider_json.get(key)
            if isinstance(value, str):
                provider_json_id = value
                if value == provider:
                    provider_json_matches = True
                break

    provenance_mentions_provider = False

    if provenance_json:
        serialized = json.dumps(provenance_json)
        provenance_mentions_provider = provider in serialized

    init_status = read_provider_status(provider)
    verify_status = read_provider_verify_status(provider)

    result = {
        "provider": provider,
        "workspace": str(workspace),
        "ok": (
            typecheck_status == 0
            and build_status == 0
            and init_status == 0
            and verify_status == 0
            and workspace.is_dir()
            and not missing_files
            and package_json_error is None
            and provider_json_error is None
            and provenance_error is None
            and provider_json_matches
            and provenance_mentions_provider
        ),
        "initStatus": init_status,
        "verifyStatus": verify_status,
        "workspaceExists": workspace.is_dir(),
        "missingFiles": missing_files,
        "packageJsonValid": package_json_error is None and package_json is not None,
        "packageJsonError": package_json_error,
        "providerJsonValid": provider_json_error is None and provider_json is not None,
        "providerJsonError": provider_json_error,
        "providerJsonId": provider_json_id,
        "providerJsonMatches": provider_json_matches,
        "provenanceValid": provenance_error is None and provenance_json is not None,
        "provenanceError": provenance_error,
        "provenanceMentionsProvider": provenance_mentions_provider,
        "logs": {
            "init": str(artifact_dir / f"provider-{provider_slug}.log"),
            "verify": str(artifact_dir / f"provider-{provider_slug}-verify.log"),
        },
    }

    provider_results.append(result)

report = {
    "ok": (
        typecheck_status == 0
        and build_status == 0
        and all(result["ok"] for result in provider_results)
    ),
    "typecheckStatus": typecheck_status,
    "buildStatus": build_status,
    "providerCount": len(provider_results),
    "providersOk": sum(1 for result in provider_results if result["ok"]),
    "providersFailed": [
        result["provider"] for result in provider_results if not result["ok"]
    ],
    "providerResults": provider_results,
    "notes": [],
}

if typecheck_status != 0:
    report["notes"].append("CLI typecheck failed before provider matrix evaluation.")

if build_status != 0:
    report["notes"].append("CLI build failed before provider matrix evaluation.")

if report["providersFailed"]:
    report["notes"].append("One or more database provider smoke checks failed.")

summary_json.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

print("")
print("Foundry init database provider matrix summary")
print("=============================================")
print("ok:", report["ok"])
print("typecheck:", report["typecheckStatus"])
print("build:", report["buildStatus"])
print("provider count:", report["providerCount"])
print("providers ok:", report["providersOk"])
print("providers failed:", report["providersFailed"])

for note in report["notes"]:
    print("note:", note)

print("")
print("Wrote:")
print("- .artifacts/foundry/init-database-matrix/summary.txt")
print("- .artifacts/foundry/init-database-matrix/summary.json")

if not report["ok"]:
    raise SystemExit(1)
PYTHON_SUMMARY
