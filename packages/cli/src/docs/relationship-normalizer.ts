import { writeFileSync } from "node:fs";

import { parseMarkdownDocument } from "./frontmatter.js";
import { getFrontmatterArray, getFrontmatterString } from "./metadata.js";
import { scanMarkdownDocuments } from "./scanner.js";
import type { ParsedMarkdownDocument } from "./types.js";

export type RelationshipField =
  | "upstream"
  | "downstream"
  | "governanceLinks"
  | "adrLinks"
  | "glossaryTerms";

export type RelationshipNormalizationAction = {
  readonly path: string;
  readonly field: RelationshipField;
  readonly before: readonly string[];
  readonly after: readonly string[];
  readonly added: readonly string[];
};

export type RelationshipNormalizationFileChange = {
  readonly path: string;
  readonly actionCount: number;
};

export type RelationshipNormalizationPlan = {
  readonly ok: boolean;
  readonly write: boolean;
  readonly checkedDocuments: number;
  readonly changedFiles: readonly RelationshipNormalizationFileChange[];
  readonly actions: readonly RelationshipNormalizationAction[];
  readonly messages: readonly string[];
};

export type RelationshipNormalizationOptions = {
  readonly repoRoot: string;
  readonly docsDir?: string;
  readonly write?: boolean;
};

type PlannedRelationships = Record<RelationshipField, string[]>;

const relationshipFields: readonly RelationshipField[] = [
  "upstream",
  "downstream",
  "governanceLinks",
  "adrLinks",
  "glossaryTerms"
];

const canonicalFrontmatterOrder = [
  "title",
  "status",
  "owner",
  "lastUpdated",
  "governanceLevel",
  "documentType",
  "upstream",
  "downstream",
  "governanceLinks",
  "adrLinks",
  "glossaryTerms"
] as const;

export function normalizeDocsRelationships(
  options: RelationshipNormalizationOptions
): RelationshipNormalizationPlan {
  const scanResult = scanMarkdownDocuments({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {})
  });

  if (!scanResult.ok) {
    return {
      ok: false,
      write: options.write ?? false,
      checkedDocuments: 0,
      changedFiles: [],
      actions: [],
      messages: [scanResult.reason]
    };
  }

  const parsedDocuments = scanResult.documents.map((document) => parseMarkdownDocument(document));
  const pathSet = new Set(parsedDocuments.map((document) => document.relativePath));
  const plannedByPath = new Map<string, PlannedRelationships>();

  for (const document of parsedDocuments) {
    plannedByPath.set(document.relativePath, createInitialPlan(document));
  }

  for (const document of parsedDocuments) {
    const plan = plannedByPath.get(document.relativePath);

    if (!plan) {
      continue;
    }

    addRecommendedUpstream(document, pathSet, plan);
    addRecommendedGovernanceLink(document, pathSet, plan);
    addRecommendedAdrLinks(document, pathSet, plan);
    addRecommendedGlossaryTerms(document, plan);
  }

  addReciprocalDownstreamLinks(parsedDocuments, plannedByPath, pathSet);

  const actions: RelationshipNormalizationAction[] = [];
  const changedFiles: RelationshipNormalizationFileChange[] = [];

  for (const document of parsedDocuments) {
    const plan = plannedByPath.get(document.relativePath);

    if (!plan) {
      continue;
    }

    const documentActions = relationshipFields.flatMap((field) =>
      createActionIfChanged(document, plan, field)
    );

    if (documentActions.length === 0) {
      continue;
    }

    actions.push(...documentActions);
    changedFiles.push({
      path: document.relativePath,
      actionCount: documentActions.length
    });

    if (options.write ?? false) {
      const updatedContent = renderDocumentWithNormalizedFrontmatter(document, plan);
      writeFileSync(document.absolutePath, updatedContent, "utf8");
    }
  }

  return {
    ok: true,
    write: options.write ?? false,
    checkedDocuments: parsedDocuments.length,
    changedFiles,
    actions,
    messages: []
  };
}

export function formatRelationshipNormalizationPlanAsText(
  plan: RelationshipNormalizationPlan
): string {
  const lines: string[] = [];

  if (!plan.ok) {
    lines.push("Documentation relationship normalization failed.");

    for (const message of plan.messages) {
      lines.push(`- ${message}`);
    }

    return lines.join("\n");
  }

  lines.push(
    plan.write
      ? "Documentation relationships normalized."
      : "Documentation relationship normalization dry run."
  );

  lines.push("");
  lines.push(`Checked ${plan.checkedDocuments} Markdown file(s).`);
  lines.push(`Changed files: ${plan.changedFiles.length}`);
  lines.push(`Relationship actions: ${plan.actions.length}`);

  if (plan.actions.length > 0) {
    lines.push("");
    lines.push("Actions:");

    for (const action of plan.actions) {
      lines.push(`- ${action.path}: ${action.field}`);
      lines.push(`  added: ${action.added.length > 0 ? action.added.join(", ") : "none"}`);
    }
  }

  if (!plan.write) {
    lines.push("");
    lines.push("No files were written. Re-run with --write to apply these changes.");
  }

  return lines.join("\n");
}

export function formatRelationshipNormalizationPlanAsJson(
  plan: RelationshipNormalizationPlan
): string {
  return JSON.stringify(plan, null, 2);
}

function createInitialPlan(document: ParsedMarkdownDocument): PlannedRelationships {
  return {
    upstream: [...(getFrontmatterArray(document, "upstream") ?? [])],
    downstream: [...(getFrontmatterArray(document, "downstream") ?? [])],
    governanceLinks: [...(getFrontmatterArray(document, "governanceLinks") ?? [])],
    adrLinks: [...(getFrontmatterArray(document, "adrLinks") ?? [])],
    glossaryTerms: [...(getFrontmatterArray(document, "glossaryTerms") ?? [])]
  };
}

function addRecommendedUpstream(
  document: ParsedMarkdownDocument,
  pathSet: ReadonlySet<string>,
  plan: PlannedRelationships
): void {
  const sourcePath = document.relativePath;

  if (sourcePath === "docs/index.md") {
    return;
  }

  const target = recommendedUpstreamTarget(sourcePath, pathSet);

  if (!target || target === sourcePath) {
    return;
  }

  addUnique(plan.upstream, target);
}

function recommendedUpstreamTarget(
  sourcePath: string,
  pathSet: ReadonlySet<string>
): string | null {
  if (sourcePath === "docs/README.md") {
    return pathSet.has("docs/index.md") ? "docs/index.md" : null;
  }

  if (sourcePath.endsWith("/index.md")) {
    return pathSet.has("docs/index.md") && sourcePath !== "docs/index.md" ? "docs/index.md" : null;
  }

  if (sourcePath.startsWith("docs/architecture/adr/")) {
    return firstExisting(pathSet, [
      "docs/architecture/adr/index.md",
      "docs/architecture/index.md",
      "docs/index.md"
    ]);
  }

  if (sourcePath.startsWith("docs/adr/")) {
    return firstExisting(pathSet, [
      "docs/adr/index.md",
      "docs/architecture/adr/index.md",
      "docs/architecture/index.md",
      "docs/index.md"
    ]);
  }

  if (sourcePath.startsWith("docs/work-packets/")) {
    return firstExisting(pathSet, [
      "docs/work-packets/index.md",
      "docs/changeplans/index.md",
      "docs/lifecycle/index.md",
      "docs/index.md"
    ]);
  }

  if (sourcePath.startsWith("docs/scaffolding/")) {
    return firstExisting(pathSet, [
      "docs/scaffolding/index.md",
      "docs/platform/index.md",
      "docs/index.md"
    ]);
  }

  if (sourcePath.startsWith("docs/product/")) {
    return firstExisting(pathSet, [
      "docs/product/index.md",
      "docs/planning/index.md",
      "docs/index.md"
    ]);
  }

  if (sourcePath.startsWith("docs/.ideas/")) {
    return firstExisting(pathSet, [
      "docs/planning/index.md",
      "docs/index.md"
    ]);
  }

  const domainIndex = domainIndexForPath(sourcePath);

  if (domainIndex && pathSet.has(domainIndex) && domainIndex !== sourcePath) {
    return domainIndex;
  }

  return pathSet.has("docs/index.md") ? "docs/index.md" : null;
}

function addRecommendedGovernanceLink(
  document: ParsedMarkdownDocument,
  pathSet: ReadonlySet<string>,
  plan: PlannedRelationships
): void {
  const sourcePath = document.relativePath;
  const target = firstExisting(pathSet, [
    "docs/governance/documentation-governance.md",
    "docs/governance/governance-charter.md",
    "docs/governance/index.md"
  ]);

  if (!target || target === sourcePath) {
    return;
  }

  addUnique(plan.governanceLinks, target);
}

function addRecommendedAdrLinks(
  document: ParsedMarkdownDocument,
  pathSet: ReadonlySet<string>,
  plan: PlannedRelationships
): void {
  const sourcePath = document.relativePath;
  const documentType = getFrontmatterString(document, "documentType") ?? inferDocumentType(sourcePath);

  if (documentType === "ADR") {
    return;
  }

  const candidates: string[] = [];

  if (documentType === "Architecture") {
    candidates.push(
      "docs/architecture/adr/0001-architecture-principles.md",
      "docs/adr/ADR-0001-monorepo-scaffolding-toolchain.md"
    );
  }

  if (
    documentType === "Platform" ||
    documentType === "Scaffolding" ||
    sourcePath.includes("scaffolding") ||
    sourcePath.includes("monorepo")
  ) {
    candidates.push(
      "docs/architecture/adr/0002-monorepo-structure.md",
      "docs/adr/ADR-0001-monorepo-scaffolding-toolchain.md"
    );
  }

  if (sourcePath.includes("package") || sourcePath.includes("tooling")) {
    candidates.push("docs/architecture/adr/0003-package-management.md");
  }

  if (
    sourcePath.includes("ci") ||
    sourcePath.includes("governance") ||
    sourcePath.includes("verification") ||
    sourcePath.includes("pipeline")
  ) {
    candidates.push("docs/architecture/adr/0004-ci-governance.md");
  }

  if (sourcePath.includes("ai") || sourcePath.includes("provider")) {
    candidates.push("docs/adr/ADR-0002-ai-expected-provider-agnostic-architecture.md");
  }

  for (const candidate of candidates) {
    if (pathSet.has(candidate) && candidate !== sourcePath) {
      addUnique(plan.adrLinks, candidate);
    }
  }
}

function addRecommendedGlossaryTerms(
  document: ParsedMarkdownDocument,
  plan: PlannedRelationships
): void {
  const documentType = getFrontmatterString(document, "documentType") ?? inferDocumentType(document.relativePath);
  const title = getFrontmatterString(document, "title") ?? titleFromPath(document.relativePath);

  addUnique(plan.glossaryTerms, documentType);

  if (document.relativePath.includes("governance")) {
    addUnique(plan.glossaryTerms, "Governance");
  }

  if (document.relativePath.includes("architecture")) {
    addUnique(plan.glossaryTerms, "Architecture");
  }

  if (document.relativePath.includes("adr") || title.toLowerCase().includes("adr")) {
    addUnique(plan.glossaryTerms, "ADR");
  }

  if (document.relativePath.includes("graph")) {
    addUnique(plan.glossaryTerms, "Knowledge Graph");
  }

  if (document.relativePath.includes("changeplan") || document.relativePath.includes("changeplans")) {
    addUnique(plan.glossaryTerms, "ChangePlan");
  }

  if (document.relativePath.includes("scaffolding")) {
    addUnique(plan.glossaryTerms, "Scaffolding");
  }

  const titleTerms = title
    .split(/[^A-Za-z0-9]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 4)
    .filter((term) => !commonTitleWords.has(term.toLowerCase()))
    .slice(0, 5);

  for (const term of titleTerms) {
    addUnique(plan.glossaryTerms, term);
  }
}

function addReciprocalDownstreamLinks(
  documents: readonly ParsedMarkdownDocument[],
  plannedByPath: Map<string, PlannedRelationships>,
  pathSet: ReadonlySet<string>
): void {
  for (const document of documents) {
    const plan = plannedByPath.get(document.relativePath);

    if (!plan) {
      continue;
    }

    for (const upstreamTarget of plan.upstream) {
      if (!pathSet.has(upstreamTarget)) {
        continue;
      }

      const targetPlan = plannedByPath.get(upstreamTarget);

      if (!targetPlan) {
        continue;
      }

      addUnique(targetPlan.downstream, document.relativePath);
    }
  }
}

function createActionIfChanged(
  document: ParsedMarkdownDocument,
  plan: PlannedRelationships,
  field: RelationshipField
): RelationshipNormalizationAction[] {
  const before = getFrontmatterArray(document, field) ?? [];
  const after = orderedUnique(plan[field]);

  if (arraysEqual(before, after)) {
    return [];
  }

  return [
    {
      path: document.relativePath,
      field,
      before,
      after,
      added: after.filter((item) => !before.includes(item))
    }
  ];
}

function renderDocumentWithNormalizedFrontmatter(
  document: ParsedMarkdownDocument,
  plan: PlannedRelationships
): string {
  const data: Record<string, unknown> = {
    ...(document.frontmatter?.data ?? {})
  };

  ensureDefaultScalarFields(document, data);

  for (const field of relationshipFields) {
    data[field] = orderedUnique(plan[field]);
  }

  return `${serializeFrontmatter(data)}\n${document.body.replace(/^\n+/, "")}`;
}

function ensureDefaultScalarFields(
  document: ParsedMarkdownDocument,
  data: Record<string, unknown>
): void {
  data.title = typeof data.title === "string" && data.title.trim().length > 0
    ? data.title
    : titleFromPath(document.relativePath);

  data.status = typeof data.status === "string" && data.status.trim().length > 0
    ? data.status
    : "Draft";

  data.owner = typeof data.owner === "string" && data.owner.trim().length > 0
    ? data.owner
    : ownerForPath(document.relativePath);

  data.lastUpdated = typeof data.lastUpdated === "string" && data.lastUpdated.trim().length > 0
    ? data.lastUpdated
    : new Date().toISOString().slice(0, 10);

  data.governanceLevel = typeof data.governanceLevel === "string" && data.governanceLevel.trim().length > 0
    ? data.governanceLevel
    : governanceLevelForPath(document.relativePath);

  data.documentType = typeof data.documentType === "string" && data.documentType.trim().length > 0
    ? data.documentType
    : inferDocumentType(document.relativePath);
}

function serializeFrontmatter(data: Record<string, unknown>): string {
  const keys = [
    ...canonicalFrontmatterOrder,
    ...Object.keys(data)
      .filter((key) => !canonicalFrontmatterOrder.includes(key as never))
      .sort()
  ];

  const lines = ["---"];

  for (const key of keys) {
    const value = data[key];

    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);

        for (const item of value) {
          lines.push(`  - "${yamlEscape(String(item))}"`);
        }
      }

      continue;
    }

    lines.push(`${key}: "${yamlEscape(String(value))}"`);
  }

  lines.push("---");

  return lines.join("\n");
}

function domainIndexForPath(path: string): string | null {
  const segments = path.split("/");

  if (segments.length < 3 || segments[0] !== "docs") {
    return null;
  }

  return `docs/${segments[1]}/index.md`;
}

function inferDocumentType(path: string): string {
  if (path.startsWith("docs/architecture/adr/") || path.startsWith("docs/adr/")) {
    return "ADR";
  }

  if (path.startsWith("docs/architecture/")) {
    return "Architecture";
  }

  if (path.startsWith("docs/changeplans/")) {
    return "ChangePlan";
  }

  if (path.startsWith("docs/work-packets/")) {
    return "WorkPacket";
  }

  if (path.startsWith("docs/governance/")) {
    return "Governance";
  }

  if (path.startsWith("docs/lifecycle/")) {
    return "Lifecycle";
  }

  if (path.startsWith("docs/onboarding/")) {
    return "Onboarding";
  }

  if (path.startsWith("docs/platform/")) {
    return "Platform";
  }

  if (path.startsWith("docs/product/")) {
    return "Product";
  }

  if (path.startsWith("docs/scaffolding/")) {
    return "Scaffolding";
  }

  if (path.startsWith("docs/standards/")) {
    return "Standard";
  }

  if (path.startsWith("docs/.ideas/")) {
    return "Idea";
  }

  return "Planning";
}

function ownerForPath(path: string): string {
  const documentType = inferDocumentType(path);

  if (documentType === "ADR" || documentType === "Architecture") {
    return "Architecture";
  }

  if (documentType === "Governance") {
    return "Governance";
  }

  if (documentType === "ChangePlan" || documentType === "WorkPacket" || documentType === "Lifecycle") {
    return "Engineering Productivity";
  }

  if (documentType === "Standard") {
    return "Standards";
  }

  if (documentType === "Platform" || documentType === "Scaffolding") {
    return "Platform";
  }

  if (documentType === "Onboarding") {
    return "Documentation";
  }

  return "Product Architecture";
}

function governanceLevelForPath(path: string): string {
  const documentType = inferDocumentType(path);

  if (documentType === "ADR" || documentType === "Governance" || documentType === "Standard") {
    return "Binding";
  }

  if (documentType === "Onboarding" || documentType === "Idea") {
    return "Informational";
  }

  return "Required";
}

function titleFromPath(path: string): string {
  const fileName = path.split("/").at(-1) ?? path;
  const stem = fileName.replace(/\.md$/, "");

  return stem
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replaceAll("—", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function firstExisting(
  pathSet: ReadonlySet<string>,
  candidates: readonly string[]
): string | null {
  for (const candidate of candidates) {
    if (pathSet.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

function addUnique(values: string[], value: string): void {
  const normalized = value.trim();

  if (normalized.length === 0) {
    return;
  }

  if (!values.includes(normalized)) {
    values.push(normalized);
  }
}

function orderedUnique(values: readonly string[]): string[] {
  const result: string[] = [];

  for (const value of values) {
    addUnique(result, value);
  }

  return result;
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function yamlEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

const commonTitleWords = new Set([
  "with",
  "from",
  "into",
  "this",
  "that",
  "your",
  "their",
  "document",
  "documentation",
  "engine",
  "system",
  "design",
  "overview",
  "index",
  "readme"
]);
