#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VENV_DIR="$ROOT_DIR/.artifacts/foundry/tools/copier-venv"

if [[ ! -x "$VENV_DIR/bin/copier" ]]; then
  echo "==> Installing Copier into repo-local tool venv: $VENV_DIR" >&2
  python3 -m venv "$VENV_DIR"
  "$VENV_DIR/bin/python" -m pip install --upgrade pip >/dev/null
  "$VENV_DIR/bin/python" -m pip install copier >/dev/null
fi

exec "$VENV_DIR/bin/copier" "$@"
