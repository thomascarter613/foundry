export type DocsEngineSeverity = "error" | "warning" | "info";

export type DocumentStatus = "Draft" | "Approved" | "Deprecated";

export type GovernanceLevel = "Informational" | "Required" | "Binding";

export type DocumentType =
  | "Planning"
  | "Governance"
  | "Architecture"
  | "ADR"
  | "ChangePlan"
  | "Lifecycle"
  | "Standard"
  | "Platform"
  | "Onboarding"
  | "Product"
  | "Scaffolding"
  | "WorkPacket"
  | "Idea"
  | "Spec";

export type DocsEngineOptions = {
  readonly repoRoot: string;
  readonly docsDir?: string;
  readonly failOnWarnings?: boolean;
};

export type MarkdownDocumentSource = {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly content: string;
};

export type ParsedFrontmatter = {
  readonly raw: string;
  readonly data: Record<string, unknown>;
};

export type ParsedMarkdownDocument = {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly content: string;
  readonly body: string;
  readonly frontmatter: ParsedFrontmatter | null;
};

export type DocsValidationIssue = {
  readonly severity: DocsEngineSeverity;
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly field?: string;
};

export type DocumentValidationResult = {
  readonly path: string;
  readonly issues: readonly DocsValidationIssue[];
};

export type DocsValidationSummary = {
  readonly checkedDocuments: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
};

export type DocsValidationReport = {
  readonly ok: boolean;
  readonly summary: DocsValidationSummary;
  readonly documents: readonly DocumentValidationResult[];
  readonly issues: readonly DocsValidationIssue[];
};
