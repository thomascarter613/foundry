#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


FILES: dict[str, str] = {
    "packages/cli/src/docs/readiness.ts": r'''import {
  validateAdrIndex,
  type AdrValidationReport
} from "./adr-validator.js";
import {
  validateDirectoryTopology,
  type DirectoryValidationReport
} from "./directory-validator.js";
import { buildDocsGraph } from "./graph.js";
import {
  validateDocsGraph,
  type DocsGraphValidationReport
} from "./graph-validator.js";
import {
  validateGlossary,
  type GlossaryValidationReport
} from "./glossary-validator.js";
import { parseMarkdownDocument } from "./frontmatter.js";
import { scanMarkdownDocuments } from "./scanner.js";
import type {
  DocsValidationReport,
  ParsedMarkdownDocument
} from "./types.js";
import { runDocsValidation } from "./engine.js";

export type DocsReadinessStatus = "ready" | "attention" | "blocked";

export type DocsReadinessDimensionId =
  | "directory"
  | "metadata"
  | "graph"
  | "adr"
  | "glossary";

export type DocsReadinessDimension = {
  readonly id: DocsReadinessDimensionId;
  readonly label: string;
  readonly status: DocsReadinessStatus;
  readonly score: number;
  readonly weight: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly recommendations: readonly string[];
};

export type DocsReadinessReport = {
  readonly ok: boolean;
  readonly generatedAt: string;
  readonly status: DocsReadinessStatus;
  readonly score: number;
  readonly dimensions: readonly DocsReadinessDimension[];
  readonly recommendations: readonly string[];
};

export type DocsReadinessOptions = {
  readonly repoRoot: string;
  readonly docsDir?: string;
};

type DimensionInput = {
  readonly id: DocsReadinessDimensionId;
  readonly label: string;
  readonly weight: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly recommendations: readonly string[];
};

const weights: Record<DocsReadinessDimensionId, number> = {
  directory: 20,
  metadata: 25,
  graph: 25,
  adr: 15,
  glossary: 15
};

export function assessDocsReadiness(options: DocsReadinessOptions): DocsReadinessReport {
  const directoryValidation = validateDirectoryTopology({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {}),
    strict: true,
    failOnWarnings: false
  });

  const metadataValidation = runDocsValidation({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {}),
    failOnWarnings: false
  });

  const adrValidation = validateAdrIndex({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {}),
    strictIndex: true,
    failOnWarnings: false
  });

  const glossaryValidation = validateGlossary({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {}),
    requireQuickrefCoverage: true,
    failOnWarnings: false
  });

  const graphValidation = createGraphValidationReport(options);

  const dimensions = [
    createDirectoryDimension(directoryValidation),
    createMetadataDimension(metadataValidation),
    createGraphDimension(graphValidation),
    createAdrDimension(adrValidation),
    createGlossaryDimension(glossaryValidation)
  ];

  const score = Math.round(
    dimensions.reduce((sum, dimension) => sum + dimension.score * (dimension.weight / 100), 0)
  );

  const status = overallStatus(dimensions, score);
  const recommendations = dimensions.flatMap((dimension) => [...dimension.recommendations]);

  return {
    ok: status === "ready",
    generatedAt: new Date().toISOString(),
    status,
    score,
    dimensions,
    recommendations
  };
}

export function formatDocsReadinessReportAsText(report: DocsReadinessReport): string {
  const lines: string[] = [];

  lines.push("Documentation Strict-Mode Readiness");
  lines.push("");
  lines.push(`Status: ${report.status}`);
  lines.push(`Score: ${report.score}/100`);
  lines.push("");

  lines.push("Dimensions:");

  for (const dimension of report.dimensions) {
    lines.push(`- ${dimension.label}: ${dimension.status}`);
    lines.push(`  score: ${dimension.score}/100`);
    lines.push(`  errors: ${dimension.errorCount}`);
    lines.push(`  warnings: ${dimension.warningCount}`);

    if (dimension.recommendations.length > 0) {
      lines.push("  recommendations:");

      for (const recommendation of dimension.recommendations) {
        lines.push(`    - ${recommendation}`);
      }
    }
  }

  if (report.recommendations.length > 0) {
    lines.push("");
    lines.push("Recommended next actions:");

    for (const recommendation of unique(report.recommendations)) {
      lines.push(`- ${recommendation}`);
    }
  }

  if (report.ok) {
    lines.push("");
    lines.push("The documentation system is ready for strict-mode enforcement.");
  } else {
    lines.push("");
    lines.push("The documentation system should remain in bootstrap mode until the listed issues are resolved.");
  }

  return lines.join("\n");
}

export function formatDocsReadinessReportAsJson(report: DocsReadinessReport): string {
  return JSON.stringify(report, null, 2);
}

function createGraphValidationReport(options: DocsReadinessOptions): DocsGraphValidationReport {
  const scanResult = scanMarkdownDocuments({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {})
  });

  if (!scanResult.ok) {
    return {
      ok: false,
      summary: {
        nodeCount: 0,
        edgeCount: 0,
        errorCount: 1,
        warningCount: 0,
        infoCount: 0
      },
      issues: [
        {
          severity: "error",
          code: "docs.scanFailed",
          message: scanResult.reason,
          path: options.docsDir ?? "docs"
        }
      ]
    };
  }

  const parsedDocuments: readonly ParsedMarkdownDocument[] = scanResult.documents.map((document) =>
    parseMarkdownDocument(document)
  );

  const graphBuildResult = buildDocsGraph(parsedDocuments);

  return validateDocsGraph(graphBuildResult.graph, graphBuildResult.issues, {
    includeOrphanWarnings: true,
    requireReciprocalLinks: true,
    failOnWarnings: false
  });
}

function createDirectoryDimension(report: DirectoryValidationReport): DocsReadinessDimension {
  return createDimension({
    id: "directory",
    label: "Directory topology",
    weight: weights.directory,
    errorCount: report.summary.errorCount,
    warningCount: report.summary.warningCount,
    recommendations: [
      ...(report.summary.errorCount > 0
        ? ["Run `foundry docs directory repair --write`, then re-run directory validation."]
        : []),
      ...(report.summary.warningCount > 0
        ? ["Review legacy docs directories and root-level Markdown placement before enabling strict topology enforcement."]
        : [])
    ]
  });
}

function createMetadataDimension(report: DocsValidationReport): DocsReadinessDimension {
  return createDimension({
    id: "metadata",
    label: "Governed metadata",
    weight: weights.metadata,
    errorCount: report.summary.errorCount,
    warningCount: report.summary.warningCount,
    recommendations: [
      ...(report.summary.errorCount > 0
        ? ["Repair required frontmatter fields and invalid metadata enum values."]
        : []),
      ...(report.summary.warningCount > 0
        ? ["Review metadata warnings before enabling strict metadata enforcement."]
        : [])
    ]
  });
}

function createGraphDimension(report: DocsGraphValidationReport): DocsReadinessDimension {
  return createDimension({
    id: "graph",
    label: "Documentation graph",
    weight: weights.graph,
    errorCount: report.summary.errorCount,
    warningCount: report.summary.warningCount,
    recommendations: [
      ...(report.summary.errorCount > 0
        ? ["Run `foundry docs graph repair --write`, then re-run `foundry docs verify`."]
        : []),
      ...(report.summary.warningCount > 0
        ? ["Resolve graph warnings or intentionally defer them before strict graph validation."]
        : [])
    ]
  });
}

function createAdrDimension(report: AdrValidationReport): DocsReadinessDimension {
  return createDimension({
    id: "adr",
    label: "ADR governance",
    weight: weights.adr,
    errorCount: report.summary.errorCount,
    warningCount: report.summary.warningCount,
    recommendations: [
      ...(report.summary.errorCount > 0
        ? ["Repair ADR numbering, duplicate ADRs, and ADR index consistency."]
        : []),
      ...(report.summary.warningCount > 0
        ? ["Run strict ADR validation and update the ADR index."]
        : [])
    ]
  });
}

function createGlossaryDimension(report: GlossaryValidationReport): DocsReadinessDimension {
  return createDimension({
    id: "glossary",
    label: "Glossary coverage",
    weight: weights.glossary,
    errorCount: report.summary.errorCount,
    warningCount: report.summary.warningCount,
    recommendations: [
      ...(report.summary.errorCount > 0
        ? ["Repair duplicate glossary terms and invalid glossary structure."]
        : []),
      ...(report.summary.warningCount > 0
        ? ["Add missing glossary terms or update document glossaryTerms references."]
        : [])
    ]
  });
}

function createDimension(input: DimensionInput): DocsReadinessDimension {
  const score = scoreDimension(input.errorCount, input.warningCount);
  const status = dimensionStatus(input.errorCount, input.warningCount, score);

  return {
    id: input.id,
    label: input.label,
    status,
    score,
    weight: input.weight,
    errorCount: input.errorCount,
    warningCount: input.warningCount,
    recommendations: input.recommendations
  };
}

function scoreDimension(errorCount: number, warningCount: number): number {
  if (errorCount > 0) {
    return Math.max(0, 50 - errorCount * 10);
  }

  if (warningCount > 0) {
    return Math.max(60, 100 - warningCount * 4);
  }

  return 100;
}

function dimensionStatus(
  errorCount: number,
  warningCount: number,
  score: number
): DocsReadinessStatus {
  if (errorCount > 0 || score < 60) {
    return "blocked";
  }

  if (warningCount > 0 || score < 95) {
    return "attention";
  }

  return "ready";
}

function overallStatus(
  dimensions: readonly DocsReadinessDimension[],
  score: number
): DocsReadinessStatus {
  if (dimensions.some((dimension) => dimension.status === "blocked")) {
    return "blocked";
  }

  if (dimensions.some((dimension) => dimension.status === "attention") || score < 95) {
    return "attention";
  }

  return "ready";
}

function unique(values: readonly string[]): string[] {
  const result: string[] = [];

  for (const value of values) {
    if (!result.includes(value)) {
      result.push(value);
    }
  }

  return result;
}
''',

    "packages/cli/src/commands/docs/readiness.ts": r'''import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  assessDocsReadiness,
  formatDocsReadinessReportAsJson,
  formatDocsReadinessReportAsText
} from "../../docs/readiness.js";

export default class DocsReadiness extends Command {
  static override summary = "Assess documentation strict-mode readiness.";

  static override description = `
Assess whether the governed documentation system is ready to move from
bootstrap-mode validation to strict-mode enforcement.

This command is read-only. It summarizes directory, metadata, graph, ADR, and
glossary validation into a weighted readiness score.
`;

  static override examples = [
    {
      description: "Assess documentation strict-mode readiness.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Print readiness as JSON.",
      command: "<%= config.bin %> <%= command.id %> --json"
    },
    {
      description: "Write a readiness report artifact.",
      command: "<%= config.bin %> <%= command.id %> --report-path .artifacts/docs/readiness-report.json"
    }
  ];

  static override flags = {
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to assess."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the readiness report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the readiness JSON report."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsReadiness);
    const repoRoot = resolve(flags.root);

    const report = assessDocsReadiness({
      repoRoot,
      docsDir: flags["docs-dir"]
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatDocsReadinessReportAsJson(report)}\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatDocsReadinessReportAsJson(report)
        : formatDocsReadinessReportAsText(report)
    );

    if (report.status === "blocked") {
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
        "docs:readiness",
        "bun run foundry:build && node packages/cli/bin/run.js docs readiness"
    )
    scripts.setdefault(
        "docs:readiness:json",
        "bun run foundry:build && node packages/cli/bin/run.js docs readiness --json --report-path .artifacts/docs/readiness-report.json"
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
