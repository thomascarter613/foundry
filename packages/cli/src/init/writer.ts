import { chmod, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildDatabaseTemplateFiles,
  getDatabasePackageAdditions,
  normalizeDatabaseTemplateProviderId,
  type DatabaseTemplateProviderId
} from "./database/templates.js";
import {
  buildBaseWorkspaceTemplateFiles,
  type WorkspaceTemplateFile
} from "./templates.js";

export interface WriteInitWorkspaceInput {
  readonly config: unknown;
  readonly installDependencies?: boolean;
  readonly plan?: unknown;
}

export interface WrittenInitFile {
  readonly path: string;
  readonly description: string;
}

export interface WriteInitWorkspaceResult {
  readonly destination: string;
  readonly directoriesCreated: number;
  readonly filesWritten: number;
  readonly files: readonly WrittenInitFile[];
}

interface NormalizedInitWriterConfig {
  readonly destination: string;
  readonly workspaceName: string;
  readonly includeDatabase: boolean;
  readonly databaseProvider: DatabaseTemplateProviderId | undefined;
}

export async function writeInitWorkspace(
  input: WriteInitWorkspaceInput
): Promise<WriteInitWorkspaceResult> {
  const config = normalizeInitWriterConfig(input);
  const files = buildWorkspaceFiles(config);
  const directories = new Set<string>();

  for (const file of files) {
    const absolutePath = path.join(config.destination, file.relativePath);
    const directoryPath = path.dirname(absolutePath);

    directories.add(path.relative(config.destination, directoryPath) || ".");

    await mkdir(directoryPath, { recursive: true });
    await writeFile(absolutePath, file.contents, { encoding: "utf8" });

    if (file.executable) {
      await chmod(absolutePath, 0o755);
    }
  }

  return {
    destination: config.destination,
    directoriesCreated: directories.size,
    filesWritten: files.length,
    files: files.map((file) => ({
      path: file.relativePath,
      description: file.description
    }))
  };
}

function normalizeInitWriterConfig(
  input: WriteInitWorkspaceInput
): NormalizedInitWriterConfig {
  const configRecord = toRecord(input.config, "init writer config");
  const planRecord = toOptionalRecord(input.plan);

  const destination =
    getString(configRecord, [
      "destination",
      "destinationPath",
      "absoluteDestinationPath",
      "targetPath",
      "rootPath"
    ]) ??
    getString(planRecord, [
      "destination",
      "destinationPath",
      "absoluteDestinationPath",
      "targetPath",
      "rootPath"
    ]) ??
    process.cwd();

  const workspaceName =
    getString(configRecord, ["workspaceName", "name", "projectName"]) ??
    getString(planRecord, ["workspaceName", "name", "projectName"]) ??
    path.basename(destination);

  const explicitIncludeDatabase =
    getBoolean(configRecord, [
      "includeDatabase",
      "databaseEnabled",
      "withDatabase"
    ]) ??
    getBoolean(planRecord, [
      "includeDatabase",
      "databaseEnabled",
      "withDatabase"
    ]);

  const rawProvider =
    getDatabaseProviderId(configRecord) ?? getDatabaseProviderId(planRecord);

  const includeDatabase =
    explicitIncludeDatabase ??
    inferIncludeDatabase(configRecord, rawProvider) ??
    inferIncludeDatabase(planRecord, rawProvider) ??
    false;

  const databaseProvider = includeDatabase
    ? normalizeDatabaseTemplateProviderId(rawProvider ?? "postgres:drizzle")
    : undefined;

  return {
    destination,
    workspaceName,
    includeDatabase,
    databaseProvider
  };
}

function buildWorkspaceFiles(
  config: NormalizedInitWriterConfig
): readonly WorkspaceTemplateFile[] {
  const databasePackageAdditions = config.databaseProvider
    ? getDatabasePackageAdditions(config.databaseProvider)
    : {
        dependencies: {},
        devDependencies: {}
      };

  const baselineFiles = buildBaseWorkspaceTemplateFiles({
    workspaceName: config.workspaceName,
    databaseProvider: config.databaseProvider,
    databaseDependencies: databasePackageAdditions.dependencies,
    databaseDevDependencies: databasePackageAdditions.devDependencies
  });

  const databaseFiles = config.databaseProvider
    ? buildDatabaseTemplateFiles(config.databaseProvider)
    : [];

  return [...baselineFiles, ...databaseFiles];
}

function toRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Expected ${label} to be an object.`);
  }

  return value as Record<string, unknown>;
}

function toOptionalRecord(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getString(
  record: Record<string, unknown>,
  keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function getBoolean(
  record: Record<string, unknown>,
  keys: readonly string[]
): boolean | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }
  }

  return undefined;
}

function inferIncludeDatabase(
  record: Record<string, unknown>,
  rawProvider: string | undefined
): boolean | undefined {
  const database = record.database;

  if (database === false || database === null) {
    return false;
  }

  if (database === true) {
    return true;
  }

  if (rawProvider) {
    return true;
  }

  if (typeof database === "object" && !Array.isArray(database)) {
    return true;
  }

  return undefined;
}

function getDatabaseProviderId(
  record: Record<string, unknown>
): string | undefined {
  const direct = getString(record, [
    "databaseProvider",
    "databaseProviderId",
    "providerId",
    "selectedDatabaseProvider"
  ]);

  if (direct) {
    return direct;
  }

  const database = toOptionalRecord(record.database);

  return getString(database, [
    "provider",
    "providerId",
    "id",
    "databaseProvider",
    "databaseProviderId"
  ]);
}