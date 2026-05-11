import {
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
