import type {
  DocumentStatus,
  DocumentType,
  GovernanceLevel,
  ParsedMarkdownDocument
} from "./types.js";

export const validStatuses = new Set<DocumentStatus>([
  "Draft",
  "Approved",
  "Deprecated"
]);

export const validGovernanceLevels = new Set<GovernanceLevel>([
  "Informational",
  "Required",
  "Binding"
]);

export const validDocumentTypes = new Set<DocumentType>([
  "Planning",
  "Governance",
  "Architecture",
  "ADR",
  "ChangePlan",
  "Lifecycle",
  "Standard",
  "Platform",
  "Onboarding",
  "Product",
  "Scaffolding",
  "WorkPacket",
  "Idea"
]);

export const requiredFrontmatterFields = [
  "title",
  "status",
  "owner",
  "lastUpdated",
  "governanceLevel",
  "documentType"
] as const;

export const optionalArrayFrontmatterFields = [
  "upstream",
  "downstream",
  "governanceLinks",
  "adrLinks",
  "glossaryTerms"
] as const;

export type RequiredFrontmatterField = (typeof requiredFrontmatterFields)[number];

export function getFrontmatterString(document: ParsedMarkdownDocument, field: string): string | null {
  const value = document.frontmatter?.data[field];

  return typeof value === "string" ? value : null;
}

export function getFrontmatterArray(document: ParsedMarkdownDocument, field: string): readonly string[] | null {
  const value = document.frontmatter?.data[field];

  if (!Array.isArray(value)) {
    return null;
  }

  if (value.every((item) => typeof item === "string")) {
    return value;
  }

  return null;
}

export function expectedDocumentTypesForPath(relativePath: string): readonly DocumentType[] {
  if (relativePath.startsWith("docs/architecture/adr/")) {
    return ["ADR", "Architecture"];
  }

  if (relativePath.startsWith("docs/adr/")) {
    return ["ADR"];
  }

  if (relativePath.startsWith("docs/architecture/")) {
    return ["Architecture"];
  }

  if (relativePath.startsWith("docs/changeplans/")) {
    return ["ChangePlan"];
  }

  if (relativePath.startsWith("docs/work-packets/")) {
    return ["WorkPacket", "ChangePlan"];
  }

  if (relativePath.startsWith("docs/governance/")) {
    return ["Governance"];
  }

  if (relativePath.startsWith("docs/lifecycle/")) {
    return ["Lifecycle"];
  }

  if (relativePath.startsWith("docs/onboarding/")) {
    return ["Onboarding"];
  }

  if (relativePath.startsWith("docs/planning/")) {
    return ["Planning"];
  }

  if (relativePath.startsWith("docs/platform/")) {
    return ["Platform"];
  }

  if (relativePath.startsWith("docs/product/")) {
    return ["Product", "Planning"];
  }

  if (relativePath.startsWith("docs/scaffolding/")) {
    return ["Scaffolding", "Platform"];
  }

  if (relativePath.startsWith("docs/standards/")) {
    return ["Standard"];
  }

  if (relativePath.startsWith("docs/.ideas/")) {
    return ["Idea", "Planning"];
  }

  if (relativePath === "docs/index.md" || relativePath === "docs/README.md") {
    return ["Onboarding", "Planning"];
  }

  return [];
}
