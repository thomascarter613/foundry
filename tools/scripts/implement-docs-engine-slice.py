#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


FILES: dict[str, str] = {
    "packages/cli/src/docs/types.ts": '''export type DocsEngineSeverity = "error" | "warning" | "info";

export type DocumentStatus = "Draft" | "Approved" | "Deprecated";

export type GovernanceLevel = "Informational" | "Required" | "Binding";

export type DocumentType =
  | "Planning"
  | "Governance"
  | "Architecture"
  | "ADR"
  | "ChangePlan"
  | "Lifecycle"
  | "Standard"
  | "Platform"
  | "Onboarding"
  | "Product"
  | "Scaffolding"
  | "WorkPacket"
  | "Idea";

export type DocsEngineOptions = {
  readonly repoRoot: string;
  readonly docsDir?: string;
  readonly failOnWarnings?: boolean;
};

export type MarkdownDocumentSource = {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly content: string;
};

export type ParsedFrontmatter = {
  readonly raw: string;
  readonly data: Record<string, unknown>;
};

export type ParsedMarkdownDocument = {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly content: string;
  readonly body: string;
  readonly frontmatter: ParsedFrontmatter | null;
};

export type DocsValidationIssue = {
  readonly severity: DocsEngineSeverity;
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly field?: string;
};

export type DocumentValidationResult = {
  readonly path: string;
  readonly issues: readonly DocsValidationIssue[];
};

export type DocsValidationSummary = {
  readonly checkedDocuments: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
};

export type DocsValidationReport = {
  readonly ok: boolean;
  readonly summary: DocsValidationSummary;
  readonly documents: readonly DocumentValidationResult[];
  readonly issues: readonly DocsValidationIssue[];
};
''',

    "packages/cli/src/docs/scanner.ts": '''import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import type { MarkdownDocumentSource } from "./types.js";

export type ScanDocsOptions = {
  readonly repoRoot: string;
  readonly docsDir?: string;
};

export type ScanDocsResult =
  | {
      readonly ok: true;
      readonly docsRoot: string;
      readonly documents: readonly MarkdownDocumentSource[];
    }
  | {
      readonly ok: false;
      readonly docsRoot: string;
      readonly reason: string;
    };

export function scanMarkdownDocuments(options: ScanDocsOptions): ScanDocsResult {
  const docsRoot = join(options.repoRoot, options.docsDir ?? "docs");

  if (!existsSync(docsRoot)) {
    return {
      ok: false,
      docsRoot,
      reason: "Missing docs/ directory."
    };
  }

  if (!statSync(docsRoot).isDirectory()) {
    return {
      ok: false,
      docsRoot,
      reason: "docs exists but is not a directory."
    };
  }

  const documents = walkMarkdownFiles(docsRoot)
    .sort()
    .map((absolutePath) => ({
      absolutePath,
      relativePath: relative(options.repoRoot, absolutePath).replaceAll("\\\\", "/"),
      content: readFileSync(absolutePath, "utf8")
    }));

  return {
    ok: true,
    docsRoot,
    documents
  };
}

function walkMarkdownFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return walkMarkdownFiles(absolutePath);
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      return [absolutePath];
    }

    return [];
  });
}
''',

    "packages/cli/src/docs/frontmatter.ts": '''import type {
  MarkdownDocumentSource,
  ParsedFrontmatter,
  ParsedMarkdownDocument
} from "./types.js";

export function parseMarkdownDocument(source: MarkdownDocumentSource): ParsedMarkdownDocument {
  const normalizedContent = source.content.replace(/\\r\\n/g, "\\n");
  const frontmatter = extractYamlFrontmatter(normalizedContent);

  if (!frontmatter) {
    return {
      absolutePath: source.absolutePath,
      relativePath: source.relativePath,
      content: normalizedContent,
      body: normalizedContent,
      frontmatter: null
    };
  }

  return {
    absolutePath: source.absolutePath,
    relativePath: source.relativePath,
    content: normalizedContent,
    body: normalizedContent.slice(frontmatter.endOffset).replace(/^\\n+/, ""),
    frontmatter: {
      raw: frontmatter.raw,
      data: parseSimpleYaml(frontmatter.raw)
    }
  };
}

type ExtractedFrontmatter = {
  readonly raw: string;
  readonly endOffset: number;
};

function extractYamlFrontmatter(content: string): ExtractedFrontmatter | null {
  if (!content.startsWith("---\\n")) {
    return null;
  }

  const closingMarkerIndex = content.indexOf("\\n---\\n", 4);

  if (closingMarkerIndex <= 0) {
    return null;
  }

  return {
    raw: content.slice(4, closingMarkerIndex),
    endOffset: closingMarkerIndex + "\\n---\\n".length
  };
}

function parseSimpleYaml(frontmatter: string): ParsedFrontmatter["data"] {
  const data: Record<string, unknown> = {};
  let activeArrayKey: string | null = null;

  for (const line of frontmatter.split("\\n")) {
    if (line.trim() === "" || line.trim().startsWith("#")) {
      continue;
    }

    const arrayItemMatch = line.match(/^\\s*-\\s+(.*)$/);

    if (arrayItemMatch && activeArrayKey) {
      const current = data[activeArrayKey];

      if (Array.isArray(current)) {
        current.push(unquote(arrayItemMatch[1] ?? ""));
      }

      continue;
    }

    const keyValueMatch = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\\s*(.*)$/);

    if (!keyValueMatch) {
      activeArrayKey = null;
      continue;
    }

    const key = keyValueMatch[1];
    const rawValue = keyValueMatch[2] ?? "";

    if (!key) {
      activeArrayKey = null;
      continue;
    }

    if (rawValue.trim() === "" || rawValue.trim() === "[]") {
      data[key] = [];
      activeArrayKey = key;
      continue;
    }

    if (rawValue.trim().startsWith("[") && rawValue.trim().endsWith("]")) {
      data[key] = parseInlineArray(rawValue.trim());
      activeArrayKey = null;
      continue;
    }

    data[key] = unquote(rawValue);
    activeArrayKey = null;
  }

  return data;
}

function parseInlineArray(rawValue: string): string[] {
  const inner = rawValue.slice(1, -1).trim();

  if (inner.length === 0) {
    return [];
  }

  return inner.split(",").map((item) => unquote(item.trim()));
}

function unquote(value: string): string {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith("\\"") && trimmed.endsWith("\\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}
''',

    "packages/cli/src/docs/metadata.ts": '''import type {
  DocumentStatus,
  DocumentType,
  GovernanceLevel,
  ParsedMarkdownDocument
} from "./types.js";

export const validStatuses = new Set<DocumentStatus>([
  "Draft",
  "Approved",
  "Deprecated"
]);

export const validGovernanceLevels = new Set<GovernanceLevel>([
  "Informational",
  "Required",
  "Binding"
]);

export const validDocumentTypes = new Set<DocumentType>([
  "Planning",
  "Governance",
  "Architecture",
  "ADR",
  "ChangePlan",
  "Lifecycle",
  "Standard",
  "Platform",
  "Onboarding",
  "Product",
  "Scaffolding",
  "WorkPacket",
  "Idea"
]);

export const requiredFrontmatterFields = [
  "title",
  "status",
  "owner",
  "lastUpdated",
  "governanceLevel",
  "documentType"
] as const;

export const optionalArrayFrontmatterFields = [
  "upstream",
  "downstream",
  "governanceLinks",
  "adrLinks",
  "glossaryTerms"
] as const;

export type RequiredFrontmatterField = (typeof requiredFrontmatterFields)[number];

export function getFrontmatterString(document: ParsedMarkdownDocument, field: string): string | null {
  const value = document.frontmatter?.data[field];

  return typeof value === "string" ? value : null;
}

export function getFrontmatterArray(document: ParsedMarkdownDocument, field: string): readonly string[] | null {
  const value = document.frontmatter?.data[field];

  if (!Array.isArray(value)) {
    return null;
  }

  if (value.every((item) => typeof item === "string")) {
    return value;
  }

  return null;
}

export function expectedDocumentTypesForPath(relativePath: string): readonly DocumentType[] {
  if (relativePath.startsWith("docs/architecture/adr/")) {
    return ["ADR", "Architecture"];
  }

  if (relativePath.startsWith("docs/adr/")) {
    return ["ADR"];
  }

  if (relativePath.startsWith("docs/architecture/")) {
    return ["Architecture"];
  }

  if (relativePath.startsWith("docs/changeplans/")) {
    return ["ChangePlan"];
  }

  if (relativePath.startsWith("docs/work-packets/")) {
    return ["WorkPacket", "ChangePlan"];
  }

  if (relativePath.startsWith("docs/governance/")) {
    return ["Governance"];
  }

  if (relativePath.startsWith("docs/lifecycle/")) {
    return ["Lifecycle"];
  }

  if (relativePath.startsWith("docs/onboarding/")) {
    return ["Onboarding"];
  }

  if (relativePath.startsWith("docs/planning/")) {
    return ["Planning"];
  }

  if (relativePath.startsWith("docs/platform/")) {
    return ["Platform"];
  }

  if (relativePath.startsWith("docs/product/")) {
    return ["Product", "Planning"];
  }

  if (relativePath.startsWith("docs/scaffolding/")) {
    return ["Scaffolding", "Platform"];
  }

  if (relativePath.startsWith("docs/standards/")) {
    return ["Standard"];
  }

  if (relativePath.startsWith("docs/.ideas/")) {
    return ["Idea", "Planning"];
  }

  if (relativePath === "docs/index.md" || relativePath === "docs/README.md") {
    return ["Onboarding", "Planning"];
  }

  return [];
}
''',

    "packages/cli/src/docs/validator.ts": '''import {
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

  if (lastUpdated && !/^\\d{4}-\\d{2}-\\d{2}$/.test(lastUpdated)) {
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
''',

    "packages/cli/src/docs/reporter.ts": '''import type {
  DocsValidationIssue,
  DocsValidationReport,
  DocsValidationSummary,
  DocumentValidationResult
} from "./types.js";

export function createValidationReport(
  documents: readonly DocumentValidationResult[],
  failOnWarnings = false
): DocsValidationReport {
  const issues = documents.flatMap((document) => [...document.issues]);
  const summary = summarizeIssues(documents.length, issues);
  const ok = summary.errorCount === 0 && (!failOnWarnings || summary.warningCount === 0);

  return {
    ok,
    summary,
    documents,
    issues
  };
}

export function formatValidationReportAsText(report: DocsValidationReport): string {
  const lines: string[] = [];

  if (report.ok) {
    lines.push("Docs verification passed.");
    lines.push(`Checked ${report.summary.checkedDocuments} Markdown file(s).`);
    lines.push(`${report.summary.warningCount} warning(s) found.`);

    return lines.join("\\n");
  }

  lines.push("Docs verification failed.");
  lines.push("");

  for (const issue of report.issues) {
    lines.push(`- ${issue.path}: ${issue.message}`);
  }

  lines.push("");
  lines.push(`Checked ${report.summary.checkedDocuments} Markdown file(s).`);
  lines.push(`${report.summary.errorCount} error(s) found.`);
  lines.push(`${report.summary.warningCount} warning(s) found.`);

  return lines.join("\\n");
}

export function formatValidationReportAsJson(report: DocsValidationReport): string {
  return JSON.stringify(report, null, 2);
}

function summarizeIssues(
  checkedDocuments: number,
  issues: readonly DocsValidationIssue[]
): DocsValidationSummary {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const issue of issues) {
    if (issue.severity === "error") {
      errorCount += 1;
      continue;
    }

    if (issue.severity === "warning") {
      warningCount += 1;
      continue;
    }

    infoCount += 1;
  }

  return {
    checkedDocuments,
    errorCount,
    warningCount,
    infoCount
  };
}
''',

    "packages/cli/src/docs/engine.ts": '''import { parseMarkdownDocument } from "./frontmatter.js";
import { createValidationReport } from "./reporter.js";
import { scanMarkdownDocuments } from "./scanner.js";
import type { DocsEngineOptions, DocsValidationReport, DocumentValidationResult } from "./types.js";
import { validateParsedDocument } from "./validator.js";

export function runDocsValidation(options: DocsEngineOptions): DocsValidationReport {
  const scanResult = scanMarkdownDocuments({
    repoRoot: options.repoRoot,
    docsDir: options.docsDir
  });

  if (!scanResult.ok) {
    const result: DocumentValidationResult = {
      path: options.docsDir ?? "docs",
      issues: [
        {
          severity: "error",
          code: "docs.scanFailed",
          message: scanResult.reason,
          path: options.docsDir ?? "docs"
        }
      ]
    };

    return createValidationReport([result], options.failOnWarnings ?? false);
  }

  const documentResults = scanResult.documents.map((source) =>
    validateParsedDocument(parseMarkdownDocument(source), {
      strictDirectoryTypes: false
    })
  );

  return createValidationReport(documentResults, options.failOnWarnings ?? false);
}
''',

    "packages/cli/src/docs/index.ts": '''export { runDocsValidation } from "./engine.js";
export {
  createValidationReport,
  formatValidationReportAsJson,
  formatValidationReportAsText
} from "./reporter.js";
export { scanMarkdownDocuments } from "./scanner.js";
export { parseMarkdownDocument } from "./frontmatter.js";
export { validateParsedDocument } from "./validator.js";
export type {
  DocsEngineOptions,
  DocsValidationIssue,
  DocsValidationReport,
  DocsValidationSummary,
  DocumentStatus,
  DocumentType,
  DocumentValidationResult,
  GovernanceLevel,
  MarkdownDocumentSource,
  ParsedFrontmatter,
  ParsedMarkdownDocument
} from "./types.js";
''',

    "packages/cli/src/commands/docs/validate.ts": '''import { Command, Flags } from "@oclif/core";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  formatValidationReportAsJson,
  formatValidationReportAsText,
  runDocsValidation
} from "../../docs/index.js";

export default class DocsValidate extends Command {
  static override summary = "Validate the governed documentation corpus.";

  static override description = `
Scan, parse, validate, and report on the repository documentation corpus.

This is the first docs-engine slice. It validates Markdown discovery,
YAML frontmatter parsing, governed metadata fields, enum values,
document type placement warnings, forbidden citation artifacts, and merge
conflict markers.
`;

  static override examples = [
    {
      description: "Validate docs with human-readable output.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Validate docs and print JSON.",
      command: "<%= config.bin %> <%= command.id %> --json"
    },
    {
      description: "Validate docs and write a JSON report.",
      command: "<%= config.bin %> <%= command.id %> --report-path .artifacts/docs/validation-report.json"
    }
  ];

  static override flags = {
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to validate."
    }),
    "fail-on-warnings": Flags.boolean({
      default: false,
      description: "Exit non-zero when warnings are present."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the validation report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional path to write a JSON validation report."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsValidate);
    const repoRoot = resolve(flags.root);

    const report = runDocsValidation({
      repoRoot,
      docsDir: flags["docs-dir"],
      failOnWarnings: flags["fail-on-warnings"]
    });

    if (flags["report-path"]) {
      writeFileSync(resolve(repoRoot, flags["report-path"]), formatValidationReportAsJson(report));
    }

    this.log(flags.json ? formatValidationReportAsJson(report) : formatValidationReportAsText(report));

    if (!report.ok) {
      this.exit(1);
    }
  }
}
''',

    "tools/scripts/verify-docs.ts": '''import {
  formatValidationReportAsText,
  runDocsValidation
} from "../../packages/cli/src/docs/index.ts";

const report = runDocsValidation({
  repoRoot: process.cwd(),
  docsDir: "docs"
});

console.log(formatValidationReportAsText(report));

if (!report.ok) {
  process.exit(1);
}
''',
}


def main() -> int:
    for file_name, content in FILES.items():
        path = Path(file_name)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        print(f"wrote {file_name}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
