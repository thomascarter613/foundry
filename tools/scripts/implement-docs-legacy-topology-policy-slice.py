#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re


POLICY_DOC = '''---
title: "Legacy Documentation Topology Policy"
status: "Approved"
owner: "Governance"
lastUpdated: "2026-05-11"
governanceLevel: "Binding"
documentType: "Governance"
upstream:
  - "docs/governance/index.md"
downstream:
  - "docs/.ideas"
  - "docs/adr"
  - "docs/product"
  - "docs/scaffolding"
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Governance"
  - "Documentation System"
  - "Policy"
  - "Repository Contract"
---

# Legacy Documentation Topology Policy

## Purpose

Define which legacy documentation directories are temporarily accepted during the transition from bootstrap documentation governance to strict documentation governance.

## Policy

The following directories are accepted transitional documentation topology:

| Directory | Status | Rationale | Future Disposition |
| --- | --- | --- | --- |
| `docs/.ideas` | Accepted Legacy | Idea-capture material remains useful during bootstrap. | Migrate or formalize into planning intake. |
| `docs/adr` | Accepted Legacy | Existing ADRs predate the canonical `docs/architecture/adr` topology. | Migrate, supersede, or explicitly retain as historical ADR ledger. |
| `docs/product` | Accepted Legacy | Product documents predate the canonical planning/product split. | Migrate into `docs/planning` or a canonical product domain. |
| `docs/scaffolding` | Accepted Legacy | Scaffolding material predates the canonical platform/scaffolding boundary. | Migrate into `docs/platform` or formalize as a canonical domain. |

## Enforcement

Accepted legacy directories are not treated as documentation topology errors.

They may still appear as informational findings until migrated or formally retained by a later ADR.

Any unlisted legacy or unexpected docs directory remains subject to directory topology validation.

## Strict Mode

Strict mode may pass with accepted legacy directories only while this policy is active and approved.

Removing or changing this policy requires updating the directory topology validator and the documentation readiness criteria.

## Change History

- Approved accepted legacy directory policy for Documentation System MVP v1 bootstrap completion.
'''


def replace_function(content: str, function_name: str, replacement: str) -> str:
    start = content.find(f"function {function_name}(")

    if start < 0:
        raise SystemExit(f"Could not find function {function_name}")

    brace = content.find("{", start)

    if brace < 0:
        raise SystemExit(f"Could not find function body for {function_name}")

    depth = 0

    for index in range(brace, len(content)):
        char = content[index]

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1

            if depth == 0:
                return content[:start] + replacement + content[index + 1:]

    raise SystemExit(f"Could not locate end of function {function_name}")


def patch_directory_validator() -> None:
    path = Path("packages/cli/src/docs/directory-validator.ts")

    if not path.exists():
        raise SystemExit(f"Missing {path}")

    content = path.read_text(encoding="utf-8")

    if "acceptedLegacyDirectories" not in content:
        marker = '''const allowedLegacyDirectories = new Set(['''

        insertion = '''const acceptedLegacyDirectories = new Set([
  "docs/.ideas",
  "docs/adr",
  "docs/product",
  "docs/scaffolding"
]);

'''

        content = content.replace(marker, insertion + marker)

    replacement = '''function validateLegacyDirectories(options: {
  readonly inventory: DirectoryInventory;
  readonly issues: DocsValidationIssue[];
  readonly strict: boolean;
}): void {
  for (const directory of options.inventory.directories) {
    if (!allowedLegacyDirectories.has(directory)) {
      continue;
    }

    if (acceptedLegacyDirectories.has(directory)) {
      options.issues.push(createIssue({
        severity: "info",
        code: "directory.acceptedLegacyDirectory",
        message: `accepted legacy docs directory is governed by docs/governance/legacy-docs-topology.md: ${directory}`,
        path: directory
      }));
      continue;
    }

    options.issues.push(createIssue({
      severity: options.strict ? "error" : "warning",
      code: "directory.legacyDirectory",
      message: `legacy docs directory is still present and should eventually be migrated: ${directory}`,
      path: directory
    }));
  }
}
'''

    content = replace_function(content, "validateLegacyDirectories", replacement)

    path.write_text(content, encoding="utf-8")
    print(f"patched {path}")


def patch_directory_repair() -> None:
    path = Path("packages/cli/src/docs/directory-repair.ts")

    if not path.exists():
        raise SystemExit(f"Missing {path}")

    content = path.read_text(encoding="utf-8")

    if "acceptedLegacyDirectories" not in content:
        marker = '''const legacyDirectories = new Set(['''

        insertion = '''const acceptedLegacyDirectories = new Set([
  "docs/.ideas",
  "docs/adr",
  "docs/product",
  "docs/scaffolding"
]);

'''

        content = content.replace(marker, insertion + marker)

    old = '''      if (legacyDirectories.has(directory)) {
        actions.push({
          kind: "reportLegacyDirectory",
          path: directory,
          description: `Legacy docs directory should eventually be migrated or explicitly accepted: ${directory}`,
          willWrite: false
        });
      }'''

    new = '''      if (legacyDirectories.has(directory) && !acceptedLegacyDirectories.has(directory)) {
        actions.push({
          kind: "reportLegacyDirectory",
          path: directory,
          description: `Legacy docs directory should eventually be migrated or explicitly accepted: ${directory}`,
          willWrite: false
        });
      }'''

    if old in content:
        content = content.replace(old, new)
    elif "acceptedLegacyDirectories.has(directory)" not in content:
        print("warning: could not patch directory-repair legacy reporting block automatically")

    path.write_text(content, encoding="utf-8")
    print(f"patched {path}")


def write_policy_doc() -> None:
    path = Path("docs/governance/legacy-docs-topology.md")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(POLICY_DOC, encoding="utf-8")
    print(f"wrote {path}")


def main() -> int:
    write_policy_doc()
    patch_directory_validator()
    patch_directory_repair()

    print("")
    print("Next:")
    print("  bun run --cwd packages/cli typecheck")
    print("  cd packages/cli && bun run build && cd ../..")
    print("  node packages/cli/bin/run.js docs directory validate")
    print("  node packages/cli/bin/run.js docs readiness")
    print("  tools/scripts/check-docs-mvp.sh")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
