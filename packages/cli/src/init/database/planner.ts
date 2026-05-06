import {
  listInitDatabaseProviderIds,
  maybeGetInitDatabaseProvider,
  type InitDatabaseProviderDefinition
} from "./registry.js";

export interface InitDatabaseOption {
  readonly id?: string;
  readonly name?: string;
  readonly provider?: string;
  readonly providerId?: string;
  readonly databaseProvider?: string;
  readonly databaseProviderId?: string;
}

export interface InitDatabaseConnectionPlan {
  readonly name: string;
  readonly providerId: string;
  readonly label: string;
  readonly description: string;
}

export interface InitDatabaseDirectoryPlan {
  readonly path: string;
  readonly description: string;
}

export interface InitDatabaseFilePlan {
  readonly path: string;
  readonly description: string;
}

export interface InitDatabaseScriptPlan {
  readonly name: string;
  readonly command: string;
  readonly description: string;
}

export interface InitDatabaseEnvVarPlan {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
  readonly example: string | undefined;
}

export interface InitDatabaseGeneratedFilePatternPlan {
  readonly pattern: string;
  readonly description: string;
}

export interface InitDatabaseWarningPlan {
  readonly code: string;
  readonly message: string;
}

export interface InitDatabasePlan {
  readonly enabled: boolean;
  readonly providerIds: readonly string[];
  readonly connections: readonly InitDatabaseConnectionPlan[];
  readonly directories: readonly InitDatabaseDirectoryPlan[];
  readonly files: readonly InitDatabaseFilePlan[];
  readonly scripts: readonly InitDatabaseScriptPlan[];
  readonly generatedFilePatterns: readonly InitDatabaseGeneratedFilePatternPlan[];
  readonly envVars: readonly InitDatabaseEnvVarPlan[];
  readonly warnings: readonly InitDatabaseWarningPlan[];
}

interface SelectedProvider {
  readonly database: InitDatabaseOption;
  readonly provider: InitDatabaseProviderDefinition;
}

export function createInitDatabasePlan(
  databases: readonly InitDatabaseOption[] | undefined
): InitDatabasePlan {
  const selectedProviders = selectDatabaseProviders(databases);

  return {
    enabled: selectedProviders.length > 0,
    providerIds: selectedProviders.map((entry) => entry.provider.id),
    connections: createConnectionPlans(selectedProviders),
    directories: createDatabaseDirectoryPlan(selectedProviders),
    files: createDatabaseFilePlan(selectedProviders),
    scripts: createDatabaseScriptPlan(selectedProviders),
    generatedFilePatterns: createGeneratedFilePatternPlan(selectedProviders),
    envVars: createEnvVarPlan(selectedProviders),
    warnings: createDatabaseWarnings(selectedProviders)
  };
}

export function createDatabasePlan(
  databases: readonly InitDatabaseOption[] | undefined
): InitDatabasePlan {
  return createInitDatabasePlan(databases);
}

export function planInitDatabases(
  databases: readonly InitDatabaseOption[] | undefined
): InitDatabasePlan {
  return createInitDatabasePlan(databases);
}

export function listPlannableDatabaseProviderIds(): readonly string[] {
  return listInitDatabaseProviderIds();
}

function selectDatabaseProviders(
  databases: readonly InitDatabaseOption[] | undefined
): readonly SelectedProvider[] {
  if (!databases || databases.length === 0) {
    return [];
  }

  return databases
    .map((database): SelectedProvider | undefined => {
      const providerId = getProviderId(database);
      const provider = maybeGetInitDatabaseProvider(providerId);

      if (!provider) {
        return undefined;
      }

      return {
        database,
        provider
      };
    })
    .filter((entry): entry is SelectedProvider => entry !== undefined);
}

function createConnectionPlans(
  selectedProviders: readonly SelectedProvider[]
): readonly InitDatabaseConnectionPlan[] {
  return selectedProviders.map(({ database, provider }) => {
    return {
      name: database.name ?? database.id ?? provider.id,
      providerId: provider.id,
      label: provider.label,
      description: provider.description
    };
  });
}

function createDatabaseDirectoryPlan(
  selectedProviders: readonly SelectedProvider[]
): readonly InitDatabaseDirectoryPlan[] {
  const directories = new Map<string, InitDatabaseDirectoryPlan>();

  for (const { provider } of selectedProviders) {
    addDirectory(directories, "db", "Database provider files.");
    addDirectory(directories, "tools/scripts", "Database helper scripts.");

    if (provider.adapter === "drizzle") {
      addDirectory(directories, "db/migrations", "Drizzle migrations.");
    }

    if (provider.adapter === "prisma") {
      addDirectory(directories, "prisma", "Prisma schema and migrations.");
      addDirectory(directories, "prisma/migrations", "Prisma migrations.");
    }

    if (provider.family === "sqlite") {
      addDirectory(directories, "data", "Local SQLite database files.");
    }

    if (provider.family === "supabase") {
      addDirectory(directories, "supabase", "Supabase provider files.");
      addDirectory(
        directories,
        "supabase/migrations",
        "Supabase SQL migrations."
      );
    }
  }

  return [...directories.values()];
}

function createDatabaseFilePlan(
  selectedProviders: readonly SelectedProvider[]
): readonly InitDatabaseFilePlan[] {
  const files = new Map<string, InitDatabaseFilePlan>();

  for (const { provider } of selectedProviders) {
    addFile(files, "db/provider.json", "Selected database provider metadata.");
    addFile(files, "db/README.md", "Database workspace README.");
    addFile(files, ".env.example", "Database environment variable examples.");
    addFile(files, "tools/scripts/db-validate.sh", "Database validation script.");
    addFile(files, "tools/scripts/db-start.sh", "Database start script.");
    addFile(files, "tools/scripts/db-stop.sh", "Database stop script.");

    if (provider.localService) {
      addFile(files, "docker-compose.yml", "Local database Docker Compose service.");
    }

    if (provider.adapter === "drizzle") {
      addFile(files, "drizzle.config.ts", "Drizzle Kit configuration.");
      addFile(files, "db/schema.ts", "Drizzle schema.");
      addFile(files, "db/client.ts", "Drizzle database client.");
      addFile(files, "db/migrations/.gitkeep", "Drizzle migrations placeholder.");
    }

    if (provider.adapter === "prisma") {
      addFile(files, "prisma/schema.prisma", "Prisma schema.");
      addFile(files, "db/client.ts", "Prisma database client.");
      addFile(files, "prisma/migrations/.gitkeep", "Prisma migrations placeholder.");
    }

    if (provider.family === "mongodb") {
      addFile(files, "db/client.ts", "MongoDB native database client.");
      addFile(files, "db/indexes.ts", "MongoDB index bootstrap.");
    }

    if (provider.family === "sqlite") {
      addFile(files, "data/.gitkeep", "SQLite data directory placeholder.");
    }

    if (provider.family === "supabase") {
      addFile(files, "supabase/README.md", "Supabase provider README.");
      addFile(
        files,
        "supabase/migrations/0001_initial.sql",
        "Initial Supabase SQL migration."
      );
      addFile(files, "db/client.ts", "Supabase-compatible database client.");
    }

    if (provider.adapter === "sql" || provider.adapter === "client") {
      addFile(files, "db/client.ts", "Supabase client facade.");
    }
  }

  return [...files.values()];
}

function createDatabaseScriptPlan(
  selectedProviders: readonly SelectedProvider[]
): readonly InitDatabaseScriptPlan[] {
  if (selectedProviders.length === 0) {
    return [];
  }

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
}

function createGeneratedFilePatternPlan(
  selectedProviders: readonly SelectedProvider[]
): readonly InitDatabaseGeneratedFilePatternPlan[] {
  const patterns = new Map<string, InitDatabaseGeneratedFilePatternPlan>();

  for (const { provider } of selectedProviders) {
    addGeneratedPattern(
      patterns,
      "db/provider.json",
      "Database provider metadata."
    );

    if (provider.adapter === "drizzle") {
      addGeneratedPattern(patterns, "drizzle.config.ts", "Drizzle configuration.");
      addGeneratedPattern(patterns, "db/schema.ts", "Drizzle schema.");
      addGeneratedPattern(patterns, "db/client.ts", "Drizzle client.");
      addGeneratedPattern(patterns, "db/migrations/**", "Drizzle migrations.");
    }

    if (provider.adapter === "prisma") {
      addGeneratedPattern(patterns, "prisma/schema.prisma", "Prisma schema.");
      addGeneratedPattern(patterns, "db/client.ts", "Prisma client.");
      addGeneratedPattern(patterns, "prisma/migrations/**", "Prisma migrations.");
    }

    if (provider.family === "mongodb") {
      addGeneratedPattern(patterns, "db/client.ts", "MongoDB client.");
      addGeneratedPattern(patterns, "db/indexes.ts", "MongoDB indexes.");
    }

    if (provider.family === "supabase") {
      addGeneratedPattern(patterns, "supabase/**", "Supabase provider files.");
    }

    if (provider.localService) {
      addGeneratedPattern(patterns, "docker-compose.yml", "Local service compose file.");
    }
  }

  return [...patterns.values()];
}

function createEnvVarPlan(
  selectedProviders: readonly SelectedProvider[]
): readonly InitDatabaseEnvVarPlan[] {
  const envVars = new Map<string, InitDatabaseEnvVarPlan>();

  for (const { provider } of selectedProviders) {
    if (provider.family === "postgres") {
      addEnvVar(envVars, {
        name: "DATABASE_URL",
        description: "Primary PostgreSQL database connection string.",
        required: true,
        example: "postgres://foundry:foundry@localhost:5432/foundry"
      });
    }

    if (provider.family === "sqlite") {
      addEnvVar(envVars, {
        name: "DATABASE_URL",
        description: "SQLite database URL.",
        required: true,
        example: "file:./data/dev.db"
      });
    }

    if (provider.family === "mongodb") {
      addEnvVar(envVars, {
        name: "MONGODB_URI",
        description: "MongoDB connection string.",
        required: true,
        example:
          "mongodb://foundry:foundry@localhost:27017/foundry?authSource=admin"
      });

      addEnvVar(envVars, {
        name: "MONGODB_DATABASE",
        description: "MongoDB database name.",
        required: true,
        example: "foundry"
      });
    }

    if (provider.family === "supabase") {
      addEnvVar(envVars, {
        name: "SUPABASE_URL",
        description: "Supabase project URL.",
        required: true,
        example: "https://example.supabase.co"
      });

      addEnvVar(envVars, {
        name: "SUPABASE_ANON_KEY",
        description: "Supabase anonymous API key.",
        required: true,
        example: "replace-me"
      });

      addEnvVar(envVars, {
        name: "SUPABASE_SERVICE_ROLE_KEY",
        description: "Supabase service role key.",
        required: true,
        example: "replace-me"
      });

      if (provider.adapter === "drizzle" || provider.adapter === "prisma") {
        addEnvVar(envVars, {
          name: "DATABASE_URL",
          description: "Supabase PostgreSQL connection string.",
          required: true,
          example:
            "postgresql://postgres:replace-me@db.example.supabase.co:5432/postgres"
        });
      }
    }
  }

  return [...envVars.values()];
}

function createDatabaseWarnings(
  selectedProviders: readonly SelectedProvider[]
): readonly InitDatabaseWarningPlan[] {
  const warnings: InitDatabaseWarningPlan[] = [];

  for (const { provider } of selectedProviders) {
    if (provider.firstClassSupabase) {
      warnings.push({
        code: "supabase-first-class-provider",
        message:
          "Supabase is modeled as a first-class provider family, not merely plain PostgreSQL."
      });
    }

    if (!provider.localService) {
      warnings.push({
        code: "database-no-local-service",
        message: `${provider.id} does not require a local Docker database service.`
      });
    }
  }

  return warnings;
}

function getProviderId(database: InitDatabaseOption): string | undefined {
  return (
    normalizeString(database.provider) ??
    normalizeString(database.providerId) ??
    normalizeString(database.databaseProvider) ??
    normalizeString(database.databaseProviderId) ??
    normalizeString(database.id)
  );
}

function addDirectory(
  directories: Map<string, InitDatabaseDirectoryPlan>,
  directoryPath: string,
  description: string
): void {
  if (!directories.has(directoryPath)) {
    directories.set(directoryPath, {
      path: directoryPath,
      description
    });
  }
}

function addFile(
  files: Map<string, InitDatabaseFilePlan>,
  filePath: string,
  description: string
): void {
  if (!files.has(filePath)) {
    files.set(filePath, {
      path: filePath,
      description
    });
  }
}

function addGeneratedPattern(
  patterns: Map<string, InitDatabaseGeneratedFilePatternPlan>,
  pattern: string,
  description: string
): void {
  if (!patterns.has(pattern)) {
    patterns.set(pattern, {
      pattern,
      description
    });
  }
}

function addEnvVar(
  envVars: Map<string, InitDatabaseEnvVarPlan>,
  envVar: InitDatabaseEnvVarPlan
): void {
  if (!envVars.has(envVar.name)) {
    envVars.set(envVar.name, envVar);
  }
}

function normalizeString(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}