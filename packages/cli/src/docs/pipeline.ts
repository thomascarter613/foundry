import {
  formatAdrValidationReportAsJson,
  formatAdrValidationReportAsText,
  validateAdrIndex,
  type AdrValidationReport
} from "./adr-validator.js";
import {
  formatChangePlanValidationReportAsJson,
  formatChangePlanValidationReportAsText,
  validateChangePlans,
  type ChangePlanValidationReport
} from "./changeplan-validator.js";
import {
  formatDirectoryValidationReportAsJson,
  formatDirectoryValidationReportAsText,
  validateDirectoryTopology,
  type DirectoryValidationReport
} from "./directory-validator.js";
import { buildDocsGraph, summarizeDocsGraph, type DocsGraph } from "./graph.js";
import {
  formatGraphValidationReportAsJson,
  formatGraphValidationReportAsText,
  validateDocsGraph,
  type DocsGraphValidationReport
} from "./graph-validator.js";
import {
  formatGlossaryValidationReportAsJson,
  formatGlossaryValidationReportAsText,
  validateGlossary,
  type GlossaryValidationReport
} from "./glossary-validator.js";
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
  readonly directory?: {
    readonly strict?: boolean;
    readonly failOnWarnings?: boolean;
  };
  readonly graph?: {
    readonly includeOrphanWarnings?: boolean;
    readonly requireReciprocalLinks?: boolean;
    readonly failOnWarnings?: boolean;
  };
  readonly adr?: {
    readonly strictIndex?: boolean;
    readonly failOnWarnings?: boolean;
  };
  readonly glossary?: {
    readonly requireQuickrefCoverage?: boolean;
    readonly failOnWarnings?: boolean;
  };
  readonly changeplans?: {
    readonly strictIndex?: boolean;
    readonly strictPlacement?: boolean;
    readonly failOnWarnings?: boolean;
  };
};

export type DocsVerificationPipelineReport = {
  readonly ok: boolean;
  readonly directoryValidation: DirectoryValidationReport;
  readonly metadata: DocsValidationReport;
  readonly graph: DocsGraph | null;
  readonly graphBuildIssues: readonly DocsValidationIssue[];
  readonly graphValidation: DocsGraphValidationReport | null;
  readonly adrValidation: AdrValidationReport;
  readonly glossaryValidation: GlossaryValidationReport;
  readonly changePlanValidation: ChangePlanValidationReport;
};

export function runDocsVerificationPipeline(
  options: DocsVerificationPipelineOptions
): DocsVerificationPipelineReport {
  const directoryValidation = validateDirectoryTopology({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {}),
    strict: options.directory?.strict ?? false,
    failOnWarnings: options.directory?.failOnWarnings ?? false
  });

  const metadata = runDocsValidation({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {}),
    failOnWarnings: options.failOnWarnings ?? false
  });

  const scanResult = scanMarkdownDocuments({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {})
  });

  const adrValidation = validateAdrIndex({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {}),
    strictIndex: options.adr?.strictIndex ?? false,
    failOnWarnings: options.adr?.failOnWarnings ?? false
  });

  const glossaryValidation = validateGlossary({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {}),
    requireQuickrefCoverage: options.glossary?.requireQuickrefCoverage ?? false,
    failOnWarnings: options.glossary?.failOnWarnings ?? false
  });

  const changePlanValidation = validateChangePlans({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {}),
    strictIndex: options.changeplans?.strictIndex ?? false,
    strictPlacement: options.changeplans?.strictPlacement ?? false,
    failOnWarnings: options.changeplans?.failOnWarnings ?? false
  });

  if (!scanResult.ok) {
    return {
      ok: false,
      directoryValidation,
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
      graphValidation: null,
      adrValidation,
      glossaryValidation,
      changePlanValidation
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
    ok:
      directoryValidation.ok &&
      metadata.ok &&
      graphValidation.ok &&
      adrValidation.ok &&
      glossaryValidation.ok &&
      changePlanValidation.ok,
    directoryValidation,
    metadata,
    graph: graphBuildResult.graph,
    graphBuildIssues: graphBuildResult.issues,
    graphValidation,
    adrValidation,
    glossaryValidation,
    changePlanValidation
  };
}

export function formatDocsVerificationPipelineReportAsText(
  report: DocsVerificationPipelineReport
): string {
  const sections: string[] = [];

  sections.push("Documentation Verification Pipeline");
  sections.push(report.ok ? "Result: passed" : "Result: failed");
  sections.push(formatDirectoryValidationReportAsText(report.directoryValidation));
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

  sections.push(formatAdrValidationReportAsText(report.adrValidation));
  sections.push(formatGlossaryValidationReportAsText(report.glossaryValidation));
  sections.push(formatChangePlanValidationReportAsText(report.changePlanValidation));

  sections.push(
    report.ok
      ? "Documentation verification pipeline passed."
      : "Documentation verification pipeline failed."
  );

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
    "directory-validation-report.json": formatDirectoryValidationReportAsJson(report.directoryValidation),
    "validation-report.json": formatValidationReportAsJson(report.metadata),
    "graph.json": JSON.stringify(report.graph, null, 2),
    "graph-validation-report.json": report.graphValidation
      ? formatGraphValidationReportAsJson(report.graphValidation)
      : JSON.stringify(null, null, 2),
    "adr-validation-report.json": formatAdrValidationReportAsJson(report.adrValidation),
    "glossary-validation-report.json": formatGlossaryValidationReportAsJson(report.glossaryValidation),
    "changeplan-validation-report.json": formatChangePlanValidationReportAsJson(report.changePlanValidation),
    "verification-pipeline-report.json": formatDocsVerificationPipelineReportAsJson(report)
  };
}
