#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


FILES: dict[str, str] = {
    "packages/cli/src/docs/pipeline.ts": '''import {
  formatAdrValidationReportAsJson,
  formatAdrValidationReportAsText,
  validateAdrIndex,
  type AdrValidationReport
} from "./adr-validator.js";
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
};

export type DocsVerificationPipelineReport = {
  readonly ok: boolean;
  readonly metadata: DocsValidationReport;
  readonly graph: DocsGraph | null;
  readonly graphBuildIssues: readonly DocsValidationIssue[];
  readonly graphValidation: DocsGraphValidationReport | null;
  readonly adrValidation: AdrValidationReport;
  readonly glossaryValidation: GlossaryValidationReport;
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
      graphValidation: null,
      adrValidation,
      glossaryValidation
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
      metadata.ok &&
      graphValidation.ok &&
      adrValidation.ok &&
      glossaryValidation.ok,
    metadata,
    graph: graphBuildResult.graph,
    graphBuildIssues: graphBuildResult.issues,
    graphValidation,
    adrValidation,
    glossaryValidation
  };
}

export function formatDocsVerificationPipelineReportAsText(
  report: DocsVerificationPipelineReport
): string {
  const sections: string[] = [];

  sections.push("Documentation Verification Pipeline");
  sections.push(report.ok ? "Result: passed" : "Result: failed");
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

  sections.push(
    report.ok
      ? "Documentation verification pipeline passed."
      : "Documentation verification pipeline failed."
  );

  return sections.join("\\n\\n");
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
    "adr-validation-report.json": formatAdrValidationReportAsJson(report.adrValidation),
    "glossary-validation-report.json": formatGlossaryValidationReportAsJson(report.glossaryValidation),
    "verification-pipeline-report.json": formatDocsVerificationPipelineReportAsJson(report)
  };
}
''',

    "packages/cli/src/commands/docs/verify.ts": '''import { Command, Flags } from "@oclif/core";
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
Run metadata validation, graph construction, graph validation, ADR validation,
and glossary validation as one governed documentation verification pipeline.

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
      description: "Enable strict graph, ADR, and glossary checks."
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
      }
    });

    if (!flags["no-artifacts"]) {
      const artifactsDir = resolve(repoRoot, flags["artifacts-dir"]);
      mkdirSync(artifactsDir, { recursive: true });

      const artifacts = createDocsVerificationArtifacts(report);

      for (const [fileName, content] of Object.entries(artifacts)) {
        writeFileSync(join(artifactsDir, fileName), `${content}\\n`, "utf8");
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
      this.log(`- ${flags["artifacts-dir"]}/validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/graph.json`);
      this.log(`- ${flags["artifacts-dir"]}/graph-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/adr-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/glossary-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/verification-pipeline-report.json`);
    }

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

    "tools/scripts/verify-docs.ts": '''import { mkdirSync, writeFileSync } from "node:fs";
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
  }
});

mkdirSync(artifactsDir, { recursive: true });

const artifacts = createDocsVerificationArtifacts(report);

for (const [fileName, content] of Object.entries(artifacts)) {
  writeFileSync(join(artifactsDir, fileName), `${content}\\n`, "utf8");
}

console.log(formatDocsVerificationPipelineReportAsText(report));
console.log("");
console.log("Documentation verification artifacts written:");
console.log("- .artifacts/docs/validation-report.json");
console.log("- .artifacts/docs/graph.json");
console.log("- .artifacts/docs/graph-validation-report.json");
console.log("- .artifacts/docs/adr-validation-report.json");
console.log("- .artifacts/docs/glossary-validation-report.json");
console.log("- .artifacts/docs/verification-pipeline-report.json");

if (!report.ok) {
  process.exit(1);
}
''',
}


def update_package_json() -> None:
    path = Path("package.json")

    if not path.exists():
        print("skip package.json update: package.json not found")
        return

    data = json.loads(path.read_text(encoding="utf-8"))
    scripts = data.setdefault("scripts", {})

    scripts["docs:verify"] = "bun run foundry:build && node packages/cli/bin/run.js docs verify"
    scripts["docs:verify:strict"] = "bun run foundry:build && node packages/cli/bin/run.js docs verify --strict"

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
