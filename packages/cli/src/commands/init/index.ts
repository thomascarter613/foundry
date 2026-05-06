import { Args, Command, Flags } from "@oclif/core";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import {
  runInitWizard,
  supportedInitWizardDatabaseProviders,
  type InitWizardDatabaseProviderId
} from "../../init/wizard.js";
import { writeInitWorkspace } from "../../init/writer.js";

type InitDatabaseProviderId = InitWizardDatabaseProviderId;

interface InitConfig {
  readonly destination: string;
  readonly workspaceName: string;
  readonly includeDatabase: boolean;
  readonly databaseProvider: InitDatabaseProviderId | undefined;
  readonly installDependencies: boolean;
}

interface InitValidationIssue {
  readonly severity: "error";
  readonly code: string;
  readonly message: string;
}

interface InitPlanDirectory {
  readonly path: string;
  readonly description: string;
}

interface InitPlanFile {
  readonly path: string;
  readonly description: string;
}

interface InitPlanScript {
  readonly name: string;
  readonly command: string;
  readonly description: string;
}

interface InitPlan {
  readonly destination: string;
  readonly workspaceName: string;
  readonly includeDatabase: boolean;
  readonly databaseProvider: InitDatabaseProviderId | undefined;
  readonly installDependencies: boolean;
  readonly directories: readonly InitPlanDirectory[];
  readonly files: readonly InitPlanFile[];
  readonly scripts: readonly InitPlanScript[];
}

const databaseProviders = supportedInitWizardDatabaseProviders();

export default class Init extends Command {
  static override readonly description =
    "Initialize a new Foundry workspace with optional database provider templates.";

  static override readonly examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> myapp",
    "<%= config.bin %> <%= command.id %> myapp --dry-run",
    "<%= config.bin %> <%= command.id %> myapp --no-database --yes --no-install",
    "<%= config.bin %> <%= command.id %> myapp --database-provider postgres:drizzle --yes --no-install",
    "<%= config.bin %> <%= command.id %> myapp --database-provider postgres:prisma --yes --no-install",
    "<%= config.bin %> <%= command.id %> myapp --database-provider sqlite:drizzle --yes --no-install",
    "<%= config.bin %> <%= command.id %> myapp --database-provider mongodb:native --yes --no-install",
    "<%= config.bin %> <%= command.id %> myapp --database-provider supabase:client --yes --no-install"
  ];

  static override readonly args = {
    destination: Args.string({
      description:
        "Repository-relative workspace directory to create. Defaults to myapp.",
      required: false
    })
  };

  static override readonly flags = {
    yes: Flags.boolean({
      char: "y",
      default: false,
      description:
        "Skip the interactive wizard and write the workspace immediately."
    }),

    "dry-run": Flags.boolean({
      default: false,
      description:
        "Print the initialization plan without writing files."
    }),

    "no-install": Flags.boolean({
      default: false,
      description:
        "Do not install dependencies after writing workspace files."
    }),

    "no-database": Flags.boolean({
      default: false,
      description:
        "Initialize without database provider files."
    }),

    "database-provider": Flags.string({
      description:
        "Database provider to configure. Supported Tier 1 providers include postgres:drizzle, postgres:prisma, sqlite:drizzle, sqlite:prisma, mongodb:native, supabase:sql, supabase:drizzle, supabase:prisma, and supabase:client.",
      options: [...databaseProviders]
    })
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Init);

    let config = buildInitialConfig({
      destination: args.destination,
      noDatabase: flags["no-database"],
      databaseProvider: flags["database-provider"],
      noInstall: flags["no-install"]
    });

    let confirmedByWizard = false;

    const shouldRunWizard =
      !flags.yes && !flags["dry-run"] && process.stdin.isTTY;

    if (shouldRunWizard) {
      const wizardAnswers = await runInitWizard({
        destination: config.destination,
        includeDatabase: config.includeDatabase,
        databaseProvider: config.databaseProvider,
        installDependencies: config.installDependencies
      });

      if (!wizardAnswers.confirmed) {
        this.log("Foundry init cancelled.");
        return;
      }

      config = {
        destination: wizardAnswers.destination,
        workspaceName: inferWorkspaceName(wizardAnswers.destination),
        includeDatabase: wizardAnswers.includeDatabase,
        databaseProvider: wizardAnswers.includeDatabase
          ? wizardAnswers.databaseProvider ?? "postgres:drizzle"
          : undefined,
        installDependencies: wizardAnswers.installDependencies
      };

      confirmedByWizard = true;
    }

    const issues = await validateInitConfig(config);

    if (issues.length > 0) {
      this.error(formatValidationFailure(issues), { exit: 1 });
    }

    const plan = createInitPlan(config);

    if (flags["dry-run"] || (!flags.yes && !confirmedByWizard)) {
      printPlan(this, plan);

      this.log("");
      this.log("No files were written.");
      this.log("Re-run with --yes to write the workspace non-interactively.");
      return;
    }

    printPlan(this, plan);

    const writeConfig: InitConfig = {
      ...config,
      destination: resolveInitDestination(config.destination)
    };

    const result = await writeInitWorkspace({
      config: writeConfig,
      installDependencies: config.installDependencies,
      plan
    });

    this.log("");
    this.log(`Initialized Foundry workspace: ${result.destination}`);
    this.log(`Directories created: ${result.directoriesCreated}`);
    this.log(`Files written: ${result.filesWritten}`);

    this.log("");

    if (result.dependenciesInstalled) {
      this.log(`Dependencies installed: yes (${result.installCommand ?? "bun install"})`);
    } else if (config.installDependencies) {
      this.log("Dependencies installed: no");
      this.log("Run this manually if installation did not complete:");
      this.log(`- cd ${result.destination}`);
      this.log("- bun install");
    } else {
      this.log("Dependencies installed: skipped by --no-install");
    }

    this.log("");
    this.log("Next steps:");
    this.log(`- cd ${result.destination}`);
    this.log("- bun run foundry -- generate --list");
    this.log("- bun run verify");
  }
}

function buildInitialConfig(input: {
  readonly destination: string | undefined;
  readonly noDatabase: boolean;
  readonly databaseProvider: string | undefined;
  readonly noInstall: boolean;
}): InitConfig {
  const destination = input.destination ?? "myapp";
  const includeDatabase =
    input.noDatabase ? false : input.databaseProvider !== undefined;

  return {
    destination,
    workspaceName: inferWorkspaceName(destination),
    includeDatabase,
    databaseProvider: includeDatabase
      ? normalizeDatabaseProvider(input.databaseProvider ?? "postgres:drizzle")
      : undefined,
    installDependencies: !input.noInstall
  };
}

async function validateInitConfig(
  config: InitConfig
): Promise<readonly InitValidationIssue[]> {
  const issues: InitValidationIssue[] = [];

  if (config.destination.trim().length === 0) {
    issues.push({
      severity: "error",
      code: "destination-empty",
      message: "Destination must not be empty."
    });
  }

  if (path.isAbsolute(config.destination)) {
    issues.push({
      severity: "error",
      code: "destination-absolute",
      message: "Destination must be repository-relative for this initializer slice."
    });
  }

  if (containsPathSeparator(config.destination)) {
    issues.push({
      severity: "error",
      code: "project-name-path-separator",
      message: "Project name must not contain path separators."
    });
  }

  if (config.destination === "." || config.destination === "..") {
    issues.push({
      severity: "error",
      code: "destination-reserved",
      message: "Destination must not be . or ..."
    });
  }

  const resolvedDestination = resolveInitDestination(config.destination);

  if (!isPathInside(getInvocationCwd(), resolvedDestination)) {
    issues.push({
      severity: "error",
      code: "destination-outside-cwd",
      message: "Destination resolves outside the current working directory."
    });
  }

  if (
    config.includeDatabase &&
    config.databaseProvider !== undefined &&
    !isDatabaseProvider(config.databaseProvider)
  ) {
    issues.push({
      severity: "error",
      code: "database-provider-unsupported",
      message: `Unsupported database provider: ${config.databaseProvider}. Supported providers: ${databaseProviders.join(", ")}`
    });
  }

  const destinationState = await inspectDestination(resolvedDestination);

  if (destinationState === "file") {
    issues.push({
      severity: "error",
      code: "destination-file",
      message: `Destination already exists and is a file: ${config.destination}`
    });
  }

  if (destinationState === "non-empty-directory") {
    issues.push({
      severity: "error",
      code: "destination-not-empty",
      message: `Destination already exists and is not empty: ${config.destination}`
    });
  }

  return issues;
}

async function inspectDestination(
  destination: string
): Promise<"missing" | "empty-directory" | "non-empty-directory" | "file"> {
  try {
    const destinationStat = await stat(destination);

    if (!destinationStat.isDirectory()) {
      return "file";
    }

    const entries = await readdir(destination);

    return entries.length === 0 ? "empty-directory" : "non-empty-directory";
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return "missing";
    }

    throw error;
  }
}

function createInitPlan(config: InitConfig): InitPlan {
  const directories: InitPlanDirectory[] = [
    {
      path: config.destination,
      description: "Workspace root."
    },
    {
      path: `${config.destination}/apps`,
      description: "Application surfaces."
    },
    {
      path: `${config.destination}/services`,
      description: "Backend services and workers."
    },
    {
      path: `${config.destination}/packages`,
      description: "Shared internal packages."
    },
    {
      path: `${config.destination}/docs`,
      description: "Workspace documentation."
    },
    {
      path: `${config.destination}/tools/scripts`,
      description: "Repository-local scripts."
    },
    {
      path: `${config.destination}/contracts/openapi`,
      description: "OpenAPI contracts."
    },
    {
      path: `${config.destination}/generated/clients`,
      description: "Generated clients."
    },
    {
      path: `${config.destination}/config/foundry`,
      description: "Foundry configuration."
    },
    {
      path: `${config.destination}/templates`,
      description: "Scaffolding templates."
    }
  ];

  const files: InitPlanFile[] = [
    {
      path: `${config.destination}/package.json`,
      description: "Root Bun workspace package manifest."
    },
    {
      path: `${config.destination}/bunfig.toml`,
      description: "Bun workspace configuration."
    },
    {
      path: `${config.destination}/README.md`,
      description: "Root workspace README."
    },
    {
      path: `${config.destination}/.gitignore`,
      description: "Default Git ignore rules."
    },
    {
      path: `${config.destination}/tsconfig.base.json`,
      description: "Shared TypeScript configuration."
    },
    {
      path: `${config.destination}/turbo.json`,
      description: "Turbo task graph."
    },
    {
      path: `${config.destination}/.github/workflows/ci.yml`,
      description: "GitHub Actions CI workflow."
    },
    {
      path: `${config.destination}/tools/scripts/foundry.sh`,
      description: "Root Foundry CLI wrapper."
    },
    {
      path: `${config.destination}/tools/scripts/verify.sh`,
      description: "Root verification script."
    },
    {
      path: `${config.destination}/packages/cli/src/index.ts`,
      description: "Embedded minimal Foundry CLI entrypoint."
    },
    {
      path: `${config.destination}/config/foundry/generator-manifest.json`,
      description: "Foundry generator manifest."
    },
    {
      path: `${config.destination}/.scaffdog/config.js`,
      description: "Scaffdog configuration placeholder."
    }
  ];

  if (config.includeDatabase) {
    directories.push({
      path: `${config.destination}/db`,
      description: "Database provider files."
    });

    files.push({
      path: `${config.destination}/db/provider.json`,
      description: `Database provider metadata for ${config.databaseProvider ?? "postgres:drizzle"}.`
    });

    files.push({
      path: `${config.destination}/.env.example`,
      description: "Database environment variable example file."
    });

    files.push({
      path: `${config.destination}/tools/scripts/db-validate.sh`,
      description: "Database validation script."
    });

    files.push({
      path: `${config.destination}/tools/scripts/db-start.sh`,
      description: "Database local service start script."
    });

    files.push({
      path: `${config.destination}/tools/scripts/db-stop.sh`,
      description: "Database local service stop script."
    });
  }

  return {
    destination: config.destination,
    workspaceName: config.workspaceName,
    includeDatabase: config.includeDatabase,
    databaseProvider: config.databaseProvider,
    installDependencies: config.installDependencies,
    directories,
    files,
    scripts: createPlanScripts(config)
  };
}

function createPlanScripts(config: InitConfig): readonly InitPlanScript[] {
  const scripts: InitPlanScript[] = [
    {
      name: "foundry",
      command: "bash tools/scripts/foundry.sh",
      description: "Run the embedded Foundry CLI from the repository root."
    },
    {
      name: "verify",
      command: "bash tools/scripts/verify.sh",
      description: "Run full repository verification."
    }
  ];

  if (config.includeDatabase) {
    scripts.push(
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
    );
  }

  return scripts;
}

function printPlan(command: Command, plan: InitPlan): void {
  command.log("");
  command.log("Foundry init plan");
  command.log("");
  command.log(`Workspace: ${plan.workspaceName}`);
  command.log(`Destination: ${plan.destination}`);
  command.log(
    `Database provider: ${plan.databaseProvider ?? "none / no database"}`
  );
  command.log(
    `Install dependencies: ${plan.installDependencies ? "yes" : "no"}`
  );

  command.log("");
  command.log("Directories:");
  for (const directory of plan.directories) {
    command.log(`- ${directory.path}`);
    command.log(`  ${directory.description}`);
  }

  command.log("");
  command.log("Files:");
  for (const file of plan.files) {
    command.log(`- ${file.path}`);
    command.log(`  ${file.description}`);
  }

  command.log("");
  command.log("Scripts:");
  for (const script of plan.scripts) {
    command.log(`- ${script.name}: ${script.command}`);
    command.log(`  ${script.description}`);
  }
}

function formatValidationFailure(
  issues: readonly InitValidationIssue[]
): string {
  const formattedIssues = issues
    .map((issue) => {
      return `- ${issue.severity}: ${issue.code}
  ${issue.message}`;
    })
    .join("\n");

  return `Foundry init was blocked because the initialization request is invalid.

Issues:
${formattedIssues}

Fix the inputs and run the command again.`;
}

function inferWorkspaceName(destination: string): string {
  return path.basename(destination);
}

function containsPathSeparator(value: string): boolean {
  return value.includes("/") || value.includes("\\");
}

function isPathInside(parentPath: string, childPath: string): boolean {
  const relativePath = path.relative(parentPath, childPath);

  return (
    relativePath.length === 0 ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}

function normalizeDatabaseProvider(
  provider: string
): InitDatabaseProviderId {
  if (isDatabaseProvider(provider)) {
    return provider;
  }

  throw new Error(
    `Unsupported database provider: ${provider}. Supported providers: ${databaseProviders.join(", ")}`
  );
}

function isDatabaseProvider(value: string): value is InitDatabaseProviderId {
  return databaseProviders.includes(value as InitDatabaseProviderId);
}

function getInvocationCwd(): string {
  const invocationCwd = process.env.FOUNDRY_INVOCATION_CWD;

  if (typeof invocationCwd === "string" && invocationCwd.trim().length > 0) {
    return path.resolve(invocationCwd);
  }

  return process.cwd();
}

function resolveInitDestination(destination: string): string {
  return path.resolve(getInvocationCwd(), destination);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}