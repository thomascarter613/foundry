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
