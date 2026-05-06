import type { InitDatabaseProviderId } from "./providers.js";
import type { DatabaseTemplateFile } from "./templates.js";

export type InitDatabaseProviderCapability =
  | "local-service"
  | "sql"
  | "document"
  | "orm"
  | "client"
  | "migrations"
  | "supabase"
  | "docker-compose"
  | "file-database"
  | "cloud-managed";

export interface InitDatabaseProviderPackageAdditions {
  readonly dependencies: Readonly<Record<string, string>>;
  readonly devDependencies: Readonly<Record<string, string>>;
}

export interface InitDatabaseProviderEnvironmentVariable {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
  readonly example: string | undefined;
  readonly secret: boolean;
}

export interface InitDatabaseProviderCommand {
  readonly name: string;
  readonly command: string;
  readonly description: string;
}

export interface InitDatabaseProviderPluginMetadata {
  readonly id: InitDatabaseProviderId | string;
  readonly family: string;
  readonly adapter: string;
  readonly label: string;
  readonly description: string;
  readonly tier: number | "external" | "custom";
  readonly status: "available" | "planned" | "experimental" | "deprecated";
  readonly firstClassSupabase: boolean;
  readonly capabilities: readonly InitDatabaseProviderCapability[];
}

export interface InitDatabaseProviderTemplateContext {
  readonly workspaceName: string;
  readonly providerId: string;
}

export interface InitDatabaseProviderPlugin {
  readonly metadata: InitDatabaseProviderPluginMetadata;

  getPackageAdditions(): InitDatabaseProviderPackageAdditions;

  getEnvironmentVariables(): readonly InitDatabaseProviderEnvironmentVariable[];

  getCommands(): readonly InitDatabaseProviderCommand[];

  buildFiles(
    context: InitDatabaseProviderTemplateContext
  ): readonly DatabaseTemplateFile[];
}

export function assertValidInitDatabaseProviderPlugin(
  plugin: InitDatabaseProviderPlugin
): void {
  assertNonEmptyString(plugin.metadata.id, "metadata.id");
  assertNonEmptyString(plugin.metadata.family, "metadata.family");
  assertNonEmptyString(plugin.metadata.adapter, "metadata.adapter");
  assertNonEmptyString(plugin.metadata.label, "metadata.label");
  assertNonEmptyString(plugin.metadata.description, "metadata.description");

  if (!Array.isArray(plugin.metadata.capabilities)) {
    throw new Error("metadata.capabilities must be an array.");
  }

  for (const capability of plugin.metadata.capabilities) {
    assertNonEmptyString(capability, "metadata.capabilities[]");
  }

  assertPackageAdditions(plugin.getPackageAdditions());

  for (const envVar of plugin.getEnvironmentVariables()) {
    assertNonEmptyString(envVar.name, "environment variable name");
    assertNonEmptyString(
      envVar.description,
      `environment variable description for ${envVar.name}`
    );
  }

  for (const command of plugin.getCommands()) {
    assertNonEmptyString(command.name, "command.name");
    assertNonEmptyString(command.command, `command.command for ${command.name}`);
    assertNonEmptyString(
      command.description,
      `command.description for ${command.name}`
    );
  }

  const files = plugin.buildFiles({
    workspaceName: "validation-workspace",
    providerId: plugin.metadata.id
  });

  if (!Array.isArray(files)) {
    throw new Error("buildFiles() must return an array.");
  }

  for (const file of files) {
    assertNonEmptyString(file.relativePath, "file.relativePath");
    assertNonEmptyString(file.description, `description for ${file.relativePath}`);

    if (typeof file.contents !== "string") {
      throw new Error(`contents for ${file.relativePath} must be a string.`);
    }
  }
}

function assertPackageAdditions(
  additions: InitDatabaseProviderPackageAdditions
): void {
  if (typeof additions !== "object" || additions === null) {
    throw new Error("Package additions must be an object.");
  }

  if (
    typeof additions.dependencies !== "object" ||
    additions.dependencies === null
  ) {
    throw new Error("Package additions dependencies must be an object.");
  }

  if (
    typeof additions.devDependencies !== "object" ||
    additions.devDependencies === null
  ) {
    throw new Error("Package additions devDependencies must be an object.");
  }
}

function assertNonEmptyString(value: unknown, label: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}