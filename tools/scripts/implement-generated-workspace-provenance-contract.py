#!/usr/bin/env python3
from __future__ import annotations

from datetime import date
from pathlib import Path


TODAY = date.today().isoformat()

WORK_PACKET_PATH = Path("docs/work-packets/WP-0007-require-init-provenance-audit-contract.md")
WORK_PACKET_INDEX = Path("docs/work-packets/index.md")
CHECK_SCRIPT_PATH = Path("tools/scripts/check-generated-workspace-contract.sh")


WORK_PACKET = f'''---
title: "WP-0007: Require Init Provenance Audit Contract"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "{TODAY}"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
  - "docs/work-packets/WP-0006-verify-generated-workspace-contract.md"
downstream:
  - "tools/scripts/check-generated-workspace-contract.sh"
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Work Packet"
  - "Repository Contract"
  - "Provenance"
  - "Audit"
  - "Verification"
---

# WP-0007: Require Init Provenance Audit Contract

## Purpose

Promote generated workspace provenance and audit files from optional signals to required Foundry init MVP contract artifacts.

## Context

The init writer is expected to emit provenance and audit files as part of the generated workspace. The generated workspace contract verifier previously treated those files as optional. This Work Packet makes them required and validates their minimum semantic shape.

## Required Provenance Contract

A generated workspace must include:

- `.foundry/init/provenance.json`
- `.foundry/init/audit.ndjson`
- `.foundry/README.md`

## Required Provenance JSON Fields

The generated `.foundry/init/provenance.json` file must include:

- `schemaVersion`
- `generatedBy`
- `generatedAt`
- `workspace`
- `generatedFiles`
- `plan`

The `generatedFiles` field must be a non-empty array.

The `workspace` field must be an object with a non-empty `name`.

## Required Audit Event Fields

The generated `.foundry/init/audit.ndjson` file must contain at least one valid JSON line with:

- `schemaVersion`
- `type`
- `occurredAt`
- `actor`
- `subject`
- `details`

The first event type must be:

    foundry.init.workspace_created

## Verification

Run:

    tools/scripts/check-foundry-init-workspace.sh
    tools/scripts/check-generated-workspace-contract.sh
    cat .artifacts/foundry/generated-workspace-contract/summary.json

## Acceptance Criteria

This Work Packet is accepted when:

1. Init workspace smoke succeeds.
2. Generated workspace contract verification succeeds.
3. Provenance files are required, not optional.
4. `provenance.json` parses as JSON.
5. `audit.ndjson` contains at least one valid audit event.
6. Contract summary reports `"ok": true`.

## Change History

- Promoted init provenance and audit files to required generated workspace contract artifacts.
'''


CHECK_SCRIPT = r'''#!/usr/bin/env bash
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
from typing import Any


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
    ".foundry",
    ".foundry/init",
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
    ".foundry/init/provenance.json",
    ".foundry/init/audit.ndjson",
    ".foundry/README.md",
]

required_scripts = [
    "foundry",
    "verify",
]

required_provenance_fields = [
    "schemaVersion",
    "generatedBy",
    "generatedAt",
    "workspace",
    "generatedFiles",
    "plan",
]

required_audit_event_fields = [
    "schemaVersion",
    "type",
    "occurredAt",
    "actor",
    "subject",
    "details",
]


def exists_dir(relative: str) -> bool:
    return (workspace / relative).is_dir()


def exists_file(relative: str) -> bool:
    return (workspace / relative).is_file()


def load_json_file(relative: str) -> tuple[dict[str, Any] | None, str | None]:
    path = workspace / relative

    if not path.is_file():
        return None, "file is missing"

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        return None, str(error)

    if not isinstance(data, dict):
        return None, "top-level JSON value must be an object"

    return data, None


def load_ndjson(relative: str) -> tuple[list[dict[str, Any]], list[str]]:
    path = workspace / relative
    events: list[dict[str, Any]] = []
    errors: list[str] = []

    if not path.is_file():
        return events, ["file is missing"]

    for index, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        stripped = line.strip()

        if not stripped:
            continue

        try:
            event = json.loads(stripped)
        except json.JSONDecodeError as error:
            errors.append(f"line {index}: {error}")
            continue

        if not isinstance(event, dict):
            errors.append(f"line {index}: event must be a JSON object")
            continue

        events.append(event)

    if not events and not errors:
        errors.append("audit log must contain at least one JSON event")

    return events, errors


def missing_keys(record: dict[str, Any] | None, keys: list[str]) -> list[str]:
    if record is None:
        return keys

    return [key for key in keys if key not in record]


missing_directories = [
    directory for directory in required_directories if not exists_dir(directory)
]

missing_files = [
    file for file in required_files if not exists_file(file)
]

package_json_path = workspace / "package.json"
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

provenance, provenance_error = load_json_file(".foundry/init/provenance.json")
missing_provenance_fields = missing_keys(provenance, required_provenance_fields)

generated_files_valid = False
generated_files_count = 0

if provenance and isinstance(provenance.get("generatedFiles"), list):
    generated_files_count = len(provenance["generatedFiles"])
    generated_files_valid = generated_files_count > 0

workspace_object_valid = False
workspace_name = None

if provenance and isinstance(provenance.get("workspace"), dict):
    workspace_name_value = provenance["workspace"].get("name")
    if isinstance(workspace_name_value, str):
        workspace_name = workspace_name_value
        workspace_object_valid = len(workspace_name_value.strip()) > 0

generated_by_valid = False

if provenance and isinstance(provenance.get("generatedBy"), dict):
    generated_by = provenance["generatedBy"]
    tool = generated_by.get("tool")
    command = generated_by.get("command")
    generated_by_valid = isinstance(tool, str) and len(tool.strip()) > 0 and isinstance(command, str) and len(command.strip()) > 0

audit_events, audit_errors = load_ndjson(".foundry/init/audit.ndjson")
first_audit_event = audit_events[0] if audit_events else None
missing_audit_fields = missing_keys(first_audit_event, required_audit_event_fields)

audit_type_valid = (
    first_audit_event is not None
    and first_audit_event.get("type") == "foundry.init.workspace_created"
)

workspace_files = []
if workspace.is_dir():
    workspace_files = sorted(
        str(path.relative_to(workspace))
        for path in workspace.rglob("*")
        if path.is_file()
    )

report = {
    "ok": (
        workspace.is_dir()
        and not missing_directories
        and not missing_files
        and package_json_error is None
        and not missing_scripts
        and provenance_error is None
        and not missing_provenance_fields
        and generated_files_valid
        and workspace_object_valid
        and generated_by_valid
        and not audit_errors
        and len(audit_events) > 0
        and not missing_audit_fields
        and audit_type_valid
    ),
    "workspace": str(workspace),
    "workspaceExists": workspace.is_dir(),
    "workspaceFileCount": len(workspace_files),
    "missingDirectories": missing_directories,
    "missingFiles": missing_files,
    "packageJsonValid": package_json_error is None and package_json_path.is_file(),
    "packageJsonError": package_json_error,
    "missingScripts": missing_scripts,
    "provenance": {
        "path": ".foundry/init/provenance.json",
        "validJson": provenance_error is None and provenance is not None,
        "error": provenance_error,
        "missingFields": missing_provenance_fields,
        "generatedFilesCount": generated_files_count,
        "generatedFilesValid": generated_files_valid,
        "workspaceObjectValid": workspace_object_valid,
        "workspaceName": workspace_name,
        "generatedByValid": generated_by_valid,
    },
    "audit": {
        "path": ".foundry/init/audit.ndjson",
        "eventCount": len(audit_events),
        "errors": audit_errors,
        "missingFirstEventFields": missing_audit_fields,
        "firstEventTypeValid": audit_type_valid,
        "firstEventType": first_audit_event.get("type") if first_audit_event else None,
    },
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

if provenance_error or missing_provenance_fields or not generated_files_valid or not workspace_object_valid or not generated_by_valid:
    report["notes"].append(
        "Generated provenance.json is missing or does not satisfy the required provenance contract."
    )

if audit_errors or missing_audit_fields or not audit_type_valid:
    report["notes"].append(
        "Generated audit.ndjson is missing or does not satisfy the required audit event contract."
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
print("provenance:", report["provenance"])
print("audit:", report["audit"])

for note in report["notes"]:
    print("note:", note)

print("")
print("Wrote:")
print("- .artifacts/foundry/generated-workspace-contract/summary.json")
print("- .artifacts/foundry/generated-workspace-contract/summary.txt")

if not report["ok"]:
    raise SystemExit(1)
PYTHON_SUMMARY
'''


def write(path: Path, content: str, executable: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")

    if executable:
        path.chmod(0o755)

    print(f"wrote {path}")


def update_work_packet_index() -> None:
    if not WORK_PACKET_INDEX.exists():
        print(f"skipped missing {WORK_PACKET_INDEX}")
        return

    row = "| WP-0007 | Require Init Provenance Audit Contract | Draft | `docs/work-packets/WP-0007-require-init-provenance-audit-contract.md` |"
    content = WORK_PACKET_INDEX.read_text(encoding="utf-8")

    if row in content:
        print(f"{WORK_PACKET_INDEX} already contains WP-0007")
        return

    marker = "| --- | --- | --- | --- |"

    if marker in content:
        content = content.replace(marker, marker + "\n" + row)
    else:
        content += "\n" + row + "\n"

    WORK_PACKET_INDEX.write_text(content, encoding="utf-8")
    print(f"updated {WORK_PACKET_INDEX}")


def main() -> int:
    write(WORK_PACKET_PATH, WORK_PACKET)
    write(CHECK_SCRIPT_PATH, CHECK_SCRIPT, executable=True)
    update_work_packet_index()

    print("")
    print("Next:")
    print("  python3 tools/scripts/implement-generated-workspace-provenance-contract.py")
    print("  tools/scripts/check-foundry-init-workspace.sh")
    print("  tools/scripts/check-generated-workspace-contract.sh")
    print("  cat .artifacts/foundry/generated-workspace-contract/summary.json")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
