import { Args, Command, Flags } from "@oclif/core";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import type {
  FoundrySpecKind,
  FoundrySpecLifecycleStatus,
  FoundrySpecRiskLevel,
} from "../../spec/index.js";

export default class SpecCreate extends Command {
  static override description = "Create a Foundry native specification file.";

  static override examples = [
    '$ foundry spec create "Add authentication"',
    '$ foundry spec create "Add billing" --kind feature',
    '$ foundry spec create "Harden secret handling" --kind security --risk-level high',
    '$ foundry spec create "Add authentication" --dir specs/features',
    '$ foundry spec create "Add authentication" --id SPEC-0042',
  ];

  static override args = {
    title: Args.string({
      description: "Human-readable title for the new specification.",
      required: true,
    }),
  };

  static override flags = {
    dir: Flags.string({
      description: "Directory where the spec folder should be created.",
      default: "specs/features",
    }),
    id: Flags.string({
      description: "Explicit spec id to use, for example SPEC-0007.",
      required: false,
    }),
    kind: Flags.string({
      description: "Spec kind.",
      default: "feature",
      options: [
        "feature",
        "bugfix",
        "refactor",
        "architecture",
        "security",
        "operations",
        "documentation",
        "research",
      ],
    }),
    "spec-status": Flags.string({
      description: "Native Foundry spec lifecycle status.",
      default: "draft",
      options: [
        "draft",
        "clarifying",
        "planned",
        "tasked",
        "approved",
        "implemented",
        "verified",
        "superseded",
        "rejected",
      ],
    }),
    "risk-level": Flags.string({
      description: "Risk level for the spec.",
      default: "low",
      options: ["low", "medium", "high", "critical"],
    }),
    owner: Flags.string({
      description: "Primary owner for the generated spec.",
      default: "project-owner",
    }),
    force: Flags.boolean({
      description: "Overwrite an existing generated spec file if one already exists.",
      default: false,
    }),
    json: Flags.boolean({
      description: "Print creation result as JSON.",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SpecCreate);

    const workspaceRoot = getWorkspaceRoot();
    const specRoot = resolveWorkspacePath(flags.dir);
    const specId = flags.id ?? await findNextSpecId(specRoot);

    if (!/^SPEC-\d{4,}$/.test(specId)) {
      this.error(`Invalid spec id: ${specId}. Expected format: SPEC-0001.`);
    }

    const title = args.title.trim();

    if (title.length === 0) {
      this.error("Spec title cannot be empty.");
    }

    const folderName = `${specId.slice("SPEC-".length)}-${slugify(title)}`;
    const outputDir = join(specRoot, folderName);
    const outputPath = join(outputDir, "spec.md");

    const alreadyExists = await pathExists(outputPath);

    if (alreadyExists && !flags.force) {
      this.error(
        `Spec already exists: ${relativeToWorkspace(workspaceRoot, outputPath)}. ` +
          "Pass --force to overwrite it.",
      );
    }

    const now = formatDate(new Date());
    const kind = flags.kind as FoundrySpecKind;
    const specStatus = flags["spec-status"] as FoundrySpecLifecycleStatus;
    const riskLevel = flags["risk-level"] as FoundrySpecRiskLevel;

    const content = renderSpec({
      id: specId,
      title,
      kind,
      specStatus,
      riskLevel,
      owner: flags.owner,
      date: now,
    });

    await mkdir(outputDir, { recursive: true });
    await writeFile(outputPath, content, "utf8");

    const relativePath = relativeToWorkspace(workspaceRoot, outputPath);

    if (flags.json) {
      this.log(
        JSON.stringify(
          {
            ok: true,
            id: specId,
            title,
            path: relativePath,
            kind,
            specStatus,
            riskLevel,
          },
          null,
          2,
        ),
      );

      return;
    }

    this.log("Foundry spec created.");
    this.log(`ID: ${specId}`);
    this.log(`Title: ${title}`);
    this.log(`Path: ${relativePath}`);
    this.log("");
    this.log("Next:");
    this.log(`  foundry spec validate ${relativePath}`);
  }
}

interface RenderSpecInput {
  readonly id: string;
  readonly title: string;
  readonly kind: FoundrySpecKind;
  readonly specStatus: FoundrySpecLifecycleStatus;
  readonly riskLevel: FoundrySpecRiskLevel;
  readonly owner: string;
  readonly date: string;
}

function getWorkspaceRoot(): string {
  return process.env.FOUNDRY_WORKSPACE_CWD ?? process.env.INIT_CWD ?? process.cwd();
}

function resolveWorkspacePath(inputPath: string): string {
  if (isAbsolute(inputPath)) {
    return inputPath;
  }

  return resolve(getWorkspaceRoot(), inputPath);
}

function relativeToWorkspace(workspaceRoot: string, absolutePath: string): string {
  const normalizedWorkspace = workspaceRoot.replace(/\/+$/g, "");
  const normalizedPath = absolutePath.replace(/\/+$/g, "");

  if (normalizedPath === normalizedWorkspace) {
    return ".";
  }

  if (normalizedPath.startsWith(`${normalizedWorkspace}/`)) {
    return normalizedPath.slice(normalizedWorkspace.length + 1);
  }

  return absolutePath;
}

async function findNextSpecId(specRoot: string): Promise<string> {
  const max = await findMaxSpecNumber(specRoot);

  return `SPEC-${String(max + 1).padStart(4, "0")}`;
}

async function findMaxSpecNumber(directory: string): Promise<number> {
  if (!await pathExists(directory)) {
    return 0;
  }

  const entries = await readdir(directory, { withFileTypes: true });
  let max = 0;

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      max = Math.max(max, await findMaxSpecNumber(fullPath));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    const content = await readFile(fullPath, "utf8");
    const match = content.match(/^id:\s*SPEC-(\d{4,})\s*$/m);

    if (match?.[1]) {
      max = Math.max(max, Number.parseInt(match[1], 10));
    }
  }

  return max;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug.length > 0 ? slug : "untitled-spec";
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function renderSpec(input: RenderSpecInput): string {
  return `---
id: ${input.id}
title: ${input.title}
status: Current
specStatus: ${input.specStatus}
kind: ${input.kind}
version: 0.1.0
created: ${input.date}
updated: ${input.date}
lastUpdated: ${input.date}
owner: ${input.owner}
owners:
  - ${input.owner}
governanceLevel: Repository
documentType: Specification
related_adrs: []
related_work_packets: []
risk_level: ${input.riskLevel}
requires_ai: false
requires_database_change: false
requires_api_change: false
requires_security_review: false
requires_migration: false
tags:
  - spec
  - foundry
---

# ${input.id}: ${input.title}

## Summary

Describe the feature, change, or decision this specification governs.

## Problem

Describe the problem, user need, operational gap, or architectural gap this specification addresses.

## Goals

- Define the intended outcome.
- Preserve clear acceptance criteria.
- Keep the change traceable through planning, work packets, verification, and commit history.

## Non-Goals

- List anything intentionally excluded from this specification.

## Users

- Identify the users, maintainers, systems, or operators affected by this change.

## Requirements

### REQ-0001: Define the first requirement

Foundry must have at least one requirement in every native specification.

Acceptance criteria:

- The requirement is testable.
- The requirement is traceable.
- The requirement can be converted into work-packet tasks.

## Open Questions

- What needs clarification before this spec can move from draft to planned?

## Implementation Notes

Capture architecture notes, affected files, expected modules, migration concerns, or follow-up design work.

## Verification

\`\`\`bash
foundry spec validate ${input.id}
\`\`\`
`;
}
