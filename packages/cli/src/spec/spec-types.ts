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

export type FoundrySpecStatus = FoundrySpecLifecycleStatus;

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
   * Native spec lifecycle status used by the current spec validator.
   */
  specStatus: FoundrySpecLifecycleStatus;

  /**
   * Backward-compatible alias used by earlier spec slices.
   */
  status: FoundrySpecStatus;

  version: string;
  kind: FoundrySpecKind;
  created: string;
  updated: string;
  lastUpdated: string;

  owner: string;
  owners: string[];

  governanceLevel: string;
  documentType: string;

  tags: string[];

  related_adrs: string[];
  related_work_packets: string[];

  risk_level: FoundrySpecRiskLevel;

  requires_ai: boolean;
  requires_database_change: boolean;
  requires_api_change: boolean;
  requires_security_review: boolean;
  requires_migration: boolean;
}

export type FoundrySpecFrontmatterField = keyof FoundrySpecFrontmatter;

export interface ParsedFoundrySpec {
  filePath: string;
  frontmatter: Partial<FoundrySpecFrontmatter>;
  body: string;
}

export interface SpecValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  field?: FoundrySpecFrontmatterField | string;
  section?: string;
}

export interface SpecValidationResult {
  ok: boolean;
  filePath: string;
  issues: SpecValidationIssue[];
}
