#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    Path(path).write_text(content, encoding="utf-8")
    print(f"patched {path}")


def patch_exact_optional_manifest_call(path: str) -> None:
    content = read(path)

    original = """readFoundryManifest({
      workspaceRoot,
      manifestPath: flags.manifest
    })"""

    replacement = """readFoundryManifest({
      workspaceRoot,
      ...(flags.manifest ? { manifestPath: flags.manifest } : {})
    })"""

    if original not in content:
      print(f"skip {path}: target manifest call not found")
      return

    write(path, content.replace(original, replacement))


def patch_docs_engine() -> None:
    path = "packages/cli/src/docs/engine.ts"
    content = read(path)

    original = """const scanResult = scanMarkdownDocuments({
    repoRoot: options.repoRoot,
    docsDir: options.docsDir
  });"""

    replacement = """const scanResult = scanMarkdownDocuments({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {})
  });"""

    if original not in content:
        print(f"skip {path}: target docs engine scan call not found")
        return

    write(path, content.replace(original, replacement))


def patch_cli_tsconfig_bun_types() -> None:
    path = Path("packages/cli/tsconfig.json")

    if not path.exists():
        print("skip packages/cli/tsconfig.json: file not found")
        return

    raw = path.read_text(encoding="utf-8")

    # This script expects standard JSON tsconfig. If you later move to JSONC,
    # adjust this function to preserve comments.
    data = json.loads(raw)

    compiler_options = data.setdefault("compilerOptions", {})
    existing_types = compiler_options.get("types")

    if existing_types is None:
        compiler_options["types"] = ["node", "bun"]
    elif isinstance(existing_types, list):
        if "node" not in existing_types:
            existing_types.append("node")
        if "bun" not in existing_types:
            existing_types.append("bun")
    else:
        raise TypeError("compilerOptions.types must be an array when present")

    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"patched {path.as_posix()}")


def main() -> int:
    patch_exact_optional_manifest_call("packages/cli/src/commands/manifest/index.ts")
    patch_exact_optional_manifest_call("packages/cli/src/commands/manifest/validate.ts")
    patch_docs_engine()
    patch_cli_tsconfig_bun_types()

    print("")
    print("Build error patches applied.")
    print("Next commands:")
    print("  bun run typecheck")
    print("  bun run foundry:build")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
