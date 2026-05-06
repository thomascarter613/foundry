import type {
  DatabaseKind,
  DatabaseRollbackSupport,
  DatabaseToolkit
} from "./database/types.js";

export type InitDatabaseSelectionMode = "none" | "one" | "multiple";

export type InitValidationIssueLevel = "warning" | "error";

export interface InitDatabaseOption {
  readonly connectionName: string;
  readonly providerId: string;
}

export interface InitConfig {
  readonly projectName: string;
  readonly destination: string;
  readonly packageScope: string;
  readonly description: string;
  readonly packageManager: "bun";
  readonly initializeGit: boolean;
  readonly createInitialCommit: boolean;
  readonly installDependencies: boolean;
  readonly runVerification: boolean;
  readonly databaseMode: InitDatabaseSelectionMode;
  readonly databases: readonly InitDatabaseOption[];
  readonly includeFoundryCli: boolean;
  readonly includeCi: boolean;
  readonly includeDocs: boolean;
  readonly includeContracts: boolean;
  readonly includeGenerated: boolean;
  readonly includeApps: boolean;
  readonly includeServices: boolean;
  readonly includePackages: boolean;
  readonly includeTools: boolean;
}

export interface InitPlanFile {
  readonly path: string;
  readonly description: string;
}

export interface InitPlanDirectory {
  readonly path: string;
  readonly description: string;
}

export interface InitPlanScript {
  readonly name: string;
  readonly command: string;
  readonly description: string;
}

export interface InitPlanDependency {
  readonly name: string;
  readonly requestedBy: readonly string[];
}

export interface InitPlanEnvVar {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
  readonly secret: boolean;
  readonly requestedBy: readonly string[];
  readonly example?: string;
}

export interface InitPlanDatabaseConnection {
  readonly connectionName: string;
  readonly providerId: string;
  readonly providerDisplayName: string;
  readonly database: DatabaseKind;
  readonly toolkit: DatabaseToolkit;
  readonly supportsMigrations: boolean;
  readonly supportsSeeding: boolean;
  readonly supportsRollback: DatabaseRollbackSupport;
  readonly supportsDockerCompose: boolean;
  readonly supportsSupabaseLocalStack: boolean;
  readonly supportsHostedConnection: boolean;
  readonly generatedFilePatterns: readonly string[];
  readonly notes: readonly string[];
}

export interface InitPlan {
  readonly projectName: string;
  readonly destination: string;
  readonly dryRun: true;
  readonly summary: string;
  readonly directories: readonly InitPlanDirectory[];
  readonly files: readonly InitPlanFile[];
  readonly scripts: readonly InitPlanScript[];
  readonly databases: readonly InitDatabaseOption[];
  readonly databaseConnections: readonly InitPlanDatabaseConnection[];
  readonly dependencies: readonly InitPlanDependency[];
  readonly devDependencies: readonly InitPlanDependency[];
  readonly envVars: readonly InitPlanEnvVar[];
  readonly postInitCommands: readonly string[];
  readonly warnings: readonly string[];
}

export interface InitValidationIssue {
  readonly level: InitValidationIssueLevel;
  readonly code: string;
  readonly message: string;
}

export interface InitValidationResult {
  readonly ok: boolean;
  readonly issues: readonly InitValidationIssue[];
}
