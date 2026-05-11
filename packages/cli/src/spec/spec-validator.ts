import type {
  FoundrySpecFrontmatter,
  FoundrySpecKind,
  FoundrySpecLifecycleStatus,
  FoundrySpecRiskLevel,
  ParsedFoundrySpec,
  SpecValidationIssue,
  SpecValidationResult,
} from "./spec-types.js";

type FoundrySpecFrontmatterField = Extract<keyof FoundrySpecFrontmatter, string>;

const requiredFrontmatterFields: FoundrySpecFrontmatterField[] = [
  "id",
  "title",
  "status",
  "specStatus",
  "kind",
  "version",
  "created",
  "updated",
  "lastUpdated",
  "owner",
  "owners",
  "governanceLevel",
  "documentType",
  "related_adrs",
  "related_work_packets",
  "risk_level",
  "requires_ai",
  "requires_database_change",
  "requires_api_change",
  "requires_security_review",
  "requires_migration",
  "tags",
];

const validSpecStatuses: FoundrySpecLifecycleStatus[] = [
  "draft",
  "clarifying",
  "planned",
  "tasked",
  "approved",
  "implemented",
  "verified",
  "superseded",
  "rejected",
];

const validKinds: FoundrySpecKind[] = [
  "feature",
  "bugfix",
  "refactor",
  "architecture",
  "security",
  "operations",
  "documentation",
  "research",
];

const validRiskLevels: FoundrySpecRiskLevel[] = ["low", "medium", "high", "critical"];

const requiredSections = ["Summary", "Problem", "Goals", "Requirements"];

export function validateFoundrySpec(spec: ParsedFoundrySpec): SpecValidationResult {
  const issues: SpecValidationIssue[] = [];

  validateRequiredFrontmatter(spec, issues);
  validateFrontmatterValues(spec, issues);
  validateRequiredSections(spec, issues);
  validateGovernanceWarnings(spec, issues);

  return {
    ok: issues.every((issue) => issue.severity !== "error"),
    filePath: spec.filePath,
    issues,
  };
}

function validateRequiredFrontmatter(
  spec: ParsedFoundrySpec,
  issues: SpecValidationIssue[],
): void {
  for (const field of requiredFrontmatterFields) {
    const value = spec.frontmatter[field];

    if (value === undefined || value === null || value === "") {
      issues.push({
        severity: "error",
        code: "missing-frontmatter-field",
        message: `Missing required frontmatter field: ${field}`,
        field,
      });
    }
  }
}

function validateFrontmatterValues(spec: ParsedFoundrySpec, issues: SpecValidationIssue[]): void {
  const { frontmatter } = spec;

  if (
    typeof frontmatter.id === "string" &&
    !/^SPEC-\d{4,}$/.test(frontmatter.id)
  ) {
    issues.push({
      severity: "error",
      code: "invalid-spec-id",
      message: "Spec id must use the format SPEC-0001.",
      field: "id",
    });
  }

  if (
    frontmatter.specStatus !== undefined &&
    !validSpecStatuses.includes(frontmatter.specStatus as FoundrySpecLifecycleStatus)
  ) {
    issues.push({
      severity: "error",
      code: "invalid-spec-status",
      message: `Invalid spec lifecycle status: ${String(frontmatter.specStatus)}`,
      field: "specStatus",
    });
  }

  if (
    frontmatter.kind !== undefined &&
    !validKinds.includes(frontmatter.kind as FoundrySpecKind)
  ) {
    issues.push({
      severity: "error",
      code: "invalid-kind",
      message: `Invalid spec kind: ${String(frontmatter.kind)}`,
      field: "kind",
    });
  }

  if (
    frontmatter.risk_level !== undefined &&
    !validRiskLevels.includes(frontmatter.risk_level as FoundrySpecRiskLevel)
  ) {
    issues.push({
      severity: "error",
      code: "invalid-risk-level",
      message: `Invalid risk level: ${String(frontmatter.risk_level)}`,
      field: "risk_level",
    });
  }

  validateStringField(frontmatter.title, "title", issues);
  validateStringField(frontmatter.status, "status", issues);
  validateStringField(frontmatter.version, "version", issues);
  validateStringField(frontmatter.created, "created", issues);
  validateStringField(frontmatter.updated, "updated", issues);
  validateStringField(frontmatter.lastUpdated, "lastUpdated", issues);
  validateStringField(frontmatter.owner, "owner", issues);
  validateStringField(frontmatter.governanceLevel, "governanceLevel", issues);
  validateStringField(frontmatter.documentType, "documentType", issues);

  validateArrayField(frontmatter.owners, "owners", issues);
  validateArrayField(frontmatter.related_adrs, "related_adrs", issues);
  validateArrayField(frontmatter.related_work_packets, "related_work_packets", issues);
  validateArrayField(frontmatter.tags, "tags", issues);

  validateBooleanField(frontmatter.requires_ai, "requires_ai", issues);
  validateBooleanField(frontmatter.requires_database_change, "requires_database_change", issues);
  validateBooleanField(frontmatter.requires_api_change, "requires_api_change", issues);
  validateBooleanField(frontmatter.requires_security_review, "requires_security_review", issues);
  validateBooleanField(frontmatter.requires_migration, "requires_migration", issues);
}

function validateStringField(
  value: unknown,
  field: FoundrySpecFrontmatterField,
  issues: SpecValidationIssue[],
): void {
  if (value !== undefined && typeof value !== "string") {
    issues.push({
      severity: "error",
      code: "invalid-string-field",
      message: `Frontmatter field must be a string: ${field}`,
      field,
    });
  }
}

function validateArrayField(
  value: unknown,
  field: FoundrySpecFrontmatterField,
  issues: SpecValidationIssue[],
): void {
  if (value !== undefined && !Array.isArray(value)) {
    issues.push({
      severity: "error",
      code: "invalid-array-field",
      message: `Frontmatter field must be an array: ${field}`,
      field,
    });
  }
}

function validateBooleanField(
  value: unknown,
  field: FoundrySpecFrontmatterField,
  issues: SpecValidationIssue[],
): void {
  if (value !== undefined && typeof value !== "boolean") {
    issues.push({
      severity: "error",
      code: "invalid-boolean-field",
      message: `Frontmatter field must be a boolean: ${field}`,
      field,
    });
  }
}

function validateRequiredSections(spec: ParsedFoundrySpec, issues: SpecValidationIssue[]): void {
  for (const section of requiredSections) {
    const sectionPattern = new RegExp(`^##\\s+${escapeRegExp(section)}\\s*$`, "m");

    if (!sectionPattern.test(spec.body)) {
      issues.push({
        severity: "error",
        code: "missing-required-section",
        message: `Missing required section: ${section}`,
        section,
      });
    }
  }
}

function validateGovernanceWarnings(
  spec: ParsedFoundrySpec,
  issues: SpecValidationIssue[],
): void {
  if (spec.frontmatter.requires_security_review === true) {
    const hasSecuritySection = /^##\s+Security\s*$/m.test(spec.body);

    if (!hasSecuritySection) {
      issues.push({
        severity: "warning",
        code: "security-review-without-security-section",
        message:
          "Spec requires security review but does not include a Security section.",
        section: "Security",
      });
    }
  }

  if (spec.frontmatter.requires_database_change === true) {
    const hasDataSection = /^##\s+Data Model\s*$/m.test(spec.body);

    if (!hasDataSection) {
      issues.push({
        severity: "warning",
        code: "database-change-without-data-model-section",
        message:
          "Spec requires a database change but does not include a Data Model section.",
        section: "Data Model",
      });
    }
  }

  if (spec.frontmatter.requires_api_change === true) {
    const hasApiSection = /^##\s+API Contract\s*$/m.test(spec.body);

    if (!hasApiSection) {
      issues.push({
        severity: "warning",
        code: "api-change-without-api-contract-section",
        message:
          "Spec requires an API change but does not include an API Contract section.",
        section: "API Contract",
      });
    }
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
