#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


READINESS_TS = r'''import {
  validateAdrIndex,
  type AdrValidationReport
} from "./adr-validator.js";
import {
  validateChangePlans,
  type ChangePlanValidationReport
} from "./changeplan-validator.js";
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
import {
  validateWorkPackets,
  type WorkPacketValidationReport
} from "./work-packet-validator.js";
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
  | "glossary"
  | "changeplans"
  | "workPackets";

export type DocsReadinessActionPriority = "high" | "medium" | "low";

export type DocsReadinessAction = {
  readonly priority: DocsReadinessActionPriority;
  readonly dimension: DocsReadinessDimensionId;
  readonly title: string;
  readonly command?: string;
  readonly detail: string;
};

export type DocsReadinessDimension = {
  readonly id: DocsReadinessDimensionId;
  readonly label: string;
  readonly status: DocsReadinessStatus;
  readonly score: number;
  readonly weight: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
  readonly recommendations: readonly string[];
};

export type DocsReadinessModeSummary = {
  readonly complete: boolean;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
};

export type DocsReadinessReport = {
  readonly ok: boolean;
  readonly generatedAt: string;
  readonly status: DocsReadinessStatus;
  readonly score: number;
  readonly bootstrap: DocsReadinessModeSummary;
  readonly strict: DocsReadinessModeSummary;
  readonly dimensions: readonly DocsReadinessDimension[];
  readonly actions: readonly DocsReadinessAction[];
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
  readonly infoCount: number;
  readonly recommendations: readonly string[];
};

type ValidationCounts = {
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
};

const weights: Record<DocsReadinessDimensionId, number> = {
  directory: 16,
  metadata: 20,
  graph: 20,
  adr: 12,
  glossary: 12,
  changeplans: 10,
  workPackets: 10
};

export function assessDocsReadiness(options: DocsReadinessOptions): DocsReadinessReport {
  const bootstrapCounts = assessBootstrapCounts(options);

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

  const graphValidation = createGraphValidationReport(options, {
    includeOrphanWarnings: true,
    requireReciprocalLinks: true
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

  const changePlanValidation = validateChangePlans({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {}),
    strictIndex: true,
    strictPlacement: true,
    failOnWarnings: false
  });

  const workPacketValidation = validateWorkPackets({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {}),
    strictIndex: true,
    strictPlacement: true,
    failOnWarnings: false
  });

  const dimensions = [
    createDirectoryDimension(directoryValidation),
    createMetadataDimension(metadataValidation),
    createGraphDimension(graphValidation),
    createAdrDimension(adrValidation),
    createGlossaryDimension(glossaryValidation),
    createChangePlanDimension(changePlanValidation),
    createWorkPacketDimension(workPacketValidation)
  ];

  const strictCounts = summarizeDimensions(dimensions);
  const score = Math.round(
    dimensions.reduce((sum, dimension) => sum + dimension.score * (dimension.weight / 100), 0)
  );

  const status = overallStatus(dimensions, score);
  const actions = createActionPlan(dimensions);
  const recommendations = dimensions.flatMap((dimension) => [...dimension.recommendations]);

  return {
    ok: status === "ready",
    generatedAt: new Date().toISOString(),
    status,
    score,
    bootstrap: {
      complete: bootstrapCounts.errorCount === 0,
      errorCount: bootstrapCounts.errorCount,
      warningCount: bootstrapCounts.warningCount,
      infoCount: bootstrapCounts.infoCount
    },
    strict: {
      complete: status === "ready",
      errorCount: strictCounts.errorCount,
      warningCount: strictCounts.warningCount,
      infoCount: strictCounts.infoCount
    },
    dimensions,
    actions,
    recommendations
  };
}

export function formatDocsReadinessReportAsText(report: DocsReadinessReport): string {
  const lines: string[] = [];

  lines.push("Documentation Strict-Mode Readiness");
  lines.push("");
  lines.push(`Bootstrap complete: ${String(report.bootstrap.complete)}`);
  lines.push(`Strict ready: ${String(report.strict.complete)}`);
  lines.push(`Strict status: ${report.status}`);
  lines.push(`Strict score: ${report.score}/100`);
  lines.push("");
  lines.push("Bootstrap summary:");
  lines.push(`- errors: ${report.bootstrap.errorCount}`);
  lines.push(`- warnings: ${report.bootstrap.warningCount}`);
  lines.push(`- info: ${report.bootstrap.infoCount}`);
  lines.push("");
  lines.push("Strict summary:");
  lines.push(`- errors: ${report.strict.errorCount}`);
  lines.push(`- warnings: ${report.strict.warningCount}`);
  lines.push(`- info: ${report.strict.infoCount}`);
  lines.push("");

  lines.push("Dimensions:");

  for (const dimension of report.dimensions) {
    lines.push(`- ${dimension.label}: ${dimension.status}`);
    lines.push(`  score: ${dimension.score}/100`);
    lines.push(`  errors: ${dimension.errorCount}`);
    lines.push(`  warnings: ${dimension.warningCount}`);
    lines.push(`  info: ${dimension.infoCount}`);

    if (dimension.recommendations.length > 0) {
      lines.push("  recommendations:");

      for (const recommendation of dimension.recommendations) {
        lines.push(`    - ${recommendation}`);
      }
    }
  }

  if (report.actions.length > 0) {
    lines.push("");
    lines.push("Strict-mode action plan:");

    for (const action of report.actions) {
      lines.push(`- [${action.priority}] ${action.title}`);
      lines.push(`  dimension: ${action.dimension}`);
      lines.push(`  detail: ${action.detail}`);

      if (action.command) {
        lines.push(`  command: ${action.command}`);
      }
    }
  }

  if (report.bootstrap.complete && !report.strict.complete) {
    lines.push("");
    lines.push("Bootstrap verification is complete. Strict-mode readiness remains open.");
  }

  if (report.ok) {
    lines.push("");
    lines.push("The documentation system is ready for strict-mode enforcement.");
  }

  return lines.join("\n");
}

export function formatDocsReadinessReportAsJson(report: DocsReadinessReport): string {
  return JSON.stringify(report, null, 2);
}

function assessBootstrapCounts(options: DocsReadinessOptions): ValidationCounts {
  const reports = [
    validateDirectoryTopology({
      repoRoot: options.repoRoot,
      ...(options.docsDir ? { docsDir: options.docsDir } : {}),
      strict: false,
      failOnWarnings: false
    }),
    runDocsValidation({
      repoRoot: options.repoRoot,
      ...(options.docsDir ? { docsDir: options.docsDir } : {}),
      failOnWarnings: false
    }),
    createGraphValidationReport(options, {
      includeOrphanWarnings: false,
      requireReciprocalLinks: false
    }),
    validateAdrIndex({
      repoRoot: options.repoRoot,
      ...(options.docsDir ? { docsDir: options.docsDir } : {}),
      strictIndex: false,
      failOnWarnings: false
    }),
    validateGlossary({
      repoRoot: options.repoRoot,
      ...(options.docsDir ? { docsDir: options.docsDir } : {}),
      requireQuickrefCoverage: false,
      failOnWarnings: false
    }),
    validateChangePlans({
      repoRoot: options.repoRoot,
      ...(options.docsDir ? { docsDir: options.docsDir } : {}),
      strictIndex: false,
      strictPlacement: false,
      failOnWarnings: false
    }),
    validateWorkPackets({
      repoRoot: options.repoRoot,
      ...(options.docsDir ? { docsDir: options.docsDir } : {}),
      strictIndex: false,
      strictPlacement: false,
      failOnWarnings: false
    })
  ];

  return reports.reduce(
    (counts, report) => ({
      errorCount: counts.errorCount + report.summary.errorCount,
      warningCount: counts.warningCount + report.summary.warningCount,
      infoCount: counts.infoCount + report.summary.infoCount
    }),
    {
      errorCount: 0,
      warningCount: 0,
      infoCount: 0
    }
  );
}

function createGraphValidationReport(
  options: DocsReadinessOptions,
  graphOptions: {
    readonly includeOrphanWarnings: boolean;
    readonly requireReciprocalLinks: boolean;
  }
): DocsGraphValidationReport {
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
    includeOrphanWarnings: graphOptions.includeOrphanWarnings,
    requireReciprocalLinks: graphOptions.requireReciprocalLinks,
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
    infoCount: report.summary.infoCount,
    recommendations: [
      ...(report.summary.errorCount > 0
        ? ["Run `foundry docs directory repair --write`, then re-run directory validation."]
        : []),
      ...(report.summary.warningCount > 0
        ? ["Review non-accepted docs topology warnings before strict enforcement."]
        : []),
      ...(report.summary.infoCount > 0
        ? ["Accepted legacy topology is present and governed as a transitional policy."]
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
    infoCount: report.summary.infoCount,
    recommendations: [
      ...(report.summary.errorCount > 0
        ? ["Repair required frontmatter fields and invalid metadata enum values."]
        : []),
      ...(report.summary.warningCount > 0
        ? ["Review metadata warnings before strict metadata enforcement."]
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
    infoCount: report.summary.infoCount,
    recommendations: [
      ...(report.summary.errorCount > 0
        ? ["Run `foundry docs graph repair --write`, then re-run `foundry docs verify`."]
        : []),
      ...(report.summary.warningCount > 0
        ? ["Resolve strict graph warnings or explicitly defer them before strict graph enforcement."]
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
    infoCount: report.summary.infoCount,
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
    infoCount: report.summary.infoCount,
    recommendations: [
      ...(report.summary.errorCount > 0
        ? ["Repair duplicate glossary terms and invalid glossary structure."]
        : []),
      ...(report.summary.warningCount > 0
        ? ["Add missing quickref glossary terms or narrow quickref coverage requirements."]
        : [])
    ]
  });
}

function createChangePlanDimension(report: ChangePlanValidationReport): DocsReadinessDimension {
  return createDimension({
    id: "changeplans",
    label: "ChangePlan governance",
    weight: weights.changeplans,
    errorCount: report.summary.errorCount,
    warningCount: report.summary.warningCount,
    infoCount: report.summary.infoCount,
    recommendations: [
      ...(report.summary.errorCount > 0
        ? ["Repair ChangePlan numbering, duplicate CP files, and required CP metadata."]
        : []),
      ...(report.summary.warningCount > 0
        ? ["Regenerate docs/changeplans/index.md and migrate legacy planning CP files before strict enforcement."]
        : [])
    ]
  });
}

function createWorkPacketDimension(report: WorkPacketValidationReport): DocsReadinessDimension {
  return createDimension({
    id: "workPackets",
    label: "Work Packet governance",
    weight: weights.workPackets,
    errorCount: report.summary.errorCount,
    warningCount: report.summary.warningCount,
    infoCount: report.summary.infoCount,
    recommendations: [
      ...(report.summary.errorCount > 0
        ? ["Repair Work Packet numbering, duplicate WP files, and required WP metadata."]
        : []),
      ...(report.summary.warningCount > 0
        ? ["Create or update docs/work-packets/index.md before strict enforcement."]
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
    infoCount: input.infoCount,
    recommendations: input.recommendations
  };
}

function createActionPlan(
  dimensions: readonly DocsReadinessDimension[]
): readonly DocsReadinessAction[] {
  return dimensions
    .filter((dimension) => dimension.status !== "ready")
    .flatMap((dimension) => actionsForDimension(dimension));
}

function actionsForDimension(dimension: DocsReadinessDimension): DocsReadinessAction[] {
  if (dimension.id === "graph" && dimension.warningCount > 0) {
    return [
      {
        priority: "high",
        dimension: "graph",
        title: "Resolve strict graph warnings",
        command: "node packages/cli/bin/run.js docs graph validate",
        detail: "Strict graph validation still reports warnings such as orphan or missing reciprocal graph relationships."
      }
    ];
  }

  if (dimension.id === "glossary" && dimension.warningCount > 0) {
    return [
      {
        priority: "medium",
        dimension: "glossary",
        title: "Complete glossary quickref coverage",
        command: "node packages/cli/bin/run.js docs glossary validate --require-quickref-coverage",
        detail: "Bootstrap glossary validation passes, but strict readiness requires referenced glossary terms to be covered by onboarding quickref."
      }
    ];
  }

  if (dimension.errorCount > 0) {
    return [
      {
        priority: "high",
        dimension: dimension.id,
        title: `Repair ${dimension.label} errors`,
        detail: `${dimension.label} has ${dimension.errorCount} strict-readiness error(s).`
      }
    ];
  }

  if (dimension.warningCount > 0) {
    return [
      {
        priority: "medium",
        dimension: dimension.id,
        title: `Review ${dimension.label} warnings`,
        detail: `${dimension.label} has ${dimension.warningCount} strict-readiness warning(s).`
      }
    ];
  }

  return [];
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

function summarizeDimensions(
  dimensions: readonly DocsReadinessDimension[]
): ValidationCounts {
  return dimensions.reduce(
    (counts, dimension) => ({
      errorCount: counts.errorCount + dimension.errorCount,
      warningCount: counts.warningCount + dimension.warningCount,
      infoCount: counts.infoCount + dimension.infoCount
    }),
    {
      errorCount: 0,
      warningCount: 0,
      infoCount: 0
    }
  );
}
'''

Path("packages/cli/src/docs/readiness.ts").write_text(READINESS_TS, encoding="utf-8")
print("rewrote packages/cli/src/docs/readiness.ts")
