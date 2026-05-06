export interface WorkspaceTemplateFile {
  readonly relativePath: string;
  readonly description: string;
  readonly contents: string;
  readonly executable?: boolean;
}

export interface BaseWorkspaceTemplateInput {
  readonly workspaceName: string;
  readonly databaseProvider: string | undefined;
  readonly databaseDependencies: Readonly<Record<string, string>>;
  readonly databaseDevDependencies: Readonly<Record<string, string>>;
}

export function buildBaseWorkspaceTemplateFiles(
  input: BaseWorkspaceTemplateInput
): readonly WorkspaceTemplateFile[] {
  return [
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
}

function buildPackageJson(input: BaseWorkspaceTemplateInput): string {
  const scripts: Record<string, string> = {
    foundry: "bash tools/scripts/foundry.sh",
    verify: "bash tools/scripts/verify.sh"
  };

  if (input.databaseProvider) {
    scripts["db:validate"] = "bash tools/scripts/db-validate.sh";
    scripts["db:start"] = "bash tools/scripts/db-start.sh";
    scripts["db:stop"] = "bash tools/scripts/db-stop.sh";
  }

  const dependencies =
    Object.keys(input.databaseDependencies).length > 0
      ? input.databaseDependencies
      : undefined;

  return json({
    name: input.workspaceName,
    private: true,
    type: "module",
    packageManager: "bun@1.2.0",
    scripts,
    workspaces: ["apps/*", "services/*", "packages/*"],
    dependencies,
    devDependencies: {
      "@types/node": "^22.10.2",
      turbo: "^2.3.3",
      typescript: "^5.7.2",
      ...input.databaseDevDependencies
    },
    foundry: {
      databaseProvider: input.databaseProvider ?? null
    }
  });
}

function buildRootReadme(input: BaseWorkspaceTemplateInput): string {
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

function buildGeneratorManifest(databaseProvider: string | undefined): string {
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
): WorkspaceTemplateFile {
  const directoryName = relativePath.split("/").at(-2) ?? "workspace";

  return {
    relativePath,
    description,
    contents: `# ${directoryName}

${description}
`
  };
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}