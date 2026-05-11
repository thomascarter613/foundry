#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


FILES: dict[str, str] = {
    "packages/cli/src/docs/pipeline.ts": r'''import {
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
import {
  formatWorkPacketValidationReportAsJson,
  formatWorkPacketValidationReportAsText,
  validateWorkPackets,
  type WorkPacketValidationReport
} from "./work-packet-validator.js";
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
  readonly workPackets?: {
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
  readonly workPacketValidation: WorkPacketValidationReport;
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

  const workPacketValidation = validateWorkPackets({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {}),
    strictIndex: options.workPackets?.strictIndex ?? false,
    strictPlacement: options.workPackets?.strictPlacement ?? false,
    failOnWarnings: options.workPackets?.failOnWarnings ?? false
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
      changePlanValidation,
      workPacketValidation
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
      changePlanValidation.ok &&
      workPacketValidation.ok,
    directoryValidation,
    metadata,
    graph: graphBuildResult.graph,
    graphBuildIssues: graphBuildResult.issues,
    graphValidation,
    adrValidation,
    glossaryValidation,
    changePlanValidation,
    workPacketValidation
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
  sections.push(formatWorkPacketValidationReportAsText(report.workPacketValidation));

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
    "work-packet-validation-report.json": formatWorkPacketValidationReportAsJson(report.workPacketValidation),
    "verification-pipeline-report.json": formatDocsVerificationPipelineReportAsJson(report)
  };
}
''',

    "packages/cli/src/commands/docs/verify.ts": r'''import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  createDocsVerificationArtifacts,
  formatDocsVerificationPipelineReportAsJson,
  formatDocsVerificationPipelineReportAsText,
  runDocsVerificationPipeline
} from "../../docs/index.js";

export default class DocsVerify extends Command {
  static override summary = "Run the full documentation verification pipeline.";

  static override description = `
Run directory topology validation, metadata validation, graph construction,
graph validation, ADR validation, glossary validation, ChangePlan validation,
and Work Packet validation as one governed documentation verification pipeline.

The command writes machine-readable artifacts by default under .artifacts/docs.
`;

  static override examples = [
    {
      description: "Run bootstrap-mode docs verification.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Run strict docs verification.",
      command: "<%= config.bin %> <%= command.id %> --strict"
    },
    {
      description: "Run docs verification and print JSON.",
      command: "<%= config.bin %> <%= command.id %> --json"
    },
    {
      description: "Write artifacts under a custom directory.",
      command: "<%= config.bin %> <%= command.id %> --artifacts-dir .artifacts/docs"
    }
  ];

  static override flags = {
    "artifacts-dir": Flags.string({
      default: ".artifacts/docs",
      description: "Repository-relative artifact directory for JSON reports."
    }),
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to verify."
    }),
    "fail-on-warnings": Flags.boolean({
      default: false,
      description: "Exit non-zero when warnings are present."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the full verification pipeline report as JSON."
    }),
    "no-artifacts": Flags.boolean({
      default: false,
      description: "Do not write JSON report artifacts."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    }),
    strict: Flags.boolean({
      default: false,
      description: "Enable strict directory, graph, ADR, glossary, ChangePlan, and Work Packet checks."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsVerify);
    const repoRoot = resolve(flags.root);
    const failOnWarnings = flags["fail-on-warnings"] || flags.strict;

    const report = runDocsVerificationPipeline({
      repoRoot,
      docsDir: flags["docs-dir"],
      failOnWarnings,
      directory: {
        strict: flags.strict,
        failOnWarnings
      },
      graph: {
        includeOrphanWarnings: flags.strict,
        requireReciprocalLinks: flags.strict,
        failOnWarnings
      },
      adr: {
        strictIndex: flags.strict,
        failOnWarnings
      },
      glossary: {
        requireQuickrefCoverage: flags.strict,
        failOnWarnings
      },
      changeplans: {
        strictIndex: flags.strict,
        strictPlacement: flags.strict,
        failOnWarnings
      },
      workPackets: {
        strictIndex: flags.strict,
        strictPlacement: flags.strict,
        failOnWarnings
      }
    });

    if (!flags["no-artifacts"]) {
      const artifactsDir = resolve(repoRoot, flags["artifacts-dir"]);
      mkdirSync(artifactsDir, { recursive: true });

      const artifacts = createDocsVerificationArtifacts(report);

      for (const [fileName, content] of Object.entries(artifacts)) {
        writeFileSync(join(artifactsDir, fileName), `${content}\n`, "utf8");
      }
    }

    this.log(
      flags.json
        ? formatDocsVerificationPipelineReportAsJson(report)
        : formatDocsVerificationPipelineReportAsText(report)
    );

    if (!flags["no-artifacts"]) {
      this.log("");
      this.log("Documentation verification artifacts written:");
      this.log(`- ${flags["artifacts-dir"]}/directory-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/graph.json`);
      this.log(`- ${flags["artifacts-dir"]}/graph-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/adr-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/glossary-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/changeplan-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/work-packet-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/verification-pipeline-report.json`);
    }

    if (!report.ok) {
      this.exit(1);
    }
  }
}
''',

    "packages/cli/src/docs/readiness.ts": r'''import {
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
  directory: 16,
  metadata: 20,
  graph: 20,
  adr: 12,
  glossary: 12,
  changeplans: 10,
  workPackets: 10
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

  const graphValidation = createGraphValidationReport(options);

  const dimensions = [
    createDirectoryDimension(directoryValidation),
    createMetadataDimension(metadataValidation),
    createGraphDimension(graphValidation),
    createAdrDimension(adrValidation),
    createGlossaryDimension(glossaryValidation),
    createChangePlanDimension(changePlanValidation),
    createWorkPacketDimension(workPacketValidation)
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

function createChangePlanDimension(report: ChangePlanValidationReport): DocsReadinessDimension {
  return createDimension({
    id: "changeplans",
    label: "ChangePlan governance",
    weight: weights.changeplans,
    errorCount: report.summary.errorCount,
    warningCount: report.summary.warningCount,
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

    "tools/scripts/verify-docs.ts": r'''import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  createDocsVerificationArtifacts,
  formatDocsVerificationPipelineReportAsText,
  runDocsVerificationPipeline
} from "../../packages/cli/src/docs/index.ts";

const repoRoot = process.cwd();
const artifactsDir = join(repoRoot, ".artifacts", "docs");

const report = runDocsVerificationPipeline({
  repoRoot,
  docsDir: "docs",
  directory: {
    strict: false,
    failOnWarnings: false
  },
  graph: {
    includeOrphanWarnings: false,
    requireReciprocalLinks: false,
    failOnWarnings: false
  },
  adr: {
    strictIndex: false,
    failOnWarnings: false
  },
  glossary: {
    requireQuickrefCoverage: false,
    failOnWarnings: false
  },
  changeplans: {
    strictIndex: false,
    strictPlacement: false,
    failOnWarnings: false
  },
  workPackets: {
    strictIndex: false,
    strictPlacement: false,
    failOnWarnings: false
  }
});

mkdirSync(artifactsDir, { recursive: true });

const artifacts = createDocsVerificationArtifacts(report);

for (const [fileName, content] of Object.entries(artifacts)) {
  writeFileSync(join(artifactsDir, fileName), `${content}\n`, "utf8");
}

console.log(formatDocsVerificationPipelineReportAsText(report));
console.log("");
console.log("Documentation verification artifacts written:");
console.log("- .artifacts/docs/directory-validation-report.json");
console.log("- .artifacts/docs/validation-report.json");
console.log("- .artifacts/docs/graph.json");
console.log("- .artifacts/docs/graph-validation-report.json");
console.log("- .artifacts/docs/adr-validation-report.json");
console.log("- .artifacts/docs/glossary-validation-report.json");
console.log("- .artifacts/docs/changeplan-validation-report.json");
console.log("- .artifacts/docs/work-packet-validation-report.json");
console.log("- .artifacts/docs/verification-pipeline-report.json");

if (!report.ok) {
  process.exit(1);
}
'''
}


def main() -> int:
    for file_name, content in FILES.items():
        path = Path(file_name)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        print(f"wrote {file_name}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
