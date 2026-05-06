import { Args, Command, Flags } from "@oclif/core";

import { createDefaultInitConfig } from "../../init/defaults.js";
import { createInitPlan } from "../../init/planner.js";
import { validateDestination } from "../../init/path-safety.js";
import type { InitDatabaseOption, InitPlan, InitValidationIssue } from "../../init/types.js";
import { formatInitValidationFailure, validateInitConfig } from "../../init/validator.js";
import { writeInitWorkspace } from "../../init/writer.js";

export default class Init extends Command {
  static override summary = "Initialize a new Foundry monorepo workspace.";

  static override description = `
Initialize a new, tested, monorepo-ready workspace with an embedded Foundry CLI.

Database-enabled workspaces are currently dry-run only. No-database workspaces
can be written with --yes and without --dry-run.
`;

  static override examples = [
    {
      description: "Preview a no-database workspace.",
      command: "<%= config.bin %> <%= command.id %> myapp --no-database --yes --no-install --dry-run"
    },
    {
      description: "Create a no-database workspace.",
      command: "<%= config.bin %> <%= command.id %> myapp --no-database --yes --no-install"
    },
    {
      description: "Preview a Supabase + Drizzle workspace.",
      command: "<%= config.bin %> <%= command.id %> myapp --db primary=supabase:drizzle --yes --no-install --dry-run"
    },
    {
      description: "Preview a Supabase + MongoDB multi-database workspace.",
      command:
        "<%= config.bin %> <%= command.id %> myapp --db primary=supabase:drizzle --db documents=mongodb:native --yes --no-install --dry-run"
    }
  ];

  static override args = {
    name: Args.string({
      description: "Project directory name to initialize.",
      required: false
    })
  };

  static override flags = {
    db: Flags.string({
      description: "Database provider selection, e.g. primary=supabase:drizzle or mongodb:native.",
      multiple: true
    }),
    "dry-run": Flags.boolean({
      default: false,
      description: "Preview the workspace initialization plan without writing files."
    }),
    "no-database": Flags.boolean({
      default: false,
      description: "Disable database scaffolding."
    }),
    "no-install": Flags.boolean({
      default: false,
      description: "Do not install dependencies after writing files."
    }),
    "no-verify": Flags.boolean({
      default: false,
      description: "Do not run verification after initialization."
    }),
    scope: Flags.string({
      default: "@repo",
      description: "Workspace package scope."
    }),
    yes: Flags.boolean({
      char: "y",
      default: false,
      description: "Use defaults and do not prompt interactively."
    })
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Init);

    const projectName = args.name ?? "my-foundry-app";
    const databases = flags["no-database"] ? [] : parseDatabaseFlags(flags.db);

    const config = createDefaultInitConfig({
      projectName,
      packageScope: flags.scope,
      installDependencies: !flags["no-install"],
      runVerification: !flags["no-verify"],
      databases
    });

    const configValidation = validateInitConfig(config);
    const destinationValidation = await validateDestination({
      destination: config.destination
    });

    const allIssues: InitValidationIssue[] = [
      ...configValidation.issues,
      ...destinationValidation.issues
    ];

    const hasErrors = allIssues.some((issue) => issue.level === "error");

    if (hasErrors) {
      this.error(formatInitValidationFailure(allIssues), { exit: 1 });
    }

    const plan = createInitPlan(config);

    if (flags["dry-run"]) {
      this.printPlan(plan, allIssues);
      this.log("");
      this.log("No files were written because --dry-run was provided.");
      return;
    }

    if (!flags.yes) {
      this.error(
        [
          "Interactive prompts are not implemented yet.",
          "",
          "Use --yes for non-interactive workspace initialization, or use --dry-run to preview."
        ].join("\n"),
        { exit: 1 }
      );
    }

    if (config.databases.length > 0) {
      this.printPlan(plan, allIssues);
      this.log("");
      this.error(
        "Database-enabled workspace writing is not implemented in this slice. Use --dry-run or --no-database.",
        { exit: 1 }
      );
    }

    const result = await writeInitWorkspace({
      config,
      plan
    });

    this.log(`Initialized Foundry workspace: ${result.destination}`);
    this.log("");
    this.log(`Directories created: ${result.directoriesCreated}`);
    this.log(`Files written: ${result.filesWritten}`);
    this.log("");

    this.log("Written files:");
    for (const file of result.files) {
      this.log(`- ${file}`);
    }

    this.log("");
    this.log("Next steps:");
    this.log(`- cd ${result.destination}`);

    if (config.installDependencies) {
      this.log("- bun install");
    }

    this.log("- bun run foundry -- generate --list");

    if (config.runVerification) {
      this.log("- bun run verify");
    }
  }

  private printPlan(plan: InitPlan, issues: readonly InitValidationIssue[]): void {
    this.log(`Project: ${plan.projectName}`);
    this.log(`Destination: ${plan.destination}`);
    this.log(`Dry run: ${plan.dryRun ? "yes" : "no"}`);
    this.log("");
    this.log(plan.summary);
    this.log("");

    this.log("Planned directories:");
    for (const directory of plan.directories) {
      this.log(`- ${directory.path}`);
      this.log(`  ${directory.description}`);
    }

    this.log("");
    this.log("Planned files:");
    for (const file of plan.files) {
      this.log(`- ${file.path}`);
      this.log(`  ${file.description}`);
    }

    this.log("");
    this.log("Planned scripts:");
    for (const script of plan.scripts) {
      this.log(`- ${script.name}: ${script.command}`);
      this.log(`  ${script.description}`);
    }

    if (plan.databaseConnections.length > 0) {
      this.log("");
      this.log("Planned database connections:");
      for (const database of plan.databaseConnections) {
        this.log(`- ${database.connectionName}: ${database.providerId}`);
        this.log(`  provider: ${database.providerDisplayName}`);
        this.log(`  database: ${database.database}`);
        this.log(`  toolkit: ${database.toolkit}`);
        this.log(`  migrations: ${database.supportsMigrations ? "yes" : "no"}`);
        this.log(`  seeding: ${database.supportsSeeding ? "yes" : "no"}`);
        this.log(`  rollback: ${database.supportsRollback}`);
        this.log(`  docker compose: ${database.supportsDockerCompose ? "yes" : "no"}`);
        this.log(`  supabase local stack: ${database.supportsSupabaseLocalStack ? "yes" : "no"}`);

        if (database.generatedFilePatterns.length > 0) {
          this.log("  provider file patterns:");
          for (const filePattern of database.generatedFilePatterns) {
            this.log(`  - ${filePattern}`);
          }
        }

        if (database.notes.length > 0) {
          this.log("  notes:");
          for (const note of database.notes) {
            this.log(`  - ${note}`);
          }
        }
      }
    } else {
      this.log("");
      this.log("Planned database connections: none");
    }

    if (plan.dependencies.length > 0) {
      this.log("");
      this.log("Planned dependencies:");
      for (const dependency of plan.dependencies) {
        this.log(`- ${dependency.name}`);
        this.log(`  requested by: ${dependency.requestedBy.join(", ")}`);
      }
    }

    if (plan.devDependencies.length > 0) {
      this.log("");
      this.log("Planned dev dependencies:");
      for (const dependency of plan.devDependencies) {
        this.log(`- ${dependency.name}`);
        this.log(`  requested by: ${dependency.requestedBy.join(", ")}`);
      }
    }

    if (plan.envVars.length > 0) {
      this.log("");
      this.log("Planned environment variables:");
      for (const envVar of plan.envVars) {
        this.log(`- ${envVar.name}`);
        this.log(`  required: ${envVar.required ? "yes" : "no"}`);
        this.log(`  secret: ${envVar.secret ? "yes" : "no"}`);
        this.log(`  ${envVar.description}`);
        if (envVar.example) {
          this.log(`  example: ${envVar.example}`);
        }

        this.log(`  requested by: ${envVar.requestedBy.join(", ")}`);
      }
    }

    const warnings = [
      ...plan.warnings,
      ...issues.filter((issue) => issue.level === "warning").map((issue) => `${issue.code}: ${issue.message}`)
    ];

    if (warnings.length > 0) {
      this.log("");
      this.log("Warnings:");
      for (const warning of warnings) {
        this.log(`- ${warning}`);
      }
    }

    this.log("");
    this.log("Post-init commands:");
    for (const command of plan.postInitCommands) {
      this.log(`- ${command}`);
    }
  }
}

function parseDatabaseFlags(rawValues: string[] | undefined): InitDatabaseOption[] {
  if (!rawValues || rawValues.length === 0) {
    return [
      {
        connectionName: "primary",
        providerId: "supabase:drizzle"
      }
    ];
  }

  return rawValues.map((rawValue, index) => parseDatabaseFlag(rawValue, index));
}

function parseDatabaseFlag(rawValue: string, index: number): InitDatabaseOption {
  const [maybeName, maybeProvider] = rawValue.split("=");

  if (maybeProvider) {
    return {
      connectionName: normalizeConnectionName(maybeName),
      providerId: maybeProvider.trim().toLowerCase()
    };
  }

  return {
    connectionName: index === 0 ? "primary" : `connection${index + 1}`,
    providerId: rawValue.trim().toLowerCase()
  };
}

function normalizeConnectionName(value: string | undefined): string {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "primary";
}
