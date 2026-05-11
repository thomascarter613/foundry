import { writeFileSync } from "node:fs";

import { parseMarkdownDocument } from "./frontmatter.js";
import { getFrontmatterString } from "./metadata.js";
import { scanMarkdownDocuments } from "./scanner.js";
import type { ParsedMarkdownDocument } from "./types.js";

export type GraphRepairField =
  | "upstream"
  | "downstream"
  | "governanceLinks"
  | "adrLinks"
  | "glossaryTerms";

export type GraphRepairActionKind =
  | "replaceStaleReference"
  | "removeSelfReference"
  | "dedupeRelationshipField"
  | "normalizeAdrTarget";

export type GraphRepairAction = {
  readonly kind: GraphRepairActionKind;
  readonly path: string;
  readonly field: GraphRepairField;
  readonly before: readonly string[];
  readonly after: readonly string[];
  readonly description: string;
  readonly willWrite: boolean;
};

export type GraphRepairChangedFile = {
  readonly path: string;
  readonly actionCount: number;
};

export type GraphRepairPlan = {
  readonly ok: boolean;
  readonly write: boolean;
  readonly checkedDocuments: number;
  readonly changedFiles: readonly GraphRepairChangedFile[];
  readonly actionCount: number;
  readonly actions: readonly GraphRepairAction[];
  readonly messages: readonly string[];
};

export type GraphRepairOptions = {
  readonly repoRoot: string;
  readonly docsDir?: string;
  readonly write?: boolean;
};

type AdrRegistry = {
  readonly paths: ReadonlySet<string>;
  readonly basenameToPath: ReadonlyMap<string, string>;
  readonly numberToPath: ReadonlyMap<string, string>;
};

const relationshipFields: readonly GraphRepairField[] = [
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

const staleReferenceReplacements = new Map<string, string>([
  ["docs/onboarding/glossary-quickreference.md", "docs/onboarding/glossary-quickref.md"],
  ["glossary-quickreference.md", "glossary-quickref.md"]
]);

export function createGraphRepairPlan(options: GraphRepairOptions): GraphRepairPlan {
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
      actionCount: 0,
      actions: [],
      messages: [scanResult.reason]
    };
  }

  const documents = scanResult.documents.map((document) => parseMarkdownDocument(document));
  const adrRegistry = createAdrRegistry(documents);
  const write = options.write ?? false;
  const actions: GraphRepairAction[] = [];
  const changedFiles: GraphRepairChangedFile[] = [];

  for (const document of documents) {
    if (!document.frontmatter) {
      continue;
    }

    const nextData: Record<string, unknown> = {
      ...document.frontmatter.data
    };

    const documentActions: GraphRepairAction[] = [];

    for (const field of relationshipFields) {
      const before = arrayValue(nextData[field]);
      const after =
        field === "adrLinks"
          ? repairAdrLinks(document.relativePath, before, adrRegistry)
          : repairRelationshipField(document.relativePath, field, before);

      if (arraysEqual(before, after)) {
        continue;
      }

      nextData[field] = after;

      documentActions.push({
        kind: classifyActionKind(field, before, after),
        path: document.relativePath,
        field,
        before,
        after,
        description: describeGraphRepairAction(document.relativePath, field, before, after),
        willWrite: write
      });
    }

    if (documentActions.length === 0) {
      continue;
    }

    actions.push(...documentActions);
    changedFiles.push({
      path: document.relativePath,
      actionCount: documentActions.length
    });

    if (write) {
      writeFileSync(
        document.absolutePath,
        renderDocumentWithFrontmatter(nextData, document.body),
        "utf8"
      );
    }
  }

  return {
    ok: true,
    write,
    checkedDocuments: documents.length,
    changedFiles,
    actionCount: actions.length,
    actions,
    messages: []
  };
}

export function formatGraphRepairPlanAsText(plan: GraphRepairPlan): string {
  const lines: string[] = [];

  if (!plan.ok) {
    lines.push("Documentation graph repair failed.");

    for (const message of plan.messages) {
      lines.push(`- ${message}`);
    }

    return lines.join("\n");
  }

  lines.push(plan.write ? "Documentation graph repair applied." : "Documentation graph repair dry run.");
  lines.push("");
  lines.push(`Checked ${plan.checkedDocuments} Markdown file(s).`);
  lines.push(`Changed files: ${plan.changedFiles.length}`);
  lines.push(`Actions: ${plan.actionCount}`);

  if (plan.actions.length > 0) {
    lines.push("");
    lines.push("Actions:");

    for (const action of plan.actions) {
      lines.push(`- ${action.kind}: ${action.path}`);
      lines.push(`  field: ${action.field}`);
      lines.push(`  ${action.description}`);
      lines.push(`  will write: ${String(action.willWrite)}`);
    }
  }

  if (!plan.write) {
    lines.push("");
    lines.push("No files were written. Re-run with --write to apply these changes.");
  }

  return lines.join("\n");
}

export function formatGraphRepairPlanAsJson(plan: GraphRepairPlan): string {
  return JSON.stringify(plan, null, 2);
}

function createAdrRegistry(documents: readonly ParsedMarkdownDocument[]): AdrRegistry {
  const paths = new Set<string>();
  const basenameToPath = new Map<string, string>();
  const numberToPath = new Map<string, string>();

  for (const document of documents) {
    if (!isAdrDocument(document)) {
      continue;
    }

    const path = document.relativePath;
    const basename = path.split("/").at(-1) ?? path;
    const number = adrNumberFromPath(path) ?? adrNumberFromTitle(getFrontmatterString(document, "title") ?? "");

    paths.add(path);
    basenameToPath.set(basename, path);

    if (number && !numberToPath.has(number)) {
      numberToPath.set(number, path);
    }
  }

  return {
    paths,
    basenameToPath,
    numberToPath
  };
}

function isAdrDocument(document: ParsedMarkdownDocument): boolean {
  if (document.relativePath.endsWith("/index.md")) {
    return false;
  }

  if (document.relativePath.endsWith("/_template.md") || document.relativePath.endsWith("/_supersession.md")) {
    return false;
  }

  const documentType = getFrontmatterString(document, "documentType");

  return (
    documentType === "ADR" ||
    /^docs\/architecture\/adr\/(?:ADR-)?\d{4}[-_].*\.md$/i.test(document.relativePath) ||
    /^docs\/adr\/ADR-\d{4}[-_].*\.md$/i.test(document.relativePath)
  );
}

function repairRelationshipField(
  currentPath: string,
  field: GraphRepairField,
  before: readonly string[]
): string[] {
  const after: string[] = [];

  for (const item of before) {
    const replaced = replaceStaleReference(item);
    const normalized = normalizeRelationshipValue(replaced);

    if (normalized.length === 0) {
      continue;
    }

    if (field !== "glossaryTerms" && normalizeDocumentReference(normalized) === currentPath) {
      continue;
    }

    pushUnique(after, normalized);
  }

  return after;
}

function repairAdrLinks(
  currentPath: string,
  before: readonly string[],
  registry: AdrRegistry
): string[] {
  const after: string[] = [];
  const seenResolvedTargets = new Set<string>();

  for (const item of before) {
    const replaced = replaceStaleReference(item);
    const normalized = normalizeRelationshipValue(replaced);

    if (normalized.length === 0) {
      continue;
    }

    const resolvedTarget = resolveAdrTarget(normalized, registry);

    if (resolvedTarget === currentPath) {
      continue;
    }

    if (resolvedTarget) {
      if (seenResolvedTargets.has(resolvedTarget)) {
        continue;
      }

      seenResolvedTargets.add(resolvedTarget);
      pushUnique(after, resolvedTarget);
      continue;
    }

    pushUnique(after, normalized);
  }

  return after;
}

function resolveAdrTarget(value: string, registry: AdrRegistry): string | null {
  const documentReference = normalizeDocumentReference(value);

  if (registry.paths.has(documentReference)) {
    return documentReference;
  }

  const basename = documentReference.split("/").at(-1) ?? documentReference;
  const byBasename = registry.basenameToPath.get(basename);

  if (byBasename) {
    return byBasename;
  }

  const number = adrNumberFromReference(value);

  if (!number) {
    return null;
  }

  return registry.numberToPath.get(number) ?? null;
}

function replaceStaleReference(value: string): string {
  return staleReferenceReplacements.get(value.trim()) ?? value.trim();
}

function normalizeRelationshipValue(value: string): string {
  return value.trim().replaceAll("\\", "/");
}

function normalizeDocumentReference(value: string): string {
  return value
    .trim()
    .replace(/^\[.*?\]\((.*?)\)$/, "$1")
    .replace(/#.*$/, "")
    .replace(/^\.\//, "")
    .replaceAll("\\", "/");
}

function adrNumberFromPath(path: string): string | null {
  const fileName = path.split("/").at(-1) ?? path;
  const match = fileName.match(/^(?:ADR-)?(\d{4})[-_]/i);

  return match?.[1] ?? null;
}

function adrNumberFromTitle(title: string): string | null {
  return adrNumberFromReference(title);
}

function adrNumberFromReference(value: string): string | null {
  const match = value.match(/ADR[-\s_]*(\d{1,4})|(?:^|\/)(\d{4})[-_]/i);
  const raw = match?.[1] ?? match?.[2];

  if (!raw) {
    return null;
  }

  return raw.padStart(4, "0");
}

function classifyActionKind(
  field: GraphRepairField,
  before: readonly string[],
  after: readonly string[]
): GraphRepairActionKind {
  if (before.some((value) => staleReferenceReplacements.has(value))) {
    return "replaceStaleReference";
  }

  if (after.length < before.length) {
    return field === "adrLinks" ? "normalizeAdrTarget" : "dedupeRelationshipField";
  }

  return "dedupeRelationshipField";
}

function describeGraphRepairAction(
  path: string,
  field: GraphRepairField,
  before: readonly string[],
  after: readonly string[]
): string {
  const removed = before.filter((value) => !after.includes(value));
  const added = after.filter((value) => !before.includes(value));

  const parts: string[] = [];

  if (removed.length > 0) {
    parts.push(`removed ${removed.length} value(s)`);
  }

  if (added.length > 0) {
    parts.push(`added ${added.length} value(s)`);
  }

  if (before.length !== new Set(before).size) {
    parts.push("removed duplicate values");
  }

  if (parts.length === 0) {
    parts.push("normalized relationship values");
  }

  return `${field} repair for ${path}: ${parts.join(", ")}.`;
}

function renderDocumentWithFrontmatter(data: Record<string, unknown>, body: string): string {
  return `${serializeFrontmatter(data)}\n\n${body.replace(/^\n+/, "")}`;
}

function serializeFrontmatter(data: Record<string, unknown>): string {
  const keys = [
    ...canonicalFrontmatterOrder.filter((key) => key in data),
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

function arrayValue(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function pushUnique(values: string[], value: string): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function yamlEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
