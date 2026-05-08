import {
  expectedDocumentTypesForPath,
  getFrontmatterArray,
  getFrontmatterString,
  optionalArrayFrontmatterFields,
  requiredFrontmatterFields,
  validDocumentTypes,
  validGovernanceLevels,
  validStatuses
} from "./metadata.js";
import type {
  DocsValidationIssue,
  DocumentValidationResult,
  ParsedMarkdownDocument
} from "./types.js";

export type ValidateDocumentOptions = {
  readonly strictDirectoryTypes?: boolean;
};

export function validateParsedDocument(
  document: ParsedMarkdownDocument,
  options: ValidateDocumentOptions = {}
): DocumentValidationResult {
  const issues: DocsValidationIssue[] = [];

  if (!document.frontmatter) {
    issues.push({
      severity: "error",
      code: "frontmatter.missing",
      message: "missing YAML frontmatter block",
      path: document.relativePath
    });

    return {
      path: document.relativePath,
      issues
    };
  }

  validateRequiredFields(document, issues);
  validateEnumFields(document, issues);
  validateDateField(document, issues);
  validateArrayFields(document, issues);
  validateDocumentTypePlacement(document, issues, options);
  validateForbiddenContent(document, issues);

  return {
    path: document.relativePath,
    issues
  };
}

function validateRequiredFields(
  document: ParsedMarkdownDocument,
  issues: DocsValidationIssue[]
): void {
  for (const field of requiredFrontmatterFields) {
    const value = getFrontmatterString(document, field);

    if (!value || value.trim().length === 0) {
      issues.push({
        severity: "error",
        code: "frontmatter.requiredFieldMissing",
        message: `missing required frontmatter field: ${field}`,
        path: document.relativePath,
        field
      });
    }
  }
}

function validateEnumFields(
  document: ParsedMarkdownDocument,
  issues: DocsValidationIssue[]
): void {
  const status = getFrontmatterString(document, "status");
  const governanceLevel = getFrontmatterString(document, "governanceLevel");
  const documentType = getFrontmatterString(document, "documentType");

  if (status && !validStatuses.has(status as never)) {
    issues.push({
      severity: "error",
      code: "frontmatter.invalidStatus",
      message: `invalid status: ${status}`,
      path: document.relativePath,
      field: "status"
    });
  }

  if (governanceLevel && !validGovernanceLevels.has(governanceLevel as never)) {
    issues.push({
      severity: "error",
      code: "frontmatter.invalidGovernanceLevel",
      message: `invalid governanceLevel: ${governanceLevel}`,
      path: document.relativePath,
      field: "governanceLevel"
    });
  }

  if (documentType && !validDocumentTypes.has(documentType as never)) {
    issues.push({
      severity: "error",
      code: "frontmatter.invalidDocumentType",
      message: `invalid documentType: ${documentType}`,
      path: document.relativePath,
      field: "documentType"
    });
  }
}

function validateDateField(
  document: ParsedMarkdownDocument,
  issues: DocsValidationIssue[]
): void {
  const lastUpdated = getFrontmatterString(document, "lastUpdated");

  if (lastUpdated && !/^\d{4}-\d{2}-\d{2}$/.test(lastUpdated)) {
    issues.push({
      severity: "error",
      code: "frontmatter.invalidLastUpdated",
      message: `invalid lastUpdated date: ${lastUpdated}`,
      path: document.relativePath,
      field: "lastUpdated"
    });
  }
}

function validateArrayFields(
  document: ParsedMarkdownDocument,
  issues: DocsValidationIssue[]
): void {
  for (const field of optionalArrayFrontmatterFields) {
    const rawValue = document.frontmatter?.data[field];

    if (rawValue === undefined) {
      continue;
    }

    const arrayValue = getFrontmatterArray(document, field);

    if (!arrayValue) {
      issues.push({
        severity: "error",
        code: "frontmatter.invalidArrayField",
        message: `frontmatter field must be an array of strings: ${field}`,
        path: document.relativePath,
        field
      });
    }
  }
}

function validateDocumentTypePlacement(
  document: ParsedMarkdownDocument,
  issues: DocsValidationIssue[],
  options: ValidateDocumentOptions
): void {
  const documentType = getFrontmatterString(document, "documentType");

  if (!documentType) {
    return;
  }

  const expectedTypes = expectedDocumentTypesForPath(document.relativePath);

  if (expectedTypes.length === 0 || expectedTypes.includes(documentType as never)) {
    return;
  }

  issues.push({
    severity: options.strictDirectoryTypes ? "error" : "warning",
    code: "frontmatter.documentTypeDirectoryMismatch",
    message: `documentType ${documentType} does not match expected type(s): ${expectedTypes.join(", ")}`,
    path: document.relativePath,
    field: "documentType"
  });
}

function validateForbiddenContent(
  document: ParsedMarkdownDocument,
  issues: DocsValidationIssue[]
): void {
  if (document.content.includes("contentReference[oaicite:")) {
    issues.push({
      severity: "error",
      code: "content.forbiddenCitationArtifact",
      message: "contains forbidden contentReference citation artifact",
      path: document.relativePath
    });
  }

  if (
    document.content.includes("<<<<<<<") ||
    document.content.includes("=======") ||
    document.content.includes(">>>>>>>")
  ) {
    issues.push({
      severity: "error",
      code: "content.mergeConflictMarker",
      message: "contains possible merge conflict marker",
      path: document.relativePath
    });
  }
}
