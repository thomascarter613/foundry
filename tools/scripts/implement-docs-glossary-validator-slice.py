#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


FILES: dict[str, str] = {
    "packages/cli/src/docs/glossary-validator.ts": '''import { parseMarkdownDocument } from "./frontmatter.js";
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

  return lines.join("\\n");
}

export function formatGlossaryValidationReportAsJson(report: GlossaryValidationReport): string {
  return JSON.stringify(report, null, 2);
}

function extractTermsFromDocument(document: ParsedMarkdownDocument): GlossaryTermRecord[] {
  const records: GlossaryTermRecord[] = [];
  const lines = document.body.split("\\n");

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
  const match = line.match(/^#{2,4}\\s+(.+?)\\s*$/);

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
  const boldMatch = line.match(/^\\s*[-*]\\s+\\*\\*(.+?)\\*\\*/);

  if (boldMatch?.[1]) {
    return cleanTerm(boldMatch[1]);
  }

  const colonMatch = line.match(/^\\s*[-*]\\s+([^:]{2,80}):\\s+/);

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
    .replace(/\\[([^\\]]+)\\]\\([^\\)]+\\)/g, "$1")
    .replace(/[📘🏛️🏗️🔄🧪⚙️🧭🧠🔥✅]/g, "")
    .replace(/^#+\\s*/, "")
    .replace(/[:：]\\s*$/, "")
    .trim();

  return cleaned.length > 0 ? cleaned : null;
}

function normalizeTerm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
}

function slugify(value: string): string {
  return normalizeTerm(value).replace(/\\s+/g, "-");
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
''',

    "packages/cli/src/commands/docs/glossary/validate.ts": '''import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  formatGlossaryValidationReportAsJson,
  formatGlossaryValidationReportAsText,
  validateGlossary
} from "../../../docs/glossary-validator.js";

export default class DocsGlossaryValidate extends Command {
  static override summary = "Validate glossary terms and glossary references.";

  static override description = `
Validate the canonical glossary, onboarding quickref, and glossaryTerms
frontmatter references across the governed documentation corpus.
`;

  static override examples = [
    {
      description: "Validate glossary references in bootstrap mode.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Validate glossary references and fail on warnings.",
      command: "<%= config.bin %> <%= command.id %> --fail-on-warnings"
    },
    {
      description: "Validate glossary quickref coverage.",
      command: "<%= config.bin %> <%= command.id %> --require-quickref-coverage"
    },
    {
      description: "Write a JSON glossary validation report.",
      command: "<%= config.bin %> <%= command.id %> --json --report-path .artifacts/docs/glossary-validation-report.json"
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
      description: "Print the glossary validation report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the glossary validation JSON report."
    }),
    "require-quickref-coverage": Flags.boolean({
      default: false,
      description: "Warn when referenced glossary terms are missing from onboarding quickref."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsGlossaryValidate);
    const repoRoot = resolve(flags.root);

    const report = validateGlossary({
      repoRoot,
      docsDir: flags["docs-dir"],
      failOnWarnings: flags["fail-on-warnings"],
      requireQuickrefCoverage: flags["require-quickref-coverage"]
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatGlossaryValidationReportAsJson(report)}\\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatGlossaryValidationReportAsJson(report)
        : formatGlossaryValidationReportAsText(report)
    );

    if (!report.ok) {
      this.exit(1);
    }
  }
}
''',

    "packages/cli/src/docs/index.ts": '''export {
  formatAdrValidationReportAsJson,
  formatAdrValidationReportAsText,
  validateAdrIndex
} from "./adr-validator.js";
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
  DocsGraph,
  DocsGraphBuildResult,
  DocsGraphEdge,
  DocsGraphEdgeType,
  DocsGraphNode,
  DocsGraphNodeKind
} from "./graph.js";
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
''',
}


def update_package_json() -> None:
    path = Path("package.json")

    if not path.exists():
        print("skip package.json update: package.json not found")
        return

    data = json.loads(path.read_text(encoding="utf-8"))
    scripts = data.setdefault("scripts", {})

    scripts.setdefault(
        "docs:glossary:validate",
        "bun run foundry:build && node packages/cli/bin/run.js docs glossary validate"
    )
    scripts.setdefault(
        "docs:glossary:validate:strict",
        "bun run foundry:build && node packages/cli/bin/run.js docs glossary validate --fail-on-warnings --require-quickref-coverage"
    )

    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print("updated package.json")


def main() -> int:
    for file_name, content in FILES.items():
        path = Path(file_name)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        print(f"wrote {file_name}")

    update_package_json()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
