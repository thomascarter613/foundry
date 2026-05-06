import type { WorkspaceTemplateFile } from "./templates.js";

export interface BuildInitProvenanceFilesInput {
  readonly workspaceName: string;
  readonly databaseProvider: string | undefined;
  readonly installDependencies: boolean;
  readonly plan: unknown;
  readonly files: readonly WorkspaceTemplateFile[];
}

export function buildInitProvenanceFiles(
  input: BuildInitProvenanceFilesInput
): readonly WorkspaceTemplateFile[] {
  const generatedAt = new Date().toISOString();
  const generatedFiles = input.files.map((file) => {
    return {
      path: file.relativePath,
      description: file.description,
      executable: file.executable === true
    };
  });

  const provenance = {
    schemaVersion: 1,
    generatedBy: {
      tool: "foundry",
      command: "foundry init",
      package: "@foundry/cli"
    },
    generatedAt,
    workspace: {
      name: input.workspaceName,
      databaseProvider: input.databaseProvider ?? null,
      installDependencies: input.installDependencies
    },
    generatedFiles,
    plan: sanitizePlan(input.plan)
  };

  const auditEvent = {
    schemaVersion: 1,
    type: "foundry.init.workspace_created",
    occurredAt: generatedAt,
    actor: {
      kind: "local-user"
    },
    subject: {
      kind: "workspace",
      name: input.workspaceName
    },
    details: {
      databaseProvider: input.databaseProvider ?? null,
      installDependencies: input.installDependencies,
      filesWritten: generatedFiles.length
    }
  };

  return [
    {
      relativePath: ".foundry/init/provenance.json",
      description: "Foundry init provenance metadata.",
      contents: `${JSON.stringify(provenance, null, 2)}\n`
    },
    {
      relativePath: ".foundry/init/audit.ndjson",
      description: "Foundry init audit event log.",
      contents: `${JSON.stringify(auditEvent)}\n`
    },
    {
      relativePath: ".foundry/README.md",
      description: "Generated workspace Foundry metadata README.",
      contents: `# Foundry Metadata

This directory contains local Foundry metadata for the generated workspace.

## Files

- \`init/provenance.json\` — machine-readable initialization provenance.
- \`init/audit.ndjson\` — append-friendly initialization audit events.

These files are intentionally committed with the generated workspace so future tools, maintainers, and AI agents can understand how the workspace was created.
`
    }
  ];
}

function sanitizePlan(plan: unknown): unknown {
  if (plan === undefined || plan === null) {
    return null;
  }

  if (typeof plan === "string") {
    return plan;
  }

  if (typeof plan === "number" || typeof plan === "boolean") {
    return plan;
  }

  if (Array.isArray(plan)) {
    return plan.map((entry) => sanitizePlan(entry));
  }

  if (typeof plan === "object") {
    const record = plan as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(record)) {
      if (typeof value === "function" || typeof value === "symbol") {
        continue;
      }

      sanitized[key] = sanitizePlan(value);
    }

    return sanitized;
  }

  return String(plan);
}