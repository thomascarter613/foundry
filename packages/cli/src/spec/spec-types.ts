export type FoundrySpecStatus =
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
  status: FoundrySpecStatus;
  kind: FoundrySpecKind;
  created: string;
  updated: string;
  owners: string[];
  related_adrs: string[];
  related_work_packets: string[];
  risk_level: FoundrySpecRiskLevel;
  requires_ai: boolean;
  requires_database_change: boolean;
  requires_api_change: boolean;
  requires_security_review: boolean;
  requires_migration: boolean;
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
