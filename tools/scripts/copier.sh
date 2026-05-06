#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VENV_DIR="$ROOT_DIR/.artifacts/foundry/tools/copier-venv"
COPIER_BIN="$VENV_DIR/bin/copier"
PYTHON_BIN="$VENV_DIR/bin/python"

ensure_copier() {
  if [[ -x "$COPIER_BIN" ]] && "$COPIER_BIN" --version >/dev/null 2>&1; then
    return 0
  fi

  echo "Copier executable is missing or broken; rebuilding Copier virtualenv..." >&2

  rm -rf "$VENV_DIR"
  mkdir -p "$(dirname "$VENV_DIR")"

  python3 -m venv "$VENV_DIR"
  "$PYTHON_BIN" -m pip install --upgrade pip >/dev/null
  "$PYTHON_BIN" -m pip install "copier" >/dev/null

  if [[ ! -x "$COPIER_BIN" ]]; then
    echo "Failed to install Copier executable at $COPIER_BIN" >&2
    exit 1
  fi
}

ensure_copier

exec "$COPIER_BIN" "$@"
