import { chmod, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

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

type DatabaseProviderId =
  | "postgres:drizzle"
  | "postgres:prisma"
  | "sqlite:drizzle"
  | "sqlite:prisma"
  | "mongodb:native"
  | "supabase:sql"
  | "supabase:drizzle"
  | "supabase:prisma"
  | "supabase:client";

interface NormalizedInitWriterConfig {
  readonly destination: string;
  readonly workspaceName: string;
  readonly includeDatabase: boolean;
  readonly databaseProvider: DatabaseProviderId | undefined;
}

interface DatabasePackageAdditions {
  readonly dependencies: Record<string, string>;
  readonly devDependencies: Record<string, string>;
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
    getBoolean(planRecord, ["includeDatabase", "databaseEnabled", "withDatabase"]);

  const rawProvider =
    getDatabaseProviderId(configRecord) ?? getDatabaseProviderId(planRecord);

  const includeDatabase =
    explicitIncludeDatabase ??
    inferIncludeDatabase(configRecord, rawProvider) ??
    inferIncludeDatabase(planRecord, rawProvider) ??
    false;

  const databaseProvider = includeDatabase
    ? normalizeDatabaseProviderId(rawProvider ?? "postgres:drizzle")
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
  readonly databaseProvider: DatabaseProviderId | undefined;
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
    files.push(...buildDatabaseWorkspaceFiles(input.databaseProvider));
  }

  return files;
}

function buildPackageJson(input: {
  readonly workspaceName: string;
  readonly databaseProvider: DatabaseProviderId | undefined;
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
  readonly databaseProvider: DatabaseProviderId | undefined;
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

function buildGeneratorManifest(databaseProvider?: DatabaseProviderId): string {
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

function buildDatabaseWorkspaceFiles(
  provider: DatabaseProviderId
): readonly WorkspaceFile[] {
  const commonFiles: WorkspaceFile[] = [
    {
      relativePath: "db/provider.json",
      description: "Selected database provider metadata.",
      contents: json(getDatabaseProviderMetadata(provider))
    },
    {
      relativePath: "db/README.md",
      description: "Database workspace README.",
      contents: buildDatabaseReadme(provider)
    },
    {
      relativePath: ".env.example",
      description: "Database environment variable example file.",
      contents: buildEnvExample(provider)
    },
    {
      relativePath: "tools/scripts/db-validate.sh",
      description: "Database configuration validation script.",
      executable: true,
      contents: buildDatabaseValidateScript(provider)
    },
    {
      relativePath: "tools/scripts/db-start.sh",
      description: "Database local service start script.",
      executable: true,
      contents: buildDatabaseStartScript(provider)
    },
    {
      relativePath: "tools/scripts/db-stop.sh",
      description: "Database local service stop script.",
      executable: true,
      contents: buildDatabaseStopScript(provider)
    }
  ];

  switch (provider) {
    case "postgres:drizzle":
      return [
        ...commonFiles,
        postgresDockerCompose(),
        drizzleConfig("postgres"),
        drizzleSchema("postgres"),
        drizzleClient("postgres"),
        gitkeep("db/migrations/.gitkeep")
      ];

    case "postgres:prisma":
      return [
        ...commonFiles,
        postgresDockerCompose(),
        prismaSchema("postgresql"),
        prismaClient(),
        gitkeep("prisma/migrations/.gitkeep")
      ];

    case "sqlite:drizzle":
      return [
        ...commonFiles,
        gitkeep("data/.gitkeep"),
        drizzleConfig("sqlite"),
        drizzleSchema("sqlite"),
        drizzleClient("sqlite"),
        gitkeep("db/migrations/.gitkeep")
      ];

    case "sqlite:prisma":
      return [
        ...commonFiles,
        gitkeep("data/.gitkeep"),
        prismaSchema("sqlite"),
        prismaClient(),
        gitkeep("prisma/migrations/.gitkeep")
      ];

    case "mongodb:native":
      return [
        ...commonFiles,
        mongodbDockerCompose(),
        mongodbClient(),
        mongodbIndexes()
      ];

    case "supabase:sql":
      return [
        ...commonFiles,
        supabaseReadme(),
        supabaseInitialSqlMigration(),
        supabaseSqlClient()
      ];

    case "supabase:drizzle":
      return [
        ...commonFiles,
        supabaseReadme(),
        drizzleConfig("supabase"),
        drizzleSchema("supabase"),
        drizzleClient("supabase"),
        supabaseInitialSqlMigration(),
        gitkeep("db/migrations/.gitkeep")
      ];

    case "supabase:prisma":
      return [
        ...commonFiles,
        supabaseReadme(),
        prismaSchema("postgresql"),
        prismaClient(),
        supabaseInitialSqlMigration(),
        gitkeep("prisma/migrations/.gitkeep")
      ];

    case "supabase:client":
      return [...commonFiles, supabaseReadme(), supabaseClientOnly()];

    default:
      assertNever(provider);
  }
}

function getDatabaseProviderMetadata(provider: DatabaseProviderId): {
  readonly id: DatabaseProviderId;
  readonly family: string;
  readonly runtime: string;
  readonly orm: string;
  readonly localService: boolean;
  readonly firstClassSupabase: boolean;
} {
  switch (provider) {
    case "postgres:drizzle":
      return {
        id: provider,
        family: "postgres",
        runtime: "postgresql",
        orm: "drizzle",
        localService: true,
        firstClassSupabase: false
      };

    case "postgres:prisma":
      return {
        id: provider,
        family: "postgres",
        runtime: "postgresql",
        orm: "prisma",
        localService: true,
        firstClassSupabase: false
      };

    case "sqlite:drizzle":
      return {
        id: provider,
        family: "sqlite",
        runtime: "sqlite",
        orm: "drizzle",
        localService: false,
        firstClassSupabase: false
      };

    case "sqlite:prisma":
      return {
        id: provider,
        family: "sqlite",
        runtime: "sqlite",
        orm: "prisma",
        localService: false,
        firstClassSupabase: false
      };

    case "mongodb:native":
      return {
        id: provider,
        family: "mongodb",
        runtime: "mongodb",
        orm: "native",
        localService: true,
        firstClassSupabase: false
      };

    case "supabase:sql":
      return {
        id: provider,
        family: "supabase",
        runtime: "postgresql",
        orm: "sql",
        localService: false,
        firstClassSupabase: true
      };

    case "supabase:drizzle":
      return {
        id: provider,
        family: "supabase",
        runtime: "postgresql",
        orm: "drizzle",
        localService: false,
        firstClassSupabase: true
      };

    case "supabase:prisma":
      return {
        id: provider,
        family: "supabase",
        runtime: "postgresql",
        orm: "prisma",
        localService: false,
        firstClassSupabase: true
      };

    case "supabase:client":
      return {
        id: provider,
        family: "supabase",
        runtime: "supabase-js",
        orm: "supabase-client",
        localService: false,
        firstClassSupabase: true
      };

    default:
      assertNever(provider);
  }
}

function getDatabasePackageAdditions(
  provider: DatabaseProviderId
): DatabasePackageAdditions {
  switch (provider) {
    case "postgres:drizzle":
      return {
        dependencies: {
          "drizzle-orm": "^0.38.3",
          postgres: "^3.4.5"
        },
        devDependencies: {
          "drizzle-kit": "^0.30.1"
        }
      };

    case "postgres:prisma":
      return {
        dependencies: {
          "@prisma/client": "^6.0.1"
        },
        devDependencies: {
          prisma: "^6.0.1"
        }
      };

    case "sqlite:drizzle":
      return {
        dependencies: {
          "better-sqlite3": "^11.7.0",
          "drizzle-orm": "^0.38.3"
        },
        devDependencies: {
          "@types/better-sqlite3": "^7.6.12",
          "drizzle-kit": "^0.30.1"
        }
      };

    case "sqlite:prisma":
      return {
        dependencies: {
          "@prisma/client": "^6.0.1"
        },
        devDependencies: {
          prisma: "^6.0.1"
        }
      };

    case "mongodb:native":
      return {
        dependencies: {
          mongodb: "^6.12.0"
        },
        devDependencies: {}
      };

    case "supabase:sql":
      return {
        dependencies: {
          "@supabase/supabase-js": "^2.47.10"
        },
        devDependencies: {}
      };

    case "supabase:drizzle":
      return {
        dependencies: {
          "@supabase/supabase-js": "^2.47.10",
          "drizzle-orm": "^0.38.3",
          postgres: "^3.4.5"
        },
        devDependencies: {
          "drizzle-kit": "^0.30.1"
        }
      };

    case "supabase:prisma":
      return {
        dependencies: {
          "@prisma/client": "^6.0.1",
          "@supabase/supabase-js": "^2.47.10"
        },
        devDependencies: {
          prisma: "^6.0.1"
        }
      };

    case "supabase:client":
      return {
        dependencies: {
          "@supabase/supabase-js": "^2.47.10"
        },
        devDependencies: {}
      };

    default:
      assertNever(provider);
  }
}

function buildDatabaseReadme(provider: DatabaseProviderId): string {
  const metadata = getDatabaseProviderMetadata(provider);

  return `# Database

Provider:

\`\`\`text
${provider}
\`\`\`

## Metadata

- Family: \`${metadata.family}\`
- Runtime: \`${metadata.runtime}\`
- ORM/client: \`${metadata.orm}\`
- Local service: \`${metadata.localService ? "yes" : "no"}\`
- First-class Supabase provider: \`${metadata.firstClassSupabase ? "yes" : "no"}\`

## Commands

\`\`\`bash
bun run db:validate
bun run db:start
bun run db:stop
\`\`\`

The generated database files are intentionally minimal. They establish the provider-specific workspace shape and can be expanded by later Foundry generators.
`;
}

function buildEnvExample(provider: DatabaseProviderId): string {
  switch (provider) {
    case "postgres:drizzle":
    case "postgres:prisma":
      return `DATABASE_URL="postgres://foundry:foundry@localhost:5432/foundry"
`;

    case "sqlite:drizzle":
    case "sqlite:prisma":
      return `DATABASE_URL="file:./data/dev.db"
`;

    case "mongodb:native":
      return `MONGODB_URI="mongodb://foundry:foundry@localhost:27017/foundry?authSource=admin"
MONGODB_DATABASE="foundry"
`;

    case "supabase:sql":
    case "supabase:drizzle":
    case "supabase:prisma":
    case "supabase:client":
      return `SUPABASE_URL="https://example.supabase.co"
SUPABASE_ANON_KEY="replace-me"
SUPABASE_SERVICE_ROLE_KEY="replace-me"
DATABASE_URL="postgresql://postgres:replace-me@db.example.supabase.co:5432/postgres"
`;

    default:
      assertNever(provider);
  }
}

function buildDatabaseValidateScript(provider: DatabaseProviderId): string {
  return `#!/usr/bin/env bash
set -euo pipefail

echo "database provider: ${provider}"

if [[ -f ".env" ]]; then
  echo ".env: present"
else
  echo ".env: not present; copy .env.example to .env when configuring the database"
fi

test -f "db/provider.json"

echo "database validation: ok"
`;
}

function buildDatabaseStartScript(provider: DatabaseProviderId): string {
  switch (provider) {
    case "postgres:drizzle":
    case "postgres:prisma":
    case "mongodb:native":
      return `#!/usr/bin/env bash
set -euo pipefail

if command -v docker >/dev/null 2>&1; then
  docker compose up -d
else
  echo "docker is required to start the local ${provider} service" >&2
  exit 1
fi
`;

    case "sqlite:drizzle":
    case "sqlite:prisma":
    case "supabase:sql":
    case "supabase:drizzle":
    case "supabase:prisma":
    case "supabase:client":
      return `#!/usr/bin/env bash
set -euo pipefail

echo "No local Docker service is required for ${provider}."
`;

    default:
      assertNever(provider);
  }
}

function buildDatabaseStopScript(provider: DatabaseProviderId): string {
  switch (provider) {
    case "postgres:drizzle":
    case "postgres:prisma":
    case "mongodb:native":
      return `#!/usr/bin/env bash
set -euo pipefail

if command -v docker >/dev/null 2>&1; then
  docker compose down
else
  echo "docker is not installed; nothing to stop"
fi
`;

    case "sqlite:drizzle":
    case "sqlite:prisma":
    case "supabase:sql":
    case "supabase:drizzle":
    case "supabase:prisma":
    case "supabase:client":
      return `#!/usr/bin/env bash
set -euo pipefail

echo "No local Docker service is required for ${provider}."
`;

    default:
      assertNever(provider);
  }
}

function postgresDockerCompose(): WorkspaceFile {
  return {
    relativePath: "docker-compose.yml",
    description: "Local PostgreSQL Docker Compose service.",
    contents: `services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_USER: foundry
      POSTGRES_PASSWORD: foundry
      POSTGRES_DB: foundry
    ports:
      - "5432:5432"
    volumes:
      - foundry-postgres-data:/var/lib/postgresql/data

volumes:
  foundry-postgres-data:
`
  };
}

function mongodbDockerCompose(): WorkspaceFile {
  return {
    relativePath: "docker-compose.yml",
    description: "Local MongoDB Docker Compose service.",
    contents: `services:
  mongodb:
    image: mongo:8
    environment:
      MONGO_INITDB_ROOT_USERNAME: foundry
      MONGO_INITDB_ROOT_PASSWORD: foundry
      MONGO_INITDB_DATABASE: foundry
    ports:
      - "27017:27017"
    volumes:
      - foundry-mongodb-data:/data/db

volumes:
  foundry-mongodb-data:
`
  };
}

function drizzleConfig(
  provider: "postgres" | "sqlite" | "supabase"
): WorkspaceFile {
  const dialect = provider === "sqlite" ? "sqlite" : "postgresql";
  const databaseUrl =
    provider === "sqlite"
      ? "process.env.DATABASE_URL ?? \"file:./data/dev.db\""
      : "process.env.DATABASE_URL ?? \"postgres://foundry:foundry@localhost:5432/foundry\"";

  return {
    relativePath: "drizzle.config.ts",
    description: "Drizzle Kit configuration.",
    contents: `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "${dialect}",
  dbCredentials: {
    url: ${databaseUrl}
  }
});
`
  };
}

function drizzleSchema(
  provider: "postgres" | "sqlite" | "supabase"
): WorkspaceFile {
  if (provider === "sqlite") {
    return {
      relativePath: "db/schema.ts",
      description: "SQLite Drizzle schema.",
      contents: `import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const healthChecks = sqliteTable("health_checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull()
});
`
    };
  }

  return {
    relativePath: "db/schema.ts",
    description: "PostgreSQL-compatible Drizzle schema.",
    contents: `import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const healthChecks = pgTable("health_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
`
  };
}

function drizzleClient(
  provider: "postgres" | "sqlite" | "supabase"
): WorkspaceFile {
  if (provider === "sqlite") {
    return {
      relativePath: "db/client.ts",
      description: "SQLite Drizzle database client.",
      contents: `import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const databasePath = process.env.DATABASE_URL?.replace("file:", "") ?? "./data/dev.db";

export const sqlite = new Database(databasePath);
export const db = drizzle(sqlite);
`
    };
  }

  return {
    relativePath: "db/client.ts",
    description: "PostgreSQL-compatible Drizzle database client.",
    contents: `import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://foundry:foundry@localhost:5432/foundry";

export const sql = postgres(connectionString);
export const db = drizzle(sql);
`
  };
}

function prismaSchema(provider: "postgresql" | "sqlite"): WorkspaceFile {
  const url = provider === "sqlite" ? "file:./../data/dev.db" : "env(\"DATABASE_URL\")";

  return {
    relativePath: "prisma/schema.prisma",
    description: "Prisma schema.",
    contents: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = ${provider === "sqlite" ? `"${url}"` : url}
}

model HealthCheck {
  id        String   @id @default(cuid())
  status    String
  createdAt DateTime @default(now())
}
`
  };
}

function prismaClient(): WorkspaceFile {
  return {
    relativePath: "db/client.ts",
    description: "Prisma database client.",
    contents: `import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();
`
  };
}

function mongodbClient(): WorkspaceFile {
  return {
    relativePath: "db/client.ts",
    description: "MongoDB native client.",
    contents: `import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI ??
  "mongodb://foundry:foundry@localhost:27017/foundry?authSource=admin";

export const mongoClient = new MongoClient(uri);

export async function getDatabase() {
  await mongoClient.connect();
  return mongoClient.db(process.env.MONGODB_DATABASE ?? "foundry");
}
`
  };
}

function mongodbIndexes(): WorkspaceFile {
  return {
    relativePath: "db/indexes.ts",
    description: "MongoDB index bootstrap placeholder.",
    contents: `import { getDatabase } from "./client.js";

export async function ensureIndexes() {
  const db = await getDatabase();

  await db.collection("health_checks").createIndex({ createdAt: -1 });
}
`
  };
}

function supabaseReadme(): WorkspaceFile {
  return {
    relativePath: "supabase/README.md",
    description: "Supabase provider README.",
    contents: `# Supabase

Supabase is modeled as a first-class provider family in this workspace, not merely as plain PostgreSQL.

Use \`.env.example\` as the starting point for local environment configuration.

Required values usually include:

- \`SUPABASE_URL\`
- \`SUPABASE_ANON_KEY\`
- \`SUPABASE_SERVICE_ROLE_KEY\`
- \`DATABASE_URL\`
`
  };
}

function supabaseInitialSqlMigration(): WorkspaceFile {
  return {
    relativePath: "supabase/migrations/0001_initial.sql",
    description: "Initial Supabase SQL migration.",
    contents: `create table if not exists public.health_checks (
  id uuid primary key default gen_random_uuid(),
  status text not null,
  created_at timestamptz not null default now()
);
`
  };
}

function supabaseSqlClient(): WorkspaceFile {
  return {
    relativePath: "db/client.ts",
    description: "Supabase SQL/client placeholder.",
    contents: `import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`
  };
}

function supabaseClientOnly(): WorkspaceFile {
  return {
    relativePath: "db/client.ts",
    description: "Supabase client-only database facade.",
    contents: `import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`
  };
}

function gitkeep(relativePath: string): WorkspaceFile {
  return {
    relativePath,
    description: "Directory placeholder.",
    contents: ""
  };
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
  rawProvider?: string
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
  const direct =
    getString(record, [
      "databaseProvider",
      "databaseProviderId",
      "providerId",
      "selectedDatabaseProvider"
    ]) ?? undefined;

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

function normalizeDatabaseProviderId(rawProvider: string): DatabaseProviderId {
  const provider = rawProvider.trim();

  if (isDatabaseProviderId(provider)) {
    return provider;
  }

  throw new Error(
    `Unsupported database provider: ${rawProvider}. Supported providers: ${supportedDatabaseProviders().join(", ")}`
  );
}

function isDatabaseProviderId(value: string): value is DatabaseProviderId {
  return supportedDatabaseProviders().includes(value as DatabaseProviderId);
}

function supportedDatabaseProviders(): readonly DatabaseProviderId[] {
  return [
    "postgres:drizzle",
    "postgres:prisma",
    "sqlite:drizzle",
    "sqlite:prisma",
    "mongodb:native",
    "supabase:sql",
    "supabase:drizzle",
    "supabase:prisma",
    "supabase:client"
  ];
}

function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}
