export type DatabaseTemplateProviderId =
  | "postgres:drizzle"
  | "postgres:prisma"
  | "sqlite:drizzle"
  | "sqlite:prisma"
  | "mongodb:native"
  | "supabase:sql"
  | "supabase:drizzle"
  | "supabase:prisma"
  | "supabase:client";

export interface DatabaseTemplateFile {
  readonly relativePath: string;
  readonly description: string;
  readonly contents: string;
  readonly executable?: boolean;
}

export interface DatabasePackageAdditions {
  readonly dependencies: Record<string, string>;
  readonly devDependencies: Record<string, string>;
}

export interface DatabaseProviderMetadata {
  readonly id: DatabaseTemplateProviderId;
  readonly family: string;
  readonly runtime: string;
  readonly orm: string;
  readonly localService: boolean;
  readonly firstClassSupabase: boolean;
}

const databaseProviders: readonly DatabaseTemplateProviderId[] = [
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

export function supportedDatabaseTemplateProviders(): readonly DatabaseTemplateProviderId[] {
  return databaseProviders;
}

export function isDatabaseTemplateProviderId(
  value: string
): value is DatabaseTemplateProviderId {
  return databaseProviders.includes(value as DatabaseTemplateProviderId);
}

export function normalizeDatabaseTemplateProviderId(
  rawProvider: string
): DatabaseTemplateProviderId {
  const provider = rawProvider.trim();

  if (isDatabaseTemplateProviderId(provider)) {
    return provider;
  }

  throw new Error(
    `Unsupported database provider: ${rawProvider}. Supported providers: ${databaseProviders.join(", ")}`
  );
}

export function getDatabaseProviderMetadata(
  provider: DatabaseTemplateProviderId
): DatabaseProviderMetadata {
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

export function getDatabasePackageAdditions(
  provider: DatabaseTemplateProviderId
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

export function buildDatabaseTemplateFiles(
  provider: DatabaseTemplateProviderId
): readonly DatabaseTemplateFile[] {
  const commonFiles: DatabaseTemplateFile[] = [
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
        supabaseClient()
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
      return [...commonFiles, supabaseReadme(), supabaseClient()];

    default:
      assertNever(provider);
  }
}

function buildDatabaseReadme(provider: DatabaseTemplateProviderId): string {
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

function buildEnvExample(provider: DatabaseTemplateProviderId): string {
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

function buildDatabaseValidateScript(provider: DatabaseTemplateProviderId): string {
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

function buildDatabaseStartScript(provider: DatabaseTemplateProviderId): string {
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

function buildDatabaseStopScript(provider: DatabaseTemplateProviderId): string {
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

function postgresDockerCompose(): DatabaseTemplateFile {
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

function mongodbDockerCompose(): DatabaseTemplateFile {
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
): DatabaseTemplateFile {
  const dialect = provider === "sqlite" ? "sqlite" : "postgresql";
  const databaseUrl =
    provider === "sqlite"
      ? 'process.env.DATABASE_URL ?? "file:./data/dev.db"'
      : 'process.env.DATABASE_URL ?? "postgres://foundry:foundry@localhost:5432/foundry"';

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
): DatabaseTemplateFile {
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
): DatabaseTemplateFile {
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

function prismaSchema(provider: "postgresql" | "sqlite"): DatabaseTemplateFile {
  const datasourceUrl =
    provider === "sqlite" ? '"file:./../data/dev.db"' : 'env("DATABASE_URL")';

  return {
    relativePath: "prisma/schema.prisma",
    description: "Prisma schema.",
    contents: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = ${datasourceUrl}
}

model HealthCheck {
  id        String   @id @default(cuid())
  status    String
  createdAt DateTime @default(now())
}
`
  };
}

function prismaClient(): DatabaseTemplateFile {
  return {
    relativePath: "db/client.ts",
    description: "Prisma database client.",
    contents: `import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();
`
  };
}

function mongodbClient(): DatabaseTemplateFile {
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

function mongodbIndexes(): DatabaseTemplateFile {
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

function supabaseReadme(): DatabaseTemplateFile {
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

function supabaseInitialSqlMigration(): DatabaseTemplateFile {
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

function supabaseClient(): DatabaseTemplateFile {
  return {
    relativePath: "db/client.ts",
    description: "Supabase client facade.",
    contents: `import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`
  };
}

function gitkeep(relativePath: string): DatabaseTemplateFile {
  return {
    relativePath,
    description: "Directory placeholder.",
    contents: ""
  };
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled database provider: ${String(value)}`);
}
