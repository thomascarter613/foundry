import { findDatabaseProvider } from "./registry.js";
import type { DatabaseEnvVarDefinition, DatabaseProviderDefinition } from "./types.js";
import type {
  InitDatabaseOption,
  InitPlanDatabaseConnection,
  InitPlanDependency,
  InitPlanDirectory,
  InitPlanEnvVar,
  InitPlanFile,
  InitPlanScript
} from "../types.js";

export interface DatabaseWorkspacePlan {
  readonly connections: readonly InitPlanDatabaseConnection[];
  readonly directories: readonly InitPlanDirectory[];
  readonly files: readonly InitPlanFile[];
  readonly scripts: readonly InitPlanScript[];
  readonly dependencies: readonly InitPlanDependency[];
  readonly devDependencies: readonly InitPlanDependency[];
  readonly envVars: readonly InitPlanEnvVar[];
  readonly warnings: readonly string[];
}

export function createDatabaseWorkspacePlan(databases: readonly InitDatabaseOption[]): DatabaseWorkspacePlan {
  if (databases.length === 0) {
    return {
      connections: [],
      directories: [],
      files: [],
      scripts: [],
      dependencies: [],
      devDependencies: [],
      envVars: [],
      warnings: []
    };
  }

  const selectedProviders = databases
    .map((database) => ({
      database,
      provider: findDatabaseProvider(database.providerId)
    }))
    .filter((entry): entry is { readonly database: InitDatabaseOption; readonly provider: DatabaseProviderDefinition } => {
      return entry.provider !== undefined;
    });

  return {
    connections: createConnectionPlans(selectedProviders),
    directories: createDatabaseDirectoryPlan(selectedProviders),
    files: createDatabaseFilePlan(selectedProviders),
    scripts: createDatabaseScriptPlan(selectedProviders),
    dependencies: createDependencyPlan(
      selectedProviders,
      (provider) => provider.requiredDependencies
    ),
    devDependencies: createDependencyPlan(
      selectedProviders,
      (provider) => provider.requiredDevDependencies
    ),
    envVars: createEnvVarPlan(selectedProviders),
    warnings: createDatabaseWarnings(selectedProviders)
  };
}

function createConnectionPlans(
  selectedProviders: readonly {
    readonly database: InitDatabaseOption;
    readonly provider: DatabaseProviderDefinition;
  }[]
): InitPlanDatabaseConnection[] {
  return selectedProviders.map(({ database, provider }) => ({
    connectionName: database.connectionName,
    providerId: provider.id,
    providerDisplayName: provider.displayName,
    database: provider.database,
    toolkit: provider.toolkit,
    supportsMigrations: provider.supportsMigrations,
    supportsSeeding: provider.supportsSeeding,
    supportsRollback: provider.supportsRollback,
    supportsDockerCompose: provider.supportsDockerCompose,
    supportsSupabaseLocalStack: provider.supportsSupabaseLocalStack,
    supportsHostedConnection: provider.supportsHostedConnection,
    generatedFilePatterns: provider.generatedFilePatterns.map((filePattern) =>
      renderConnectionPattern(filePattern, database.connectionName)
    ),
    notes: provider.notes
  }));
}

function createDatabaseDirectoryPlan(
  selectedProviders: readonly {
    readonly database: InitDatabaseOption;
    readonly provider: DatabaseProviderDefinition;
  }[]
): InitPlanDirectory[] {
  const directories = new Map<string, InitPlanDirectory>();

  addDirectory(directories, "config/database", "Database connection manifest directory.");
  addDirectory(directories, "db", "Database schemas, migrations, seeds, rollbacks, and provider files.");

  for (const { database, provider } of selectedProviders) {
    addDirectory(directories, `db/${database.connectionName}`, `Database workspace for ${database.connectionName}.`);
    addDirectory(directories, `db/${database.connectionName}/schema`, `Schema files for ${database.connectionName}.`);
    addDirectory(
      directories,
      `db/${database.connectionName}/migrations`,
      `Migration files for ${database.connectionName}.`
    );
    addDirectory(
      directories,
      `db/${database.connectionName}/rollbacks`,
      `Rollback files for ${database.connectionName}.`
    );
    addDirectory(directories, `db/${database.connectionName}/seeds`, `Seed files for ${database.connectionName}.`);

    if (provider.database === "supabase") {
      addDirectory(directories, "supabase", "Supabase local project root.");
      addDirectory(directories, "supabase/migrations", "Supabase SQL migrations.");
      addDirectory(directories, "supabase/functions", "Supabase Edge Functions.");
      addDirectory(
        directories,
        `db/${database.connectionName}/policies`,
        `Supabase policy organization for ${database.connectionName}.`
      );
    }

    if (provider.toolkit === "prisma") {
      addDirectory(
        directories,
        `prisma/${database.connectionName}`,
        `Prisma schema directory for ${database.connectionName}.`
      );
    }

    if (provider.id === "supabase:client") {
      addDirectory(directories, "packages/supabase-client", "Supabase client package.");
      addDirectory(directories, "packages/supabase-client/src", "Supabase client package source.");
    }
  }

  return [...directories.values()];
}

function createDatabaseFilePlan(
  selectedProviders: readonly {
    readonly database: InitDatabaseOption;
    readonly provider: DatabaseProviderDefinition;
  }[]
): InitPlanFile[] {
  const files = new Map<string, InitPlanFile>();

  addFile(files, ".env.example", "Environment variable template for selected database providers.");
  addFile(files, "config/database/connections.json", "Database connection manifest.");
  addFile(files, "db/README.md", "Database workspace documentation.");
  addFile(files, "db/registry.ts", "Generated database connection registry.");
  addFile(files, "tools/scripts/db.ts", "Unified database lifecycle dispatcher.");

  if (selectedProviders.some(({ provider }) => provider.supportsDockerCompose)) {
    addFile(files, "docker-compose.yml", "Local database service definitions.");
  }

  for (const { database, provider } of selectedProviders) {
    for (const filePattern of provider.generatedFilePatterns) {
      const renderedPath = renderConnectionPattern(filePattern, database.connectionName);

      if (renderedPath === "not-yet-implemented") {
        continue;
      }

      addFile(files, renderedPath, `${provider.displayName} generated file.`);
    }
  }

  return [...files.values()];
}

function createDatabaseScriptPlan(
  selectedProviders: readonly {
    readonly database: InitDatabaseOption;
    readonly provider: DatabaseProviderDefinition;
  }[]
): InitPlanScript[] {
  const scripts = new Map<string, InitPlanScript>();

  addScript(scripts, {
    name: "db:check",
    command: "bun run tools/scripts/db.ts check",
    description: "Validate configured database connections."
  });

  addScript(scripts, {
    name: "db:up",
    command: "bun run tools/scripts/db.ts up",
    description: "Start local database services when supported."
  });

  addScript(scripts, {
    name: "db:down",
    command: "bun run tools/scripts/db.ts down",
    description: "Stop local database services when supported."
  });

  addScript(scripts, {
    name: "db:migrate",
    command: "bun run tools/scripts/db.ts migrate",
    description: "Run provider-specific migrations."
  });

  addScript(scripts, {
    name: "db:seed",
    command: "bun run tools/scripts/db.ts seed",
    description: "Run provider-specific seed workflows."
  });

  addScript(scripts, {
    name: "db:rollback",
    command: "bun run tools/scripts/db.ts rollback",
    description: "Run provider-defined rollback workflows."
  });

  addScript(scripts, {
    name: "db:reset",
    command: "bun run tools/scripts/db.ts reset",
    description: "Reset local database state when supported."
  });

  for (const { database, provider } of selectedProviders) {
    for (const providerScript of provider.scripts) {
      const scriptName = normalizeProviderScriptName(providerScript.name, database.connectionName);
      const command = providerScript.command.replaceAll("<connection>", database.connectionName);

      addScript(scripts, {
        name: scriptName,
        command,
        description: providerScript.description
      });
    }
  }

  return [...scripts.values()];
}

function createDependencyPlan(
  selectedProviders: readonly {
    readonly database: InitDatabaseOption;
    readonly provider: DatabaseProviderDefinition;
  }[],
  selector: (provider: DatabaseProviderDefinition) => readonly string[]
): InitPlanDependency[] {
  const requestedByByDependency = new Map<string, Set<string>>();

  for (const { provider } of selectedProviders) {
    for (const dependency of selector(provider)) {
      const existing = requestedByByDependency.get(dependency) ?? new Set<string>();
      existing.add(provider.id);
      requestedByByDependency.set(dependency, existing);
    }
  }

  return [...requestedByByDependency.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, requestedBy]) => ({
      name,
      requestedBy: [...requestedBy].sort()
    }));
}

function createEnvVarPlan(
  selectedProviders: readonly {
    readonly database: InitDatabaseOption;
    readonly provider: DatabaseProviderDefinition;
  }[]
): InitPlanEnvVar[] {
  const envVarsByName = new Map<
    string,
    {
      readonly definition: DatabaseEnvVarDefinition;
      readonly requestedBy: Set<string>;
    }
  >();

  for (const { provider } of selectedProviders) {
    for (const envVar of provider.envVars) {
      const existing = envVarsByName.get(envVar.name);

      if (existing) {
        existing.requestedBy.add(provider.id);
        continue;
      }

      envVarsByName.set(envVar.name, {
        definition: envVar,
        requestedBy: new Set([provider.id])
      });
    }
  }

  return [...envVarsByName.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([_name, value]) => ({
      name: value.definition.name,
      description: value.definition.description,
      required: value.definition.required,
      secret: value.definition.secret,
      requestedBy: [...value.requestedBy].sort(),
      ...(value.definition.example === undefined ? {} : { example: value.definition.example })
    }));
}

function createDatabaseWarnings(
  selectedProviders: readonly {
    readonly database: InitDatabaseOption;
    readonly provider: DatabaseProviderDefinition;
  }[]
): string[] {
  const warnings: string[] = [];

  if (selectedProviders.some(({ provider }) => provider.supportsDockerCompose)) {
    warnings.push("One or more selected database providers may require Docker for local database workflows.");
  }

  if (selectedProviders.some(({ provider }) => provider.supportsSupabaseLocalStack)) {
    warnings.push("Supabase local workflows require the Supabase CLI and Docker.");
  }

  const prismaProviders = selectedProviders.filter(({ provider }) => provider.toolkit === "prisma");

  if (prismaProviders.length > 1) {
    warnings.push("Multiple Prisma-backed connections require namespaced Prisma schema directories.");
  }

  const supabaseClientOnly =
    selectedProviders.some(({ provider }) => provider.id === "supabase:client") &&
    !selectedProviders.some(({ provider }) =>
      ["supabase:sql", "supabase:drizzle", "supabase:prisma"].includes(provider.id)
    );

  if (supabaseClientOnly) {
    warnings.push("supabase:client without a Supabase runtime provider relies on hosted Supabase environment variables.");
  }

  return warnings;
}

function normalizeProviderScriptName(scriptName: string, connectionName: string): string {
  if (scriptName.startsWith("supabase:")) {
    return scriptName;
  }

  if (scriptName.startsWith("db:")) {
    return `db:${connectionName}:${scriptName.slice("db:".length)}`;
  }

  return `db:${connectionName}:${scriptName}`;
}

function renderConnectionPattern(pattern: string, connectionName: string): string {
  return pattern.replaceAll("<connection>", connectionName);
}

function addDirectory(
  directories: Map<string, InitPlanDirectory>,
  directoryPath: string,
  description: string
): void {
  if (directories.has(directoryPath)) {
    return;
  }

  directories.set(directoryPath, {
    path: directoryPath,
    description
  });
}

function addFile(files: Map<string, InitPlanFile>, filePath: string, description: string): void {
  if (files.has(filePath)) {
    return;
  }

  files.set(filePath, {
    path: filePath,
    description
  });
}

function addScript(scripts: Map<string, InitPlanScript>, script: InitPlanScript): void {
  if (scripts.has(script.name)) {
    return;
  }

  scripts.set(script.name, script);
}
