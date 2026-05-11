import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import {
  isSupportedInitDatabaseProviderId,
  listInitDatabaseProviderIds
} from "./database/registry.js";

export type InitValidationSeverity = "error";

export interface InitValidationIssue {
  readonly severity: InitValidationSeverity;
  readonly code: string;
  readonly message: string;
}

export interface InitValidationResult {
  readonly valid: boolean;
  readonly issues: readonly InitValidationIssue[];
}

export interface InitValidationInput {
  readonly destination?: string;
  readonly workspaceName?: string;
  readonly includeDatabase?: boolean;
  readonly databaseProvider?: string;
  readonly databaseProviderId?: string;
  readonly providerId?: string;
  readonly database?: unknown;
  readonly databases?: readonly unknown[];
}

interface NormalizedInitValidationInput {
  readonly destination: string;
  readonly workspaceName: string;
  readonly includeDatabase: boolean;
  readonly databaseProvider: string | undefined;
}

export async function validateInitConfig(
  input: InitValidationInput
): Promise<readonly InitValidationIssue[]> {
  const config = normalizeValidationInput(input);
  const issues: InitValidationIssue[] = [];

  issues.push(...validateDestination(config.destination));
  issues.push(...validateWorkspaceName(config.workspaceName));
  issues.push(...validateDatabaseProvider(config));

  const destinationIssues = issues.filter((issue) => {
    return [
      "destination-empty",
      "destination-absolute",
      "destination-windows-absolute",
      "destination-reserved",
      "destination-outside-cwd"
    ].includes(issue.code);
  });

  if (destinationIssues.length === 0) {
    issues.push(...(await validateDestinationState(config.destination)));
  }

  return issues;
}

export async function validateInitRequest(
  input: InitValidationInput
): Promise<InitValidationResult> {
  const issues = await validateInitConfig(input);

  return {
    valid: issues.length === 0,
    issues
  };
}

export async function validateInitOptions(
  input: InitValidationInput
): Promise<readonly InitValidationIssue[]> {
  return validateInitConfig(input);
}

export async function validateInitConfiguration(
  input: InitValidationInput
): Promise<readonly InitValidationIssue[]> {
  return validateInitConfig(input);
}

function normalizeValidationInput(
  input: InitValidationInput
): NormalizedInitValidationInput {
  const destination = normalizeDestinationPath(
    normalizeString(input.destination) ?? "myapp"
  );
  const workspaceName =
    normalizeString(input.workspaceName) ??
    deriveWorkspaceNameFromDestination(destination);

  const directProvider =
    normalizeString(input.databaseProvider) ??
    normalizeString(input.databaseProviderId) ??
    normalizeString(input.providerId) ??
    getDatabaseProviderFromDatabaseValue(input.database) ??
    getDatabaseProviderFromDatabaseList(input.databases);

  const includeDatabase =
    input.includeDatabase ??
    inferIncludeDatabase(input.database, input.databases, directProvider);

  return {
    destination,
    workspaceName,
    includeDatabase,
    databaseProvider: directProvider
  };
}

function validateDestination(
  destination: string
): readonly InitValidationIssue[] {
  const issues: InitValidationIssue[] = [];

  if (destination.trim().length === 0) {
    issues.push({
      severity: "error",
      code: "destination-empty",
      message: "Destination must not be empty."
    });

    return issues;
  }

  if (path.isAbsolute(destination)) {
    issues.push({
      severity: "error",
      code: "destination-absolute",
      message: "Destination must be repository-relative for this initializer slice."
    });
  }

  if (isWindowsAbsolutePath(destination)) {
    issues.push({
      severity: "error",
      code: "destination-windows-absolute",
      message: "Destination must be repository-relative and must not use a Windows absolute path."
    });
  }

  if (destination === "." || destination === "..") {
    issues.push({
      severity: "error",
      code: "destination-reserved",
      message: "Destination must not be . or ..."
    });
  }

  const resolvedDestination = path.resolve(getInvocationCwd(), destination);

  if (!isPathInside(getInvocationCwd(), resolvedDestination)) {
    issues.push({
      severity: "error",
      code: "destination-outside-cwd",
      message: "Destination resolves outside the current working directory."
    });
  }

  return issues;
}

function validateWorkspaceName(
  workspaceName: string
): readonly InitValidationIssue[] {
  const issues: InitValidationIssue[] = [];

  if (workspaceName.trim().length === 0) {
    issues.push({
      severity: "error",
      code: "workspace-name-empty",
      message: "Workspace name must not be empty."
    });
  }

  if (workspaceName === "." || workspaceName === "..") {
    issues.push({
      severity: "error",
      code: "workspace-name-reserved",
      message: "Workspace name must not be . or ..."
    });
  }

  if (containsPathSeparator(workspaceName)) {
    issues.push({
      severity: "error",
      code: "project-name-path-separator",
      message: "Project name must not contain path separators."
    });
  }

  return issues;
}

function validateDatabaseProvider(
  config: NormalizedInitValidationInput
): readonly InitValidationIssue[] {
  if (!config.includeDatabase) {
    return [];
  }

  const providerId = config.databaseProvider ?? "postgres:drizzle";
  const normalizedProviderId = providerId.trim().toLowerCase();

  if (isSupportedInitDatabaseProviderId(normalizedProviderId)) {
    return [];
  }

  return [
    {
      severity: "error",
      code: "database-provider-unsupported",
      message: `Unsupported database provider "${providerId}". Available providers: ${formatAvailableInitDatabaseProviderIds()}`
    }
  ];
}

async function validateDestinationState(
  destination: string
): Promise<readonly InitValidationIssue[]> {
  const resolvedDestination = path.resolve(getInvocationCwd(), destination);
  const state = await inspectDestination(resolvedDestination);

  if (state === "file") {
    return [
      {
        severity: "error",
        code: "destination-file",
        message: `Destination already exists and is a file: ${destination}`
      }
    ];
  }

  if (state === "non-empty-directory") {
    return [
      {
        severity: "error",
        code: "destination-not-empty",
        message: `Destination already exists and is not empty: ${destination}`
      }
    ];
  }

  return [];
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
    if (isNodeErrorWithCode(error, "ENOENT")) {
      return "missing";
    }

    throw error;
  }
}

function inferIncludeDatabase(
  database: unknown,
  databases: readonly unknown[] | undefined,
  providerId: string | undefined
): boolean {
  if (providerId) {
    return true;
  }

  if (Array.isArray(databases) && databases.length > 0) {
    return true;
  }

  if (database === true) {
    return true;
  }

  if (database === false || database === null || database === undefined) {
    return false;
  }

  if (typeof database === "object" && !Array.isArray(database)) {
    return true;
  }

  return false;
}

function getDatabaseProviderFromDatabaseValue(
  database: unknown
): string | undefined {
  if (database === null || database === undefined) {
    return undefined;
  }

  if (typeof database !== "object" || Array.isArray(database)) {
    return undefined;
  }

  const record = database as Record<string, unknown>;

  return (
    getString(record, "provider") ??
    getString(record, "providerId") ??
    getString(record, "id") ??
    getString(record, "databaseProvider") ??
    getString(record, "databaseProviderId")
  );
}

function getDatabaseProviderFromDatabaseList(
  databases: readonly unknown[] | undefined
): string | undefined {
  if (!Array.isArray(databases)) {
    return undefined;
  }

  for (const database of databases) {
    const provider = getDatabaseProviderFromDatabaseValue(database);

    if (provider) {
      return provider;
    }
  }

  return undefined;
}

function formatAvailableInitDatabaseProviderIds(): string {
  return listInitDatabaseProviderIds().join(", ");
}

function getInvocationCwd(): string {
  const invocationCwd = process.env.FOUNDRY_INVOCATION_CWD;

  if (typeof invocationCwd === "string" && invocationCwd.trim().length > 0) {
    return path.resolve(invocationCwd);
  }

  return process.cwd();
}

function normalizeDestinationPath(destination: string): string {
  return destination.trim().replaceAll("\\", "/").replace(/\/+$/, "") || "myapp";
}

function deriveWorkspaceNameFromDestination(destination: string): string {
  const normalized = normalizeDestinationPath(destination);
  const segments = normalized.split("/").filter((segment) => segment.length > 0);

  return segments.at(-1) ?? "myapp";
}

function containsPathSeparator(value: string): boolean {
  return value.includes("/") || value.includes("\\");
}

function isWindowsAbsolutePath(value: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(value) || value.startsWith("\\\\");
}

function isPathInside(parentPath: string, childPath: string): boolean {
  const relativePath = path.relative(parentPath, childPath);

  return (
    relativePath.length === 0 ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}

function normalizeString(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function getString(
  record: Record<string, unknown>,
  key: string
): string | undefined {
  const value = record[key];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function isNodeErrorWithCode(error: unknown, code: string): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { readonly code?: unknown }).code === code
  );
}
