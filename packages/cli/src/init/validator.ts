import {
  formatAvailableDatabaseProviderIds,
  lookupDatabaseProvider,
  normalizeProviderId
} from "./database/registry.js";
import type {
  InitConfig,
  InitDatabaseOption,
  InitValidationIssue,
  InitValidationResult
} from "./types.js";

const RESERVED_NAMES = new Set([
  ".",
  "..",
  "aux",
  "com1",
  "com2",
  "com3",
  "com4",
  "com5",
  "com6",
  "com7",
  "com8",
  "com9",
  "con",
  "lpt1",
  "lpt2",
  "lpt3",
  "lpt4",
  "lpt5",
  "lpt6",
  "lpt7",
  "lpt8",
  "lpt9",
  "nul",
  "prn"
]);

export function validateInitConfig(config: InitConfig): InitValidationResult {
  const issues: InitValidationIssue[] = [
    ...validateProjectName(config.projectName),
    ...validatePackageScope(config.packageScope),
    ...validateDatabaseOptions(config.databases)
  ];

  return {
    ok: !issues.some((issue) => issue.level === "error"),
    issues
  };
}

export function formatInitValidationFailure(issues: readonly InitValidationIssue[]): string {
  const issueLines = issues.map((issue) => {
    return `- ${issue.level}: ${issue.code}\n  ${issue.message}`;
  });

  return [
    "Foundry init was blocked because the initialization request is invalid.",
    "",
    "Issues:",
    ...issueLines,
    "",
    "Fix the inputs and run the command again."
  ].join("\n");
}

function validateProjectName(projectName: string): InitValidationIssue[] {
  const issues: InitValidationIssue[] = [];
  const trimmed = projectName.trim();

  if (trimmed.length === 0) {
    issues.push({
      level: "error",
      code: "project-name-empty",
      message: "Project name must not be empty."
    });

    return issues;
  }

  if (trimmed.length > 80) {
    issues.push({
      level: "error",
      code: "project-name-too-long",
      message: "Project name must be 80 characters or fewer."
    });
  }

  if (/[\u0000-\u001f\u007f]/u.test(trimmed)) {
    issues.push({
      level: "error",
      code: "project-name-control-character",
      message: "Project name must not contain control characters."
    });
  }

  if (trimmed.includes("/") || trimmed.includes("\\")) {
    issues.push({
      level: "error",
      code: "project-name-path-separator",
      message: "Project name must not contain path separators."
    });
  }

  if (trimmed.includes("..")) {
    issues.push({
      level: "error",
      code: "project-name-path-traversal",
      message: "Project name must not contain '..'."
    });
  }

  const slug = slugify(trimmed);

  if (slug.length === 0) {
    issues.push({
      level: "error",
      code: "project-name-empty-slug",
      message: "Project name must contain at least one letter or number."
    });
  }

  if (RESERVED_NAMES.has(slug.toLowerCase())) {
    issues.push({
      level: "error",
      code: "project-name-reserved",
      message: `Project name "${trimmed}" resolves to reserved name "${slug}".`
    });
  }

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/u.test(slug)) {
    issues.push({
      level: "error",
      code: "project-name-invalid-slug",
      message: `Project name "${trimmed}" resolves to invalid slug "${slug}".`
    });
  }

  return issues;
}

function validatePackageScope(packageScope: string): InitValidationIssue[] {
  const issues: InitValidationIssue[] = [];
  const trimmed = packageScope.trim();

  if (trimmed.length === 0) {
    issues.push({
      level: "error",
      code: "package-scope-empty",
      message: "Package scope must not be empty."
    });

    return issues;
  }

  if (!/^@[a-z0-9][a-z0-9-]*$/u.test(trimmed)) {
    issues.push({
      level: "error",
      code: "package-scope-invalid",
      message: `Package scope "${packageScope}" is invalid. Expected a scope like "@repo" or "@my-org".`
    });
  }

  return issues;
}

function validateDatabaseOptions(databases: readonly InitDatabaseOption[]): InitValidationIssue[] {
  const issues: InitValidationIssue[] = [];
  const seenConnectionNames = new Set<string>();

  for (const database of databases) {
    const normalizedConnectionName = database.connectionName.trim().toLowerCase();

    if (normalizedConnectionName.length === 0) {
      issues.push({
        level: "error",
        code: "database-connection-name-empty",
        message: "Database connection name must not be empty."
      });
    }

    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/u.test(normalizedConnectionName)) {
      issues.push({
        level: "error",
        code: "database-connection-name-invalid",
        message: `Database connection name "${database.connectionName}" must use lowercase letters, numbers, and hyphens.`
      });
    }

    if (seenConnectionNames.has(normalizedConnectionName)) {
      issues.push({
        level: "error",
        code: "database-connection-name-duplicate",
        message: `Database connection name "${database.connectionName}" is used more than once.`
      });
    }

    seenConnectionNames.add(normalizedConnectionName);

    issues.push(...validateProviderId(database.providerId));
  }

  issues.push(...validateProviderCombinations(databases));

  return issues;
}

function validateProviderId(providerId: string): InitValidationIssue[] {
  const normalizedProviderId = normalizeProviderId(providerId);

  if (normalizedProviderId.length === 0) {
    return [
      {
        level: "error",
        code: "database-provider-empty",
        message: "Database provider ID must not be empty."
      }
    ];
  }

  if (!/^[a-z0-9-]+:[a-z0-9-]+$/u.test(normalizedProviderId)) {
    return [
      {
        level: "error",
        code: "database-provider-format-invalid",
        message: `Database provider ID "${providerId}" is invalid. Expected format "<target>:<toolkit>", such as "supabase:drizzle".`
      }
    ];
  }

  const lookup = lookupDatabaseProvider(normalizedProviderId);

  if (lookup.status === "available") {
    return [];
  }

  if (lookup.status === "planned" || lookup.status === "deferred") {
    return [
      {
        level: "error",
        code: "database-provider-not-implemented",
        message: `Database provider "${providerId}" is ${lookup.status} but not implemented in the current init slice.`
      }
    ];
  }

  return [
    {
      level: "error",
      code: "database-provider-unknown",
      message: [
        `Database provider "${providerId}" is not recognized.`,
        "",
        "Available providers:",
        formatAvailableDatabaseProviderIds()
      ].join("\n")
    }
  ];
}

function validateProviderCombinations(databases: readonly InitDatabaseOption[]): InitValidationIssue[] {
  const issues: InitValidationIssue[] = [];

  const providerIds = databases.map((database) => normalizeProviderId(database.providerId));
  const hasSupabaseClient = providerIds.includes("supabase:client");
  const hasSupabaseRuntime =
    providerIds.includes("supabase:sql") ||
    providerIds.includes("supabase:drizzle") ||
    providerIds.includes("supabase:prisma");

  if (hasSupabaseClient && !hasSupabaseRuntime) {
    issues.push({
      level: "warning",
      code: "supabase-client-without-runtime",
      message:
        "supabase:client was selected without supabase:sql, supabase:drizzle, or supabase:prisma. This is allowed, but the generated repo will rely on hosted Supabase environment variables."
    });
  }

  const prismaConnections = providerIds.filter((providerId) => providerId.endsWith(":prisma"));

  if (prismaConnections.length > 1) {
    issues.push({
      level: "warning",
      code: "multiple-prisma-connections",
      message:
        "Multiple Prisma-backed database connections require namespaced Prisma schema directories. The provider registry must preserve that rule."
    });
  }

  return issues;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/['"]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}
