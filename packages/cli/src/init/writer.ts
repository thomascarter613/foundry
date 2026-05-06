import { chmod, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildDatabaseTemplateFiles,
  getDatabasePackageAdditions,
  normalizeDatabaseTemplateProviderId,
  type DatabaseTemplateProviderId
} from "./database/templates.js";

export interface WriteInitWorkspaceInput {
  readonly config: unknown;
  readonly installDependencies?: boolean;
  readonly plan?: unknown;
}

export interface WrittenInitFile {
  readonly path: string;
  readonly description: string;
}

export interface WriteInitWorkspaceResult {
  readonly destination: string;
  readonly directoriesCreated: number;
  readonly filesWritten: number;
  readonly files: readonly WrittenInitFile[];
}

interface WorkspaceFile {
  readonly relativePath: string;
  readonly description: string;
  readonly contents: string;
  readonly executable?: boolean;
}

interface NormalizedInitWriterConfig {
  readonly destination: string;
  readonly workspaceName: string;
  readonly includeDatabase: boolean;
  readonly databaseProvider: DatabaseTemplateProviderId | undefined;
}

export async function writeInitWorkspace(
  input: WriteInitWorkspaceInput
): Promise<WriteInitWorkspaceResult> {
  const config = normalizeInitWriterConfig(input);

  const files = buildWorkspaceFiles({
    workspaceName: config.workspaceName,
    databaseProvider: config.includeDatabase
      ? config.databaseProvider ?? "postgres:drizzle"
      : undefined
  });

  const directories = new Set<string>();

  for (const file of files) {
    const absolutePath = path.join(config.destination, file.relativePath);
    const directoryPath = path.dirname(absolutePath);

    directories.add(path.relative(config.destination, directoryPath) || ".");

    await mkdir(directoryPath, { recursive: true });
    await writeFile(absolutePath, file.contents, { encoding: "utf8" });

    if (file.executable) {
      await chmod(absolutePath, 0o755);
    }
  }

  return {
    destination: config.destination,
    directoriesCreated: directories.size,
    filesWritten: files.length,
    files: files.map((file) => ({
      path: file.relativePath,
      description: file.description
    }))
  };
}

function normalizeInitWriterConfig(
  input: WriteInitWorkspaceInput
): NormalizedInitWriterConfig {
  const configRecord = toRecord(input.config, "init writer config");
  const planRecord = toOptionalRecord(input.plan);

  const destination =
    getString(configRecord, [
      "destination",
      "destinationPath",
      "absoluteDestinationPath",
      "targetPath",
      "rootPath"
    ]) ??
    getString(planRecord, [
      "destination",
      "destinationPath",
      "absoluteDestinationPath",
      "targetPath",
      "rootPath"
    ]) ??
    process.cwd();

  const workspaceName =
    getString(configRecord, ["workspaceName", "name", "projectName"]) ??
    getString(planRecord, ["workspaceName", "name", "projectName"]) ??
    path.basename(destination);

  const explicitIncludeDatabase =
    getBoolean(configRecord, [
      "includeDatabase",
      "databaseEnabled",
      "withDatabase"
    ]) ??
    getBoolean(planRecord, [
      "includeDatabase",
      "databaseEnabled",
      "withDatabase"
    ]);

  const rawProvider =
    getDatabaseProviderId(configRecord) ?? getDatabaseProviderId(planRecord);

  const includeDatabase =
    explicitIncludeDatabase ??
    inferIncludeDatabase(configRecord, rawProvider) ??
    inferIncludeDatabase(planRecord, rawProvider) ??
    false;

  const databaseProvider = includeDatabase
    ? normalizeDatabaseTemplateProviderId(rawProvider ?? "postgres:drizzle")
    : undefined;

  return {
    destination,
    workspaceName,
    includeDatabase,
    databaseProvider
  };
}

function buildWorkspaceFiles(input: {
  readonly workspaceName: string;
  readonly databaseProvider: DatabaseTemplateProviderId | undefined;
}): readonly WorkspaceFile[] {
  const files: WorkspaceFile[] = [
    {
      relativePath: "package.json",
      description: "Root Bun workspace package manifest.",
      contents: buildPackageJson(input)
    },
    {
      relativePath: "bunfig.toml",
      description: "Bun workspace configuration.",
      contents: `[install]
frozenLockfile = true
`
    },
    {
      relativePath: "README.md",
      description: "Root workspace README.",
      contents: buildRootReadme(input)
    },
    {
      relativePath: ".gitignore",
      description: "Default Git ignore rules.",
      contents: `node_modules/
.bun/
.turbo/
dist/
coverage/
.env
.env.*
!.env.example
.DS_Store
data/*.db
data/*.sqlite
`
    },
    {
      relativePath: "tsconfig.base.json",
      description: "Shared TypeScript compiler configuration.",
      contents: json({
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022"],
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          skipLibCheck: true,
          declaration: true,
          declarationMap: true,
          sourceMap: true,
          esModuleInterop: true,
          forceConsistentCasingInFileNames: true
        }
      })
    },
    {
      relativePath: "turbo.json",
      description: "Minimal Turbo task graph.",
      contents: json({
        $schema: "https://turbo.build/schema.json",
        tasks: {
          build: {
            dependsOn: ["^build"],
            outputs: ["dist/**"]
          },
          lint: {
            dependsOn: ["^lint"]
          },
          typecheck: {
            dependsOn: ["^typecheck"]
          },
          test: {
            dependsOn: ["^test"]
          }
        }
      })
    },
    {
      relativePath: ".github/workflows/ci.yml",
      description: "Minimal GitHub Actions CI workflow.",
      contents: `name: CI

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install

      - name: Verify
        run: bun run verify
`
    },
    {
      relativePath: "tools/scripts/foundry.sh",
      description: "Root Foundry CLI wrapper.",
      executable: true,
      contents: `#!/usr/bin/env bash
set -euo pipefail

export FOUNDRY_INVOCATION_CWD="\${FOUNDRY_INVOCATION_CWD:-$PWD}"

ROOT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

if [[ -f "packages/cli/src/index.ts" ]]; then
  bun run packages/cli/src/index.ts "$@"
else
  echo "Foundry CLI entrypoint not found: packages/cli/src/index.ts" >&2
  exit 1
fi
`
    },
    {
      relativePath: "tools/scripts/verify.sh",
      description: "Root verification script.",
      executable: true,
      contents: `#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

bun run foundry -- generate --list >/dev/null

echo "verify: ok"
`
    },
    {
      relativePath: "packages/cli/package.json",
      description: "Embedded minimal Foundry CLI package manifest.",
      contents: json({
        name: "@foundry/workspace-cli",
        private: true,
        type: "module",
        scripts: {
          typecheck: "tsc -p tsconfig.json --noEmit"
        },
        dependencies: {
          "@oclif/core": "^4.0.34"
        },
        devDependencies: {
          typescript: "^5.7.2"
        }
      })
    },
    {
      relativePath: "packages/cli/tsconfig.json",
      description: "Embedded CLI TypeScript configuration.",
      contents: json({
        extends: "../../tsconfig.base.json",
        compilerOptions: {
          rootDir: "src",
          outDir: "dist",
          types: ["node"]
        },
        include: ["src/**/*.ts"]
      })
    },
    {
      relativePath: "packages/cli/src/index.ts",
      description: "Embedded minimal Foundry CLI entrypoint.",
      contents: `const args = process.argv.slice(2);

if (args[0] === "generate" && args[1] === "--list") {
  console.log("Available generators:");
  console.log("- governance-doc");
  console.log("- typescript-package");
  console.log("- hono-service");
  console.log("- openapi-client");
  process.exit(0);
}

console.log("Foundry workspace CLI");
console.log("");
console.log("Available commands:");
console.log("  generate --list");
`
    },
    directoryReadme("docs/README.md", "Documentation lives here."),
    directoryReadme("apps/README.md", "Application surfaces live here."),
    directoryReadme("services/README.md", "Backend services and workers live here."),
    directoryReadme("packages/README.md", "Shared internal packages live here."),
    directoryReadme("tools/README.md", "Repository-local tooling lives here."),
    directoryReadme("contracts/openapi/README.md", "OpenAPI contracts live here."),
    directoryReadme("generated/README.md", "Generated artifacts live here."),
    directoryReadme("generated/clients/README.md", "Generated API clients live here."),
    {
      relativePath: "config/foundry/generator-manifest.json",
      description: "Foundry generator manifest.",
      contents: buildGeneratorManifest(input.databaseProvider)
    },
    {
      relativePath: ".scaffdog/config.js",
      description: "Scaffdog configuration placeholder.",
      contents: `export default {
  files: ["templates/**/*.md"]
};
`
    },
    directoryReadme("templates/README.md", "Scaffolding templates live here.")
  ];

  if (input.databaseProvider) {
    files.push(...buildDatabaseTemplateFiles(input.databaseProvider));
  }

  return files;
}

function buildPackageJson(input: {
  readonly workspaceName: string;
  readonly databaseProvider: DatabaseTemplateProviderId | undefined;
}): string {
  const databasePackages = input.databaseProvider
    ? getDatabasePackageAdditions(input.databaseProvider)
    : { dependencies: {}, devDependencies: {} };

  const scripts: Record<string, string> = {
    foundry: "bash tools/scripts/foundry.sh",
    verify: "bash tools/scripts/verify.sh"
  };

  if (input.databaseProvider) {
    scripts["db:validate"] = "bash tools/scripts/db-validate.sh";
    scripts["db:start"] = "bash tools/scripts/db-start.sh";
    scripts["db:stop"] = "bash tools/scripts/db-stop.sh";
  }

  return json({
    name: input.workspaceName,
    private: true,
    type: "module",
    packageManager: "bun@1.2.0",
    scripts,
    workspaces: ["apps/*", "services/*", "packages/*"],
    dependencies:
      Object.keys(databasePackages.dependencies).length > 0
        ? databasePackages.dependencies
        : undefined,
    devDependencies: {
      "@types/node": "^22.10.2",
      turbo: "^2.3.3",
      typescript: "^5.7.2",
      ...databasePackages.devDependencies
    },
    foundry: {
      databaseProvider: input.databaseProvider ?? null
    }
  });
}

function buildRootReadme(input: {
  readonly workspaceName: string;
  readonly databaseProvider: DatabaseTemplateProviderId | undefined;
}): string {
  const databaseSection = input.databaseProvider
    ? `

## Database

This workspace was initialized with the following database provider:

\`\`\`text
${input.databaseProvider}
\`\`\`

Database files are located in:

- \`db/\`
- \`tools/scripts/db-validate.sh\`
- \`tools/scripts/db-start.sh\`
- \`tools/scripts/db-stop.sh\`

Provider-specific files may also exist under \`prisma/\`, \`supabase/\`, or \`data/\`.
`
    : "";

  return `# ${input.workspaceName}

This repository was initialized with Foundry.

## Commands

\`\`\`bash
bun run foundry -- generate --list
bun run verify
\`\`\`

## Workspace layout

- \`apps/\` — application surfaces
- \`services/\` — backend services and workers
- \`packages/\` — shared internal packages
- \`contracts/\` — API and integration contracts
- \`generated/\` — generated clients and artifacts
- \`tools/\` — local repository tooling
- \`templates/\` — scaffolding templates
- \`config/foundry/\` — Foundry configuration${databaseSection}
`;
}

function buildGeneratorManifest(
  databaseProvider: DatabaseTemplateProviderId | undefined
): string {
  return json({
    version: 1,
    generatedBy: "foundry init",
    databaseProvider: databaseProvider ?? null,
    generators: [
      {
        id: "governance-doc",
        engine: "scaffdog",
        status: "available"
      },
      {
        id: "typescript-package",
        engine: "plop",
        status: "available"
      },
      {
        id: "hono-service",
        engine: "copier",
        status: "available"
      },
      {
        id: "openapi-client",
        engine: "orval",
        status: "available"
      }
    ]
  });
}

function directoryReadme(
  relativePath: string,
  description: string
): WorkspaceFile {
  return {
    relativePath,
    description,
    contents: `# ${path.basename(path.dirname(relativePath))}

${description}
`
  };
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function toRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Expected ${label} to be an object.`);
  }

  return value as Record<string, unknown>;
}

function toOptionalRecord(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getString(
  record: Record<string, unknown>,
  keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function getBoolean(
  record: Record<string, unknown>,
  keys: readonly string[]
): boolean | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }
  }

  return undefined;
}

function inferIncludeDatabase(
  record: Record<string, unknown>,
  rawProvider: string | undefined
): boolean | undefined {
  const database = record.database;

  if (database === false || database === null) {
    return false;
  }

  if (database === true) {
    return true;
  }

  if (rawProvider) {
    return true;
  }

  if (typeof database === "object" && !Array.isArray(database)) {
    return true;
  }

  return undefined;
}

function getDatabaseProviderId(
  record: Record<string, unknown>
): string | undefined {
  const direct = getString(record, [
    "databaseProvider",
    "databaseProviderId",
    "providerId",
    "selectedDatabaseProvider"
  ]);

  if (direct) {
    return direct;
  }

  const database = toOptionalRecord(record.database);

  return getString(database, [
    "provider",
    "providerId",
    "id",
    "databaseProvider",
    "databaseProviderId"
  ]);
}
