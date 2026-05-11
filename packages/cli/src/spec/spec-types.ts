export type FoundrySpecLifecycleStatus =
  | "draft"
  | "clarifying"
  | "planned"
  | "tasked"
  | "approved"
  | "implemented"
  | "verified"
  | "superseded"
  | "rejected";

export type FoundrySpecKind =
  | "feature"
  | "bugfix"
  | "refactor"
  | "architecture"
  | "security"
  | "operations"
  | "documentation"
  | "research";

export type FoundrySpecRiskLevel = "low" | "medium" | "high" | "critical";

export interface FoundrySpecFrontmatter {
  id: string;
  title: string;

  /**
   * Governed document status.
   *
   * This is intentionally separate from specStatus because the documentation
   * verification pipeline owns the generic `status` field.
   */
  status: string;

  /**
   * Native Foundry spec lifecycle status.
   */
  specStatus: FoundrySpecLifecycleStatus;

  kind: FoundrySpecKind;
  version: string;
  created: string;
  updated: string;
  lastUpdated: string;
  owner: string;
  owners: string[];
  governanceLevel: string;
  documentType: string;
  related_adrs: string[];
  related_work_packets: string[];
  risk_level: FoundrySpecRiskLevel;
  requires_ai: boolean;
  requires_database_change: boolean;
  requires_api_change: boolean;
  requires_security_review: boolean;
  requires_migration: boolean;
  tags: string[];
}

export interface ParsedFoundrySpec {
  filePath: string;
  frontmatter: Partial<FoundrySpecFrontmatter>;
  body: string;
}

export interface SpecValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  field?: string;
  section?: string;
}

export interface SpecValidationResult {
  ok: boolean;
  filePath: string;
  issues: SpecValidationIssue[];
}
