#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "==> Verifying generator manifest"

python3 <<'PY'
import json
import pathlib
import subprocess
import sys

root = pathlib.Path.cwd()
manifest_path = root / "config/foundry/generator-manifest.json"

if not manifest_path.exists():
    print("Missing generator manifest: config/foundry/generator-manifest.json", file=sys.stderr)
    sys.exit(1)

try:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
except json.JSONDecodeError as error:
    print(f"Generator manifest is invalid JSON: {error}", file=sys.stderr)
    sys.exit(1)

required_top_level = [
    "manifestVersion",
    "updated",
    "owner",
    "classification",
    "description",
    "rules",
    "generators",
]

missing_top_level = [key for key in required_top_level if key not in manifest]
if missing_top_level:
    print(f"Generator manifest is missing top-level keys: {', '.join(missing_top_level)}", file=sys.stderr)
    sys.exit(1)

if manifest["manifestVersion"] != "foundry.generator-manifest.v1":
    print(f"Unexpected manifestVersion: {manifest['manifestVersion']}", file=sys.stderr)
    sys.exit(1)

generators = manifest["generators"]
if not isinstance(generators, list) or not generators:
    print("Generator manifest must contain a non-empty generators list", file=sys.stderr)
    sys.exit(1)

required_generator_keys = [
    "id",
    "status",
    "category",
    "backend",
    "description",
    "sourcePaths",
    "outputPathPatterns",
    "canonicalInputs",
    "derivedArtifacts",
    "verificationCommands",
    "provenance",
]

available_generator_ids = []
seen_ids = set()

for generator in generators:
    if not isinstance(generator, dict):
        print("Each generator entry must be an object", file=sys.stderr)
        sys.exit(1)

    generator_id = generator.get("id", "<missing-id>")

    if generator_id in seen_ids:
        print(f"Duplicate generator id in manifest: {generator_id}", file=sys.stderr)
        sys.exit(1)

    seen_ids.add(generator_id)

    missing_generator_keys = [
        key for key in required_generator_keys if key not in generator
    ]

    if missing_generator_keys:
        print(
            f"Generator {generator_id} is missing keys: {', '.join(missing_generator_keys)}",
            file=sys.stderr,
        )
        sys.exit(1)

    if generator["status"] not in {"available", "planned", "deferred"}:
        print(
            f"Generator {generator_id} has invalid status: {generator['status']}",
            file=sys.stderr,
        )
        sys.exit(1)

    if generator["status"] == "available":
        available_generator_ids.append(generator_id)

    list_fields = [
        "sourcePaths",
        "outputPathPatterns",
        "canonicalInputs",
        "derivedArtifacts",
        "verificationCommands",
    ]

    for field in list_fields:
        if not isinstance(generator[field], list) or not generator[field]:
            print(
                f"Generator {generator_id} field {field} must be a non-empty list",
                file=sys.stderr,
            )
            sys.exit(1)

    provenance = generator["provenance"]
    if not isinstance(provenance, dict):
        print(f"Generator {generator_id} provenance must be an object", file=sys.stderr)
        sys.exit(1)

    for provenance_key in [
        "sourceOfTruth",
        "generatedOutputIsEditable",
        "generatedOutputRequiresReview",
        "localStatePaths",
    ]:
        if provenance_key not in provenance:
            print(
                f"Generator {generator_id} provenance is missing {provenance_key}",
                file=sys.stderr,
            )
            sys.exit(1)

    for source_path in generator["sourcePaths"]:
        source_path_value = str(source_path)

        if source_path_value == "not-yet-implemented":
            continue

        candidate = root / source_path_value

        if not candidate.exists():
            print(
                f"Generator {generator_id} references missing source path: {source_path_value}",
                file=sys.stderr,
            )
            sys.exit(1)

if not available_generator_ids:
    print("Manifest has no available generators", file=sys.stderr)
    sys.exit(1)

cli_result = subprocess.run(
    ["node", "packages/cli/bin/run.js", "generate", "--list"],
    cwd=root,
    check=False,
    text=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
)

if cli_result.returncode != 0:
    print("Could not list generators from Foundry CLI", file=sys.stderr)
    print(cli_result.stdout, file=sys.stderr)
    sys.exit(cli_result.returncode)

cli_output = cli_result.stdout

for generator_id in available_generator_ids:
    if generator_id not in cli_output:
        print(
            f"Available generator {generator_id} is in manifest but not listed by CLI",
            file=sys.stderr,
        )
        sys.exit(1)

tracked_artifacts_result = subprocess.run(
    ["git", "ls-files", ".artifacts"],
    cwd=root,
    check=False,
    text=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
)

if tracked_artifacts_result.stdout.strip():
    print(".artifacts files must not be tracked:", file=sys.stderr)
    print(tracked_artifacts_result.stdout, file=sys.stderr)
    sys.exit(1)

print("Generator manifest verified")
PY
