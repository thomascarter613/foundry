---
title: "v1 MVP Acceptance Checklist"
status: "Approved"
owner: "Project Maintainer"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "Platform"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

# v1 MVP Acceptance Checklist

## Purpose

This document defines the acceptance criteria for the v1 MVP of the Foundry scaffolding system.

The v1 MVP is considered complete only when the local repository-embedded CLI can safely preview, validate, audit, execute, verify, and document the core scaffold workflows needed by the monorepo.

## MVP Scope

The v1 MVP covers the repository-local scaffolding system, not the entire product.

The scope includes:

1. the Foundry CLI command surface;
2. generator registry and planning;
3. input validation;
4. collision preflight;
5. audit event generation;
6. explicit audit-log persistence;
7. Scaffdog document generation;
8. Plop TypeScript package generation;
9. Copier Hono service generation;
10. Orval OpenAPI TypeScript client generation;
11. generated-artifact hygiene;
12. OpenAPI contract verification;
13. generator smoke tests;
14. CI verification;
15. user-facing CLI documentation.

## MVP Non-Scope

The v1 MVP does not include:

1. Backstage Scaffolder integration;
2. GUI or TUI generator interface;
3. remote template registry;
4. automatic pull request creation;
5. automatic GitHub issue creation;
6. template update automation;
7. Nx generator support;
8. OpenAPI Generator multi-language SDK generation;
9. SolidStart app generation;
10. advanced policy-as-code enforcement;
11. release publishing to npm;
12. generated artifact signing;
13. multi-user approval workflows.

## Required Commands

The following commands must exist and pass.

### Full repository verification

```bash
bun run verify
````

### Contract verification

```bash
bun run verify:contracts
```

### Generated artifact verification

```bash
bun run verify:generated
```

### Generator smoke verification

```bash
bun run verify:generators
```

### CLI verification

```bash
cd packages/cli
bun run typecheck
bun run build
cd ../..
```

## Required CLI Behaviors

### Registry listing

The CLI must list available generators.

```bash
cd packages/cli
node ./bin/run.js generate --list
cd ../..
```

Required generator IDs:

```text
governance-artifact:adr
governance-artifact:work-packet
package:typescript-library
service:hono-api
contract-artifact:openapi-typescript-client
```

### Preview mode

Preview mode must be the default.

Example:

```bash
cd packages/cli
node ./bin/run.js generate \
  --generator package:typescript-library \
  --name "logger"
cd ../..
```

Acceptance criteria:

* [ ] command succeeds;
* [ ] command prints planned operations;
* [ ] command reports dry-run mode;
* [ ] command writes no scaffolded project files.

### Execute mode

Execution must require:

```text
--execute
```

Example:

```bash
cd packages/cli
node ./bin/run.js generate \
  --generator package:typescript-library \
  --name "logger" \
  --execute
cd ../..
```

Acceptance criteria:

* [ ] command validates inputs;
* [ ] command runs collision preflight;
* [ ] command invokes the selected backend;
* [ ] command reports backend execution result;
* [ ] command prints recommended verification commands.

### Audit event preview

The CLI must print structured audit events.

Example:

```bash
cd packages/cli
node ./bin/run.js generate \
  --generator package:typescript-library \
  --name "logger" \
  --audit-event
cd ../..
```

Acceptance criteria:

* [ ] event includes `schemaVersion`;
* [ ] event includes `eventId`;
* [ ] event includes `eventType`;
* [ ] event includes `result`;
* [ ] event includes generator metadata;
* [ ] event includes planned operations;
* [ ] event redacts sensitive input keys.

### Audit log writing

Audit-log persistence must require:

```text
--write-audit-log
```

Example:

```bash
cd packages/cli
node ./bin/run.js generate \
  --generator package:typescript-library \
  --name "logger" \
  --execute \
  --write-audit-log
cd ../..
```

Acceptance criteria:

* [ ] audit log is written under `.artifacts/foundry/audit/`;
* [ ] `.artifacts/` is ignored by Git;
* [ ] `.artifacts/` is not tracked;
* [ ] audit logs are not committed by default.

## Required Generator Backends

### Scaffdog

Required generators:

```text
governance-artifact:adr
governance-artifact:work-packet
```

Acceptance criteria:

* [ ] ADR generation works;
* [ ] work-packet generation works;
* [ ] generated documents include YAML frontmatter;
* [ ] generated documents land under the expected `docs/` paths;
* [ ] Scaffdog project path resolves to `.scaffdog`;
* [ ] Scaffdog output path resolves from the repository root.

### Plop

Required generator:

```text
package:typescript-library
```

Acceptance criteria:

* [ ] package generation works;
* [ ] generated package includes `package.json`;
* [ ] generated package includes `tsconfig.json`;
* [ ] generated package includes `README.md`;
* [ ] generated package includes `src/index.ts`;
* [ ] generated package includes `src/index.test.ts`;
* [ ] generated package passes `bun run typecheck`;
* [ ] generated package passes `bun run test`;
* [ ] generated package passes `bun run build`.

### Copier

Required generator:

```text
service:hono-api
```

Acceptance criteria:

* [ ] service generation works;
* [ ] generated service includes `package.json`;
* [ ] generated service includes `tsconfig.json`;
* [ ] generated service includes `README.md`;
* [ ] generated service includes `src/index.ts`;
* [ ] generated service includes `src/index.test.ts`;
* [ ] generated service uses Hono;
* [ ] generated service passes `bun run typecheck`;
* [ ] generated service passes `bun run test`;
* [ ] generated service passes `bun run build`;
* [ ] `services/*` is included in root workspaces.

### Orval

Required generator:

```text
contract-artifact:openapi-typescript-client
```

Acceptance criteria:

* [ ] OpenAPI client generation works;
* [ ] generated client lands under `generated/clients/<name>`;
* [ ] generated client includes `index.ts`;
* [ ] generated client includes `model/`;
* [ ] generated client is derived from `contracts/openapi/gov-api.yaml`;
* [ ] temporary Orval config is written under `.artifacts/foundry/orval/`;
* [ ] Orval config uses resolvable paths;
* [ ] generated client output is committed intentionally when useful.

## Required Repository Files

The following files must exist.

### CLI and generation implementation

```text
packages/cli/package.json
packages/cli/tsconfig.json
packages/cli/bin/run.js
packages/cli/src/commands/generate/index.ts
packages/cli/src/generation/audit.ts
packages/cli/src/generation/audit-log-writer.ts
packages/cli/src/generation/copier-runner.ts
packages/cli/src/generation/orval-runner.ts
packages/cli/src/generation/planner.ts
packages/cli/src/generation/plop-runner.ts
packages/cli/src/generation/preflight.ts
packages/cli/src/generation/registry.ts
packages/cli/src/generation/scaffdog-runner.ts
packages/cli/src/generation/types.ts
packages/cli/src/generation/validation.ts
```

### Templates

```text
.scaffdog/config.js
.scaffdog/adr.md
.scaffdog/work-packet.md
plopfile.mjs
templates/plop/package/typescript-library/package.json.hbs
templates/plop/package/typescript-library/tsconfig.json.hbs
templates/plop/package/typescript-library/README.md.hbs
templates/plop/package/typescript-library/src/index.ts.hbs
templates/plop/package/typescript-library/src/index.test.ts.hbs
templates/copier/service-hono-api/copier.yml
templates/copier/service-hono-api/package.json.jinja
templates/copier/service-hono-api/tsconfig.json.jinja
templates/copier/service-hono-api/README.md.jinja
templates/copier/service-hono-api/src/index.ts.jinja
templates/copier/service-hono-api/src/index.test.ts.jinja
```

### Contracts and generated artifacts

```text
contracts/openapi/gov-api.yaml
generated/README.md
generated/clients/README.md
```

If the generated Gov API client is intentionally committed:

```text
generated/clients/gov-api-client/index.ts
generated/clients/gov-api-client/model/
```

### Verification scripts

```text
tools/scripts/copier.sh
tools/scripts/verify.sh
tools/scripts/verify-contracts.sh
tools/scripts/verify-generated.sh
tools/scripts/verify-generators.sh
```

### CI

```text
.github/workflows/ci.yml
```

### Documentation

```text
docs/adr/ADR-0001-monorepo-scaffolding-toolchain.md
docs/scaffolding/scaffolding-strategy.md
docs/scaffolding/generator-taxonomy.md
docs/scaffolding/generated-artifact-hygiene.md
docs/scaffolding/contract-verification.md
docs/scaffolding/generator-smoke-tests.md
docs/scaffolding/ci-verification.md
docs/scaffolding/cli/foundry-cli-usage.md
docs/scaffolding/releases/v1-mvp-acceptance-checklist.md
packages/cli/README.md
```

## Required Safety Behaviors

The following safety behaviors are required for v1 MVP.

* [ ] preview is the default behavior;
* [ ] file writes require `--execute`;
* [ ] audit logs require `--write-audit-log`;
* [ ] invalid inputs block execution;
* [ ] unsafe paths block execution;
* [ ] existing output paths block execution;
* [ ] backend failures are reported clearly;
* [ ] blocked executions can produce audit events;
* [ ] successful executions can produce audit events;
* [ ] local `.artifacts/` state is not tracked;
* [ ] generated clients are documented as derived artifacts.

## Required Verification Coverage

The root verification command must check:

* [ ] Git whitespace with `git diff --check`;
* [ ] CLI typecheck;
* [ ] CLI build;
* [ ] workspace package typecheck/test/build when scripts exist;
* [ ] workspace service typecheck/test/build when scripts exist;
* [ ] OpenAPI contract verification;
* [ ] generated artifact hygiene;
* [ ] generator smoke tests.

## Final v1 MVP Verification Procedure

Run from repository root:

```bash
bun install
bun run verify
git status --short
git ls-files .artifacts
```

Acceptance criteria:

* [ ] `bun install` succeeds;
* [ ] `bun run verify` succeeds;
* [ ] `git status --short` contains only intentional changes before final commit;
* [ ] `git ls-files .artifacts` prints nothing;
* [ ] no disposable smoke-test packages remain;
* [ ] no disposable smoke-test services remain;
* [ ] no disposable smoke-test clients remain;
* [ ] no disposable smoke-test ADRs remain.

## Disposable Artifact Cleanup

Before declaring v1 MVP complete, run:

```bash
rm -rf packages/smoke-*
rm -rf services/smoke-*
rm -rf generated/clients/smoke-*
rm -f docs/adr/ADR-9*-smoke*.md
rm -rf data
```

Then verify:

```bash
find packages -maxdepth 1 -type d -name 'smoke-*' -print
find services -maxdepth 1 -type d -name 'smoke-*' -print
find generated/clients -maxdepth 1 -type d -name 'smoke-*' -print
find docs/adr -maxdepth 1 -type f -name 'ADR-9*-smoke*.md' -print
```

Expected output: nothing.

## MVP Declaration

The v1 MVP may be declared complete when:

* [ ] all required files exist;
* [ ] all required generators are available;
* [ ] all required safety behaviors work;
* [ ] `bun run verify` passes;
* [ ] CI is configured to run `bun run verify`;
* [ ] disposable artifacts are cleaned up;
* [ ] `.artifacts/` is ignored and untracked;
* [ ] documentation explains how to use the CLI;
* [ ] this checklist has been reviewed.

## Final v1 MVP Commit

Recommended final checkpoint commit:

```bash
git commit -m "chore(release): mark scaffolding v1 mvp complete"
```

## Post-v1 Backlog

The following items are deferred until after v1 MVP:

1. SolidStart app generator;
2. OpenAPI Generator multi-language SDK generation;
3. Backstage Scaffolder integration;
4. template update automation;
5. remote template registry;
6. automatic PR creation;
7. automatic GitHub issue creation;
8. richer policy-as-code verification;
9. generated artifact signing;
10. release packaging for the CLI;
11. migration/update commands for generated templates;
12. interactive prompt mode refinement;
13. root-level `foundry` binary convenience improvements.
