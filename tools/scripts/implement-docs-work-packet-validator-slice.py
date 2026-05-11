#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


FILES: dict[str, str] = {
    "packages/cli/src/docs/work-packet-validator.ts": r'''import { parseMarkdownDocument } from "./frontmatter.js";
import { getFrontmatterString } from "./metadata.js";
import { scanMarkdownDocuments } from "./scanner.js";
import type { DocsValidationIssue, ParsedMarkdownDocument } from "./types.js";

export type WorkPacketValidationOptions = {
  readonly repoRoot: string;
  readonly docsDir?: string;
  readonly strictIndex?: boolean;
  readonly strictPlacement?: boolean;
  readonly failOnWarnings?: boolean;
};

export type WorkPacketRecord = {
  readonly number: string | null;
  readonly pathNumber: string | null;
  readonly title: string;
  readonly path: string;
  readonly status: string | null;
  readonly documentType: string | null;
  readonly isLegacyPath: boolean;
};

export type WorkPacketIndexEntry = {
  readonly number: string;
  readonly title: string;
  readonly status: string | null;
  readonly indexPath: string;
  readonly line: number;
};

export type WorkPacketValidationSummary = {
  readonly workPacketCount: number;
  readonly indexCount: number;
  readonly indexEntryCount: number;
  readonly legacyPathCount: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
};

export type WorkPacketValidationReport = {
  readonly ok: boolean;
  readonly summary: WorkPacketValidationSummary;
  readonly workPackets: readonly WorkPacketRecord[];
  readonly indexEntries: readonly WorkPacketIndexEntry[];
  readonly issues: readonly DocsValidationIssue[];
};

const validWorkPacketStatuses = new Set(["Draft", "Approved", "Deprecated"]);

export function validateWorkPackets(
  options: WorkPacketValidationOptions
): WorkPacketValidationReport {
  const scanResult = scanMarkdownDocuments({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {})
  });

  if (!scanResult.ok) {
    const issues: DocsValidationIssue[] = [
      {
        severity: "error",
        code: "workpacket.scanFailed",
        message: scanResult.reason,
        path: options.docsDir ?? "docs"
      }
    ];

    return createWorkPacketValidationReport({
      workPackets: [],
      indexEntries: [],
      indexCount: 0,
      issues,
      failOnWarnings: options.failOnWarnings ?? false
    });
  }

  const parsedDocuments = scanResult.documents.map((document) => parseMarkdownDocument(document));
  const workPacketDocuments = parsedDocuments.filter(isWorkPacketDocument);
  const indexDocuments = parsedDocuments.filter(isWorkPacketIndexDocument);

  const workPackets = workPacketDocuments.map(createWorkPacketRecord);
  const indexEntries = indexDocuments.flatMap(parseWorkPacketIndexEntries);
  const issues: DocsValidationIssue[] = [];

  validateIndexPresence(indexDocuments, issues);
  validateWorkPacketRecords({
    workPackets,
    issues,
    strictPlacement: options.strictPlacement ?? false
  });
  validateDuplicateWorkPacketNumbers(workPackets, issues);
  validateIndexCoverage({
    workPackets,
    indexEntries,
    issues,
    strictIndex: options.strictIndex ?? false
  });
  validateIndexStatusConsistency({
    workPackets,
    indexEntries,
    issues,
    strictIndex: options.strictIndex ?? false
  });

  return createWorkPacketValidationReport({
    workPackets,
    indexEntries,
    indexCount: indexDocuments.length,
    issues,
    failOnWarnings: options.failOnWarnings ?? false
  });
}

export function formatWorkPacketValidationReportAsText(
  report: WorkPacketValidationReport
): string {
  const lines: string[] = [];

  lines.push(report.ok ? "Work Packet validation passed." : "Work Packet validation failed.");
  lines.push("");
  lines.push("Summary:");
  lines.push(`- Work Packet files: ${report.summary.workPacketCount}`);
  lines.push(`- Work Packet index files: ${report.summary.indexCount}`);
  lines.push(`- Work Packet index entries: ${report.summary.indexEntryCount}`);
  lines.push(`- legacy path files: ${report.summary.legacyPathCount}`);
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

  if (report.workPackets.length > 0) {
    lines.push("");
    lines.push("Work Packet files:");

    for (const workPacket of report.workPackets) {
      lines.push(`- ${workPacket.number ?? "????"} ${workPacket.title} (${workPacket.path})`);
    }
  }

  return lines.join("\n");
}

export function formatWorkPacketValidationReportAsJson(
  report: WorkPacketValidationReport
): string {
  return JSON.stringify(report, null, 2);
}

function isWorkPacketDocument(document: ParsedMarkdownDocument): boolean {
  const path = document.relativePath;

  if (path.endsWith("/index.md")) {
    return false;
  }

  if (!path.endsWith(".md")) {
    return false;
  }

  const documentType = getFrontmatterString(document, "documentType");

  if (documentType === "WorkPacket") {
    return true;
  }

  return (
    /^docs\/work-packets\/(?:WP|wp)-?\d{4}[-_].*\.md$/i.test(path) ||
    /^docs\/planning\/(?:WP|wp)-?\d{4}[-_].*\.md$/i.test(path)
  );
}

function isWorkPacketIndexDocument(document: ParsedMarkdownDocument): boolean {
  return document.relativePath === "docs/work-packets/index.md";
}

function createWorkPacketRecord(document: ParsedMarkdownDocument): WorkPacketRecord {
  const title =
    getFrontmatterString(document, "title") ??
    firstMarkdownHeading(document.body) ??
    titleFromPath(document.relativePath);

  const pathNumber = workPacketNumberFromPath(document.relativePath);
  const titleNumber = workPacketNumberFromText(title);
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
    isLegacyPath: document.relativePath.startsWith("docs/planning/")
  };
}

function parseWorkPacketIndexEntries(document: ParsedMarkdownDocument): WorkPacketIndexEntry[] {
  const entries: WorkPacketIndexEntry[] = [];
  const lines = document.body.split("\n");

  for (const [index, line] of lines.entries()) {
    const tableEntry = parseWorkPacketIndexTableLine({
      line,
      indexPath: document.relativePath,
      lineNumber: index + 1
    });

    if (tableEntry) {
      entries.push(tableEntry);
      continue;
    }

    const listEntry = parseWorkPacketIndexListLine({
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

function parseWorkPacketIndexTableLine(options: {
  readonly line: string;
  readonly indexPath: string;
  readonly lineNumber: number;
}): WorkPacketIndexEntry | null {
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

  const number = workPacketNumberFromText(cells[0] ?? "");

  if (!number) {
    return null;
  }

  const title = cells[1] && cells[1].length > 0 ? cells[1] : `WP-${number}`;
  const status = cells[2] && validWorkPacketStatuses.has(cells[2]) ? cells[2] : null;

  return {
    number,
    title,
    status,
    indexPath: options.indexPath,
    line: options.lineNumber
  };
}

function parseWorkPacketIndexListLine(options: {
  readonly line: string;
  readonly indexPath: string;
  readonly lineNumber: number;
}): WorkPacketIndexEntry | null {
  const trimmed = options.line.trim();

  if (!trimmed.startsWith("-")) {
    return null;
  }

  const number = workPacketNumberFromText(trimmed);

  if (!number) {
    return null;
  }

  const title = trimmed
    .replace(/^[-*]\s*/, "")
    .replace(/(?:WP|wp)[-\s_]*/i, "WP-")
    .trim();

  return {
    number,
    title: title.length > 0 ? title : `WP-${number}`,
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
    code: "workpacket.indexMissing",
    message: "Work Packet index is missing. Expected docs/work-packets/index.md.",
    path: "docs/work-packets/index.md"
  });
}

function validateWorkPacketRecords(options: {
  readonly workPackets: readonly WorkPacketRecord[];
  readonly issues: DocsValidationIssue[];
  readonly strictPlacement: boolean;
}): void {
  for (const workPacket of options.workPackets) {
    if (!workPacket.number) {
      options.issues.push({
        severity: "error",
        code: "workpacket.numberMissing",
        message: "Work Packet file does not contain a parseable WP number.",
        path: workPacket.path
      });
    }

    if (workPacket.number && workPacket.pathNumber && workPacket.number !== workPacket.pathNumber) {
      options.issues.push({
        severity: "error",
        code: "workpacket.numberPathMismatch",
        message: `Work Packet number ${workPacket.number} does not match filename number ${workPacket.pathNumber}.`,
        path: workPacket.path
      });
    }

    if (workPacket.documentType && workPacket.documentType !== "WorkPacket") {
      options.issues.push({
        severity: "warning",
        code: "workpacket.documentTypeMismatch",
        message: `Work Packet-like file has documentType ${workPacket.documentType}; expected WorkPacket.`,
        path: workPacket.path,
        field: "documentType"
      });
    }

    if (!workPacket.status) {
      options.issues.push({
        severity: "warning",
        code: "workpacket.statusMissing",
        message: "Work Packet is missing status metadata.",
        path: workPacket.path,
        field: "status"
      });
    } else if (!validWorkPacketStatuses.has(workPacket.status)) {
      options.issues.push({
        severity: "error",
        code: "workpacket.invalidStatus",
        message: `Work Packet status must be Draft, Approved, or Deprecated. Found: ${workPacket.status}`,
        path: workPacket.path,
        field: "status"
      });
    }

    if (workPacket.isLegacyPath) {
      options.issues.push({
        severity: options.strictPlacement ? "error" : "warning",
        code: "workpacket.legacyPlanningPath",
        message: "Work Packet lives under legacy docs/planning path; canonical path is docs/work-packets.",
        path: workPacket.path
      });
    }
  }
}

function validateDuplicateWorkPacketNumbers(
  workPackets: readonly WorkPacketRecord[],
  issues: DocsValidationIssue[]
): void {
  const byNumber = new Map<string, WorkPacketRecord[]>();

  for (const workPacket of workPackets) {
    if (!workPacket.number) {
      continue;
    }

    const existing = byNumber.get(workPacket.number) ?? [];
    existing.push(workPacket);
    byNumber.set(workPacket.number, existing);
  }

  for (const [number, records] of byNumber.entries()) {
    if (records.length <= 1) {
      continue;
    }

    for (const record of records) {
      issues.push({
        severity: "error",
        code: "workpacket.duplicateNumber",
        message: `duplicate Work Packet number ${number}. Other files: ${records
          .filter((candidate) => candidate.path !== record.path)
          .map((candidate) => candidate.path)
          .join(", ")}`,
        path: record.path
      });
    }
  }
}

function validateIndexCoverage(options: {
  readonly workPackets: readonly WorkPacketRecord[];
  readonly indexEntries: readonly WorkPacketIndexEntry[];
  readonly issues: DocsValidationIssue[];
  readonly strictIndex: boolean;
}): void {
  const workPacketNumbers = new Set(
    options.workPackets
      .map((workPacket) => workPacket.number)
      .filter((number): number is string => typeof number === "string")
  );
  const indexNumbers = new Set(options.indexEntries.map((entry) => entry.number));
  const severity = options.strictIndex ? "error" : "warning";

  for (const workPacket of options.workPackets) {
    if (!workPacket.number) {
      continue;
    }

    if (!indexNumbers.has(workPacket.number)) {
      options.issues.push({
        severity,
        code: "workpacket.indexEntryMissing",
        message: `WP-${workPacket.number} is not listed in docs/work-packets/index.md.`,
        path: workPacket.path
      });
    }
  }

  for (const entry of options.indexEntries) {
    if (!workPacketNumbers.has(entry.number)) {
      options.issues.push({
        severity,
        code: "workpacket.indexEntryWithoutFile",
        message: `Work Packet index entry WP-${entry.number} does not resolve to a Work Packet file.`,
        path: entry.indexPath
      });
    }
  }
}

function validateIndexStatusConsistency(options: {
  readonly workPackets: readonly WorkPacketRecord[];
  readonly indexEntries: readonly WorkPacketIndexEntry[];
  readonly issues: readonly DocsValidationIssue[];
  readonly strictIndex: boolean;
}): void {
  const severity = options.strictIndex ? "error" : "warning";
  const mutableIssues = options.issues as DocsValidationIssue[];
  const workPacketsByNumber = new Map<string, WorkPacketRecord>();

  for (const workPacket of options.workPackets) {
    if (workPacket.number) {
      workPacketsByNumber.set(workPacket.number, workPacket);
    }
  }

  for (const entry of options.indexEntries) {
    if (!entry.status) {
      continue;
    }

    const workPacket = workPacketsByNumber.get(entry.number);

    if (!workPacket || !workPacket.status) {
      continue;
    }

    if (entry.status !== workPacket.status) {
      mutableIssues.push({
        severity,
        code: "workpacket.indexStatusMismatch",
        message: `WP-${entry.number} index status ${entry.status} does not match file status ${workPacket.status}.`,
        path: entry.indexPath
      });
    }
  }
}

function createWorkPacketValidationReport(options: {
  readonly workPackets: readonly WorkPacketRecord[];
  readonly indexEntries: readonly WorkPacketIndexEntry[];
  readonly indexCount: number;
  readonly issues: readonly DocsValidationIssue[];
  readonly failOnWarnings: boolean;
}): WorkPacketValidationReport {
  const summary = summarizeWorkPacketValidation({
    workPackets: options.workPackets,
    indexEntries: options.indexEntries,
    indexCount: options.indexCount,
    issues: options.issues
  });

  return {
    ok: summary.errorCount === 0 && (!options.failOnWarnings || summary.warningCount === 0),
    summary,
    workPackets: [...options.workPackets].sort(compareWorkPacketRecords),
    indexEntries: [...options.indexEntries].sort(compareIndexEntries),
    issues: options.issues
  };
}

function summarizeWorkPacketValidation(options: {
  readonly workPackets: readonly WorkPacketRecord[];
  readonly indexEntries: readonly WorkPacketIndexEntry[];
  readonly indexCount: number;
  readonly issues: readonly DocsValidationIssue[];
}): WorkPacketValidationSummary {
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
    workPacketCount: options.workPackets.length,
    indexCount: options.indexCount,
    indexEntryCount: options.indexEntries.length,
    legacyPathCount: options.workPackets.filter((workPacket) => workPacket.isLegacyPath).length,
    errorCount,
    warningCount,
    infoCount
  };
}

function dedupeIndexEntries(entries: readonly WorkPacketIndexEntry[]): WorkPacketIndexEntry[] {
  const seen = new Set<string>();
  const result: WorkPacketIndexEntry[] = [];

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

function compareWorkPacketRecords(
  left: WorkPacketRecord,
  right: WorkPacketRecord
): number {
  return (
    (left.number ?? "9999").localeCompare(right.number ?? "9999") ||
    left.path.localeCompare(right.path)
  );
}

function compareIndexEntries(
  left: WorkPacketIndexEntry,
  right: WorkPacketIndexEntry
): number {
  return left.number.localeCompare(right.number) || left.indexPath.localeCompare(right.indexPath);
}

function workPacketNumberFromPath(path: string): string | null {
  const fileName = path.split("/").at(-1) ?? path;
  const match = fileName.match(/^(?:WP|wp)-?(\d{4})[-_]/);

  return match?.[1] ?? null;
}

function workPacketNumberFromText(value: string): string | null {
  const match = value.match(/(?:WP|wp)[-\s_]*(\d{1,4})|(?:^|\D)(\d{4})(?:\D|$)/);
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

    "packages/cli/src/commands/docs/work-packets/validate.ts": r'''import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  formatWorkPacketValidationReportAsJson,
  formatWorkPacketValidationReportAsText,
  validateWorkPackets
} from "../../../docs/work-packet-validator.js";

export default class DocsWorkPacketsValidate extends Command {
  static override summary = "Validate documentation Work Packets.";

  static override description = `
Validate governed Work Packet documents under docs/work-packets and legacy
planning WP files under docs/planning.

This command checks WP numbering, duplicate WP numbers, index coverage, status
metadata, and canonical placement.
`;

  static override examples = [
    {
      description: "Validate Work Packets in bootstrap mode.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Validate Work Packets strictly.",
      command: "<%= config.bin %> <%= command.id %> --strict-index --strict-placement --fail-on-warnings"
    },
    {
      description: "Write a JSON Work Packet validation report.",
      command: "<%= config.bin %> <%= command.id %> --json --report-path .artifacts/docs/work-packet-validation-report.json"
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
      description: "Print the Work Packet validation report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the Work Packet validation JSON report."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    }),
    "strict-index": Flags.boolean({
      default: false,
      description: "Treat Work Packet index coverage issues as errors."
    }),
    "strict-placement": Flags.boolean({
      default: false,
      description: "Treat legacy Work Packet placement issues as errors."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsWorkPacketsValidate);
    const repoRoot = resolve(flags.root);

    const report = validateWorkPackets({
      repoRoot,
      docsDir: flags["docs-dir"],
      strictIndex: flags["strict-index"],
      strictPlacement: flags["strict-placement"],
      failOnWarnings: flags["fail-on-warnings"]
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatWorkPacketValidationReportAsJson(report)}\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatWorkPacketValidationReportAsJson(report)
        : formatWorkPacketValidationReportAsText(report)
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
export {
  formatWorkPacketValidationReportAsJson,
  formatWorkPacketValidationReportAsText,
  validateWorkPackets
} from "./work-packet-validator.js";
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
  WorkPacketIndexEntry,
  WorkPacketRecord,
  WorkPacketValidationOptions,
  WorkPacketValidationReport,
  WorkPacketValidationSummary
} from "./work-packet-validator.js";
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
        "docs:work-packets:validate",
        "bun run foundry:build && node packages/cli/bin/run.js docs work-packets validate"
    )
    scripts.setdefault(
        "docs:work-packets:validate:strict",
        "bun run foundry:build && node packages/cli/bin/run.js docs work-packets validate --strict-index --strict-placement --fail-on-warnings"
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
