export type GeneratorCategory =
  | "app"
  | "package"
  | "service"
  | "tool"
  | "cli-command"
  | "document"
  | "governance-artifact"
  | "contract-artifact"
  | "configuration"
  | "test-fixture";

export type GeneratorEngine =
  | "oclif"
  | "plop"
  | "turbo-gen"
  | "copier"
  | "scaffdog"
  | "orval"
  | "openapi-generator"
  | "buf";

export type GeneratorStatus = "planned" | "available" | "deferred";

export type OverwritePolicy = "fail" | "skip" | "merge" | "overwrite";

export type GeneratorInputType = "string" | "boolean" | "number" | "enum";

export interface GeneratorInputDefinition {
  readonly name: string;
  readonly type: GeneratorInputType;
  readonly description: string;
  readonly required: boolean;
  readonly example?: string;
  readonly defaultValue?: string | boolean | number;
  readonly allowedValues?: readonly string[];
}

export interface GeneratorDefinition {
  readonly id: string;
  readonly category: GeneratorCategory;
  readonly name: string;
  readonly description: string;
  readonly engine: GeneratorEngine;
  readonly status: GeneratorStatus;
  readonly inputSchema: readonly GeneratorInputDefinition[];
  readonly outputPaths: readonly string[];
  readonly supportsDryRun: boolean;
  readonly supportsAuditLog: boolean;
  readonly overwritePolicy: OverwritePolicy;
  readonly validationCommands: readonly string[];
  readonly tags: readonly string[];
}

export interface GeneratorRegistry {
  readonly generators: readonly GeneratorDefinition[];
}

export type GeneratorInputValues = Record<string, string | boolean | number | undefined>;

export type PlanOperationAction = "create" | "modify" | "skip" | "validate";

export interface PlanOperation {
  readonly action: PlanOperationAction;
  readonly path: string;
  readonly overwritePolicy: OverwritePolicy;
  readonly description: string;
}

export interface GeneratorPlanIssue {
  readonly level: "info" | "warning" | "error";
  readonly message: string;
}

export interface GeneratorPlan {
  readonly generatorId: string;
  readonly generatorName: string;
  readonly engine: GeneratorEngine;
  readonly dryRun: true;
  readonly summary: string;
  readonly resolvedInputs: Record<string, string | boolean | number>;
  readonly operations: readonly PlanOperation[];
  readonly validationCommands: readonly string[];
  readonly issues: readonly GeneratorPlanIssue[];
}
