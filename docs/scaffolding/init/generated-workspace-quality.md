---
title: "Generated Workspace Quality Baseline"
status: "Draft"
owner: "Platform"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "Scaffolding"
upstream:
  - "docs/platform/index.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks:
  - "docs/architecture/adr/0002-monorepo-structure.md"
  - "docs/adr/ADR-0001-monorepo-scaffolding-toolchain.md"
glossaryTerms:
  - "Platform"
  - "Scaffolding"
  - "Generated"
  - "Workspace"
  - "Quality"
  - "Baseline"
---

# Generated Workspace Quality Baseline

`foundry init` emits a workspace that is intended to be immediately inspectable, maintainable, and AI-friendly.

## Quality files

Every generated workspace includes:

```text
.editorconfig
.gitattributes
.gitignore
CONTRIBUTING.md
SECURITY.md
.github/workflows/ci.yml
.github/pull_request_template.md
docs/ai/BOOTSTRAP_PROMPT.md
docs/ai/CURRENT_STATE.md
.foundry/README.md
.foundry/manifest.json
.foundry/init/provenance.json
.foundry/init/audit.ndjson
Verification

Generated workspaces include:

tools/scripts/verify.sh

The generated verification script checks:

expected baseline files exist;
Foundry CLI wrapper works;
provenance JSON is parseable;
audit NDJSON is parseable;
the init audit event exists.

Run it with:

bun run verify
AI continuity

Generated workspaces include docs/ai/BOOTSTRAP_PROMPT.md and docs/ai/CURRENT_STATE.md.

These files help future AI-assisted sessions rehydrate from the repository instead of relying only on chat memory.

Policy

The generated workspace should be safe to commit as an initial baseline.

Generated workspaces should not contain secrets.

Generated workspaces should clearly show:

what created the workspace;
what files were generated;
how to verify the workspace;
how to continue development.
