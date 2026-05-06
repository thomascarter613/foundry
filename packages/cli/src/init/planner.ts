import {
  createInitDatabasePlan,
  type InitDatabaseOption,
  type InitDatabasePlan
} from "./database/planner.js";

export interface InitPlanInput {
  readonly destination: string;
  readonly workspaceName: string;
  readonly includeDatabase: boolean;
  readonly databaseProvider: string | undefined;
  readonly installDependencies: boolean;
}

export interface InitPlanDirectory {
  readonly path: string;
  readonly description: string;
}

export interface InitPlanFile {
  readonly path: string;
  readonly description: string;
}

export interface InitPlanScript {
  readonly name: string;
  readonly command: string;
  readonly description: string;
}

export interface InitPlan {
  readonly destination: string;
  readonly workspaceName: string;
  readonly includeDatabase: boolean;
  readonly databaseProvider: string | undefined;
  readonly installDependencies: boolean;
  readonly directories: readonly InitPlanDirectory[];
  readonly files: readonly InitPlanFile[];
  readonly scripts: readonly InitPlanScript[];
  readonly database: InitDatabasePlan;
}

export function createInitPlan(input: InitPlanInput): InitPlan {
  const databaseOptions = createDatabaseOptions(input);
  const databasePlan = createInitDatabasePlan(databaseOptions);

  return {
    destination: input.destination,
    workspaceName: input.workspaceName,
    includeDatabase: input.includeDatabase,
    databaseProvider: input.databaseProvider,
    installDependencies: input.installDependencies,
    directories: createDirectoryPlan(input, databasePlan),
    files: createFilePlan(input, databasePlan),
    scripts: createScriptPlan(input, databasePlan),
    database: databasePlan
  };
}

export function planInitWorkspace(input: InitPlanInput): InitPlan {
  return createInitPlan(input);
}

export function createWorkspaceInitPlan(input: InitPlanInput): InitPlan {
  return createInitPlan(input);
}

function createDatabaseOptions(
  input: InitPlanInput
): readonly InitDatabaseOption[] {
  if (!input.includeDatabase) {
    return [];
  }

  return [
    {
      provider: input.databaseProvider ?? "postgres:drizzle"
    }
  ];
}

function createDirectoryPlan(
  input: InitPlanInput,
  databasePlan: InitDatabasePlan
): readonly InitPlanDirectory[] {
  const directories = new Map<string, InitPlanDirectory>();

  addDirectory(directories, input.destination, "Workspace root.");
  addDirectory(directories, `${input.destination}/apps`, "Application surfaces.");
  addDirectory(
    directories,
    `${input.destination}/services`,
    "Backend services and workers."
  );
  addDirectory(
    directories,
    `${input.destination}/packages`,
    "Shared internal packages."
  );
  addDirectory(
    directories,
    `${input.destination}/docs`,
    "Workspace documentation."
  );
  addDirectory(
    directories,
    `${input.destination}/tools/scripts`,
    "Repository-local scripts."
  );
  addDirectory(
    directories,
    `${input.destination}/contracts/openapi`,
    "OpenAPI contracts."
  );
  addDirectory(
    directories,
    `${input.destination}/generated/clients`,
    "Generated clients."
  );
  addDirectory(
    directories,
    `${input.destination}/config/foundry`,
    "Foundry configuration."
  );
  addDirectory(
    directories,
    `${input.destination}/templates`,
    "Scaffolding templates."
  );

  for (const directory of databasePlan.directories) {
    addDirectory(
      directories,
      `${input.destination}/${directory.path}`,
      directory.description
    );
  }

  return [...directories.values()];
}

function createFilePlan(
  input: InitPlanInput,
  databasePlan: InitDatabasePlan
): readonly InitPlanFile[] {
  const files = new Map<string, InitPlanFile>();

  addFile(files, `${input.destination}/package.json`, "Root Bun workspace package manifest.");
  addFile(files, `${input.destination}/bunfig.toml`, "Bun workspace configuration.");
  addFile(files, `${input.destination}/README.md`, "Root workspace README.");
  addFile(files, `${input.destination}/.gitignore`, "Default Git ignore rules.");
  addFile(files, `${input.destination}/tsconfig.base.json`, "Shared TypeScript configuration.");
  addFile(files, `${input.destination}/turbo.json`, "Turbo task graph.");
  addFile(files, `${input.destination}/.github/workflows/ci.yml`, "GitHub Actions CI workflow.");
  addFile(files, `${input.destination}/tools/scripts/foundry.sh`, "Root Foundry CLI wrapper.");
  addFile(files, `${input.destination}/tools/scripts/verify.sh`, "Root verification script.");
  addFile(files, `${input.destination}/packages/cli/src/index.ts`, "Embedded minimal Foundry CLI entrypoint.");
  addFile(files, `${input.destination}/config/foundry/generator-manifest.json`, "Foundry generator manifest.");
  addFile(files, `${input.destination}/.scaffdog/config.js`, "Scaffdog configuration placeholder.");

  for (const file of databasePlan.files) {
    addFile(files, `${input.destination}/${file.path}`, file.description);
  }

  return [...files.values()];
}

function createScriptPlan(
  input: InitPlanInput,
  databasePlan: InitDatabasePlan
): readonly InitPlanScript[] {
  const scripts = new Map<string, InitPlanScript>();

  addScript(scripts, {
    name: "foundry",
    command: "bash tools/scripts/foundry.sh",
    description: "Run the embedded Foundry CLI from the repository root."
  });

  addScript(scripts, {
    name: "verify",
    command: "bash tools/scripts/verify.sh",
    description: "Run full repository verification."
  });

  for (const script of databasePlan.scripts) {
    addScript(scripts, script);
  }

  return [...scripts.values()];
}

function addDirectory(
  directories: Map<string, InitPlanDirectory>,
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
  files: Map<string, InitPlanFile>,
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

function addScript(
  scripts: Map<string, InitPlanScript>,
  script: InitPlanScript
): void {
  if (!scripts.has(script.name)) {
    scripts.set(script.name, script);
  }
}