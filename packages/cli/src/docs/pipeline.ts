import { buildDocsGraph, summarizeDocsGraph, type DocsGraph } from "./graph.js";
import {
  formatGraphValidationReportAsJson,
  formatGraphValidationReportAsText,
  validateDocsGraph,
  type DocsGraphValidationReport
} from "./graph-validator.js";
import { parseMarkdownDocument } from "./frontmatter.js";
import {
  formatValidationReportAsJson,
  formatValidationReportAsText
} from "./reporter.js";
import { scanMarkdownDocuments } from "./scanner.js";
import type {
  DocsEngineOptions,
  DocsValidationIssue,
  DocsValidationReport,
  ParsedMarkdownDocument
} from "./types.js";
import { runDocsValidation } from "./engine.js";

export type DocsVerificationPipelineOptions = DocsEngineOptions & {
  readonly graph?: {
    readonly includeOrphanWarnings?: boolean;
    readonly requireReciprocalLinks?: boolean;
    readonly failOnWarnings?: boolean;
  };
};

export type DocsVerificationPipelineReport = {
  readonly ok: boolean;
  readonly metadata: DocsValidationReport;
  readonly graph: DocsGraph | null;
  readonly graphBuildIssues: readonly DocsValidationIssue[];
  readonly graphValidation: DocsGraphValidationReport | null;
};

export function runDocsVerificationPipeline(
  options: DocsVerificationPipelineOptions
): DocsVerificationPipelineReport {
  const metadata = runDocsValidation({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {}),
    failOnWarnings: options.failOnWarnings ?? false
  });

  const scanResult = scanMarkdownDocuments({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {})
  });

  if (!scanResult.ok) {
    return {
      ok: false,
      metadata,
      graph: null,
      graphBuildIssues: [
        {
          severity: "error",
          code: "docs.scanFailed",
          message: scanResult.reason,
          path: options.docsDir ?? "docs"
        }
      ],
      graphValidation: null
    };
  }

  const parsedDocuments: readonly ParsedMarkdownDocument[] = scanResult.documents.map((document) =>
    parseMarkdownDocument(document)
  );

  const graphBuildResult = buildDocsGraph(parsedDocuments);
  const graphValidation = validateDocsGraph(graphBuildResult.graph, graphBuildResult.issues, {
    includeOrphanWarnings: options.graph?.includeOrphanWarnings ?? true,
    requireReciprocalLinks: options.graph?.requireReciprocalLinks ?? true,
    failOnWarnings: options.graph?.failOnWarnings ?? false
  });

  return {
    ok: metadata.ok && graphValidation.ok,
    metadata,
    graph: graphBuildResult.graph,
    graphBuildIssues: graphBuildResult.issues,
    graphValidation
  };
}

export function formatDocsVerificationPipelineReportAsText(
  report: DocsVerificationPipelineReport
): string {
  const sections: string[] = [];

  sections.push(formatValidationReportAsText(report.metadata));

  if (report.graph) {
    sections.push(summarizeDocsGraph(report.graph));
  } else {
    sections.push("Documentation graph was not built.");
  }

  if (report.graphValidation) {
    sections.push(formatGraphValidationReportAsText(report.graphValidation));
  } else {
    sections.push("Documentation graph validation was not run.");
  }

  sections.push(report.ok ? "Documentation verification pipeline passed." : "Documentation verification pipeline failed.");

  return sections.join("\n\n");
}

export function formatDocsVerificationPipelineReportAsJson(
  report: DocsVerificationPipelineReport
): string {
  return JSON.stringify(report, null, 2);
}

export function createDocsVerificationArtifacts(
  report: DocsVerificationPipelineReport
): Record<string, string> {
  return {
    "validation-report.json": formatValidationReportAsJson(report.metadata),
    "graph.json": JSON.stringify(report.graph, null, 2),
    "graph-validation-report.json": report.graphValidation
      ? formatGraphValidationReportAsJson(report.graphValidation)
      : JSON.stringify(null, null, 2),
    "verification-pipeline-report.json": formatDocsVerificationPipelineReportAsJson(report)
  };
}
