import type {
  FoundryAiMode,
  FoundryLifecycleEvent,
  FoundryLifecycleStep,
  FoundryPackageManager,
  FoundryProviderSource,
  FoundrySourceOfTruth,
  FoundryWorkspaceKind
} from "./types.js";

export interface FoundryManifestValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

const workspaceKinds: readonly FoundryWorkspaceKind[] = [
  "monorepo",
  "single-package",
  "service",
  "application",
  "library",
  "unknown"
];

const packageManagers: readonly FoundryPackageManager[] = [
  "bun",
  "pnpm",
  "npm",
  "yarn",
  "unknown"
];

const sourceOfTruthValues: readonly FoundrySourceOfTruth[] = [
  "repository",
  "remote-control-plane",
  "hybrid"
];

const lifecycleEvents: readonly FoundryLifecycleEvent[] = [
  "init",
  "add",
  "upgrade",
  "migrate",
  "repair",
  "validate",
  "doctor",
  "audit",
  "plan",
  "spec",
  "ai",
  "handoff"
];

const lifecycleSteps: readonly FoundryLifecycleStep[] = [
  "inspect",
  "resolve",
  "plan",
  "apply",
  "verify",
  "document",
  "audit",
  "handoff"
];

const aiModes: readonly FoundryAiMode[] = [
  "none",
  "manual",
  "optional-provider",
  "configured-provider"
];

const providerSources: readonly FoundryProviderSource[] = [
  "built-in",
  "external",
  "local",
  "remote"
];

export function validateFoundryManifest(
  value: unknown,
  source = "manifest"
): readonly FoundryManifestValidationIssue[] {
  const issues: FoundryManifestValidationIssue[] = [];

  if (!isRecord(value)) {
    return [
      {
        code: "manifest-not-object",
        path: source,
        message: "Foundry manifest must be a JSON object."
      }
    ];
  }

  issues.push(...validateRoot(value, source));
  issues.push(...validateWorkspace(value.workspace, `${source}.workspace`));
  issues.push(...validateLifecycle(value.lifecycle, `${source}.lifecycle`));
  issues.push(
    ...validateVerification(value.verification, `${source}.verification`)
  );
  issues.push(...validateAudit(value.audit, `${source}.audit`));
  issues.push(...validateAi(value.ai, `${source}.ai`));

  if ("providers" in value) {
    issues.push(...validateProviders(value.providers, `${source}.providers`));
  }

  return issues;
}

function validateRoot(
  manifest: Record<string, unknown>,
  path: string
): readonly FoundryManifestValidationIssue[] {
  const issues: FoundryManifestValidationIssue[] = [];

  if (!isPositiveInteger(manifest.schemaVersion)) {
    issues.push({
      code: "manifest-schema-version-invalid",
      path: `${path}.schemaVersion`,
      message: "schemaVersion must be a positive integer."
    });
  }

  if (!isNonEmptyString(manifest.foundryVersion)) {
    issues.push({
      code: "manifest-foundry-version-invalid",
      path: `${path}.foundryVersion`,
      message: "foundryVersion must be a non-empty string."
    });
  }

  for (const requiredKey of [
    "workspace",
    "lifecycle",
    "verification",
    "audit",
    "ai"
  ]) {
    if (!(requiredKey in manifest)) {
      issues.push({
        code: "manifest-required-field-missing",
        path: `${path}.${requiredKey}`,
        message: `Missing required manifest field: ${requiredKey}.`
      });
    }
  }

  return issues;
}

function validateWorkspace(
  value: unknown,
  path: string
): readonly FoundryManifestValidationIssue[] {
  const issues: FoundryManifestValidationIssue[] = [];

  if (!isRecord(value)) {
    return [
      {
        code: "manifest-workspace-invalid",
        path,
        message: "workspace must be an object."
      }
    ];
  }

  if (!isNonEmptyString(value.name)) {
    issues.push({
      code: "manifest-workspace-name-invalid",
      path: `${path}.name`,
      message: "workspace.name must be a non-empty string."
    });
  }

  if (!isOneOf(value.kind, workspaceKinds)) {
    issues.push({
      code: "manifest-workspace-kind-invalid",
      path: `${path}.kind`,
      message: `workspace.kind must be one of: ${workspaceKinds.join(", ")}.`
    });
  }

  if (!isOneOf(value.packageManager, packageManagers)) {
    issues.push({
      code: "manifest-package-manager-invalid",
      path: `${path}.packageManager`,
      message: `workspace.packageManager must be one of: ${packageManagers.join(", ")}.`
    });
  }

  if (!isOneOf(value.sourceOfTruth, sourceOfTruthValues)) {
    issues.push({
      code: "manifest-source-of-truth-invalid",
      path: `${path}.sourceOfTruth`,
      message: `workspace.sourceOfTruth must be one of: ${sourceOfTruthValues.join(", ")}.`
    });
  }

  return issues;
}

function validateLifecycle(
  value: unknown,
  path: string
): readonly FoundryManifestValidationIssue[] {
  const issues: FoundryManifestValidationIssue[] = [];

  if (!isRecord(value)) {
    return [
      {
        code: "manifest-lifecycle-invalid",
        path,
        message: "lifecycle must be an object."
      }
    ];
  }

  if (
    value.model !== "inspect-resolve-plan-apply-verify-document-audit-handoff"
  ) {
    issues.push({
      code: "manifest-lifecycle-model-invalid",
      path: `${path}.model`,
      message:
        "lifecycle.model must be inspect-resolve-plan-apply-verify-document-audit-handoff."
    });
  }

  issues.push(
    ...validateStringEnumArray({
      value: value.supportedEvents,
      path: `${path}.supportedEvents`,
      allowed: lifecycleEvents,
      code: "manifest-lifecycle-event-invalid"
    })
  );

  issues.push(
    ...validateStringEnumArray({
      value: value.defaultFlow,
      path: `${path}.defaultFlow`,
      allowed: lifecycleSteps,
      code: "manifest-lifecycle-step-invalid"
    })
  );

  if (Array.isArray(value.defaultFlow)) {
    const flow = value.defaultFlow.join(" → ");

    if (flow !== lifecycleSteps.join(" → ")) {
      issues.push({
        code: "manifest-default-flow-invalid",
        path: `${path}.defaultFlow`,
        message: `defaultFlow must be the canonical lifecycle flow: ${lifecycleSteps.join(" → ")}.`
      });
    }
  }

  return issues;
}

function validateVerification(
  value: unknown,
  path: string
): readonly FoundryManifestValidationIssue[] {
  const issues: FoundryManifestValidationIssue[] = [];

  if (!isRecord(value)) {
    return [
      {
        code: "manifest-verification-invalid",
        path,
        message: "verification must be an object."
      }
    ];
  }

  if (!Array.isArray(value.commands)) {
    return [
      {
        code: "manifest-verification-commands-invalid",
        path: `${path}.commands`,
        message: "verification.commands must be an array."
      }
    ];
  }

  value.commands.forEach((command, index) => {
    const commandPath = `${path}.commands[${index}]`;

    if (!isRecord(command)) {
      issues.push({
        code: "manifest-verification-command-invalid",
        path: commandPath,
        message: "verification command must be an object."
      });
      return;
    }

    if (!isNonEmptyString(command.name)) {
      issues.push({
        code: "manifest-verification-command-name-invalid",
        path: `${commandPath}.name`,
        message: "verification command name must be a non-empty string."
      });
    }

    if (!isNonEmptyString(command.command)) {
      issues.push({
        code: "manifest-verification-command-command-invalid",
        path: `${commandPath}.command`,
        message: "verification command must be a non-empty string."
      });
    }

    if (typeof command.required !== "boolean") {
      issues.push({
        code: "manifest-verification-command-required-invalid",
        path: `${commandPath}.required`,
        message: "verification command required must be a boolean."
      });
    }
  });

  return issues;
}

function validateAudit(
  value: unknown,
  path: string
): readonly FoundryManifestValidationIssue[] {
  const issues: FoundryManifestValidationIssue[] = [];

  if (!isRecord(value)) {
    return [
      {
        code: "manifest-audit-invalid",
        path,
        message: "audit must be an object."
      }
    ];
  }

  if (typeof value.enabled !== "boolean") {
    issues.push({
      code: "manifest-audit-enabled-invalid",
      path: `${path}.enabled`,
      message: "audit.enabled must be a boolean."
    });
  }

  if (!isNonEmptyString(value.logPath)) {
    issues.push({
      code: "manifest-audit-log-path-invalid",
      path: `${path}.logPath`,
      message: "audit.logPath must be a non-empty string."
    });
  }

  if (!isPositiveInteger(value.eventSchemaVersion)) {
    issues.push({
      code: "manifest-audit-event-schema-version-invalid",
      path: `${path}.eventSchemaVersion`,
      message: "audit.eventSchemaVersion must be a positive integer."
    });
  }

  return issues;
}

function validateAi(
  value: unknown,
  path: string
): readonly FoundryManifestValidationIssue[] {
  const issues: FoundryManifestValidationIssue[] = [];

  if (!isRecord(value)) {
    return [
      {
        code: "manifest-ai-invalid",
        path,
        message: "ai must be an object."
      }
    ];
  }

  if (!isOneOf(value.mode, aiModes)) {
    issues.push({
      code: "manifest-ai-mode-invalid",
      path: `${path}.mode`,
      message: `ai.mode must be one of: ${aiModes.join(", ")}.`
    });
  }

  if (typeof value.providerRequired !== "boolean") {
    issues.push({
      code: "manifest-ai-provider-required-invalid",
      path: `${path}.providerRequired`,
      message: "ai.providerRequired must be a boolean."
    });
  }

  if (value.mode === "none" && value.providerRequired === true) {
    issues.push({
      code: "manifest-ai-none-provider-required",
      path: `${path}.providerRequired`,
      message: "ai.providerRequired must not be true when ai.mode is none."
    });
  }

  if (!Array.isArray(value.artifacts)) {
    issues.push({
      code: "manifest-ai-artifacts-invalid",
      path: `${path}.artifacts`,
      message: "ai.artifacts must be an array."
    });
    return issues;
  }

  value.artifacts.forEach((artifact, index) => {
    const artifactPath = `${path}.artifacts[${index}]`;

    if (!isRecord(artifact)) {
      issues.push({
        code: "manifest-ai-artifact-invalid",
        path: artifactPath,
        message: "AI artifact must be an object."
      });
      return;
    }

    if (!isNonEmptyString(artifact.path)) {
      issues.push({
        code: "manifest-ai-artifact-path-invalid",
        path: `${artifactPath}.path`,
        message: "AI artifact path must be a non-empty string."
      });
    }

    if (!isNonEmptyString(artifact.purpose)) {
      issues.push({
        code: "manifest-ai-artifact-purpose-invalid",
        path: `${artifactPath}.purpose`,
        message: "AI artifact purpose must be a non-empty string."
      });
    }

    if ("required" in artifact && typeof artifact.required !== "boolean") {
      issues.push({
        code: "manifest-ai-artifact-required-invalid",
        path: `${artifactPath}.required`,
        message: "AI artifact required must be a boolean when present."
      });
    }
  });

  return issues;
}

function validateProviders(
  value: unknown,
  path: string
): readonly FoundryManifestValidationIssue[] {
  const issues: FoundryManifestValidationIssue[] = [];

  if (!isRecord(value)) {
    return [
      {
        code: "manifest-providers-invalid",
        path,
        message: "providers must be an object when present."
      }
    ];
  }

  if ("database" in value) {
    issues.push(
      ...validateProviderReferences(value.database, `${path}.database`)
    );
  }

  if ("ai" in value) {
    issues.push(...validateProviderReferences(value.ai, `${path}.ai`));
  }

  return issues;
}

function validateProviderReferences(
  value: unknown,
  path: string
): readonly FoundryManifestValidationIssue[] {
  const issues: FoundryManifestValidationIssue[] = [];

  if (!Array.isArray(value)) {
    return [
      {
        code: "manifest-provider-references-invalid",
        path,
        message: "provider references must be an array."
      }
    ];
  }

  value.forEach((provider, index) => {
    const providerPath = `${path}[${index}]`;

    if (!isRecord(provider)) {
      issues.push({
        code: "manifest-provider-reference-invalid",
        path: providerPath,
        message: "provider reference must be an object."
      });
      return;
    }

    if (!isNonEmptyString(provider.id)) {
      issues.push({
        code: "manifest-provider-id-invalid",
        path: `${providerPath}.id`,
        message: "provider id must be a non-empty string."
      });
    }

    if (!isNonEmptyString(provider.kind)) {
      issues.push({
        code: "manifest-provider-kind-invalid",
        path: `${providerPath}.kind`,
        message: "provider kind must be a non-empty string."
      });
    }

    if (typeof provider.required !== "boolean") {
      issues.push({
        code: "manifest-provider-required-invalid",
        path: `${providerPath}.required`,
        message: "provider required must be a boolean."
      });
    }

    if ("source" in provider && !isOneOf(provider.source, providerSources)) {
      issues.push({
        code: "manifest-provider-source-invalid",
        path: `${providerPath}.source`,
        message: `provider source must be one of: ${providerSources.join(", ")}.`
      });
    }
  });

  return issues;
}

function validateStringEnumArray(input: {
  readonly value: unknown;
  readonly path: string;
  readonly allowed: readonly string[];
  readonly code: string;
}): readonly FoundryManifestValidationIssue[] {
  const issues: FoundryManifestValidationIssue[] = [];

  if (!Array.isArray(input.value)) {
    return [
      {
        code: input.code,
        path: input.path,
        message: `${input.path} must be an array.`
      }
    ];
  }

  const seen = new Set<string>();

  input.value.forEach((entry, index) => {
    const entryPath = `${input.path}[${index}]`;

    if (typeof entry !== "string" || !input.allowed.includes(entry)) {
      issues.push({
        code: input.code,
        path: entryPath,
        message: `${entryPath} must be one of: ${input.allowed.join(", ")}.`
      });
      return;
    }

    if (seen.has(entry)) {
      issues.push({
        code: "manifest-array-duplicate",
        path: entryPath,
        message: `${entryPath} duplicates value "${entry}".`
      });
    }

    seen.add(entry);
  });

  return issues;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[]
): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}
