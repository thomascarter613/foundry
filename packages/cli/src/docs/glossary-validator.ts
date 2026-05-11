import { parseMarkdownDocument } from "./frontmatter.js";
import { getFrontmatterArray } from "./metadata.js";
import { scanMarkdownDocuments } from "./scanner.js";
import type { DocsValidationIssue, ParsedMarkdownDocument } from "./types.js";

export type GlossaryValidationOptions = {
  readonly repoRoot: string;
  readonly docsDir?: string;
  readonly failOnWarnings?: boolean;
  readonly requireQuickrefCoverage?: boolean;
};

export type GlossaryTermRecord = {
  readonly term: string;
  readonly normalizedTerm: string;
  readonly anchor: string;
  readonly path: string;
  readonly line: number;
};

export type GlossaryReferenceRecord = {
  readonly term: string;
  readonly normalizedTerm: string;
  readonly path: string;
};

export type GlossaryValidationSummary = {
  readonly glossaryTermCount: number;
  readonly quickrefTermCount: number;
  readonly referencedTermCount: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
};

export type GlossaryValidationReport = {
  readonly ok: boolean;
  readonly summary: GlossaryValidationSummary;
  readonly glossaryTerms: readonly GlossaryTermRecord[];
  readonly quickrefTerms: readonly GlossaryTermRecord[];
  readonly references: readonly GlossaryReferenceRecord[];
  readonly issues: readonly DocsValidationIssue[];
};

const canonicalGlossaryPath = "docs/planning/glossary.md";

const quickrefPaths = new Set([
  "docs/onboarding/glossary-quickref.md",
  "docs/onboarding/glossary-quickreference.md"
]);

const ignoredHeadingTerms = new Set([
  "glossary",
  "purpose",
  "context",
  "overview",
  "terms",
  "definitions",
  "related documents",
  "upstream",
  "downstream",
  "governance links",
  "glossary terms",
  "change history"
]);

export function validateGlossary(options: GlossaryValidationOptions): GlossaryValidationReport {
  const scanResult = scanMarkdownDocuments({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {})
  });

  if (!scanResult.ok) {
    const issues: DocsValidationIssue[] = [
      {
        severity: "error",
        code: "glossary.scanFailed",
        message: scanResult.reason,
        path: options.docsDir ?? "docs"
      }
    ];

    return createGlossaryValidationReport({
      glossaryTerms: [],
      quickrefTerms: [],
      references: [],
      issues,
      failOnWarnings: options.failOnWarnings ?? false
    });
  }

  const documents = scanResult.documents.map((document) => parseMarkdownDocument(document));
  const glossaryDocument = documents.find((document) => document.relativePath === canonicalGlossaryPath);
  const quickrefDocuments = documents.filter((document) => quickrefPaths.has(document.relativePath));

  const issues: DocsValidationIssue[] = [];

  if (!glossaryDocument) {
    issues.push({
      severity: "error",
      code: "glossary.canonicalGlossaryMissing",
      message: `missing canonical glossary: ${canonicalGlossaryPath}`,
      path: canonicalGlossaryPath
    });
  }

  const glossaryTerms = glossaryDocument ? extractTermsFromDocument(glossaryDocument) : [];
  const quickrefTerms = quickrefDocuments.flatMap((document) => extractTermsFromDocument(document));
  const references = extractGlossaryReferences(documents);

  validateEmptyGlossaryTerms(glossaryTerms, issues);
  validateDuplicateTerms(glossaryTerms, issues, "glossary.duplicateTerm");
  validateDuplicateTerms(quickrefTerms, issues, "glossary.duplicateQuickrefTerm");
  validateGlossaryReferences({
    references,
    glossaryTerms,
    issues
  });
  validateQuickrefReferences({
    quickrefTerms,
    glossaryTerms,
    issues
  });

  if (options.requireQuickrefCoverage ?? false) {
    validateQuickrefCoverage({
      references,
      quickrefTerms,
      issues
    });
  }

  return createGlossaryValidationReport({
    glossaryTerms,
    quickrefTerms,
    references,
    issues,
    failOnWarnings: options.failOnWarnings ?? false
  });
}

export function formatGlossaryValidationReportAsText(report: GlossaryValidationReport): string {
  const lines: string[] = [];

  lines.push(report.ok ? "Glossary validation passed." : "Glossary validation failed.");
  lines.push("");
  lines.push("Summary:");
  lines.push(`- glossary terms: ${report.summary.glossaryTermCount}`);
  lines.push(`- quickref terms: ${report.summary.quickrefTermCount}`);
  lines.push(`- referenced terms: ${report.summary.referencedTermCount}`);
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

  return lines.join("\n");
}

export function formatGlossaryValidationReportAsJson(report: GlossaryValidationReport): string {
  return JSON.stringify(report, null, 2);
}

function extractTermsFromDocument(document: ParsedMarkdownDocument): GlossaryTermRecord[] {
  const records: GlossaryTermRecord[] = [];
  const lines = document.body.split("\n");

  for (const [index, line] of lines.entries()) {
    const headingTerm = extractHeadingTerm(line);

    if (headingTerm) {
      records.push({
        term: headingTerm,
        normalizedTerm: normalizeTerm(headingTerm),
        anchor: slugify(headingTerm),
        path: document.relativePath,
        line: index + 1
      });
      continue;
    }

    const bulletTerm = extractBulletTerm(line);

    if (bulletTerm) {
      records.push({
        term: bulletTerm,
        normalizedTerm: normalizeTerm(bulletTerm),
        anchor: slugify(bulletTerm),
        path: document.relativePath,
        line: index + 1
      });
    }
  }

  return dedupeTermsByPathAndLine(records);
}

function extractHeadingTerm(line: string): string | null {
  const match = line.match(/^#{2,4}\s+(.+?)\s*$/);

  if (!match?.[1]) {
    return null;
  }

  const cleaned = cleanTerm(match[1]);

  if (!cleaned || ignoredHeadingTerms.has(normalizeTerm(cleaned))) {
    return null;
  }

  return cleaned;
}

function extractBulletTerm(line: string): string | null {
  const boldMatch = line.match(/^\s*[-*]\s+\*\*(.+?)\*\*/);

  if (boldMatch?.[1]) {
    return cleanTerm(boldMatch[1]);
  }

  const colonMatch = line.match(/^\s*[-*]\s+([^:]{2,80}):\s+/);

  if (colonMatch?.[1]) {
    return cleanTerm(colonMatch[1]);
  }

  return null;
}

function extractGlossaryReferences(
  documents: readonly ParsedMarkdownDocument[]
): GlossaryReferenceRecord[] {
  const references: GlossaryReferenceRecord[] = [];

  for (const document of documents) {
    const glossaryTerms = getFrontmatterArray(document, "glossaryTerms") ?? [];

    for (const term of glossaryTerms) {
      const cleaned = cleanTerm(term);

      if (!cleaned) {
        continue;
      }

      references.push({
        term: cleaned,
        normalizedTerm: normalizeTerm(cleaned),
        path: document.relativePath
      });
    }
  }

  return dedupeReferences(references);
}

function validateEmptyGlossaryTerms(
  glossaryTerms: readonly GlossaryTermRecord[],
  issues: DocsValidationIssue[]
): void {
  for (const term of glossaryTerms) {
    if (term.normalizedTerm.length === 0) {
      issues.push({
        severity: "error",
        code: "glossary.emptyTerm",
        message: "empty glossary term",
        path: term.path
      });
    }
  }
}

function validateDuplicateTerms(
  terms: readonly GlossaryTermRecord[],
  issues: DocsValidationIssue[],
  code: string
): void {
  const byTerm = new Map<string, GlossaryTermRecord[]>();

  for (const term of terms) {
    const existing = byTerm.get(term.normalizedTerm) ?? [];
    existing.push(term);
    byTerm.set(term.normalizedTerm, existing);
  }

  for (const [normalizedTerm, records] of byTerm.entries()) {
    if (records.length <= 1) {
      continue;
    }

    for (const record of records) {
      issues.push({
        severity: "error",
        code,
        message: `duplicate glossary term "${record.term}" (${normalizedTerm})`,
        path: record.path
      });
    }
  }
}

function validateGlossaryReferences(options: {
  readonly references: readonly GlossaryReferenceRecord[];
  readonly glossaryTerms: readonly GlossaryTermRecord[];
  readonly issues: DocsValidationIssue[];
}): void {
  const definedTerms = new Set(options.glossaryTerms.map((term) => term.normalizedTerm));

  for (const reference of options.references) {
    if (definedTerms.has(reference.normalizedTerm)) {
      continue;
    }

    options.issues.push({
      severity: "warning",
      code: "glossary.unresolvedReference",
      message: `frontmatter glossaryTerms reference is not defined in ${canonicalGlossaryPath}: ${reference.term}`,
      path: reference.path,
      field: "glossaryTerms"
    });
  }
}

function validateQuickrefReferences(options: {
  readonly quickrefTerms: readonly GlossaryTermRecord[];
  readonly glossaryTerms: readonly GlossaryTermRecord[];
  readonly issues: DocsValidationIssue[];
}): void {
  const definedTerms = new Set(options.glossaryTerms.map((term) => term.normalizedTerm));

  for (const quickrefTerm of options.quickrefTerms) {
    if (definedTerms.has(quickrefTerm.normalizedTerm)) {
      continue;
    }

    options.issues.push({
      severity: "warning",
      code: "glossary.quickrefTermMissingFromGlossary",
      message: `quickref term is not defined in canonical glossary: ${quickrefTerm.term}`,
      path: quickrefTerm.path
    });
  }
}

function validateQuickrefCoverage(options: {
  readonly references: readonly GlossaryReferenceRecord[];
  readonly quickrefTerms: readonly GlossaryTermRecord[];
  readonly issues: DocsValidationIssue[];
}): void {
  const quickrefTerms = new Set(options.quickrefTerms.map((term) => term.normalizedTerm));

  for (const reference of options.references) {
    if (quickrefTerms.has(reference.normalizedTerm)) {
      continue;
    }

    options.issues.push({
      severity: "warning",
      code: "glossary.quickrefCoverageMissing",
      message: `referenced glossary term is missing from onboarding quickref: ${reference.term}`,
      path: reference.path,
      field: "glossaryTerms"
    });
  }
}

function createGlossaryValidationReport(options: {
  readonly glossaryTerms: readonly GlossaryTermRecord[];
  readonly quickrefTerms: readonly GlossaryTermRecord[];
  readonly references: readonly GlossaryReferenceRecord[];
  readonly issues: readonly DocsValidationIssue[];
  readonly failOnWarnings: boolean;
}): GlossaryValidationReport {
  const summary = summarizeGlossaryValidation(options);

  return {
    ok: summary.errorCount === 0 && (!options.failOnWarnings || summary.warningCount === 0),
    summary,
    glossaryTerms: [...options.glossaryTerms].sort(compareTerms),
    quickrefTerms: [...options.quickrefTerms].sort(compareTerms),
    references: [...options.references].sort(compareReferences),
    issues: options.issues
  };
}

function summarizeGlossaryValidation(options: {
  readonly glossaryTerms: readonly GlossaryTermRecord[];
  readonly quickrefTerms: readonly GlossaryTermRecord[];
  readonly references: readonly GlossaryReferenceRecord[];
  readonly issues: readonly DocsValidationIssue[];
}): GlossaryValidationSummary {
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
    glossaryTermCount: options.glossaryTerms.length,
    quickrefTermCount: options.quickrefTerms.length,
    referencedTermCount: options.references.length,
    errorCount,
    warningCount,
    infoCount
  };
}

function cleanTerm(value: string): string | null {
  const cleaned = value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[📘🏛️🏗️🔄🧪⚙️🧭🧠🔥✅]/g, "")
    .replace(/^#+\s*/, "")
    .replace(/[:：]\s*$/, "")
    .trim();

  return cleaned.length > 0 ? cleaned : null;
}

function normalizeTerm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string): string {
  return normalizeTerm(value).replace(/\s+/g, "-");
}

function dedupeTermsByPathAndLine(
  terms: readonly GlossaryTermRecord[]
): GlossaryTermRecord[] {
  const seen = new Set<string>();
  const result: GlossaryTermRecord[] = [];

  for (const term of terms) {
    const key = `${term.path}:${term.line}:${term.normalizedTerm}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(term);
  }

  return result;
}

function dedupeReferences(
  references: readonly GlossaryReferenceRecord[]
): GlossaryReferenceRecord[] {
  const seen = new Set<string>();
  const result: GlossaryReferenceRecord[] = [];

  for (const reference of references) {
    const key = `${reference.path}:${reference.normalizedTerm}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(reference);
  }

  return result;
}

function compareTerms(left: GlossaryTermRecord, right: GlossaryTermRecord): number {
  return (
    left.normalizedTerm.localeCompare(right.normalizedTerm) ||
    left.path.localeCompare(right.path) ||
    left.line - right.line
  );
}

function compareReferences(left: GlossaryReferenceRecord, right: GlossaryReferenceRecord): number {
  return (
    left.normalizedTerm.localeCompare(right.normalizedTerm) ||
    left.path.localeCompare(right.path)
  );
}
