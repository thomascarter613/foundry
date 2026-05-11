#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

INIT_ARTIFACT_DIR=".artifacts/foundry/init-workspace"
WORKSPACE_DIR="$INIT_ARTIFACT_DIR/workspace"

ARTIFACT_DIR=".artifacts/foundry/generated-workspace-contract"
SUMMARY_JSON="$ARTIFACT_DIR/summary.json"
SUMMARY_TXT="$ARTIFACT_DIR/summary.txt"

mkdir -p "$ARTIFACT_DIR"
: > "$SUMMARY_TXT"

record() {
  printf '%s\n' "$1" | tee -a "$SUMMARY_TXT"
}

record "Generated workspace contract verification"
record "repo root: $ROOT"
record "workspace dir: $WORKSPACE_DIR"

if [ ! -d "$WORKSPACE_DIR" ]; then
  record "workspace missing: $WORKSPACE_DIR"
fi

python3 - <<'PYTHON_SUMMARY'
from __future__ import annotations

import json
from pathlib import Path

workspace = Path(".artifacts/foundry/init-workspace/workspace")
artifact_dir = Path(".artifacts/foundry/generated-workspace-contract")

required_directories = [
    "apps",
    "services",
    "packages",
    "docs",
    "tools/scripts",
    "contracts/openapi",
    "generated/clients",
    "config/foundry",
    "templates",
]

required_files = [
    "package.json",
    "bunfig.toml",
    "README.md",
    ".gitignore",
    "tsconfig.base.json",
    "turbo.json",
    ".github/workflows/ci.yml",
    "tools/scripts/foundry.sh",
    "tools/scripts/verify.sh",
    "packages/cli/src/index.ts",
    "config/foundry/generator-manifest.json",
    ".scaffdog/config.js",
]

required_scripts = [
    "foundry",
    "verify",
]

optional_provenance_files = [
    ".foundry/init/provenance.json",
    ".foundry/init/audit.ndjson",
]

def exists_dir(relative: str) -> bool:
    return (workspace / relative).is_dir()

def exists_file(relative: str) -> bool:
    return (workspace / relative).is_file()

missing_directories = [
    directory for directory in required_directories if not exists_dir(directory)
]

missing_files = [
    file for file in required_files if not exists_file(file)
]

package_json_path = workspace / "package.json"
package_json = None
package_json_error = None
missing_scripts = list(required_scripts)

if package_json_path.is_file():
    try:
        package_json = json.loads(package_json_path.read_text(encoding="utf-8"))
        scripts = package_json.get("scripts", {})
        if isinstance(scripts, dict):
            missing_scripts = [
                script for script in required_scripts if script not in scripts
            ]
    except json.JSONDecodeError as error:
        package_json_error = str(error)

workspace_files = []
if workspace.is_dir():
    workspace_files = sorted(
        str(path.relative_to(workspace))
        for path in workspace.rglob("*")
        if path.is_file()
    )

optional_provenance = {
    file: exists_file(file) for file in optional_provenance_files
}

report = {
    "ok": (
        workspace.is_dir()
        and not missing_directories
        and not missing_files
        and package_json_error is None
        and not missing_scripts
    ),
    "workspace": str(workspace),
    "workspaceExists": workspace.is_dir(),
    "workspaceFileCount": len(workspace_files),
    "missingDirectories": missing_directories,
    "missingFiles": missing_files,
    "packageJsonValid": package_json_error is None and package_json_path.is_file(),
    "packageJsonError": package_json_error,
    "missingScripts": missing_scripts,
    "optionalProvenance": optional_provenance,
    "workspaceFiles": workspace_files[:300],
    "notes": [],
}

if not workspace.is_dir():
    report["notes"].append(
        "Generated workspace is missing. Run tools/scripts/check-foundry-init-workspace.sh first."
    )

if missing_directories:
    report["notes"].append(
        "Generated workspace is missing required MVP directories."
    )

if missing_files:
    report["notes"].append(
        "Generated workspace is missing required MVP files."
    )

if missing_scripts:
    report["notes"].append(
        "Generated package.json is missing required MVP scripts."
    )

if not all(optional_provenance.values()):
    report["notes"].append(
        "Optional provenance/audit anchors are not fully present yet. This should become required in a later init provenance slice."
    )

(artifact_dir / "summary.json").write_text(
    json.dumps(report, indent=2) + "\n",
    encoding="utf-8",
)

print("")
print("Generated workspace contract summary")
print("====================================")
print("ok:", report["ok"])
print("workspace exists:", report["workspaceExists"])
print("workspace file count:", report["workspaceFileCount"])
print("missing directories:", report["missingDirectories"])
print("missing files:", report["missingFiles"])
print("missing scripts:", report["missingScripts"])
print("optional provenance:", report["optionalProvenance"])

for note in report["notes"]:
    print("note:", note)

print("")
print("Wrote:")
print("- .artifacts/foundry/generated-workspace-contract/summary.json")
print("- .artifacts/foundry/generated-workspace-contract/summary.txt")

if not report["ok"]:
    raise SystemExit(1)
PYTHON_SUMMARY
