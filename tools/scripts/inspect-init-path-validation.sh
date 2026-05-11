#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

ARTIFACT_DIR=".artifacts/foundry/init-path-fix"
REPORT="$ARTIFACT_DIR/source-inspection.txt"

mkdir -p "$ARTIFACT_DIR"

{
  echo "# Init Destination Path Validation Inspection"
  echo
  echo "## Known failing invocation"
  echo
  echo 'node packages/cli/bin/run.js init .artifacts/foundry/init-workspace/workspace --yes --no-install --no-database'
  echo
  echo "## Init help"
  echo
  node packages/cli/bin/run.js init --help || true
  echo

  echo "## project-name-path-separator locations"
  grep -R "project-name-path-separator" -n packages/cli/src || true
  echo

  echo "## path separator validation locations"
  grep -R "Project name must not contain path separators" -n packages/cli/src || true
  grep -R "path separators" -n packages/cli/src || true
  echo

  echo "## init command files"
  find packages/cli/src/commands -maxdepth 5 -type f | sort | grep -E 'init|workspace' || true
  echo

  echo "## init implementation files"
  find packages/cli/src/init -maxdepth 8 -type f | sort 2>/dev/null || true
  echo

  echo "## Source context for project-name-path-separator"
  while IFS=: read -r file line rest; do
    [ -n "$file" ] || continue
    echo
    echo "### $file:$line"
    start=$((line - 40))
    end=$((line + 60))
    [ "$start" -lt 1 ] && start=1
    sed -n "${start},${end}p" "$file"
  done < <(grep -R "project-name-path-separator" -n packages/cli/src || true)

  echo
  echo "## Source context for init command files"
  for file in $(find packages/cli/src/commands -maxdepth 5 -type f | sort | grep -E 'init|workspace' || true); do
    echo
    echo "### $file"
    sed -n '1,260p' "$file"
  done
} > "$REPORT"

echo "wrote $REPORT"
