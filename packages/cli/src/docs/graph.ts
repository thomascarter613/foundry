import { getFrontmatterArray, getFrontmatterString } from "./metadata.js";
import type { DocsValidationIssue, ParsedMarkdownDocument } from "./types.js";

export type DocsGraphNodeKind =
  | "Document"
  | "ADR"
  | "GlossaryTerm";

export type DocsGraphEdgeType =
  | "Upstream"
  | "Downstream"
  | "Governance"
  | "ADRDependency"
  | "GlossaryUsage";

export type DocsGraphNode = {
  readonly id: string;
  readonly kind: DocsGraphNodeKind;
  readonly label: string;
  readonly path?: string;
  readonly metadata: Record<string, string>;
};

export type DocsGraphEdge = {
  readonly id: string;
  readonly type: DocsGraphEdgeType;
  readonly from: string;
  readonly to: string;
  readonly sourcePath: string;
  readonly rawTarget: string;
};

export type DocsGraph = {
  readonly nodes: readonly DocsGraphNode[];
  readonly edges: readonly DocsGraphEdge[];
};

export type DocsGraphBuildResult = {
  readonly graph: DocsGraph;
  readonly issues: readonly DocsValidationIssue[];
};

type NodeRegistry = {
  readonly nodes: Map<string, DocsGraphNode>;
  readonly pathToNodeId: Map<string, string>;
  readonly adrNumberToNodeId: Map<string, string>;
};

export function buildDocsGraph(documents: readonly ParsedMarkdownDocument[]): DocsGraphBuildResult {
  const registry = createNodeRegistry(documents);
  const edges: DocsGraphEdge[] = [];
  const issues: DocsValidationIssue[] = [];

  for (const document of documents) {
    const from = registry.pathToNodeId.get(document.relativePath);

    if (!from) {
      continue;
    }

    addDocumentReferenceEdges({
      edges,
      issues,
      registry,
      document,
      from,
      field: "upstream",
      edgeType: "Upstream"
    });

    addDocumentReferenceEdges({
      edges,
      issues,
      registry,
      document,
      from,
      field: "downstream",
      edgeType: "Downstream"
    });

    addDocumentReferenceEdges({
      edges,
      issues,
      registry,
      document,
      from,
      field: "governanceLinks",
      edgeType: "Governance"
    });

    addAdrReferenceEdges({
      edges,
      issues,
      registry,
      document,
      from
    });

    addGlossaryUsageEdges({
      edges,
      registry,
      document,
      from
    });
  }

  return {
    graph: {
      nodes: [...registry.nodes.values()].sort((left, right) => left.id.localeCompare(right.id)),
      edges: uniqueEdgesById(edges).sort((left, right) => left.id.localeCompare(right.id))
    },
    issues
  };
}

export function summarizeDocsGraph(graph: DocsGraph): string {
  const nodeCounts = countBy(graph.nodes, (node) => node.kind);
  const edgeCounts = countBy(graph.edges, (edge) => edge.type);

  return [
    "Documentation graph built.",
    "",
    "Nodes:",
    `- total: ${graph.nodes.length}`,
    `- documents: ${nodeCounts.Document ?? 0}`,
    `- ADRs: ${nodeCounts.ADR ?? 0}`,
    `- glossary terms: ${nodeCounts.GlossaryTerm ?? 0}`,
    "",
    "Edges:",
    `- total: ${graph.edges.length}`,
    `- upstream: ${edgeCounts.Upstream ?? 0}`,
    `- downstream: ${edgeCounts.Downstream ?? 0}`,
    `- governance: ${edgeCounts.Governance ?? 0}`,
    `- ADR dependencies: ${edgeCounts.ADRDependency ?? 0}`,
    `- glossary usage: ${edgeCounts.GlossaryUsage ?? 0}`
  ].join("\n");
}

function createNodeRegistry(documents: readonly ParsedMarkdownDocument[]): NodeRegistry {
  const nodes = new Map<string, DocsGraphNode>();
  const pathToNodeId = new Map<string, string>();
  const adrNumberToNodeId = new Map<string, string>();

  for (const document of documents) {
    const documentType = getFrontmatterString(document, "documentType") ?? "Document";
    const title = getFrontmatterString(document, "title") ?? titleFromPath(document.relativePath);
    const status = getFrontmatterString(document, "status") ?? "";
    const owner = getFrontmatterString(document, "owner") ?? "";
    const governanceLevel = getFrontmatterString(document, "governanceLevel") ?? "";
    const lastUpdated = getFrontmatterString(document, "lastUpdated") ?? "";

    const kind: DocsGraphNodeKind = documentType === "ADR" ? "ADR" : "Document";
    const id = `doc:${document.relativePath}`;

    nodes.set(id, {
      id,
      kind,
      label: title,
      path: document.relativePath,
      metadata: {
        documentType,
        status,
        owner,
        governanceLevel,
        lastUpdated
      }
    });

    pathToNodeId.set(document.relativePath, id);

    if (kind === "ADR") {
      const adrNumber = adrNumberFromPathOrTitle(document.relativePath, title);

      if (adrNumber) {
        adrNumberToNodeId.set(adrNumber, id);
      }
    }
  }

  for (const document of documents) {
    const glossaryTerms = getFrontmatterArray(document, "glossaryTerms") ?? [];

    for (const term of glossaryTerms) {
      const normalizedTerm = term.trim();

      if (normalizedTerm.length === 0) {
        continue;
      }

      const id = `term:${slugify(normalizedTerm)}`;

      if (!nodes.has(id)) {
        nodes.set(id, {
          id,
          kind: "GlossaryTerm",
          label: normalizedTerm,
          metadata: {
            term: normalizedTerm
          }
        });
      }
    }
  }

  return {
    nodes,
    pathToNodeId,
    adrNumberToNodeId
  };
}

function addDocumentReferenceEdges(options: {
  readonly edges: DocsGraphEdge[];
  readonly issues: DocsValidationIssue[];
  readonly registry: NodeRegistry;
  readonly document: ParsedMarkdownDocument;
  readonly from: string;
  readonly field: "upstream" | "downstream" | "governanceLinks";
  readonly edgeType: "Upstream" | "Downstream" | "Governance";
}): void {
  const references = getFrontmatterArray(options.document, options.field) ?? [];

  for (const reference of references) {
    const target = resolveDocumentReference(options.registry, reference);

    if (!target) {
      options.issues.push({
        severity: "warning",
        code: "graph.unresolvedDocumentReference",
        message: `unresolved ${options.field} reference: ${reference}`,
        path: options.document.relativePath,
        field: options.field
      });
      continue;
    }

    options.edges.push(createEdge({
      type: options.edgeType,
      from: options.from,
      to: target,
      sourcePath: options.document.relativePath,
      rawTarget: reference
    }));
  }
}

function addAdrReferenceEdges(options: {
  readonly edges: DocsGraphEdge[];
  readonly issues: DocsValidationIssue[];
  readonly registry: NodeRegistry;
  readonly document: ParsedMarkdownDocument;
  readonly from: string;
}): void {
  const references = getFrontmatterArray(options.document, "adrLinks") ?? [];

  for (const reference of references) {
    const target = resolveAdrReference(options.registry, reference);

    if (!target) {
      options.issues.push({
        severity: "warning",
        code: "graph.unresolvedAdrReference",
        message: `unresolved ADR reference: ${reference}`,
        path: options.document.relativePath,
        field: "adrLinks"
      });
      continue;
    }

    options.edges.push(createEdge({
      type: "ADRDependency",
      from: options.from,
      to: target,
      sourcePath: options.document.relativePath,
      rawTarget: reference
    }));
  }
}

function addGlossaryUsageEdges(options: {
  readonly edges: DocsGraphEdge[];
  readonly registry: NodeRegistry;
  readonly document: ParsedMarkdownDocument;
  readonly from: string;
}): void {
  const terms = getFrontmatterArray(options.document, "glossaryTerms") ?? [];

  for (const term of terms) {
    const normalizedTerm = term.trim();

    if (normalizedTerm.length === 0) {
      continue;
    }

    const target = `term:${slugify(normalizedTerm)}`;

    if (!options.registry.nodes.has(target)) {
      continue;
    }

    options.edges.push(createEdge({
      type: "GlossaryUsage",
      from: options.from,
      to: target,
      sourcePath: options.document.relativePath,
      rawTarget: normalizedTerm
    }));
  }
}

function createEdge(options: {
  readonly type: DocsGraphEdgeType;
  readonly from: string;
  readonly to: string;
  readonly sourcePath: string;
  readonly rawTarget: string;
}): DocsGraphEdge {
  return {
    id: `${options.type}:${options.from}->${options.to}`,
    type: options.type,
    from: options.from,
    to: options.to,
    sourcePath: options.sourcePath,
    rawTarget: options.rawTarget
  };
}

function resolveDocumentReference(registry: NodeRegistry, reference: string): string | null {
  const normalizedReference = normalizePathReference(reference);

  if (registry.pathToNodeId.has(normalizedReference)) {
    return registry.pathToNodeId.get(normalizedReference) ?? null;
  }

  if (normalizedReference.startsWith("./") || normalizedReference.startsWith("../")) {
    const withoutDotPrefix = normalizedReference.replace(/^\.\//, "");

    if (registry.pathToNodeId.has(withoutDotPrefix)) {
      return registry.pathToNodeId.get(withoutDotPrefix) ?? null;
    }
  }

  return null;
}

function resolveAdrReference(registry: NodeRegistry, reference: string): string | null {
  const documentReference = resolveDocumentReference(registry, reference);

  if (documentReference) {
    return documentReference;
  }

  const adrNumber = adrNumberFromReference(reference);

  if (!adrNumber) {
    return null;
  }

  return registry.adrNumberToNodeId.get(adrNumber) ?? null;
}

function normalizePathReference(reference: string): string {
  return reference
    .trim()
    .replace(/^\[.*?\]\((.*?)\)$/, "$1")
    .replace(/#.*$/, "")
    .replace(/^\.\//, "")
    .replaceAll("\\", "/");
}

function adrNumberFromPathOrTitle(path: string, title: string): string | null {
  return adrNumberFromReference(`${path} ${title}`);
}

function adrNumberFromReference(reference: string): string | null {
  const match = reference.match(/ADR[-\s_]*(\d{1,4})|(?:^|\/)(\d{4})[-_]/i);
  const rawNumber = match?.[1] ?? match?.[2];

  if (!rawNumber) {
    return null;
  }

  return rawNumber.padStart(4, "0");
}

function titleFromPath(path: string): string {
  const fileName = path.split("/").at(-1) ?? path;
  const stem = fileName.replace(/\.md$/, "");

  return stem
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function countBy<TValue, TKey extends string>(
  values: readonly TValue[],
  getKey: (value: TValue) => TKey
): Partial<Record<TKey, number>> {
  const counts: Partial<Record<TKey, number>> = {};

  for (const value of values) {
    const key = getKey(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return counts;
}


function uniqueEdgesById(edges: readonly DocsGraphEdge[]): DocsGraphEdge[] {
  const result: DocsGraphEdge[] = [];
  const seen = new Set<string>();

  for (const edge of edges) {
    if (seen.has(edge.id)) {
      continue;
    }

    seen.add(edge.id);
    result.push(edge);
  }

  return result;
}
