import type { InitConfig, InitPlan, InitPlanDirectory, InitPlanFile, InitPlanScript } from "./types.js";

export function createInitPlan(config: InitConfig): InitPlan {
  const directories = createDirectoryPlan(config);
  const files = createFilePlan(config);
  const scripts = createScriptPlan(config);
  const postInitCommands = createPostInitCommands(config);
  const warnings = createWarnings(config);

  return {
    projectName: config.projectName,
    destination: config.destination,
    dryRun: true,
    summary: `Preview workspace initialization for "${config.projectName}".`,
    directories,
    files,
    scripts,
    databases: config.databases,
    postInitCommands,
    warnings
  };
}

function createDirectoryPlan(config: InitConfig): InitPlanDirectory[] {
  const directories: InitPlanDirectory[] = [
    {
      path: config.destination,
      description: "Workspace root."
    }
  ];

  if (config.includeApps) {
    directories.push({
      path: `${config.destination}/apps`,
      description: "Application workspaces."
    });
  }

  if (config.includePackages) {
    directories.push({
      path: `${config.destination}/packages`,
      description: "Shared package workspaces."
    });
  }

  if (config.includeFoundryCli) {
    directories.push({
      path: `${config.destination}/packages/cli`,
      description: "Embedded Foundry CLI package."
    });
  }

  if (config.includeServices) {
    directories.push({
      path: `${config.destination}/services`,
      description: "Service workspaces."
    });
  }

  if (config.includeTools) {
    directories.push({
      path: `${config.destination}/tools/scripts`,
      description: "Repository scripts and automation."
    });
  }

  if (config.includeDocs) {
    directories.push({
      path: `${config.destination}/docs`,
      description: "Documentation."
    });
  }

  if (config.includeContracts) {
    directories.push({
      path: `${config.destination}/contracts/openapi`,
      description: "OpenAPI contracts."
    });
  }

  if (config.includeGenerated) {
    directories.push({
      path: `${config.destination}/generated/clients`,
      description: "Generated API clients."
    });
  }

  directories.push(
    {
      path: `${config.destination}/config/foundry`,
      description: "Foundry configuration."
    },
    {
      path: `${config.destination}/templates`,
      description: "Generator templates."
    },
    {
      path: `${config.destination}/.scaffdog`,
      description: "Scaffdog document templates."
    },
    {
      path: `${config.destination}/.github/workflows`,
      description: "GitHub Actions workflows."
    }
  );

  if (config.databases.length > 0) {
    directories.push(
      {
        path: `${config.destination}/config/database`,
        description: "Database connection manifest."
      },
      {
        path: `${config.destination}/db`,
        description: "Database schemas, migrations, seeds, rollbacks, and provider files."
      }
    );

    for (const database of config.databases) {
      directories.push(
        {
          path: `${config.destination}/db/${database.connectionName}/schema`,
          description: `Schema files for ${database.connectionName}.`
        },
        {
          path: `${config.destination}/db/${database.connectionName}/migrations`,
          description: `Migration files for ${database.connectionName}.`
        },
        {
          path: `${config.destination}/db/${database.connectionName}/rollbacks`,
          description: `Rollback files for ${database.connectionName}.`
        },
        {
          path: `${config.destination}/db/${database.connectionName}/seeds`,
          description: `Seed files for ${database.connectionName}.`
        }
      );

      if (database.providerId.startsWith("supabase:")) {
        directories.push(
          {
            path: `${config.destination}/supabase/migrations`,
            description: "Supabase SQL migrations."
          },
          {
            path: `${config.destination}/supabase/functions`,
            description: "Supabase Edge Functions."
          }
        );
      }

      if (database.providerId.endsWith(":prisma")) {
        directories.push({
          path: `${config.destination}/prisma/${database.connectionName}`,
          description: `Prisma schema directory for ${database.connectionName}.`
        });
      }
    }
  }

  return directories;
}

function createFilePlan(config: InitConfig): InitPlanFile[] {
  const files: InitPlanFile[] = [
    {
      path: `${config.destination}/package.json`,
      description: "Root package manifest with Bun workspaces."
    },
    {
      path: `${config.destination}/README.md`,
      description: "Workspace README."
    },
    {
      path: `${config.destination}/.gitignore`,
      description: "Git ignore rules."
    },
    {
      path: `${config.destination}/tsconfig.base.json`,
      description: "Shared TypeScript base config."
    },
    {
      path: `${config.destination}/turbo.json`,
      description: "Task orchestration config."
    }
  ];

  if (config.includeCi) {
    files.push({
      path: `${config.destination}/.github/workflows/ci.yml`,
      description: "CI workflow running repository verification."
    });
  }

  if (config.includeFoundryCli) {
    files.push({
      path: `${config.destination}/packages/cli/package.json`,
      description: "Embedded Foundry CLI package manifest."
    });
  }

  if (config.databases.length > 0) {
    files.push(
      {
        path: `${config.destination}/.env.example`,
        description: "Database environment variable template."
      },
      {
        path: `${config.destination}/config/database/connections.json`,
        description: "Database connection manifest."
      },
      {
        path: `${config.destination}/tools/scripts/db.ts`,
        description: "Unified database lifecycle dispatcher."
      }
    );

    for (const database of config.databases) {
      if (database.providerId.startsWith("supabase:")) {
        files.push(
          {
            path: `${config.destination}/supabase/config.toml`,
            description: "Supabase local project config."
          },
          {
            path: `${config.destination}/supabase/seed.sql`,
            description: "Supabase seed SQL."
          }
        );
      }

      if (database.providerId.endsWith(":prisma")) {
        files.push({
          path: `${config.destination}/prisma/${database.connectionName}/schema.prisma`,
          description: `Prisma schema for ${database.connectionName}.`
        });
      }
    }
  }

  return files;
}

function createScriptPlan(config: InitConfig): InitPlanScript[] {
  const scripts: InitPlanScript[] = [
    {
      name: "foundry",
      command: "bash tools/scripts/foundry.sh"
    },
    {
      name: "verify",
      command: "bash tools/scripts/verify.sh"
    }
  ];

  if (config.databases.length > 0) {
    scripts.push(
      {
        name: "db:check",
        command: "bun run tools/scripts/db.ts check"
      },
      {
        name: "db:up",
        command: "bun run tools/scripts/db.ts up"
      },
      {
        name: "db:down",
        command: "bun run tools/scripts/db.ts down"
      },
      {
        name: "db:migrate",
        command: "bun run tools/scripts/db.ts migrate"
      },
      {
        name: "db:seed",
        command: "bun run tools/scripts/db.ts seed"
      },
      {
        name: "db:rollback",
        command: "bun run tools/scripts/db.ts rollback"
      },
      {
        name: "db:reset",
        command: "bun run tools/scripts/db.ts reset"
      }
    );

    if (config.databases.some((database) => database.providerId.startsWith("supabase:"))) {
      scripts.push(
        {
          name: "supabase:start",
          command: "supabase start"
        },
        {
          name: "supabase:stop",
          command: "supabase stop"
        },
        {
          name: "supabase:status",
          command: "supabase status"
        },
        {
          name: "supabase:reset",
          command: "supabase db reset"
        }
      );
    }
  }

  return scripts;
}

function createPostInitCommands(config: InitConfig): string[] {
  const commands = [`cd ${config.destination}`];

  if (config.installDependencies) {
    commands.push("bun install");
  }

  commands.push("bun run foundry -- generate --list");

  if (config.runVerification) {
    commands.push("bun run verify");
  }

  return commands;
}

function createWarnings(config: InitConfig): string[] {
  const warnings: string[] = [];

  if (config.databases.length > 0) {
    warnings.push("Database files are planned but not written in this slice.");
  }

  if (config.databases.some((database) => database.providerId.startsWith("supabase:"))) {
    warnings.push("Supabase providers may require the Supabase CLI and Docker for local runtime workflows.");
  }

  return warnings;
}
