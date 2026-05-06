import type {
  DatabaseProviderDefinition,
  DatabaseProviderLookupResult,
  DatabaseProviderRegistry
} from "./types.js";

const databaseUrlEnv = {
  name: "DATABASE_URL",
  description: "Primary database connection string.",
  required: true,
  example: "postgresql://foundry:foundry@localhost:5432/foundry",
  secret: true
} as const;

const postgresEnvVars = [
  databaseUrlEnv,
  {
    name: "POSTGRES_DB",
    description: "Local PostgreSQL database name.",
    required: false,
    example: "foundry",
    secret: false
  },
  {
    name: "POSTGRES_USER",
    description: "Local PostgreSQL user.",
    required: false,
    example: "foundry",
    secret: false
  },
  {
    name: "POSTGRES_PASSWORD",
    description: "Local PostgreSQL password.",
    required: false,
    example: "foundry",
    secret: true
  },
  {
    name: "POSTGRES_PORT",
    description: "Local PostgreSQL host port.",
    required: false,
    example: "5432",
    secret: false
  }
] as const;

const supabaseEnvVars = [
  databaseUrlEnv,
  {
    name: "SUPABASE_URL",
    description: "Supabase project URL.",
    required: true,
    example: "http://127.0.0.1:54321",
    secret: false
  },
  {
    name: "SUPABASE_ANON_KEY",
    description: "Supabase anonymous public API key.",
    required: true,
    example: "replace-me",
    secret: true
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    description: "Supabase service role key for trusted server-side workflows.",
    required: true,
    example: "replace-me",
    secret: true
  }
] as const;

const sqliteEnvVars = [
  {
    name: "SQLITE_DATABASE_PATH",
    description: "SQLite database file path.",
    required: true,
    example: "file:./db/local/local.db",
    secret: false
  }
] as const;

const mongodbEnvVars = [
  {
    name: "MONGODB_URI",
    description: "MongoDB connection URI.",
    required: true,
    example: "mongodb://localhost:27017",
    secret: true
  },
  {
    name: "MONGODB_DATABASE",
    description: "MongoDB database name.",
    required: true,
    example: "foundry",
    secret: false
  }
] as const;

const mysqlEnvVars = [
  {
    name: "MYSQL_DATABASE_URL",
    description: "MySQL or MariaDB connection string.",
    required: true,
    example: "mysql://foundry:foundry@localhost:3306/foundry",
    secret: true
  }
] as const;

export const databaseProviderRegistry: DatabaseProviderRegistry = {
  registryVersion: "foundry.database-provider-registry.v1",
  providers: [
    {
      id: "postgres:drizzle",
      database: "postgres",
      toolkit: "drizzle",
      status: "available",
      tier: 1,
      displayName: "PostgreSQL + Drizzle",
      description: "Plain PostgreSQL using Drizzle ORM and Drizzle Kit.",
      supportsMigrations: true,
      supportsSeeding: true,
      supportsRollback: "project-controlled",
      supportsDockerCompose: true,
      supportsSupabaseLocalStack: false,
      supportsHostedConnection: true,
      recommendedForPrimary: true,
      requiredDependencies: ["drizzle-orm", "postgres"],
      requiredDevDependencies: ["drizzle-kit"],
      generatedFilePatterns: [
        "drizzle.config.ts",
        "db/<connection>/schema/index.ts",
        "db/<connection>/seeds/seed.ts",
        "db/<connection>/rollbacks/.gitkeep",
        "docker-compose.yml"
      ],
      envVars: postgresEnvVars,
      scripts: [
        {
          name: "db:migrate",
          command: "drizzle-kit migrate",
          description: "Apply Drizzle migrations."
        },
        {
          name: "db:generate",
          command: "drizzle-kit generate",
          description: "Generate Drizzle migrations."
        },
        {
          name: "db:studio",
          command: "drizzle-kit studio",
          description: "Open Drizzle Studio."
        }
      ],
      notes: [
        "Recommended default for SQL-first TypeScript services.",
        "Rollback is project-controlled through explicit down SQL files."
      ]
    },
    {
      id: "postgres:prisma",
      database: "postgres",
      toolkit: "prisma",
      status: "available",
      tier: 1,
      displayName: "PostgreSQL + Prisma",
      description: "Plain PostgreSQL using Prisma ORM and Prisma Migrate.",
      supportsMigrations: true,
      supportsSeeding: true,
      supportsRollback: "project-controlled",
      supportsDockerCompose: true,
      supportsSupabaseLocalStack: false,
      supportsHostedConnection: true,
      recommendedForPrimary: true,
      requiredDependencies: ["@prisma/client"],
      requiredDevDependencies: ["prisma"],
      generatedFilePatterns: [
        "prisma/<connection>/schema.prisma",
        "prisma/<connection>/seed.ts",
        "db/<connection>/rollbacks/.gitkeep",
        "docker-compose.yml"
      ],
      envVars: postgresEnvVars,
      scripts: [
        {
          name: "db:migrate",
          command: "prisma migrate dev --schema prisma/<connection>/schema.prisma",
          description: "Run Prisma migrations in development."
        },
        {
          name: "db:deploy",
          command: "prisma migrate deploy --schema prisma/<connection>/schema.prisma",
          description: "Apply Prisma migrations in deployment workflows."
        },
        {
          name: "db:seed",
          command: "prisma db seed --schema prisma/<connection>/schema.prisma",
          description: "Run Prisma seed workflow."
        }
      ],
      notes: [
        "Use namespaced Prisma schema directories when multiple Prisma-backed connections exist.",
        "Rollback remains project-controlled or manual depending on migration type."
      ]
    },
    {
      id: "sqlite:drizzle",
      database: "sqlite",
      toolkit: "drizzle",
      status: "available",
      tier: 1,
      displayName: "SQLite + Drizzle",
      description: "SQLite using Drizzle ORM.",
      supportsMigrations: true,
      supportsSeeding: true,
      supportsRollback: "project-controlled",
      supportsDockerCompose: false,
      supportsSupabaseLocalStack: false,
      supportsHostedConnection: false,
      recommendedForPrimary: true,
      requiredDependencies: ["drizzle-orm", "better-sqlite3"],
      requiredDevDependencies: ["drizzle-kit", "@types/better-sqlite3"],
      generatedFilePatterns: [
        "drizzle.<connection>.config.ts",
        "db/<connection>/schema/index.ts",
        "db/<connection>/seeds/seed.ts",
        "db/<connection>/rollbacks/.gitkeep"
      ],
      envVars: sqliteEnvVars,
      scripts: [
        {
          name: "db:generate",
          command: "drizzle-kit generate --config drizzle.<connection>.config.ts",
          description: "Generate SQLite Drizzle migrations."
        },
        {
          name: "db:migrate",
          command: "drizzle-kit migrate --config drizzle.<connection>.config.ts",
          description: "Apply SQLite Drizzle migrations."
        }
      ],
      notes: ["Useful for local-first tools, prototypes, and lightweight applications."]
    },
    {
      id: "sqlite:prisma",
      database: "sqlite",
      toolkit: "prisma",
      status: "available",
      tier: 1,
      displayName: "SQLite + Prisma",
      description: "SQLite using Prisma ORM and Prisma Migrate.",
      supportsMigrations: true,
      supportsSeeding: true,
      supportsRollback: "project-controlled",
      supportsDockerCompose: false,
      supportsSupabaseLocalStack: false,
      supportsHostedConnection: false,
      recommendedForPrimary: true,
      requiredDependencies: ["@prisma/client"],
      requiredDevDependencies: ["prisma"],
      generatedFilePatterns: [
        "prisma/<connection>/schema.prisma",
        "prisma/<connection>/seed.ts",
        "db/<connection>/rollbacks/.gitkeep"
      ],
      envVars: sqliteEnvVars,
      scripts: [
        {
          name: "db:migrate",
          command: "prisma migrate dev --schema prisma/<connection>/schema.prisma",
          description: "Run SQLite Prisma migrations."
        },
        {
          name: "db:seed",
          command: "prisma db seed --schema prisma/<connection>/schema.prisma",
          description: "Run SQLite Prisma seed workflow."
        }
      ],
      notes: ["Useful for simple local development and single-file database workflows."]
    },
    {
      id: "mongodb:native",
      database: "mongodb",
      toolkit: "native",
      status: "available",
      tier: 1,
      displayName: "MongoDB + Native Driver",
      description: "MongoDB using the official native Node.js driver.",
      supportsMigrations: true,
      supportsSeeding: true,
      supportsRollback: "project-controlled",
      supportsDockerCompose: true,
      supportsSupabaseLocalStack: false,
      supportsHostedConnection: true,
      recommendedForPrimary: false,
      requiredDependencies: ["mongodb"],
      requiredDevDependencies: [],
      generatedFilePatterns: [
        "db/<connection>/schema/collections.ts",
        "db/<connection>/migrations/.gitkeep",
        "db/<connection>/rollbacks/.gitkeep",
        "db/<connection>/seeds/seed.ts",
        "docker-compose.yml"
      ],
      envVars: mongodbEnvVars,
      scripts: [
        {
          name: "db:seed",
          command: "bun run db/<connection>/seeds/seed.ts",
          description: "Seed MongoDB collections."
        },
        {
          name: "db:migrate",
          command: "bun run tools/scripts/db.ts migrate --connection <connection>",
          description: "Run project-controlled MongoDB migrations."
        }
      ],
      notes: [
        "Best for document-store use cases.",
        "Migrations and rollbacks are project-controlled TypeScript scripts."
      ]
    },
    {
      id: "supabase:sql",
      database: "supabase",
      toolkit: "sql",
      status: "available",
      tier: 1,
      displayName: "Supabase SQL",
      description: "Supabase local/hosted SQL migrations using Supabase project structure.",
      supportsMigrations: true,
      supportsSeeding: true,
      supportsRollback: "project-controlled",
      supportsDockerCompose: true,
      supportsSupabaseLocalStack: true,
      supportsHostedConnection: true,
      recommendedForPrimary: true,
      requiredDependencies: [],
      requiredDevDependencies: ["supabase"],
      generatedFilePatterns: [
        "supabase/config.toml",
        "supabase/migrations/.gitkeep",
        "supabase/seed.sql",
        "supabase/functions/.gitkeep",
        "db/<connection>/policies/.gitkeep",
        "db/<connection>/rollbacks/.gitkeep"
      ],
      envVars: supabaseEnvVars,
      scripts: [
        {
          name: "supabase:start",
          command: "supabase start",
          description: "Start the local Supabase stack."
        },
        {
          name: "supabase:stop",
          command: "supabase stop",
          description: "Stop the local Supabase stack."
        },
        {
          name: "supabase:reset",
          command: "supabase db reset",
          description: "Reset local Supabase database and run migrations/seeds."
        },
        {
          name: "supabase:migration:new",
          command: "supabase migration new",
          description: "Create a new Supabase SQL migration."
        }
      ],
      notes: [
        "Supabase is first-class and not collapsed into plain PostgreSQL.",
        "Rollback is project-controlled through explicit down SQL files."
      ]
    },
    {
      id: "supabase:drizzle",
      database: "supabase",
      toolkit: "drizzle",
      status: "available",
      tier: 1,
      displayName: "Supabase + Drizzle",
      description: "Supabase Postgres with Drizzle schema/client support plus Supabase project files.",
      supportsMigrations: true,
      supportsSeeding: true,
      supportsRollback: "project-controlled",
      supportsDockerCompose: true,
      supportsSupabaseLocalStack: true,
      supportsHostedConnection: true,
      recommendedForPrimary: true,
      requiredDependencies: ["drizzle-orm", "postgres"],
      requiredDevDependencies: ["drizzle-kit", "supabase"],
      generatedFilePatterns: [
        "drizzle.config.ts",
        "db/<connection>/schema/index.ts",
        "db/<connection>/seeds/seed.ts",
        "db/<connection>/policies/.gitkeep",
        "db/<connection>/rollbacks/.gitkeep",
        "supabase/config.toml",
        "supabase/migrations/.gitkeep",
        "supabase/seed.sql"
      ],
      envVars: supabaseEnvVars,
      scripts: [
        {
          name: "db:generate",
          command: "drizzle-kit generate",
          description: "Generate Drizzle migrations for Supabase Postgres."
        },
        {
          name: "db:migrate",
          command: "drizzle-kit migrate",
          description: "Apply Drizzle migrations to Supabase Postgres."
        },
        {
          name: "supabase:start",
          command: "supabase start",
          description: "Start the local Supabase stack."
        }
      ],
      notes: [
        "Recommended default for Foundry init when the user wants Supabase plus SQL-first TypeScript schema.",
        "Supabase SQL migration and RLS policy organization must remain visible."
      ]
    },
    {
      id: "supabase:prisma",
      database: "supabase",
      toolkit: "prisma",
      status: "available",
      tier: 1,
      displayName: "Supabase + Prisma",
      description: "Supabase Postgres with Prisma schema/client support plus Supabase project files.",
      supportsMigrations: true,
      supportsSeeding: true,
      supportsRollback: "project-controlled",
      supportsDockerCompose: true,
      supportsSupabaseLocalStack: true,
      supportsHostedConnection: true,
      recommendedForPrimary: true,
      requiredDependencies: ["@prisma/client"],
      requiredDevDependencies: ["prisma", "supabase"],
      generatedFilePatterns: [
        "prisma/<connection>/schema.prisma",
        "prisma/<connection>/seed.ts",
        "db/<connection>/policies/.gitkeep",
        "db/<connection>/rollbacks/.gitkeep",
        "supabase/config.toml",
        "supabase/migrations/.gitkeep",
        "supabase/seed.sql"
      ],
      envVars: supabaseEnvVars,
      scripts: [
        {
          name: "db:migrate",
          command: "prisma migrate dev --schema prisma/<connection>/schema.prisma",
          description: "Run Prisma migrations against Supabase Postgres."
        },
        {
          name: "db:seed",
          command: "prisma db seed --schema prisma/<connection>/schema.prisma",
          description: "Run Prisma seed workflow."
        },
        {
          name: "supabase:start",
          command: "supabase start",
          description: "Start the local Supabase stack."
        }
      ],
      notes: [
        "Use namespaced Prisma schema directories.",
        "RLS policies should remain SQL migration artifacts."
      ]
    },
    {
      id: "supabase:client",
      database: "supabase",
      toolkit: "supabase-client",
      status: "available",
      tier: 1,
      displayName: "Supabase JavaScript Client",
      description: "Supabase JavaScript client package for apps and services.",
      supportsMigrations: false,
      supportsSeeding: false,
      supportsRollback: "none",
      supportsDockerCompose: false,
      supportsSupabaseLocalStack: false,
      supportsHostedConnection: true,
      recommendedForPrimary: false,
      requiredDependencies: ["@supabase/supabase-js"],
      requiredDevDependencies: [],
      generatedFilePatterns: [
        "packages/supabase-client/package.json",
        "packages/supabase-client/README.md",
        "packages/supabase-client/src/index.ts"
      ],
      envVars: supabaseEnvVars,
      scripts: [],
      notes: [
        "May be selected alongside another Supabase provider.",
        "May also be used with hosted-only Supabase projects."
      ]
    },
    ...createPlannedProviders()
  ]
};

export function listDatabaseProviders(): readonly DatabaseProviderDefinition[] {
  return databaseProviderRegistry.providers;
}

export function listAvailableDatabaseProviders(): readonly DatabaseProviderDefinition[] {
  return databaseProviderRegistry.providers.filter((provider) => provider.status === "available");
}

export function findDatabaseProvider(providerId: string): DatabaseProviderDefinition | undefined {
  const normalizedProviderId = normalizeProviderId(providerId);

  return databaseProviderRegistry.providers.find((provider) => provider.id === normalizedProviderId);
}

export function lookupDatabaseProvider(providerId: string): DatabaseProviderLookupResult {
  const provider = findDatabaseProvider(providerId);

  if (!provider) {
    return {
      provider: undefined,
      status: "unknown"
    };
  }

  return {
    provider,
    status: provider.status
  };
}

export function isAvailableDatabaseProvider(providerId: string): boolean {
  return lookupDatabaseProvider(providerId).status === "available";
}

export function formatAvailableDatabaseProviderIds(): string {
  return listAvailableDatabaseProviders()
    .map((provider) => `  - ${provider.id}`)
    .join("\n");
}

export function normalizeProviderId(providerId: string): string {
  return providerId.trim().toLowerCase();
}

function createPlannedProviders(): DatabaseProviderDefinition[] {
  return [
    createPlannedProvider("mysql:drizzle", "mysql", "drizzle", "MySQL + Drizzle", mysqlEnvVars),
    createPlannedProvider("mysql:prisma", "mysql", "prisma", "MySQL + Prisma", mysqlEnvVars),
    createPlannedProvider("mariadb:drizzle", "mariadb", "drizzle", "MariaDB + Drizzle", mysqlEnvVars),
    createPlannedProvider("mariadb:prisma", "mariadb", "prisma", "MariaDB + Prisma", mysqlEnvVars),
    createPlannedProvider("mongodb:prisma", "mongodb", "prisma", "MongoDB + Prisma", mongodbEnvVars),
    createPlannedProvider("neon:drizzle", "neon", "drizzle", "Neon + Drizzle", postgresEnvVars),
    createPlannedProvider("neon:prisma", "neon", "prisma", "Neon + Prisma", postgresEnvVars),
    createPlannedProvider("turso:drizzle", "turso", "drizzle", "Turso + Drizzle", sqliteEnvVars),
    createPlannedProvider("libsql:drizzle", "libsql", "drizzle", "libSQL + Drizzle", sqliteEnvVars),
    createPlannedProvider(
      "cloudflare-d1:drizzle",
      "cloudflare-d1",
      "drizzle",
      "Cloudflare D1 + Drizzle",
      sqliteEnvVars
    ),
    createPlannedProvider("cockroachdb:prisma", "cockroachdb", "prisma", "CockroachDB + Prisma", postgresEnvVars),
    createPlannedProvider("sqlserver:prisma", "sqlserver", "prisma", "SQL Server + Prisma", databaseUrlOnly()),
    createPlannedProvider("singlestore:drizzle", "singlestore", "drizzle", "SingleStore + Drizzle", databaseUrlOnly()),
    createPlannedProvider("planetscale:drizzle", "planetscale", "drizzle", "PlanetScale + Drizzle", databaseUrlOnly()),
    createPlannedProvider("custom:plugin", "custom", "plugin", "Custom Provider Plugin", databaseUrlOnly())
  ];
}

function createPlannedProvider(
  id: string,
  database: DatabaseProviderDefinition["database"],
  toolkit: DatabaseProviderDefinition["toolkit"],
  displayName: string,
  envVars: DatabaseProviderDefinition["envVars"]
): DatabaseProviderDefinition {
  return {
    id,
    database,
    toolkit,
    status: "planned",
    tier: id === "custom:plugin" ? 3 : 2,
    displayName,
    description: `${displayName} provider is planned but not implemented yet.`,
    supportsMigrations: true,
    supportsSeeding: true,
    supportsRollback: "project-controlled",
    supportsDockerCompose: false,
    supportsSupabaseLocalStack: false,
    supportsHostedConnection: true,
    recommendedForPrimary: false,
    requiredDependencies: [],
    requiredDevDependencies: [],
    generatedFilePatterns: ["not-yet-implemented"],
    envVars,
    scripts: [],
    notes: ["Planned provider. Not executable in current init implementation."]
  };
}

function databaseUrlOnly(): DatabaseProviderDefinition["envVars"] {
  return [databaseUrlEnv];
}
