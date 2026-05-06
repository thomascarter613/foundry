import type {
  FoundryLifecycleEvent,
  FoundryLifecycleStep,
  FoundryManifest,
  FoundryProviderReference,
  FoundryWorkspaceKind
} from "./types.js";

export interface CreateDefaultFoundryManifestInput {
  readonly workspaceName: string;
  readonly workspaceKind?: FoundryWorkspaceKind;
  readonly databaseProviderId?: string;
}

export const foundryLifecycleModel =
  "inspect-resolve-plan-apply-verify-document-audit-handoff" as const;

export const defaultFoundryLifecycleEvents: readonly FoundryLifecycleEvent[] = [
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

export const defaultFoundryLifecycleFlow: readonly FoundryLifecycleStep[] = [
  "inspect",
  "resolve",
  "plan",
  "apply",
  "verify",
  "document",
  "audit",
  "handoff"
];

export function createDefaultFoundryManifest(
  input: CreateDefaultFoundryManifestInput
): FoundryManifest {
  const databaseProviders = createDatabaseProviderReferences(
    input.databaseProviderId
  );

  const manifestBase = {
    schemaVersion: 1,
    foundryVersion: "1.0.0",
    workspace: {
      name: input.workspaceName,
      kind: input.workspaceKind ?? "monorepo",
      packageManager: "bun",
      sourceOfTruth: "repository"
    },
    lifecycle: {
      model: foundryLifecycleModel,
      supportedEvents: defaultFoundryLifecycleEvents,
      defaultFlow: defaultFoundryLifecycleFlow
    },
    verification: {
      commands: [
        {
          name: "typecheck",
          command: "bun run typecheck",
          required: true,
          description: "Run TypeScript type checking."
        },
        {
          name: "build",
          command: "bun run build",
          required: true,
          description: "Build the CLI or workspace."
        },
        {
          name: "verify",
          command: "bun run verify",
          required: true,
          description: "Run the repository verification gate."
        }
      ]
    },
    audit: {
      enabled: true,
      logPath: ".foundry/audit/events.ndjson",
      eventSchemaVersion: 1
    },
    ai: {
      mode: "manual",
      providerRequired: false,
      artifacts: [
        {
          path: "docs/ai/BOOTSTRAP_PROMPT.md",
          purpose: "Bootstrap future human or AI-assisted sessions.",
          required: true
        },
        {
          path: "docs/ai/CURRENT_STATE.md",
          purpose: "Record current project state for continuity.",
          required: true
        },
        {
          path: "docs/ai/FRESH_CHAT_HANDOFF.md",
          purpose: "Provide a portable handoff for future chat sessions.",
          required: false
        }
      ]
    }
  } satisfies Omit<FoundryManifest, "providers">;

  if (databaseProviders.length === 0) {
    return manifestBase;
  }

  return {
    ...manifestBase,
    providers: {
      database: databaseProviders
    }
  };
}

function createDatabaseProviderReferences(
  providerId: string | undefined
): readonly FoundryProviderReference[] {
  if (!providerId) {
    return [];
  }

  return [
    {
      id: providerId,
      kind: "database",
      required: false,
      source: "built-in"
    }
  ];
}
