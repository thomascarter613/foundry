import type { GeneratorDefinition, GeneratorRegistry } from "./types.js";

export const generatorRegistry: GeneratorRegistry = {
  generators: [
    {
      id: "governance-artifact:adr",
      category: "governance-artifact",
      name: "Architecture Decision Record",
      description: "Create a governed Architecture Decision Record document.",
      engine: "scaffdog",
      status: "available",
      inputSchema: [
        {
          name: "identifier",
          type: "string",
          description: "Stable ADR identifier.",
          required: true,
          example: "ADR-0002"
        },
        {
          name: "name",
          type: "string",
          description: "Decision title.",
          required: true,
          example: "Select package generator engine"
        },
        {
          name: "status",
          type: "enum",
          description: "ADR status.",
          required: false,
          defaultValue: "proposed",
          allowedValues: ["proposed", "accepted", "superseded", "rejected"]
        }
      ],
      outputPaths: ["docs/adr/{{identifier}}-{{slug}}.md"],
      supportsDryRun: true,
      supportsAuditLog: true,
      overwritePolicy: "fail",
      validationCommands: ["bun run verify"],
      tags: ["architecture", "decision", "docs"]
    },
    {
      id: "governance-artifact:work-packet",
      category: "governance-artifact",
      name: "Work Packet",
      description: "Create a governed work packet document.",
      engine: "scaffdog",
      status: "available",
      inputSchema: [
        {
          name: "identifier",
          type: "string",
          description: "Stable work packet identifier.",
          required: true,
          example: "WP-0001"
        },
        {
          name: "name",
          type: "string",
          description: "Work packet title.",
          required: true,
          example: "Add generator registry"
        },
        {
          name: "status",
          type: "enum",
          description: "Work packet status.",
          required: false,
          defaultValue: "planned",
          allowedValues: ["planned", "active", "blocked", "complete", "cancelled"]
        }
      ],
      outputPaths: ["docs/work-packets/{{identifier}}-{{slug}}.md"],
      supportsDryRun: true,
      supportsAuditLog: true,
      overwritePolicy: "fail",
      validationCommands: ["bun run verify"],
      tags: ["planning", "execution", "docs"]
    },
    {
      id: "document:runbook",
      category: "document",
      name: "Runbook",
      description: "Create an operational runbook document.",
      engine: "scaffdog",
      status: "planned",
      inputSchema: [
        {
          name: "name",
          type: "string",
          description: "Runbook title.",
          required: true,
          example: "Local development"
        },
        {
          name: "area",
          type: "string",
          description: "Operational area.",
          required: false,
          defaultValue: "operations",
          example: "local-development"
        }
      ],
      outputPaths: ["docs/runbooks/{{slug}}.md"],
      supportsDryRun: true,
      supportsAuditLog: true,
      overwritePolicy: "fail",
      validationCommands: ["bun run verify"],
      tags: ["docs", "operations", "runbook"]
    },
    {
      id: "package:typescript-library",
      category: "package",
      name: "TypeScript Library Package",
      description: "Create a reusable internal TypeScript package.",
      engine: "turbo-gen",
      status: "planned",
      inputSchema: [
        {
          name: "name",
          type: "string",
          description: "Package name without the workspace scope.",
          required: true,
          example: "logger"
        }
      ],
      outputPaths: [
        "packages/{{slug}}/package.json",
        "packages/{{slug}}/tsconfig.json",
        "packages/{{slug}}/src/index.ts",
        "packages/{{slug}}/README.md"
      ],
      supportsDryRun: true,
      supportsAuditLog: true,
      overwritePolicy: "fail",
      validationCommands: ["bun run typecheck", "bun run verify"],
      tags: ["typescript", "package", "library"]
    },
    {
      id: "service:hono-api",
      category: "service",
      name: "Hono API Service",
      description: "Create a backend API service using Hono.",
      engine: "copier",
      status: "planned",
      inputSchema: [
        {
          name: "name",
          type: "string",
          description: "Service name.",
          required: true,
          example: "gov-api"
        }
      ],
      outputPaths: [
        "services/{{slug}}/package.json",
        "services/{{slug}}/tsconfig.json",
        "services/{{slug}}/src/index.ts",
        "services/{{slug}}/README.md"
      ],
      supportsDryRun: true,
      supportsAuditLog: true,
      overwritePolicy: "fail",
      validationCommands: ["bun run typecheck", "bun run verify"],
      tags: ["service", "api", "hono"]
    },
    {
      id: "app:solid-start",
      category: "app",
      name: "SolidStart Application",
      description: "Create a user-facing SolidStart application.",
      engine: "copier",
      status: "planned",
      inputSchema: [
        {
          name: "name",
          type: "string",
          description: "Application name.",
          required: true,
          example: "member-portal"
        }
      ],
      outputPaths: [
        "apps/{{slug}}/package.json",
        "apps/{{slug}}/tsconfig.json",
        "apps/{{slug}}/src/app.tsx",
        "apps/{{slug}}/README.md"
      ],
      supportsDryRun: true,
      supportsAuditLog: true,
      overwritePolicy: "fail",
      validationCommands: ["bun run typecheck", "bun run verify"],
      tags: ["app", "solid", "solid-start"]
    },
    {
      id: "contract-artifact:openapi-typescript-client",
      category: "contract-artifact",
      name: "OpenAPI TypeScript Client",
      description: "Generate a TypeScript client from an OpenAPI contract.",
      engine: "orval",
      status: "planned",
      inputSchema: [
        {
          name: "name",
          type: "string",
          description: "Client package or generated artifact name.",
          required: true,
          example: "gov-api-client"
        },
        {
          name: "contract",
          type: "string",
          description: "Path to the OpenAPI contract.",
          required: true,
          example: "contracts/openapi/gov-api.yaml"
        }
      ],
      outputPaths: ["generated/clients/{{slug}}"],
      supportsDryRun: true,
      supportsAuditLog: true,
      overwritePolicy: "fail",
      validationCommands: ["bun run verify"],
      tags: ["openapi", "client", "typescript"]
    },
    {
      id: "cli-command:oclif-command",
      category: "cli-command",
      name: "oclif CLI Command",
      description: "Create a new command under the Foundry CLI package.",
      engine: "oclif",
      status: "planned",
      inputSchema: [
        {
          name: "name",
          type: "string",
          description: "Command path.",
          required: true,
          example: "init app"
        }
      ],
      outputPaths: ["packages/cli/src/commands/{{commandPath}}.ts"],
      supportsDryRun: true,
      supportsAuditLog: true,
      overwritePolicy: "fail",
      validationCommands: ["cd packages/cli && bun run typecheck"],
      tags: ["cli", "oclif", "command"]
    }
  ]
};

export function listGenerators(): readonly GeneratorDefinition[] {
  return generatorRegistry.generators;
}

export function findGeneratorById(id: string): GeneratorDefinition | undefined {
  return generatorRegistry.generators.find((generator) => generator.id === id);
}

export function requireGeneratorById(id: string): GeneratorDefinition {
  const generator = findGeneratorById(id);

  if (!generator) {
    const availableIds = generatorRegistry.generators
      .map((candidate) => `  - ${candidate.id}`)
      .join("\n");

    throw new Error(`Unknown generator "${id}".\n\nAvailable generators:\n${availableIds}`);
  }

  return generator;
}
