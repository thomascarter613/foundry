import { createDatabaseWorkspacePlan, type DatabaseWorkspacePlan } from "./database/planner.js";
import type { InitConfig, InitPlan, InitPlanDirectory, InitPlanFile, InitPlanScript } from "./types.js";

export function createInitPlan(config: InitConfig): InitPlan {
  const databasePlan = createDatabaseWorkspacePlan(config.databases);
  const directories = createDirectoryPlan(config, databasePlan);
  const files = createFilePlan(config, databasePlan);
  const scripts = createScriptPlan(databasePlan);
  const postInitCommands = createPostInitCommands(config);
  const warnings = createWarnings(config, databasePlan);

  return {
    projectName: config.projectName,
    destination: config.destination,
    dryRun: true,
    summary: `Preview workspace initialization for "${config.projectName}".`,
    directories,
    files,
    scripts,
    databases: config.databases,
    databaseConnections: databasePlan.connections,
    dependencies: databasePlan.dependencies,
    devDependencies: databasePlan.devDependencies,
    envVars: databasePlan.envVars,
    postInitCommands,
    warnings
  };
}

function createDirectoryPlan(config: InitConfig, databasePlan: DatabaseWorkspacePlan): InitPlanDirectory[] {
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

  for (const directory of databasePlan.directories) {
    directories.push({
      path: `${config.destination}/${directory.path}`,
      description: directory.description
    });
  }

  return directories;
}

function createFilePlan(config: InitConfig, databasePlan: DatabaseWorkspacePlan): InitPlanFile[] {
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

  for (const file of databasePlan.files) {
    files.push({
      path: `${config.destination}/${file.path}`,
      description: file.description
    });
  }

  return files;
}

function createScriptPlan(databasePlan: DatabaseWorkspacePlan): InitPlanScript[] {
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

  for (const script of databasePlan.scripts) {
    scripts.push(script);
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

function createWarnings(config: InitConfig, databasePlan: DatabaseWorkspacePlan): string[] {
  const warnings: string[] = [];

  if (config.databases.length > 0) {
    warnings.push("Database provider files are planned but not written in this slice.");
  }

  warnings.push(...databasePlan.warnings);

  return warnings;
}
