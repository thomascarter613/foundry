#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path


FILES: dict[str, str] = {
    "packages/cli/src/docs/graph-validator.ts": '''import type { DocsValidationIssue } from "./types.js";
import type { DocsGraph, DocsGraphEdge, DocsGraphNode } from "./graph.js";

export type DocsGraphValidationOptions = {
  readonly includeOrphanWarnings?: boolean;
  readonly requireReciprocalLinks?: boolean;
  readonly failOnWarnings?: boolean;
};

export type DocsGraphValidationSummary = {
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
};

export type DocsGraphValidationReport = {
  readonly ok: boolean;
  readonly summary: DocsGraphValidationSummary;
  readonly issues: readonly DocsValidationIssue[];
};

export function validateDocsGraph(
  graph: DocsGraph,
  buildIssues: readonly DocsValidationIssue[] = [],
  options: DocsGraphValidationOptions = {}
): DocsGraphValidationReport {
  const issues: DocsValidationIssue[] = [...buildIssues];

  validateDuplicateNodeIds(graph, issues);
  validateDuplicateEdgeIds(graph, issues);
  validateEdgeTargets(graph, issues);
  validateSelfReferences(graph, issues);
  validateAdrDependencyTargets(graph, issues);
  validateGovernanceTargets(graph, issues);
  validateUpstreamCycles(graph, issues);

  if (options.requireReciprocalLinks ?? true) {
    validateReciprocalDependencyLinks(graph, issues);
  }

  if (options.includeOrphanWarnings ?? true) {
    validateOrphanDocumentNodes(graph, issues);
  }

  const summary = summarizeGraphValidation(graph, issues);

  return {
    ok: summary.errorCount === 0 && (!(options.failOnWarnings ?? false) || summary.warningCount === 0),
    summary,
    issues
  };
}

export function formatGraphValidationReportAsText(report: DocsGraphValidationReport): string {
  const lines: string[] = [];

  if (report.ok) {
    lines.push("Documentation graph validation passed.");
  } else {
    lines.push("Documentation graph validation failed.");
  }

  lines.push("");
  lines.push("Summary:");
  lines.push(`- nodes: ${report.summary.nodeCount}`);
  lines.push(`- edges: ${report.summary.edgeCount}`);
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

export function formatGraphValidationReportAsJson(report: DocsGraphValidationReport): string {
  return JSON.stringify(report, null, 2);
}

function validateDuplicateNodeIds(graph: DocsGraph, issues: DocsValidationIssue[]): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const node of graph.nodes) {
    if (seen.has(node.id)) {
      duplicates.add(node.id);
      continue;
    }

    seen.add(node.id);
  }

  for (const duplicate of duplicates) {
    issues.push(createIssue({
      severity: "error",
      code: "graph.duplicateNodeId",
      message: `duplicate graph node id: ${duplicate}`,
      path: pathFromNodeId(duplicate)
    }));
  }
}

function validateDuplicateEdgeIds(graph: DocsGraph, issues: DocsValidationIssue[]): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const edge of graph.edges) {
    if (seen.has(edge.id)) {
      duplicates.add(edge.id);
      continue;
    }

    seen.add(edge.id);
  }

  for (const duplicate of duplicates) {
    issues.push(createIssue({
      severity: "warning",
      code: "graph.duplicateEdgeId",
      message: `duplicate graph edge id: ${duplicate}`,
      path: "docs"
    }));
  }
}

function validateEdgeTargets(graph: DocsGraph, issues: DocsValidationIssue[]): void {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.from)) {
      issues.push(createIssue({
        severity: "error",
        code: "graph.danglingEdgeSource",
        message: `edge source does not resolve to a node: ${edge.from}`,
        path: edge.sourcePath
      }));
    }

    if (!nodeIds.has(edge.to)) {
      issues.push(createIssue({
        severity: "error",
        code: "graph.danglingEdgeTarget",
        message: `edge target does not resolve to a node: ${edge.to}`,
        path: edge.sourcePath
      }));
    }
  }
}

function validateSelfReferences(graph: DocsGraph, issues: DocsValidationIssue[]): void {
  for (const edge of graph.edges) {
    if (edge.from !== edge.to) {
      continue;
    }

    issues.push(createIssue({
      severity: "error",
      code: "graph.selfReference",
      message: `self-referencing ${edge.type} edge`,
      path: edge.sourcePath
    }));
  }
}

function validateAdrDependencyTargets(graph: DocsGraph, issues: DocsValidationIssue[]): void {
  const nodesById = indexNodesById(graph.nodes);

  for (const edge of graph.edges) {
    if (edge.type !== "ADRDependency") {
      continue;
    }

    const target = nodesById.get(edge.to);

    if (!target) {
      continue;
    }

    if (target.kind !== "ADR") {
      issues.push(createIssue({
        severity: "error",
        code: "graph.invalidAdrDependencyTarget",
        message: `ADRDependency edge must target an ADR node: ${edge.rawTarget}`,
        path: edge.sourcePath
      }));
    }
  }
}

function validateGovernanceTargets(graph: DocsGraph, issues: DocsValidationIssue[]): void {
  const nodesById = indexNodesById(graph.nodes);

  for (const edge of graph.edges) {
    if (edge.type !== "Governance") {
      continue;
    }

    const target = nodesById.get(edge.to);

    if (!target) {
      continue;
    }

    const targetType = target.metadata.documentType;

    if (targetType !== "Governance") {
      issues.push(createIssue({
        severity: "warning",
        code: "graph.nonGovernanceTarget",
        message: `Governance edge should target a Governance document: ${edge.rawTarget}`,
        path: edge.sourcePath
      }));
    }
  }
}

function validateReciprocalDependencyLinks(graph: DocsGraph, issues: DocsValidationIssue[]): void {
  const edgeKeys = new Set(graph.edges.map((edge) => edgeKey(edge.type, edge.from, edge.to)));

  for (const edge of graph.edges) {
    if (edge.type === "Upstream") {
      const reciprocal = edgeKey("Downstream", edge.to, edge.from);

      if (!edgeKeys.has(reciprocal)) {
        issues.push(createIssue({
          severity: "warning",
          code: "graph.missingReciprocalDownstream",
          message: `Upstream edge does not have matching Downstream edge: ${edge.rawTarget}`,
          path: edge.sourcePath
        }));
      }
    }

    if (edge.type === "Downstream") {
      const reciprocal = edgeKey("Upstream", edge.to, edge.from);

      if (!edgeKeys.has(reciprocal)) {
        issues.push(createIssue({
          severity: "warning",
          code: "graph.missingReciprocalUpstream",
          message: `Downstream edge does not have matching Upstream edge: ${edge.rawTarget}`,
          path: edge.sourcePath
        }));
      }
    }
  }
}

function validateOrphanDocumentNodes(graph: DocsGraph, issues: DocsValidationIssue[]): void {
  const connectedNodeIds = new Set<string>();

  for (const edge of graph.edges) {
    connectedNodeIds.add(edge.from);
    connectedNodeIds.add(edge.to);
  }

  for (const node of graph.nodes) {
    if (node.kind !== "Document" && node.kind !== "ADR") {
      continue;
    }

    if (isAllowedRootOrIndexNode(node)) {
      continue;
    }

    if (connectedNodeIds.has(node.id)) {
      continue;
    }

    issues.push(createIssue({
      severity: "warning",
      code: "graph.orphanDocumentNode",
      message: `document node has no graph edges: ${node.label}`,
      path: node.path ?? node.id
    }));
  }
}

function validateUpstreamCycles(graph: DocsGraph, issues: DocsValidationIssue[]): void {
  const adjacency = new Map<string, string[]>();

  for (const edge of graph.edges) {
    if (edge.type !== "Upstream") {
      continue;
    }

    const targets = adjacency.get(edge.from) ?? [];
    targets.push(edge.to);
    adjacency.set(edge.from, targets);
  }

  const state = new Map<string, "visiting" | "visited">();

  for (const node of graph.nodes) {
    visitForCycles({
      nodeId: node.id,
      adjacency,
      state,
      stack: [],
      issues,
      path: node.path ?? node.id
    });
  }
}

function visitForCycles(options: {
  readonly nodeId: string;
  readonly adjacency: ReadonlyMap<string, readonly string[]>;
  readonly state: Map<string, "visiting" | "visited">;
  readonly stack: readonly string[];
  readonly issues: DocsValidationIssue[];
  readonly path: string;
}): void {
  const currentState = options.state.get(options.nodeId);

  if (currentState === "visited") {
    return;
  }

  if (currentState === "visiting") {
    const cycleStart = options.stack.indexOf(options.nodeId);
    const cycle =
      cycleStart >= 0
        ? [...options.stack.slice(cycleStart), options.nodeId]
        : [...options.stack, options.nodeId];

    options.issues.push(createIssue({
      severity: "error",
      code: "graph.upstreamCycle",
      message: `upstream dependency cycle detected: ${cycle.join(" -> ")}`,
      path: options.path
    }));

    return;
  }

  options.state.set(options.nodeId, "visiting");

  const nextNodes = options.adjacency.get(options.nodeId) ?? [];

  for (const nextNode of nextNodes) {
    visitForCycles({
      nodeId: nextNode,
      adjacency: options.adjacency,
      state: options.state,
      stack: [...options.stack, options.nodeId],
      issues: options.issues,
      path: pathFromNodeId(options.nodeId)
    });
  }

  options.state.set(options.nodeId, "visited");
}

function summarizeGraphValidation(
  graph: DocsGraph,
  issues: readonly DocsValidationIssue[]
): DocsGraphValidationSummary {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const issue of issues) {
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
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    errorCount,
    warningCount,
    infoCount
  };
}

function indexNodesById(nodes: readonly DocsGraphNode[]): ReadonlyMap<string, DocsGraphNode> {
  const result = new Map<string, DocsGraphNode>();

  for (const node of nodes) {
    result.set(node.id, node);
  }

  return result;
}

function edgeKey(type: string, from: string, to: string): string {
  return `${type}:${from}->${to}`;
}

function isAllowedRootOrIndexNode(node: DocsGraphNode): boolean {
  if (!node.path) {
    return false;
  }

  return (
    node.path === "docs/index.md" ||
    node.path === "docs/README.md" ||
    node.path.endsWith("/index.md")
  );
}

function pathFromNodeId(nodeId: string): string {
  return nodeId.startsWith("doc:") ? nodeId.slice("doc:".length) : nodeId;
}

function createIssue(options: {
  readonly severity: DocsValidationIssue["severity"];
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly field?: string;
}): DocsValidationIssue {
  const issue = {
    severity: options.severity,
    code: options.code,
    message: options.message,
    path: options.path
  };

  return options.field ? { ...issue, field: options.field } : issue;
}
''',

    "packages/cli/src/commands/docs/graph/validate.ts": '''import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { parseMarkdownDocument } from "../../../docs/frontmatter.js";
import { buildDocsGraph } from "../../../docs/graph.js";
import {
  formatGraphValidationReportAsJson,
  formatGraphValidationReportAsText,
  validateDocsGraph
} from "../../../docs/graph-validator.js";
import { scanMarkdownDocuments } from "../../../docs/scanner.js";

export default class DocsGraphValidate extends Command {
  static override summary = "Validate the documentation knowledge graph.";

  static override description = `
Build and validate the documentation knowledge graph.

This command validates graph-level integrity after the docs corpus has been
scanned and parsed. It is intentionally read-only.
`;

  static override examples = [
    {
      description: "Validate the documentation graph.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Validate the documentation graph and print JSON.",
      command: "<%= config.bin %> <%= command.id %> --json"
    },
    {
      description: "Validate the graph and write a report artifact.",
      command: "<%= config.bin %> <%= command.id %> --report-path .artifacts/docs/graph-validation-report.json"
    }
  ];

  static override flags = {
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to scan."
    }),
    "fail-on-warnings": Flags.boolean({
      default: false,
      description: "Exit non-zero when graph warnings are present."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the graph validation report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the graph validation JSON report."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    }),
    "skip-orphan-warnings": Flags.boolean({
      default: false,
      description: "Do not warn about document nodes with no graph edges."
    }),
    "skip-reciprocal-warnings": Flags.boolean({
      default: false,
      description: "Do not warn about missing reciprocal Upstream/Downstream edges."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsGraphValidate);
    const repoRoot = resolve(flags.root);

    const scanResult = scanMarkdownDocuments({
      repoRoot,
      docsDir: flags["docs-dir"]
    });

    if (!scanResult.ok) {
      this.error(scanResult.reason, { exit: 1 });
    }

    const parsedDocuments = scanResult.documents.map((document) => parseMarkdownDocument(document));
    const buildResult = buildDocsGraph(parsedDocuments);
    const validationReport = validateDocsGraph(buildResult.graph, buildResult.issues, {
      includeOrphanWarnings: !flags["skip-orphan-warnings"],
      requireReciprocalLinks: !flags["skip-reciprocal-warnings"],
      failOnWarnings: flags["fail-on-warnings"]
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatGraphValidationReportAsJson(validationReport)}\\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatGraphValidationReportAsJson(validationReport)
        : formatGraphValidationReportAsText(validationReport)
    );

    if (!validationReport.ok) {
      this.exit(1);
    }
  }
}
''',

    "packages/cli/src/docs/index.ts": '''export { runDocsValidation } from "./engine.js";
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


def main() -> int:
    for file_name, content in FILES.items():
        path = Path(file_name)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        print(f"wrote {file_name}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
