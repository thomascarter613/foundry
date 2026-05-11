#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


WORKFLOW = r'''name: Documentation Verification

on:
  push:
    branches:
      - main
  pull_request:

permissions:
  contents: read

jobs:
  docs-verification:
    name: Docs verification
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Typecheck CLI
        run: bun run --cwd packages/cli typecheck

      - name: Build CLI
        run: |
          cd packages/cli
          bun run build

      - name: Run docs verification pipeline
        run: node packages/cli/bin/run.js docs verify

      - name: Generate docs readiness report
        run: |
          mkdir -p .artifacts/docs
          node packages/cli/bin/run.js docs readiness \
            --report-path .artifacts/docs/readiness-report.json

      - name: Run docs MVP stabilization check
        run: tools/scripts/check-docs-mvp.sh

      - name: Print MVP stabilization summary
        if: always()
        run: |
          if [ -f .artifacts/docs/mvp-stabilization-summary.json ]; then
            cat .artifacts/docs/mvp-stabilization-summary.json
          fi

      - name: Upload docs verification artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: docs-verification-artifacts
          path: .artifacts/docs
          if-no-files-found: warn
'''


README = r'''# Documentation Verification CI

This workflow verifies the governed documentation system on pushes and pull requests.

## Required Gates

The CI job fails when any of the following fail:

- CLI typecheck
- CLI build
- documentation verification pipeline
- documentation MVP stabilization check

## Strict Readiness

Strict readiness is reported but does not block the MVP bootstrap gate.

The readiness report distinguishes:

- bootstrap completion
- strict-mode readiness

Bootstrap completion is required for this workflow. Strict readiness remains a follow-up governance milestone until the remaining strict-mode action plan is complete.

## Artifacts

The workflow uploads `.artifacts/docs` as `docs-verification-artifacts`.

Expected reports include:

- `directory-validation-report.json`
- `validation-report.json`
- `graph.json`
- `graph-validation-report.json`
- `adr-validation-report.json`
- `glossary-validation-report.json`
- `changeplan-validation-report.json`
- `work-packet-validation-report.json`
- `verification-pipeline-report.json`
- `readiness-report.json`
- `mvp-stabilization-summary.json`
- `mvp-stabilization-summary.txt`
'''


def main() -> int:
    workflow_path = Path(".github/workflows/docs-verification.yml")
    workflow_path.parent.mkdir(parents=True, exist_ok=True)
    workflow_path.write_text(WORKFLOW, encoding="utf-8")
    print(f"wrote {workflow_path}")

    docs_path = Path("docs/standards/documentation-verification-ci.md")
    docs_path.parent.mkdir(parents=True, exist_ok=True)
    docs_path.write_text(
        '''---
title: "Documentation Verification CI"
status: "Approved"
owner: "Engineering Productivity"
lastUpdated: "2026-05-11"
governanceLevel: "Required"
documentType: "Standard"
upstream:
  - "docs/standards/index.md"
downstream:
  - ".github/workflows/docs-verification.yml"
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "CI"
  - "Documentation System"
  - "Verification"
  - "Validation"
---

''' + README,
        encoding="utf-8",
    )
    print(f"wrote {docs_path}")

    print("")
    print("Next:")
    print("  bun run --cwd packages/cli typecheck")
    print("  ( cd packages/cli && bun run build )")
    print("  node packages/cli/bin/run.js docs verify")
    print("  node packages/cli/bin/run.js docs readiness --report-path .artifacts/docs/readiness-report.json")
    print("  tools/scripts/check-docs-mvp.sh")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
