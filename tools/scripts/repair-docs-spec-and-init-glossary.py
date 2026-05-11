#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re


def replace_literal(path: Path, replacements: dict[str, str]) -> None:
    content = path.read_text(encoding="utf-8")
    original = content

    for old, new in replacements.items():
        content = content.replace(old, new)

    if content != original:
        path.write_text(content, encoding="utf-8")
        print(f"patched {path}")


def patch_types() -> None:
    path = Path("packages/cli/src/docs/types.ts")
    content = path.read_text(encoding="utf-8")

    if '| "Spec";' not in content:
        content = content.replace(
            '| "Idea";',
            '| "Idea"\n  | "Spec";'
        )

    path.write_text(content, encoding="utf-8")
    print(f"patched {path}")


def patch_metadata() -> None:
    path = Path("packages/cli/src/docs/metadata.ts")
    content = path.read_text(encoding="utf-8")

    if '"Spec"' not in content:
        content = content.replace(
            '  "Idea"\n]);',
            '  "Idea",\n  "Spec"\n]);'
        )

    if 'relativePath.startsWith("docs/specs/")' not in content:
        content = content.replace(
            '  if (relativePath.startsWith("docs/standards/")) {\n    return ["Standard"];\n  }\n',
            '  if (relativePath.startsWith("docs/standards/")) {\n    return ["Standard"];\n  }\n\n'
            '  if (relativePath.startsWith("docs/specs/")) {\n'
            '    return ["Spec", "Planning"];\n'
            '  }\n'
        )

    if 'relativePath.startsWith("docs/planning/04-decisions/")' not in content:
        content = content.replace(
            '  if (relativePath.startsWith("docs/planning/")) {\n    return ["Planning"];\n  }\n',
            '  if (relativePath.startsWith("docs/planning/04-decisions/")) {\n'
            '    return ["ADR", "Planning"];\n'
            '  }\n\n'
            '  if (relativePath.startsWith("docs/planning/")) {\n    return ["Planning"];\n  }\n'
        )

    path.write_text(content, encoding="utf-8")
    print(f"patched {path}")


def patch_directory_validator() -> None:
    path = Path("packages/cli/src/docs/directory-validator.ts")
    content = path.read_text(encoding="utf-8")

    if '  "docs/specs",' not in content:
        content = content.replace(
            '  "docs/standards",\n',
            '  "docs/standards",\n  "docs/specs",\n'
        )

    if '  "docs/specs/index.md",' not in content:
        content = content.replace(
            '  "docs/standards/index.md",\n',
            '  "docs/standards/index.md",\n  "docs/specs/index.md",\n'
        )

    path.write_text(content, encoding="utf-8")
    print(f"patched {path}")


def patch_frontmatter_values() -> None:
    targets = [
        Path("docs/planning/04-decisions/ADR-00XX-native-spec-lifecycle-engine.md"),
        Path("docs/specs/features/0001-example/spec.md"),
    ]

    for path in targets:
        if not path.exists():
            print(f"skipped missing {path}")
            continue

        content = path.read_text(encoding="utf-8")
        original = content

        content = re.sub(r'^status:\s*"?active"?\s*$', 'status: "Draft"', content, flags=re.MULTILINE)
        content = re.sub(r'^governanceLevel:\s*"?project"?\s*$', 'governanceLevel: "Required"', content, flags=re.MULTILINE)

        if path.name.startswith("ADR-"):
            content = re.sub(r'^documentType:\s*"?adr"?\s*$', 'documentType: "ADR"', content, flags=re.MULTILINE)
        else:
            content = re.sub(r'^documentType:\s*"?spec"?\s*$', 'documentType: "Spec"', content, flags=re.MULTILINE)

        if content != original:
            path.write_text(content, encoding="utf-8")
            print(f"patched {path}")


def ensure_specs_index() -> None:
    path = Path("docs/specs/index.md")

    if path.exists():
        return

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        '''---
title: "Specification Index"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "Spec"
upstream:
  - "docs/index.md"
downstream:
  - "docs/specs/features/0001-example/spec.md"
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Specification"
  - "Verification"
---

# Specification Index

## Purpose

Provide the governed index for specification documents.

## Specifications

- `docs/specs/features/0001-example/spec.md`

## Change History

- Added governed specification index.
''',
        encoding="utf-8",
    )
    print(f"wrote {path}")


def ensure_glossary_terms() -> None:
    glossary = Path("docs/planning/glossary.md")

    if glossary.exists():
        content = glossary.read_text(encoding="utf-8")

        additions = []

        if "## Audit" not in content:
            additions.append(
                "## Audit\n\nA durable record of actions, decisions, generated artifacts, or state changes used to support accountability, inspection, and reproducibility.\n"
            )

        if "## Provenance" not in content:
            additions.append(
                "## Provenance\n\nMachine-readable information that records how an artifact was produced, by which tool or process, with which inputs, and under which generated context.\n"
            )

        if additions:
            glossary.write_text(content.rstrip() + "\n\n" + "\n\n".join(additions) + "\n", encoding="utf-8")
            print(f"patched {glossary}")

    quickref = Path("docs/onboarding/glossary-quickref.md")

    if quickref.exists():
        content = quickref.read_text(encoding="utf-8")
        additions = []

        if "## Audit" not in content:
            additions.append(
                "## Audit\n\nA concise reference to durable action and decision records used for accountability and verification.\n"
            )

        if "## Provenance" not in content:
            additions.append(
                "## Provenance\n\nA concise reference to metadata describing how generated artifacts were produced.\n"
            )

        if additions:
            quickref.write_text(content.rstrip() + "\n\n" + "\n\n".join(additions) + "\n", encoding="utf-8")
            print(f"patched {quickref}")


def main() -> int:
    patch_types()
    patch_metadata()
    patch_directory_validator()
    patch_frontmatter_values()
    ensure_specs_index()
    ensure_glossary_terms()

    print("")
    print("Next:")
    print("  bun run --cwd packages/cli typecheck")
    print("  ( cd packages/cli && bun run build )")
    print("  node packages/cli/bin/run.js docs verify")
    print("  tools/scripts/check-foundry-init-mvp.sh")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
