export type FoundryWorkspaceKind =
  | "monorepo"
  | "single-package"
  | "service"
  | "application"
  | "library"
  | "unknown";

export type FoundryPackageManager =
  | "bun"
  | "pnpm"
  | "npm"
  | "yarn"
  | "unknown";

export type FoundrySourceOfTruth =
  | "repository"
  | "remote-control-plane"
  | "hybrid";

export type FoundryLifecycleEvent =
  | "init"
  | "add"
  | "upgrade"
  | "migrate"
  | "repair"
  | "validate"
  | "doctor"
  | "audit"
  | "plan"
  | "spec"
  | "ai"
  | "handoff";

export type FoundryLifecycleStep =
  | "inspect"
  | "resolve"
  | "plan"
  | "apply"
  | "verify"
  | "document"
  | "audit"
  | "handoff";

export type FoundryAiMode =
  | "none"
  | "manual"
  | "optional-provider"
  | "configured-provider";

export type FoundryProviderSource =
  | "built-in"
  | "external"
  | "local"
  | "remote";

export interface FoundryManifest {
  readonly schemaVersion: number;
  readonly foundryVersion: string;
  readonly workspace: FoundryWorkspaceManifest;
  readonly lifecycle: FoundryLifecycleManifest;
  readonly verification: FoundryVerificationManifest;
  readonly audit: FoundryAuditManifest;
  readonly ai: FoundryAiManifest;
  readonly providers?: FoundryProvidersManifest;
}

export interface FoundryWorkspaceManifest {
  readonly name: string;
  readonly kind: FoundryWorkspaceKind;
  readonly packageManager: FoundryPackageManager;
  readonly sourceOfTruth: FoundrySourceOfTruth;
}

export interface FoundryLifecycleManifest {
  readonly model: "inspect-resolve-plan-apply-verify-document-audit-handoff";
  readonly supportedEvents: readonly FoundryLifecycleEvent[];
  readonly defaultFlow: readonly FoundryLifecycleStep[];
}

export interface FoundryVerificationManifest {
  readonly commands: readonly FoundryVerificationCommand[];
}

export interface FoundryVerificationCommand {
  readonly name: string;
  readonly command: string;
  readonly required: boolean;
  readonly description?: string;
}

export interface FoundryAuditManifest {
  readonly enabled: boolean;
  readonly logPath: string;
  readonly eventSchemaVersion: number;
}

export interface FoundryAiManifest {
  readonly mode: FoundryAiMode;
  readonly providerRequired: boolean;
  readonly artifacts: readonly FoundryAiArtifact[];
}

export interface FoundryAiArtifact {
  readonly path: string;
  readonly purpose: string;
  readonly required?: boolean;
}

export interface FoundryProvidersManifest {
  readonly database?: readonly FoundryProviderReference[];
  readonly ai?: readonly FoundryProviderReference[];
}

export interface FoundryProviderReference {
  readonly id: string;
  readonly kind: string;
  readonly required: boolean;
  readonly source?: FoundryProviderSource;
}
