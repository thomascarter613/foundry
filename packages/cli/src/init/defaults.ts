import type { InitConfig, InitDatabaseOption } from "./types.js";

export const DEFAULT_PACKAGE_SCOPE = "@repo";

export const DEFAULT_DESCRIPTION = "A Foundry-generated monorepo.";

export function createDefaultInitConfig(options: {
  readonly projectName: string;
  readonly destination?: string;
  readonly packageScope?: string;
  readonly description?: string;
  readonly installDependencies?: boolean;
  readonly initializeGit?: boolean;
  readonly createInitialCommit?: boolean;
  readonly runVerification?: boolean;
  readonly databases?: readonly InitDatabaseOption[];
}): InitConfig {
  const databases = options.databases ?? [
    {
      connectionName: "primary",
      providerId: "supabase:drizzle"
    }
  ];

  return {
    projectName: options.projectName,
    destination: options.destination ?? options.projectName,
    packageScope: options.packageScope ?? DEFAULT_PACKAGE_SCOPE,
    description: options.description ?? DEFAULT_DESCRIPTION,
    packageManager: "bun",
    initializeGit: options.initializeGit ?? true,
    createInitialCommit: options.createInitialCommit ?? false,
    installDependencies: options.installDependencies ?? true,
    runVerification: options.runVerification ?? true,
    databaseMode: databases.length === 0 ? "none" : databases.length === 1 ? "one" : "multiple",
    databases,
    includeFoundryCli: true,
    includeCi: true,
    includeDocs: true,
    includeContracts: true,
    includeGenerated: true,
    includeApps: true,
    includeServices: true,
    includePackages: true,
    includeTools: true
  };
}
