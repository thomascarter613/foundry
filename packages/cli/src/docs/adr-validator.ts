import { parseMarkdownDocument } from "./frontmatter.js";
import { getFrontmatterString } from "./metadata.js";
import { scanMarkdownDocuments } from "./scanner.js";
import type { DocsValidationIssue, ParsedMarkdownDocument } from "./types.js";

export type AdrValidationOptions = {
  readonly repoRoot: string;
  readonly docsDir?: string;
  readonly strictIndex?: boolean;
  readonly failOnWarnings?: boolean;
};

export type AdrRecord = {
  readonly number: string | null;
  readonly pathNumber: string | null;
  readonly title: string;
  readonly path: string;
  readonly status: string | null;
};

export type AdrIndexEntry = {
  readonly number: string;
  readonly title: string;
  readonly status: string | null;
  readonly indexPath: string;
  readonly line: number;
};

export type AdrValidationSummary = {
  readonly adrCount: number;
  readonly indexCount: number;
  readonly indexEntryCount: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
};

export type AdrValidationReport = {
  readonly ok: boolean;
  readonly summary: AdrValidationSummary;
  readonly adrs: readonly AdrRecord[];
  readonly indexEntries: readonly AdrIndexEntry[];
  readonly issues: readonly DocsValidationIssue[];
};

const validAdrStatuses = new Set(["Draft", "Approved", "Deprecated"]);

export function validateAdrIndex(options: AdrValidationOptions): AdrValidationReport {
  const scanResult = scanMarkdownDocuments({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {})
  });

  if (!scanResult.ok) {
    const issues: DocsValidationIssue[] = [
      {
        severity: "error",
        code: "adr.scanFailed",
        message: scanResult.reason,
        path: options.docsDir ?? "docs"
      }
    ];

    return createAdrValidationReport({
      adrs: [],
      indexEntries: [],
      indexCount: 0,
      issues,
      failOnWarnings: options.failOnWarnings ?? false
    });
  }

  const parsedDocuments = scanResult.documents.map((document) => parseMarkdownDocument(document));
  const adrDocuments = parsedDocuments.filter(isAdrDocument);
  const indexDocuments = parsedDocuments.filter(isAdrIndexDocument);

  const adrs = adrDocuments.map(createAdrRecord);
  const indexEntries = indexDocuments.flatMap(parseAdrIndexEntries);
  const issues: DocsValidationIssue[] = [];

  validateIndexPresence(indexDocuments, issues);
  validateAdrRecords(adrs, issues);
  validateDuplicateAdrNumbers(adrs, issues);
  validateAdrIndexCoverage({
    adrs,
    indexEntries,
    issues,
    strictIndex: options.strictIndex ?? false
  });
  validateIndexStatusConsistency({
    adrs,
    indexEntries,
    issues,
    strictIndex: options.strictIndex ?? false
  });

  return createAdrValidationReport({
    adrs,
    indexEntries,
    indexCount: indexDocuments.length,
    issues,
    failOnWarnings: options.failOnWarnings ?? false
  });
}

export function formatAdrValidationReportAsText(report: AdrValidationReport): string {
  const lines: string[] = [];

  lines.push(report.ok ? "ADR validation passed." : "ADR validation failed.");
  lines.push("");
  lines.push("Summary:");
  lines.push(`- ADR files: ${report.summary.adrCount}`);
  lines.push(`- ADR index files: ${report.summary.indexCount}`);
  lines.push(`- ADR index entries: ${report.summary.indexEntryCount}`);
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

  if (report.adrs.length > 0) {
    lines.push("");
    lines.push("ADR files:");

    for (const adr of report.adrs) {
      lines.push(`- ${adr.number ?? "????"} ${adr.title} (${adr.path})`);
    }
  }

  return lines.join("\n");
}

export function formatAdrValidationReportAsJson(report: AdrValidationReport): string {
  return JSON.stringify(report, null, 2);
}

function isAdrDocument(document: ParsedMarkdownDocument): boolean {
  const path = document.relativePath;

  if (path.endsWith("/index.md")) {
    return false;
  }

  if (path.endsWith("/_template.md") || path.endsWith("/_supersession.md")) {
    return false;
  }

  const documentType = getFrontmatterString(document, "documentType");

  if (documentType === "ADR") {
    return true;
  }

  return (
    /^docs\/architecture\/adr\/(?:ADR-)?\d{4}[-_].*\.md$/i.test(path) ||
    /^docs\/adr\/(?:ADR-)?\d{4}[-_].*\.md$/i.test(path)
  );
}

function isAdrIndexDocument(document: ParsedMarkdownDocument): boolean {
  return (
    document.relativePath === "docs/architecture/adr/index.md" ||
    document.relativePath === "docs/adr/index.md"
  );
}

function createAdrRecord(document: ParsedMarkdownDocument): AdrRecord {
  const title =
    getFrontmatterString(document, "title") ??
    firstMarkdownHeading(document.body) ??
    titleFromPath(document.relativePath);

  const pathNumber = adrNumberFromPath(document.relativePath);
  const titleNumber = adrNumberFromText(title);
  const number = pathNumber ?? titleNumber;
  const status = getFrontmatterString(document, "status");

  return {
    number,
    pathNumber,
    title,
    path: document.relativePath,
    status
  };
}

function parseAdrIndexEntries(document: ParsedMarkdownDocument): AdrIndexEntry[] {
  const entries: AdrIndexEntry[] = [];
  const lines = document.body.split("\n");

  for (const [index, line] of lines.entries()) {
    const tableEntry = parseAdrIndexTableLine({
      line,
      indexPath: document.relativePath,
      lineNumber: index + 1
    });

    if (tableEntry) {
      entries.push(tableEntry);
      continue;
    }

    const listEntry = parseAdrIndexListLine({
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

function parseAdrIndexTableLine(options: {
  readonly line: string;
  readonly indexPath: string;
  readonly lineNumber: number;
}): AdrIndexEntry | null {
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

  const number = adrNumberFromText(cells[0] ?? "");

  if (!number) {
    return null;
  }

  const title = cells[1] && cells[1].length > 0 ? cells[1] : `ADR ${number}`;
  const status = cells[2] && validAdrStatuses.has(cells[2]) ? cells[2] : null;

  return {
    number,
    title,
    status,
    indexPath: options.indexPath,
    line: options.lineNumber
  };
}

function parseAdrIndexListLine(options: {
  readonly line: string;
  readonly indexPath: string;
  readonly lineNumber: number;
}): AdrIndexEntry | null {
  const trimmed = options.line.trim();

  if (!trimmed.startsWith("-")) {
    return null;
  }

  const number = adrNumberFromText(trimmed);

  if (!number) {
    return null;
  }

  const title = trimmed
    .replace(/^[-*]\s*/, "")
    .replace(/ADR[-\s_]*/i, "ADR ")
    .trim();

  return {
    number,
    title: title.length > 0 ? title : `ADR ${number}`,
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
    code: "adr.indexMissing",
    message: "ADR index is missing. Expected docs/architecture/adr/index.md or docs/adr/index.md.",
    path: "docs"
  });
}

function validateAdrRecords(
  adrs: readonly AdrRecord[],
  issues: DocsValidationIssue[]
): void {
  for (const adr of adrs) {
    if (!adr.number) {
      issues.push({
        severity: "error",
        code: "adr.numberMissing",
        message: "ADR file does not contain a parseable ADR number.",
        path: adr.path
      });
    }

    if (adr.number && adr.pathNumber && adr.number !== adr.pathNumber) {
      issues.push({
        severity: "error",
        code: "adr.numberPathMismatch",
        message: `ADR number ${adr.number} does not match filename number ${adr.pathNumber}.`,
        path: adr.path
      });
    }

    if (!adr.status) {
      issues.push({
        severity: "warning",
        code: "adr.statusMissing",
        message: "ADR is missing status metadata.",
        path: adr.path,
        field: "status"
      });
    } else if (!validAdrStatuses.has(adr.status)) {
      issues.push({
        severity: "error",
        code: "adr.invalidStatus",
        message: `ADR status must be Draft, Approved, or Deprecated. Found: ${adr.status}`,
        path: adr.path,
        field: "status"
      });
    }
  }
}

function validateDuplicateAdrNumbers(
  adrs: readonly AdrRecord[],
  issues: DocsValidationIssue[]
): void {
  const byNumber = new Map<string, AdrRecord[]>();

  for (const adr of adrs) {
    if (!adr.number) {
      continue;
    }

    const existing = byNumber.get(adr.number) ?? [];
    existing.push(adr);
    byNumber.set(adr.number, existing);
  }

  for (const [number, records] of byNumber.entries()) {
    if (records.length <= 1) {
      continue;
    }

    for (const record of records) {
      issues.push({
        severity: "error",
        code: "adr.duplicateNumber",
        message: `duplicate ADR number ${number}. Other files: ${records
          .filter((candidate) => candidate.path !== record.path)
          .map((candidate) => candidate.path)
          .join(", ")}`,
        path: record.path
      });
    }
  }
}

function validateAdrIndexCoverage(options: {
  readonly adrs: readonly AdrRecord[];
  readonly indexEntries: readonly AdrIndexEntry[];
  readonly issues: DocsValidationIssue[];
  readonly strictIndex: boolean;
}): void {
  const adrNumbers = new Set(
    options.adrs
      .map((adr) => adr.number)
      .filter((number): number is string => typeof number === "string")
  );
  const indexNumbers = new Set(options.indexEntries.map((entry) => entry.number));
  const severity = options.strictIndex ? "error" : "warning";

  for (const adr of options.adrs) {
    if (!adr.number) {
      continue;
    }

    if (!indexNumbers.has(adr.number)) {
      options.issues.push({
        severity,
        code: "adr.indexEntryMissing",
        message: `ADR ${adr.number} is not listed in an ADR index.`,
        path: adr.path
      });
    }
  }

  for (const entry of options.indexEntries) {
    if (!adrNumbers.has(entry.number)) {
      options.issues.push({
        severity,
        code: "adr.indexEntryWithoutFile",
        message: `ADR index entry ${entry.number} does not resolve to an ADR file.`,
        path: entry.indexPath
      });
    }
  }
}

function validateIndexStatusConsistency(options: {
  readonly adrs: readonly AdrRecord[];
  readonly indexEntries: readonly AdrIndexEntry[];
  readonly issues: DocsValidationIssue[];
  readonly strictIndex: boolean;
}): void {
  const severity = options.strictIndex ? "error" : "warning";
  const adrsByNumber = new Map<string, AdrRecord>();

  for (const adr of options.adrs) {
    if (adr.number) {
      adrsByNumber.set(adr.number, adr);
    }
  }

  for (const entry of options.indexEntries) {
    if (!entry.status) {
      continue;
    }

    const adr = adrsByNumber.get(entry.number);

    if (!adr || !adr.status) {
      continue;
    }

    if (entry.status !== adr.status) {
      options.issues.push({
        severity,
        code: "adr.indexStatusMismatch",
        message: `ADR ${entry.number} index status ${entry.status} does not match file status ${adr.status}.`,
        path: entry.indexPath
      });
    }
  }
}

function createAdrValidationReport(options: {
  readonly adrs: readonly AdrRecord[];
  readonly indexEntries: readonly AdrIndexEntry[];
  readonly indexCount: number;
  readonly issues: readonly DocsValidationIssue[];
  readonly failOnWarnings: boolean;
}): AdrValidationReport {
  const summary = summarizeAdrValidation({
    adrs: options.adrs,
    indexEntries: options.indexEntries,
    indexCount: options.indexCount,
    issues: options.issues
  });

  return {
    ok: summary.errorCount === 0 && (!options.failOnWarnings || summary.warningCount === 0),
    summary,
    adrs: [...options.adrs].sort(compareAdrRecords),
    indexEntries: [...options.indexEntries].sort(compareAdrIndexEntries),
    issues: options.issues
  };
}

function summarizeAdrValidation(options: {
  readonly adrs: readonly AdrRecord[];
  readonly indexEntries: readonly AdrIndexEntry[];
  readonly indexCount: number;
  readonly issues: readonly DocsValidationIssue[];
}): AdrValidationSummary {
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
    adrCount: options.adrs.length,
    indexCount: options.indexCount,
    indexEntryCount: options.indexEntries.length,
    errorCount,
    warningCount,
    infoCount
  };
}

function dedupeIndexEntries(entries: readonly AdrIndexEntry[]): AdrIndexEntry[] {
  const seen = new Set<string>();
  const result: AdrIndexEntry[] = [];

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

function compareAdrRecords(left: AdrRecord, right: AdrRecord): number {
  return (left.number ?? "9999").localeCompare(right.number ?? "9999") || left.path.localeCompare(right.path);
}

function compareAdrIndexEntries(left: AdrIndexEntry, right: AdrIndexEntry): number {
  return left.number.localeCompare(right.number) || left.indexPath.localeCompare(right.indexPath);
}

function adrNumberFromPath(path: string): string | null {
  const fileName = path.split("/").at(-1) ?? path;
  const match = fileName.match(/^(?:ADR-)?(\d{4})[-_]/i);

  if (!match?.[1]) {
    return null;
  }

  return match[1];
}

function adrNumberFromText(value: string): string | null {
  const match = value.match(/ADR[-\s_]*(\d{1,4})|(?:^|\D)(\d{4})(?:\D|$)/i);
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
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
