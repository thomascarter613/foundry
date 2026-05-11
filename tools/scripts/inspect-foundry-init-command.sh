#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

ARTIFACT_DIR=".artifacts/foundry/init-command"
mkdir -p "$ARTIFACT_DIR"

{
  echo "# foundry init help"
  echo
  node packages/cli/bin/run.js init --help || true

  echo
  echo "# candidate logs"
  echo

  for file in .artifacts/foundry/init-workspace/candidate-*.log; do
    [ -f "$file" ] || continue
    echo "## $file"
    cat "$file"
    echo
  done

  echo
  echo "# command source files"
  echo
  find packages/cli/src/commands -maxdepth 4 -type f | sort | grep -E 'init|workspace' || true

  echo
  echo "# init source files"
  echo
  find packages/cli/src/init -maxdepth 6 -type f | sort 2>/dev/null || true
} > "$ARTIFACT_DIR/inspection.txt"

echo "wrote $ARTIFACT_DIR/inspection.txt"
