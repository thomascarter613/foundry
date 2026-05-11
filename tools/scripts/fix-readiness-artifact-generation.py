#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re


def patch_check_docs_mvp() -> None:
    path = Path("tools/scripts/check-docs-mvp.sh")

    if not path.exists():
        raise SystemExit(f"Missing {path}")

    content = path.read_text(encoding="utf-8")

    old = 'run_step "docs readiness" node packages/cli/bin/run.js docs readiness'
    new = (
        'run_step "docs readiness" node packages/cli/bin/run.js docs readiness '
        '--report-path .artifacts/docs/readiness-report.json'
    )

    if old in content:
        content = content.replace(old, new)
    elif new in content:
        print("check-docs-mvp already writes readiness artifact")
    else:
        print("warning: could not find docs readiness run_step line")

    path.write_text(content, encoding="utf-8")
    print(f"patched {path}")


def patch_package_scripts() -> None:
    path = Path("package.json")

    if not path.exists():
        print("skip package.json: missing")
        return

    import json

    text = path.read_text(encoding="utf-8")
    decoder = json.JSONDecoder()

    try:
        data, _ = decoder.raw_decode(text)
    except json.JSONDecodeError as error:
        print(f"skip package.json: malformed JSON: {error}")
        return

    scripts = data.setdefault("scripts", {})

    scripts["docs:readiness"] = (
        "bun run foundry:build && node packages/cli/bin/run.js docs readiness "
        "--report-path .artifacts/docs/readiness-report.json"
    )

    scripts["docs:readiness:json"] = (
        "bun run foundry:build && node packages/cli/bin/run.js docs readiness "
        "--json --report-path .artifacts/docs/readiness-report.json"
    )

    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"patched {path}")


def main() -> int:
    patch_check_docs_mvp()
    patch_package_scripts()

    print("")
    print("Next:")
    print("  bun run --cwd packages/cli typecheck")
    print("  ( cd packages/cli && bun run build )")
    print("  node packages/cli/bin/run.js docs readiness --report-path .artifacts/docs/readiness-report.json")
    print("  tools/scripts/check-docs-mvp.sh")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
