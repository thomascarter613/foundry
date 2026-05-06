import {
  assertValidInitDatabaseProviderPlugin,
  type InitDatabaseProviderCapability,
  type InitDatabaseProviderEnvironmentVariable,
  type InitDatabaseProviderPlugin,
  type InitDatabaseProviderPluginMetadata
} from "./plugin.js";
import type { InitDatabaseProviderId } from "./providers.js";
import {
  buildDatabaseTemplateFiles,
  getDatabasePackageAdditions,
  getDatabaseProviderMetadata
} from "./templates.js";

const tierOneProviderIds: readonly InitDatabaseProviderId[] = [
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

export function listBuiltInInitDatabaseProviderPlugins(): readonly InitDatabaseProviderPlugin[] {
  return tierOneProviderIds.map((providerId) => {
    return createBuiltInInitDatabaseProviderPlugin(providerId);
  });
}

export function getBuiltInInitDatabaseProviderPlugin(
  providerId: InitDatabaseProviderId
): InitDatabaseProviderPlugin {
  return createBuiltInInitDatabaseProviderPlugin(providerId);
}

export function assertBuiltInInitDatabaseProviderPluginsValid(): void {
  for (const plugin of listBuiltInInitDatabaseProviderPlugins()) {
    assertValidInitDatabaseProviderPlugin(plugin);
  }
}

function createBuiltInInitDatabaseProviderPlugin(
  providerId: InitDatabaseProviderId
): InitDatabaseProviderPlugin {
  const metadata = buildPluginMetadata(providerId);

  return {
    metadata,

    getPackageAdditions() {
      return getDatabasePackageAdditions(providerId);
    },

    getEnvironmentVariables() {
      return buildEnvironmentVariables(providerId);
    },

    getCommands() {
      return [
        {
          name: "db:validate",
          command: "bash tools/scripts/db-validate.sh",
          description: "Validate configured database files and environment hints."
        },
        {
          name: "db:start",
          command: "bash tools/scripts/db-start.sh",
          description: "Start local database services when supported."
        },
        {
          name: "db:stop",
          command: "bash tools/scripts/db-stop.sh",
          description: "Stop local database services when supported."
        }
      ];
    },

    buildFiles() {
      return buildDatabaseTemplateFiles(providerId);
    }
  };
}

function buildPluginMetadata(
  providerId: InitDatabaseProviderId
): InitDatabaseProviderPluginMetadata {
  const metadata = getDatabaseProviderMetadata(providerId);

  return {
    id: metadata.id,
    family: metadata.family,
    adapter: metadata.orm,
    label: labelForProvider(providerId),
    description: descriptionForProvider(providerId),
    tier: 1,
    status: "available",
    firstClassSupabase: metadata.firstClassSupabase,
    capabilities: capabilitiesForProvider(providerId)
  };
}

function labelForProvider(providerId: InitDatabaseProviderId): string {
  switch (providerId) {
    case "postgres:drizzle":
      return "PostgreSQL + Drizzle";

    case "postgres:prisma":
      return "PostgreSQL + Prisma";

    case "sqlite:drizzle":
      return "SQLite + Drizzle";

    case "sqlite:prisma":
      return "SQLite + Prisma";

    case "mongodb:native":
      return "MongoDB Native Driver";

    case "supabase:sql":
      return "Supabase SQL";

    case "supabase:drizzle":
      return "Supabase + Drizzle";

    case "supabase:prisma":
      return "Supabase + Prisma";

    case "supabase:client":
      return "Supabase Client";

    default:
      assertNever(providerId);
  }
}

function descriptionForProvider(providerId: InitDatabaseProviderId): string {
  switch (providerId) {
    case "postgres:drizzle":
      return "Local PostgreSQL service with Drizzle ORM and Drizzle Kit.";

    case "postgres:prisma":
      return "Local PostgreSQL service with Prisma Client and Prisma schema.";

    case "sqlite:drizzle":
      return "Local SQLite database with Drizzle ORM and Drizzle Kit.";

    case "sqlite:prisma":
      return "Local SQLite database with Prisma Client and Prisma schema.";

    case "mongodb:native":
      return "Local MongoDB service using the official native MongoDB driver.";

    case "supabase:sql":
      return "First-class Supabase provider using SQL migrations and Supabase client configuration.";

    case "supabase:drizzle":
      return "First-class Supabase provider using Drizzle with Supabase-compatible PostgreSQL.";

    case "supabase:prisma":
      return "First-class Supabase provider using Prisma with Supabase-compatible PostgreSQL.";

    case "supabase:client":
      return "First-class Supabase client-only provider for API-first Supabase usage.";

    default:
      assertNever(providerId);
  }
}

function capabilitiesForProvider(
  providerId: InitDatabaseProviderId
): readonly InitDatabaseProviderCapability[] {
  switch (providerId) {
    case "postgres:drizzle":
      return ["local-service", "sql", "orm", "migrations", "docker-compose"];

    case "postgres:prisma":
      return ["local-service", "sql", "orm", "migrations", "docker-compose"];

    case "sqlite:drizzle":
      return ["sql", "orm", "migrations", "file-database"];

    case "sqlite:prisma":
      return ["sql", "orm", "migrations", "file-database"];

    case "mongodb:native":
      return ["local-service", "document", "client", "docker-compose"];

    case "supabase:sql":
      return ["sql", "client", "migrations", "supabase", "cloud-managed"];

    case "supabase:drizzle":
      return ["sql", "orm", "migrations", "supabase", "cloud-managed"];

    case "supabase:prisma":
      return ["sql", "orm", "migrations", "supabase", "cloud-managed"];

    case "supabase:client":
      return ["client", "supabase", "cloud-managed"];

    default:
      assertNever(providerId);
  }
}

function buildEnvironmentVariables(
  providerId: InitDatabaseProviderId
): readonly InitDatabaseProviderEnvironmentVariable[] {
  switch (providerId) {
    case "postgres:drizzle":
    case "postgres:prisma":
      return [
        {
          name: "DATABASE_URL",
          description: "PostgreSQL connection string.",
          required: true,
          example: "postgres://foundry:foundry@localhost:5432/foundry",
          secret: true
        }
      ];

    case "sqlite:drizzle":
    case "sqlite:prisma":
      return [
        {
          name: "DATABASE_URL",
          description: "SQLite database URL.",
          required: true,
          example: "file:./data/dev.db",
          secret: false
        }
      ];

    case "mongodb:native":
      return [
        {
          name: "MONGODB_URI",
          description: "MongoDB connection string.",
          required: true,
          example:
            "mongodb://foundry:foundry@localhost:27017/foundry?authSource=admin",
          secret: true
        },
        {
          name: "MONGODB_DATABASE",
          description: "MongoDB database name.",
          required: true,
          example: "foundry",
          secret: false
        }
      ];

    case "supabase:sql":
    case "supabase:drizzle":
    case "supabase:prisma":
    case "supabase:client":
      return [
        {
          name: "SUPABASE_URL",
          description: "Supabase project URL.",
          required: true,
          example: "https://example.supabase.co",
          secret: false
        },
        {
          name: "SUPABASE_ANON_KEY",
          description: "Supabase anonymous API key.",
          required: true,
          example: "replace-me",
          secret: true
        },
        {
          name: "SUPABASE_SERVICE_ROLE_KEY",
          description: "Supabase service role key.",
          required: true,
          example: "replace-me",
          secret: true
        },
        {
          name: "DATABASE_URL",
          description: "Supabase PostgreSQL connection string.",
          required: providerId === "supabase:drizzle" || providerId === "supabase:prisma",
          example:
            "postgresql://postgres:replace-me@db.example.supabase.co:5432/postgres",
          secret: true
        }
      ];

    default:
      assertNever(providerId);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled provider: ${String(value)}`);
}