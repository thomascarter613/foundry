import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import type { InitConfig, InitPlan } from "./types.js";

export interface WriteInitWorkspaceOptions {
  readonly config: InitConfig;
  readonly plan: InitPlan;
  readonly cwd?: string;
}

export interface WriteInitWorkspaceResult {
  readonly destination: string;
  readonly directoriesCreated: number;
  readonly filesWritten: number;
  readonly files: readonly string[];
}

export async function writeInitWorkspace(
  options: WriteInitWorkspaceOptions
): Promise<WriteInitWorkspaceResult> {
  if (options.config.databases.length > 0) {
    throw new Error(
      "Database-enabled workspace writing is not implemented in this slice. Use --dry-run or --no-database."
    );
  }

  const cwd = path.resolve(options.cwd ?? process.cwd());
  const destinationRoot = path.resolve(cwd, options.config.destination);
  const files = createNoDatabaseWorkspaceFiles(options.config);
  const directories = new Set<string>();

  for (const directory of options.plan.directories) {
    directories.add(path.resolve(cwd, directory.path));
  }

  for (const file of files) {
    directories.add(path.dirname(path.resolve(destinationRoot, file.path)));
  }

  for (const directory of [...directories].sort()) {
    await mkdir(directory, { recursive: true });
  }

  const writtenFiles: string[] = [];

  for (const file of files) {
    const absolutePath = path.resolve(destinationRoot, file.path);
    await writeFile(absolutePath, file.content, "utf8");
    writtenFiles.push(path.relative(cwd, absolutePath));
  }

  return {
    destination: path.relative(cwd, destinationRoot),
    directoriesCreated: directories.size,
    filesWritten: writtenFiles.length,
    files: writtenFiles
  };
}

interface RenderedInitFile {
  readonly path: string;
  readonly content: string;
}

function createNoDatabaseWorkspaceFiles(config: InitConfig): RenderedInitFile[] {
  return [
    {
      path: ".gitignore",
      content: renderGitignore()
    },
    {
      path: "README.md",
      content: renderReadme(config)
    },
    {
      path: "package.json",
      content: renderRootPackageJson(config)
    },
    {
      path: "tsconfig.base.json",
      content: renderTsconfigBaseJson()
    },
    {
      path: "turbo.json",
      content: renderTurboJson()
    },
    {
      path: ".github/workflows/ci.yml",
      content: renderCiWorkflow()
    },
    {
      path: "tools/scripts/foundry.sh",
      content: renderFoundryScript()
    },
    {
      path: "tools/scripts/verify.sh",
      content: renderVerifyScript()
    },
    {
      path: "packages/cli/package.json",
      content: renderCliPackageJson(config)
    },
    {
      path: "packages/cli/bin/run.js",
      content: renderCliBin()
    },
    {
      path: "docs/README.md",
      content: renderDocsReadme()
    },
    {
      path: "apps/README.md",
      content: renderWorkspaceReadme("Applications", "User-facing applications generated into this workspace.")
    },
    {
      path: "services/README.md",
      content: renderWorkspaceReadme("Services", "Backend services generated into this workspace.")
    },
    {
      path: "packages/README.md",
      content: renderWorkspaceReadme("Packages", "Reusable packages generated into this workspace.")
    },
    {
      path: "tools/README.md",
      content: renderWorkspaceReadme("Tools", "Repository-local tools and automation scripts.")
    },
    {
      path: "contracts/openapi/README.md",
      content: renderWorkspaceReadme("OpenAPI Contracts", "Canonical OpenAPI contracts for generated clients.")
    },
    {
      path: "generated/README.md",
      content: renderGeneratedReadme()
    },
    {
      path: "generated/clients/README.md",
      content: renderGeneratedClientsReadme()
    },
    {
      path: "config/foundry/generator-manifest.json",
      content: renderGeneratedGeneratorManifest()
    },
    {
      path: ".scaffdog/config.js",
      content: renderScaffdogConfig()
    },
    {
      path: "templates/README.md",
      content: renderWorkspaceReadme("Templates", "Generator template sources for this workspace.")
    }
  ];
}

function renderGitignore(): string {
  return `node_modules/
dist/
.turbo/
.env
.env.local
.artifacts/
.DS_Store
`;
}

function renderReadme(config: InitConfig): string {
  return `# ${config.projectName}

${config.description}

This repository was initialized by Foundry.

## Quick Start

\`\`\`bash
bun install
bun run verify
bun run foundry -- generate --list
\`\`\`

## Workspace Layout

\`\`\`text
apps/
packages/
services/
tools/
docs/
contracts/
generated/
config/
templates/
.scaffdog/
\`\`\`

## Foundry CLI

Run the embedded Foundry CLI from the repository root:

\`\`\`bash
bun run foundry -- generate --list
\`\`\`

## Verification

Run:

\`\`\`bash
bun run verify
\`\`\`

## Database

This workspace was initialized without database support.

Database support can be added later through Foundry provider templates.
`;
}

function renderRootPackageJson(config: InitConfig): string {
  return `${JSON.stringify(
    {
      name: slugifyPackageName(config.projectName),
      version: "0.1.0",
      private: true,
      description: config.description,
      type: "module",
      workspaces: ["apps/*", "packages/*", "services/*", "tools/*"],
      scripts: {
        foundry: "bash tools/scripts/foundry.sh",
        verify: "bash tools/scripts/verify.sh"
      },
      devDependencies: {}
    },
    null,
    2
  )}
`;
}

function renderTsconfigBaseJson(): string {
  return `${JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        lib: ["ES2022"],
        strict: true,
        noImplicitOverride: true,
        noUncheckedIndexedAccess: true,
        exactOptionalPropertyTypes: true,
        skipLibCheck: true
      }
    },
    null,
    2
  )}
`;
}

function renderTurboJson(): string {
  return `${JSON.stringify(
    {
      $schema: "https://turbo.build/schema.json",
      tasks: {
        build: {
          dependsOn: ["^build"],
          outputs: ["dist/**"]
        },
        typecheck: {
          dependsOn: ["^typecheck"]
        },
        test: {
          dependsOn: ["^test"]
        },
        verify: {
          dependsOn: ["build", "typecheck", "test"]
        }
      }
    },
    null,
    2
  )}
`;
}

function renderCiWorkflow(): string {
  return `name: CI

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: Verify repository
    runs-on: ubuntu-latest

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Show tool versions
        run: |
          bun --version
          node --version

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run verification
        run: bun run verify
`;
}

function renderFoundryScript(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")/../.." && pwd)"
CLI_BIN="$ROOT_DIR/packages/cli/bin/run.js"

if [[ ! -f "$CLI_BIN" ]]; then
  echo "Missing Foundry CLI executable: $CLI_BIN" >&2
  exit 1
fi

exec node "$CLI_BIN" "$@"
`;
}

function renderVerifyScript(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "==> Checking generated workspace structure"

required_paths=(
  "package.json"
  "README.md"
  "tools/scripts/foundry.sh"
  "packages/cli/bin/run.js"
  "packages/cli/package.json"
  "docs/README.md"
  "config/foundry/generator-manifest.json"
)

for required_path in "\${required_paths[@]}"; do
  if [[ ! -e "$required_path" ]]; then
    echo "Missing required path: $required_path" >&2
    exit 1
  fi
done

echo "==> Verifying embedded Foundry CLI"
bun run foundry -- generate --list >/dev/null

echo "==> Checking local artifact hygiene"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  tracked_artifacts="$(git ls-files .artifacts || true)"
  if [[ -n "$tracked_artifacts" ]]; then
    echo ".artifacts files must not be tracked:" >&2
    echo "$tracked_artifacts" >&2
    exit 1
  fi
fi

echo "==> Verification complete"
`;
}

function renderCliPackageJson(config: InitConfig): string {
  return `${JSON.stringify(
    {
      name: `${config.packageScope}/foundry-cli`,
      version: "0.1.0",
      private: true,
      type: "module",
      bin: {
        foundry: "./bin/run.js"
      },
      scripts: {
        start: "node ./bin/run.js",
        verify: "node ./bin/run.js generate --list"
      }
    },
    null,
    2
  )}
`;
}

function renderCliBin(): string {
  return `#!/usr/bin/env node

const args = process.argv.slice(2);

const availableGenerators = [
  {
    id: "governance-artifact:adr",
    backend: "scaffdog",
    status: "planned"
  },
  {
    id: "governance-artifact:work-packet",
    backend: "scaffdog",
    status: "planned"
  },
  {
    id: "package:typescript-library",
    backend: "plop",
    status: "planned"
  },
  {
    id: "service:hono-api",
    backend: "copier",
    status: "planned"
  },
  {
    id: "contract-artifact:openapi-typescript-client",
    backend: "orval",
    status: "planned"
  }
];

function printHelp() {
  console.log("Foundry CLI");
  console.log("");
  console.log("Usage:");
  console.log("  foundry generate --list");
  console.log("  foundry --help");
  console.log("");
  console.log("This generated workspace includes a minimal embedded Foundry CLI.");
  console.log("Full generator execution can be added by applying Foundry generator templates.");
}

function printGenerators() {
  console.log("Registered generators:");
  console.log("");

  for (const generator of availableGenerators) {
    console.log(\`- \${generator.id}\`);
    console.log(\`  backend: \${generator.backend}\`);
    console.log(\`  status: \${generator.status}\`);
    console.log("");
  }
}

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const [command, ...commandArgs] = args;

if (command === "generate" && (commandArgs.includes("--list") || commandArgs.includes("-l"))) {
  printGenerators();
  process.exit(0);
}

console.error(\`Unknown command: \${args.join(" ")}\`);
console.error("");
printHelp();
process.exit(1);
`;
}

function renderDocsReadme(): string {
  return `# Documentation

This directory contains project documentation.

Recommended future additions:

- product charter;
- architecture overview;
- ADRs;
- work packets;
- runbooks;
- scaffolding documentation.
`;
}

function renderWorkspaceReadme(title: string, description: string): string {
  return `# ${title}

${description}
`;
}

function renderGeneratedReadme(): string {
  return `# Generated Artifacts

This directory contains generated artifacts that are intentionally kept in the repository.

Generated artifacts are derived from canonical source files such as contracts, schemas, or templates.
`;
}

function renderGeneratedClientsReadme(): string {
  return `# Generated API Clients

Generated API clients should live under this directory.

Generated clients should not be edited manually. Update the source contract and regenerate the client instead.
`;
}

function renderGeneratedGeneratorManifest(): string {
  return `${JSON.stringify(
    {
      manifestVersion: "foundry.generator-manifest.v1",
      generatedBy: "foundry init",
      generators: [
        "governance-artifact:adr",
        "governance-artifact:work-packet",
        "package:typescript-library",
        "service:hono-api",
        "contract-artifact:openapi-typescript-client"
      ]
    },
    null,
    2
  )}
`;
}

function renderScaffdogConfig(): string {
  return `export default {
  files: ["*.md"]
};
`;
}

function slugifyPackageName(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replaceAll(/['"]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

  return slug.length > 0 ? slug : "foundry-app";
}
