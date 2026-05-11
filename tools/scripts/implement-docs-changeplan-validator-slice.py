#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


FILES: dict[str, str] = {
    "packages/cli/src/docs/changeplan-validator.ts": r'''import { parseMarkdownDocument } from "./frontmatter.js";
import { getFrontmatterString } from "./metadata.js";
import { scanMarkdownDocuments } from "./scanner.js";
import type { DocsValidationIssue, ParsedMarkdownDocument } from "./types.js";

export type ChangePlanValidationOptions = {
  readonly repoRoot: string;
  readonly docsDir?: string;
  readonly strictIndex?: boolean;
  readonly strictPlacement?: boolean;
  readonly failOnWarnings?: boolean;
};

export type ChangePlanRecord = {
  readonly number: string | null;
  readonly pathNumber: string | null;
  readonly title: string;
  readonly path: string;
  readonly status: string | null;
  readonly documentType: string | null;
  readonly isLegacyPlanningPath: boolean;
};

export type ChangePlanIndexEntry = {
  readonly number: string;
  readonly title: string;
  readonly status: string | null;
  readonly indexPath: string;
  readonly line: number;
};

export type ChangePlanValidationSummary = {
  readonly changePlanCount: number;
  readonly indexCount: number;
  readonly indexEntryCount: number;
  readonly legacyPlanningCount: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
};

export type ChangePlanValidationReport = {
  readonly ok: boolean;
  readonly summary: ChangePlanValidationSummary;
  readonly changePlans: readonly ChangePlanRecord[];
  readonly indexEntries: readonly ChangePlanIndexEntry[];
  readonly issues: readonly DocsValidationIssue[];
};

const validChangePlanStatuses = new Set(["Draft", "Approved", "Deprecated"]);

export function validateChangePlans(
  options: ChangePlanValidationOptions
): ChangePlanValidationReport {
  const scanResult = scanMarkdownDocuments({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {})
  });

  if (!scanResult.ok) {
    const issues: DocsValidationIssue[] = [
      {
        severity: "error",
        code: "changeplan.scanFailed",
        message: scanResult.reason,
        path: options.docsDir ?? "docs"
      }
    ];

    return createChangePlanValidationReport({
      changePlans: [],
      indexEntries: [],
      indexCount: 0,
      issues,
      failOnWarnings: options.failOnWarnings ?? false
    });
  }

  const parsedDocuments = scanResult.documents.map((document) => parseMarkdownDocument(document));
  const changePlanDocuments = parsedDocuments.filter(isChangePlanDocument);
  const indexDocuments = parsedDocuments.filter(isChangePlanIndexDocument);

  const changePlans = changePlanDocuments.map(createChangePlanRecord);
  const indexEntries = indexDocuments.flatMap(parseChangePlanIndexEntries);
  const issues: DocsValidationIssue[] = [];

  validateIndexPresence(indexDocuments, issues);
  validateChangePlanRecords({
    changePlans,
    issues,
    strictPlacement: options.strictPlacement ?? false
  });
  validateDuplicateChangePlanNumbers(changePlans, issues);
  validateIndexCoverage({
    changePlans,
    indexEntries,
    issues,
    strictIndex: options.strictIndex ?? false
  });
  validateIndexStatusConsistency({
    changePlans,
    indexEntries,
    issues,
    strictIndex: options.strictIndex ?? false
  });

  return createChangePlanValidationReport({
    changePlans,
    indexEntries,
    indexCount: indexDocuments.length,
    issues,
    failOnWarnings: options.failOnWarnings ?? false
  });
}

export function formatChangePlanValidationReportAsText(
  report: ChangePlanValidationReport
): string {
  const lines: string[] = [];

  lines.push(report.ok ? "ChangePlan validation passed." : "ChangePlan validation failed.");
  lines.push("");
  lines.push("Summary:");
  lines.push(`- ChangePlan files: ${report.summary.changePlanCount}`);
  lines.push(`- ChangePlan index files: ${report.summary.indexCount}`);
  lines.push(`- ChangePlan index entries: ${report.summary.indexEntryCount}`);
  lines.push(`- legacy planning CP files: ${report.summary.legacyPlanningCount}`);
  lines.push(`- errors: ${report.summary.errorCount}`);
  lines.push(`- warnings: ${report.summary.warningCount}`);
  lines.push(`- info: ${report.summary.infoCount}`);

  if (report.issues.length > 0) {
    lines.push("");
    lines.push("Issues:");

    for (const issue of report.issues) {
      lines.push(`- ${issue.severity}: ${issue.path}: ${issue.message}`);
    }
  }

  if (report.changePlans.length > 0) {
    lines.push("");
    lines.push("ChangePlan files:");

    for (const changePlan of report.changePlans) {
      lines.push(`- ${changePlan.number ?? "????"} ${changePlan.title} (${changePlan.path})`);
    }
  }

  return lines.join("\n");
}

export function formatChangePlanValidationReportAsJson(
  report: ChangePlanValidationReport
): string {
  return JSON.stringify(report, null, 2);
}

function isChangePlanDocument(document: ParsedMarkdownDocument): boolean {
  const path = document.relativePath;

  if (path.endsWith("/index.md")) {
    return false;
  }

  if (!path.endsWith(".md")) {
    return false;
  }

  const documentType = getFrontmatterString(document, "documentType");

  if (documentType === "ChangePlan") {
    return true;
  }

  return (
    /^docs\/changeplans\/(?:CP|cp)-?\d{4}[-_].*\.md$/i.test(path) ||
    /^docs\/planning\/(?:CP|cp)-?\d{4}[-_].*\.md$/i.test(path)
  );
}

function isChangePlanIndexDocument(document: ParsedMarkdownDocument): boolean {
  return document.relativePath === "docs/changeplans/index.md";
}

function createChangePlanRecord(document: ParsedMarkdownDocument): ChangePlanRecord {
  const title =
    getFrontmatterString(document, "title") ??
    firstMarkdownHeading(document.body) ??
    titleFromPath(document.relativePath);

  const pathNumber = changePlanNumberFromPath(document.relativePath);
  const titleNumber = changePlanNumberFromText(title);
  const number = pathNumber ?? titleNumber;
  const status = getFrontmatterString(document, "status");
  const documentType = getFrontmatterString(document, "documentType");

  return {
    number,
    pathNumber,
    title,
    path: document.relativePath,
    status,
    documentType,
    isLegacyPlanningPath: document.relativePath.startsWith("docs/planning/")
  };
}

function parseChangePlanIndexEntries(document: ParsedMarkdownDocument): ChangePlanIndexEntry[] {
  const entries: ChangePlanIndexEntry[] = [];
  const lines = document.body.split("\n");

  for (const [index, line] of lines.entries()) {
    const tableEntry = parseChangePlanIndexTableLine({
      line,
      indexPath: document.relativePath,
      lineNumber: index + 1
    });

    if (tableEntry) {
      entries.push(tableEntry);
      continue;
    }

    const listEntry = parseChangePlanIndexListLine({
      line,
      indexPath: document.relativePath,
      lineNumber: index + 1
    });

    if (listEntry) {
      entries.push(listEntry);
    }
  }

  return dedupeIndexEntries(entries);
}

function parseChangePlanIndexTableLine(options: {
  readonly line: string;
  readonly indexPath: string;
  readonly lineNumber: number;
}): ChangePlanIndexEntry | null {
  const trimmed = options.line.trim();

  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
    return null;
  }

  if (/^\|\s*-+\s*\|/.test(trimmed)) {
    return null;
  }

  const cells = trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());

  if (cells.length < 2) {
    return null;
  }

  const number = changePlanNumberFromText(cells[0] ?? "");

  if (!number) {
    return null;
  }

  const title = cells[1] && cells[1].length > 0 ? cells[1] : `CP-${number}`;
  const status = cells[2] && validChangePlanStatuses.has(cells[2]) ? cells[2] : null;

  return {
    number,
    title,
    status,
    indexPath: options.indexPath,
    line: options.lineNumber
  };
}

function parseChangePlanIndexListLine(options: {
  readonly line: string;
  readonly indexPath: string;
  readonly lineNumber: number;
}): ChangePlanIndexEntry | null {
  const trimmed = options.line.trim();

  if (!trimmed.startsWith("-")) {
    return null;
  }

  const number = changePlanNumberFromText(trimmed);

  if (!number) {
    return null;
  }

  const title = trimmed
    .replace(/^[-*]\s*/, "")
    .replace(/(?:CP|cp)[-\s_]*/i, "CP-")
    .trim();

  return {
    number,
    title: title.length > 0 ? title : `CP-${number}`,
    status: null,
    indexPath: options.indexPath,
    line: options.lineNumber
  };
}

function validateIndexPresence(
  indexDocuments: readonly ParsedMarkdownDocument[],
  issues: DocsValidationIssue[]
): void {
  if (indexDocuments.length > 0) {
    return;
  }

  issues.push({
    severity: "warning",
    code: "changeplan.indexMissing",
    message: "ChangePlan index is missing. Expected docs/changeplans/index.md.",
    path: "docs/changeplans/index.md"
  });
}

function validateChangePlanRecords(options: {
  readonly changePlans: readonly ChangePlanRecord[];
  readonly issues: DocsValidationIssue[];
  readonly strictPlacement: boolean;
}): void {
  for (const changePlan of options.changePlans) {
    if (!changePlan.number) {
      options.issues.push({
        severity: "error",
        code: "changeplan.numberMissing",
        message: "ChangePlan file does not contain a parseable CP number.",
        path: changePlan.path
      });
    }

    if (changePlan.number && changePlan.pathNumber && changePlan.number !== changePlan.pathNumber) {
      options.issues.push({
        severity: "error",
        code: "changeplan.numberPathMismatch",
        message: `ChangePlan number ${changePlan.number} does not match filename number ${changePlan.pathNumber}.`,
        path: changePlan.path
      });
    }

    if (changePlan.documentType && changePlan.documentType !== "ChangePlan") {
      options.issues.push({
        severity: "warning",
        code: "changeplan.documentTypeMismatch",
        message: `ChangePlan-like file has documentType ${changePlan.documentType}; expected ChangePlan.`,
        path: changePlan.path,
        field: "documentType"
      });
    }

    if (!changePlan.status) {
      options.issues.push({
        severity: "warning",
        code: "changeplan.statusMissing",
        message: "ChangePlan is missing status metadata.",
        path: changePlan.path,
        field: "status"
      });
    } else if (!validChangePlanStatuses.has(changePlan.status)) {
      options.issues.push({
        severity: "error",
        code: "changeplan.invalidStatus",
        message: `ChangePlan status must be Draft, Approved, or Deprecated. Found: ${changePlan.status}`,
        path: changePlan.path,
        field: "status"
      });
    }

    if (changePlan.isLegacyPlanningPath) {
      options.issues.push({
        severity: options.strictPlacement ? "error" : "warning",
        code: "changeplan.legacyPlanningPath",
        message: "ChangePlan lives under legacy docs/planning path; canonical path is docs/changeplans.",
        path: changePlan.path
      });
    }
  }
}

function validateDuplicateChangePlanNumbers(
  changePlans: readonly ChangePlanRecord[],
  issues: DocsValidationIssue[]
): void {
  const byNumber = new Map<string, ChangePlanRecord[]>();

  for (const changePlan of changePlans) {
    if (!changePlan.number) {
      continue;
    }

    const existing = byNumber.get(changePlan.number) ?? [];
    existing.push(changePlan);
    byNumber.set(changePlan.number, existing);
  }

  for (const [number, records] of byNumber.entries()) {
    if (records.length <= 1) {
      continue;
    }

    for (const record of records) {
      issues.push({
        severity: "error",
        code: "changeplan.duplicateNumber",
        message: `duplicate ChangePlan number ${number}. Other files: ${records
          .filter((candidate) => candidate.path !== record.path)
          .map((candidate) => candidate.path)
          .join(", ")}`,
        path: record.path
      });
    }
  }
}

function validateIndexCoverage(options: {
  readonly changePlans: readonly ChangePlanRecord[];
  readonly indexEntries: readonly ChangePlanIndexEntry[];
  readonly issues: DocsValidationIssue[];
  readonly strictIndex: boolean;
}): void {
  const changePlanNumbers = new Set(
    options.changePlans
      .map((changePlan) => changePlan.number)
      .filter((number): number is string => typeof number === "string")
  );
  const indexNumbers = new Set(options.indexEntries.map((entry) => entry.number));
  const severity = options.strictIndex ? "error" : "warning";

  for (const changePlan of options.changePlans) {
    if (!changePlan.number) {
      continue;
    }

    if (!indexNumbers.has(changePlan.number)) {
      options.issues.push({
        severity,
        code: "changeplan.indexEntryMissing",
        message: `CP-${changePlan.number} is not listed in docs/changeplans/index.md.`,
        path: changePlan.path
      });
    }
  }

  for (const entry of options.indexEntries) {
    if (!changePlanNumbers.has(entry.number)) {
      options.issues.push({
        severity,
        code: "changeplan.indexEntryWithoutFile",
        message: `ChangePlan index entry CP-${entry.number} does not resolve to a ChangePlan file.`,
        path: entry.indexPath
      });
    }
  }
}

function validateIndexStatusConsistency(options: {
  readonly changePlans: readonly ChangePlanRecord[];
  readonly indexEntries: readonly ChangePlanIndexEntry[];
  readonly issues: DocsValidationIssue[];
  readonly strictIndex: boolean;
}): void {
  const severity = options.strictIndex ? "error" : "warning";
  const changePlansByNumber = new Map<string, ChangePlanRecord>();

  for (const changePlan of options.changePlans) {
    if (changePlan.number) {
      changePlansByNumber.set(changePlan.number, changePlan);
    }
  }

  for (const entry of options.indexEntries) {
    if (!entry.status) {
      continue;
    }

    const changePlan = changePlansByNumber.get(entry.number);

    if (!changePlan || !changePlan.status) {
      continue;
    }

    if (entry.status !== changePlan.status) {
      options.issues.push({
        severity,
        code: "changeplan.indexStatusMismatch",
        message: `CP-${entry.number} index status ${entry.status} does not match file status ${changePlan.status}.`,
        path: entry.indexPath
      });
    }
  }
}

function createChangePlanValidationReport(options: {
  readonly changePlans: readonly ChangePlanRecord[];
  readonly indexEntries: readonly ChangePlanIndexEntry[];
  readonly indexCount: number;
  readonly issues: readonly DocsValidationIssue[];
  readonly failOnWarnings: boolean;
}): ChangePlanValidationReport {
  const summary = summarizeChangePlanValidation({
    changePlans: options.changePlans,
    indexEntries: options.indexEntries,
    indexCount: options.indexCount,
    issues: options.issues
  });

  return {
    ok: summary.errorCount === 0 && (!options.failOnWarnings || summary.warningCount === 0),
    summary,
    changePlans: [...options.changePlans].sort(compareChangePlanRecords),
    indexEntries: [...options.indexEntries].sort(compareIndexEntries),
    issues: options.issues
  };
}

function summarizeChangePlanValidation(options: {
  readonly changePlans: readonly ChangePlanRecord[];
  readonly indexEntries: readonly ChangePlanIndexEntry[];
  readonly indexCount: number;
  readonly issues: readonly DocsValidationIssue[];
}): ChangePlanValidationSummary {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const issue of options.issues) {
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
    changePlanCount: options.changePlans.length,
    indexCount: options.indexCount,
    indexEntryCount: options.indexEntries.length,
    legacyPlanningCount: options.changePlans.filter((changePlan) => changePlan.isLegacyPlanningPath).length,
    errorCount,
    warningCount,
    infoCount
  };
}

function dedupeIndexEntries(entries: readonly ChangePlanIndexEntry[]): ChangePlanIndexEntry[] {
  const seen = new Set<string>();
  const result: ChangePlanIndexEntry[] = [];

  for (const entry of entries) {
    const key = `${entry.indexPath}:${entry.number}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(entry);
  }

  return result;
}

function compareChangePlanRecords(
  left: ChangePlanRecord,
  right: ChangePlanRecord
): number {
  return (
    (left.number ?? "9999").localeCompare(right.number ?? "9999") ||
    left.path.localeCompare(right.path)
  );
}

function compareIndexEntries(
  left: ChangePlanIndexEntry,
  right: ChangePlanIndexEntry
): number {
  return left.number.localeCompare(right.number) || left.indexPath.localeCompare(right.indexPath);
}

function changePlanNumberFromPath(path: string): string | null {
  const fileName = path.split("/").at(-1) ?? path;
  const match = fileName.match(/^(?:CP|cp)-?(\d{4})[-_]/);

  return match?.[1] ?? null;
}

function changePlanNumberFromText(value: string): string | null {
  const match = value.match(/(?:CP|cp)[-\s_]*(\d{1,4})|(?:^|\D)(\d{4})(?:\D|$)/);
  const raw = match?.[1] ?? match?.[2];

  if (!raw) {
    return null;
  }

  return raw.padStart(4, "0");
}

function firstMarkdownHeading(body: string): string | null {
  for (const line of body.split("\n")) {
    const match = line.match(/^#\s+(.+?)\s*$/);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function titleFromPath(path: string): string {
  const fileName = path.split("/").at(-1) ?? path;
  const stem = fileName.replace(/\.md$/, "");

  return stem
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replaceAll("—", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
''',

    "packages/cli/src/commands/docs/changeplans/validate.ts": r'''import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  formatChangePlanValidationReportAsJson,
  formatChangePlanValidationReportAsText,
  validateChangePlans
} from "../../../docs/changeplan-validator.js";

export default class DocsChangeplansValidate extends Command {
  static override summary = "Validate documentation ChangePlans.";

  static override description = `
Validate governed ChangePlan documents under docs/changeplans and legacy
planning CP files under docs/planning.

This command checks CP numbering, duplicate CP numbers, index coverage, status
metadata, and canonical placement.
`;

  static override examples = [
    {
      description: "Validate ChangePlans in bootstrap mode.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Validate ChangePlans strictly.",
      command: "<%= config.bin %> <%= command.id %> --strict-index --strict-placement --fail-on-warnings"
    },
    {
      description: "Write a JSON ChangePlan validation report.",
      command: "<%= config.bin %> <%= command.id %> --json --report-path .artifacts/docs/changeplan-validation-report.json"
    }
  ];

  static override flags = {
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to scan."
    }),
    "fail-on-warnings": Flags.boolean({
      default: false,
      description: "Exit non-zero when warnings are present."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the ChangePlan validation report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the ChangePlan validation JSON report."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    }),
    "strict-index": Flags.boolean({
      default: false,
      description: "Treat ChangePlan index coverage issues as errors."
    }),
    "strict-placement": Flags.boolean({
      default: false,
      description: "Treat legacy ChangePlan placement issues as errors."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsChangeplansValidate);
    const repoRoot = resolve(flags.root);

    const report = validateChangePlans({
      repoRoot,
      docsDir: flags["docs-dir"],
      strictIndex: flags["strict-index"],
      strictPlacement: flags["strict-placement"],
      failOnWarnings: flags["fail-on-warnings"]
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatChangePlanValidationReportAsJson(report)}\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatChangePlanValidationReportAsJson(report)
        : formatChangePlanValidationReportAsText(report)
    );

    if (!report.ok) {
      this.exit(1);
    }
  }
}
''',

    "packages/cli/src/docs/index.ts": r'''export {
  formatAdrValidationReportAsJson,
  formatAdrValidationReportAsText,
  validateAdrIndex
} from "./adr-validator.js";
export {
  formatChangePlanValidationReportAsJson,
  formatChangePlanValidationReportAsText,
  validateChangePlans
} from "./changeplan-validator.js";
export {
  createDirectoryRepairPlan,
  formatDirectoryRepairPlanAsJson,
  formatDirectoryRepairPlanAsText
} from "./directory-repair.js";
export {
  formatDirectoryValidationReportAsJson,
  formatDirectoryValidationReportAsText,
  validateDirectoryTopology
} from "./directory-validator.js";
export { runDocsValidation } from "./engine.js";
export {
  createValidationReport,
  formatValidationReportAsJson,
  formatValidationReportAsText
} from "./reporter.js";
export { scanMarkdownDocuments } from "./scanner.js";
export { parseMarkdownDocument } from "./frontmatter.js";
export { validateParsedDocument } from "./validator.js";
export {
  buildDocsGraph,
  summarizeDocsGraph
} from "./graph.js";
export {
  createGraphRepairPlan,
  formatGraphRepairPlanAsJson,
  formatGraphRepairPlanAsText
} from "./graph-repair.js";
export {
  formatGraphValidationReportAsJson,
  formatGraphValidationReportAsText,
  validateDocsGraph
} from "./graph-validator.js";
export {
  formatGlossaryValidationReportAsJson,
  formatGlossaryValidationReportAsText,
  validateGlossary
} from "./glossary-validator.js";
export {
  createDocsVerificationArtifacts,
  formatDocsVerificationPipelineReportAsJson,
  formatDocsVerificationPipelineReportAsText,
  runDocsVerificationPipeline
} from "./pipeline.js";
export {
  assessDocsReadiness,
  formatDocsReadinessReportAsJson,
  formatDocsReadinessReportAsText
} from "./readiness.js";
export {
  formatRelationshipNormalizationPlanAsJson,
  formatRelationshipNormalizationPlanAsText,
  normalizeDocsRelationships
} from "./relationship-normalizer.js";
export type {
  AdrIndexEntry,
  AdrRecord,
  AdrValidationOptions,
  AdrValidationReport,
  AdrValidationSummary
} from "./adr-validator.js";
export type {
  ChangePlanIndexEntry,
  ChangePlanRecord,
  ChangePlanValidationOptions,
  ChangePlanValidationReport,
  ChangePlanValidationSummary
} from "./changeplan-validator.js";
export type {
  DirectoryRepairAction,
  DirectoryRepairActionKind,
  DirectoryRepairOptions,
  DirectoryRepairPlan
} from "./directory-repair.js";
export type {
  DirectoryValidationOptions,
  DirectoryValidationReport,
  DirectoryValidationSummary
} from "./directory-validator.js";
export type {
  DocsGraph,
  DocsGraphBuildResult,
  DocsGraphEdge,
  DocsGraphEdgeType,
  DocsGraphNode,
  DocsGraphNodeKind
} from "./graph.js";
export type {
  GraphRepairAction,
  GraphRepairActionKind,
  GraphRepairField,
  GraphRepairOptions,
  GraphRepairPlan
} from "./graph-repair.js";
export type {
  DocsGraphValidationOptions,
  DocsGraphValidationReport,
  DocsGraphValidationSummary
} from "./graph-validator.js";
export type {
  GlossaryReferenceRecord,
  GlossaryTermRecord,
  GlossaryValidationOptions,
  GlossaryValidationReport,
  GlossaryValidationSummary
} from "./glossary-validator.js";
export type {
  DocsVerificationPipelineOptions,
  DocsVerificationPipelineReport
} from "./pipeline.js";
export type {
  DocsReadinessDimension,
  DocsReadinessDimensionId,
  DocsReadinessOptions,
  DocsReadinessReport,
  DocsReadinessStatus
} from "./readiness.js";
export type {
  RelationshipField,
  RelationshipNormalizationAction,
  RelationshipNormalizationFileChange,
  RelationshipNormalizationOptions,
  RelationshipNormalizationPlan
} from "./relationship-normalizer.js";
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
'''
}


def update_package_json_scripts() -> None:
    path = Path("package.json")

    if not path.exists():
        print("skip package.json update: package.json not found")
        return

    text = path.read_text(encoding="utf-8")
    decoder = json.JSONDecoder()

    try:
        data, _ = decoder.raw_decode(text)
    except json.JSONDecodeError as error:
        print(f"skip package.json update: malformed JSON: {error}")
        return

    scripts = data.setdefault("scripts", {})

    scripts.setdefault(
        "docs:changeplans:validate",
        "bun run foundry:build && node packages/cli/bin/run.js docs changeplans validate"
    )
    scripts.setdefault(
        "docs:changeplans:validate:strict",
        "bun run foundry:build && node packages/cli/bin/run.js docs changeplans validate --strict-index --strict-placement --fail-on-warnings"
    )

    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print("updated package.json")


def main() -> int:
    for file_name, content in FILES.items():
        path = Path(file_name)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        print(f"wrote {file_name}")

    update_package_json_scripts()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
