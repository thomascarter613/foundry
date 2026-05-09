import type { DocsValidationIssue } from "./types.js";
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

  return lines.join("\n");
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
