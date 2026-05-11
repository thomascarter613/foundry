#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


FILES: dict[str, str] = {
    "packages/cli/src/docs/directory-repair.ts": '''import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

export type DirectoryRepairActionKind =
  | "createDirectory"
  | "createIndex"
  | "reportLegacyDirectory"
  | "reportUnexpectedDirectory"
  | "reportRootMarkdown"
  | "reportAdrPlacement"
  | "reportDiagramPlacement";

export type DirectoryRepairAction = {
  readonly kind: DirectoryRepairActionKind;
  readonly path: string;
  readonly description: string;
  readonly willWrite: boolean;
};

export type DirectoryRepairPlan = {
  readonly ok: boolean;
  readonly write: boolean;
  readonly actionCount: number;
  readonly writeCount: number;
  readonly reportOnlyCount: number;
  readonly actions: readonly DirectoryRepairAction[];
  readonly messages: readonly string[];
};

export type DirectoryRepairOptions = {
  readonly repoRoot: string;
  readonly docsDir?: string;
  readonly write?: boolean;
};

type IndexDefinition = {
  readonly path: string;
  readonly title: string;
  readonly owner: string;
  readonly governanceLevel: "Informational" | "Required" | "Binding";
  readonly documentType:
    | "Planning"
    | "Governance"
    | "Architecture"
    | "ADR"
    | "ChangePlan"
    | "Lifecycle"
    | "Standard"
    | "Platform"
    | "Onboarding";
  readonly upstream: readonly string[];
  readonly downstream: readonly string[];
  readonly body: string;
};

const canonicalDirectories = [
  "docs/planning",
  "docs/governance",
  "docs/architecture",
  "docs/architecture/adr",
  "docs/architecture/diagrams",
  "docs/changeplans",
  "docs/lifecycle",
  "docs/standards",
  "docs/platform",
  "docs/onboarding"
] as const;

const legacyDirectories = new Set([
  "docs/adr",
  "docs/product",
  "docs/scaffolding",
  "docs/work-packets",
  "docs/.ideas"
]);

const allowedRootMarkdownFiles = new Set([
  "docs/index.md",
  "docs/README.md",
  "docs/ci-constitutional-pipeline.md"
]);

const allowedTopLevelDirectories = new Set([
  "docs/planning",
  "docs/governance",
  "docs/architecture",
  "docs/changeplans",
  "docs/lifecycle",
  "docs/standards",
  "docs/platform",
  "docs/onboarding",
  ...legacyDirectories
]);

const diagramExtensions = new Set([
  ".drawio",
  ".mmd",
  ".mermaid",
  ".puml",
  ".plantuml",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp"
]);

const indexDefinitions: readonly IndexDefinition[] = [
  {
    path: "docs/index.md",
    title: "Documentation Index",
    owner: "Documentation",
    governanceLevel: "Informational",
    documentType: "Onboarding",
    upstream: [],
    downstream: [
      "docs/planning/index.md",
      "docs/governance/index.md",
      "docs/architecture/index.md",
      "docs/changeplans/index.md",
      "docs/lifecycle/index.md",
      "docs/standards/index.md",
      "docs/platform/index.md",
      "docs/onboarding/index.md"
    ],
    body: `# Documentation Index

## Purpose

Provide the root entrypoint for the governed Foundry documentation system.

## Navigation

- [Planning](planning/index.md)
- [Governance](governance/index.md)
- [Architecture](architecture/index.md)
- [Architecture Decision Records](architecture/adr/index.md)
- [ChangePlans](changeplans/index.md)
- [Lifecycle](lifecycle/index.md)
- [Standards](standards/index.md)
- [Platform](platform/index.md)
- [Onboarding](onboarding/index.md)

## Change History

- Created by the directory topology repair command.
`
  },
  {
    path: "docs/planning/index.md",
    title: "Planning Index",
    owner: "Product Architecture",
    governanceLevel: "Required",
    documentType: "Planning",
    upstream: ["docs/index.md"],
    downstream: [],
    body: `# Planning Index

## Purpose

Provide the governed index for planning documents.

## Change History

- Created by the directory topology repair command.
`
  },
  {
    path: "docs/governance/index.md",
    title: "Governance Index",
    owner: "Governance",
    governanceLevel: "Binding",
    documentType: "Governance",
    upstream: ["docs/index.md"],
    downstream: [],
    body: `# Governance Index

## Purpose

Provide the governed index for governance documents.

## Change History

- Created by the directory topology repair command.
`
  },
  {
    path: "docs/architecture/index.md",
    title: "Architecture Index",
    owner: "Architecture",
    governanceLevel: "Required",
    documentType: "Architecture",
    upstream: ["docs/index.md"],
    downstream: ["docs/architecture/adr/index.md"],
    body: `# Architecture Index

## Purpose

Provide the governed index for architecture documents.

## Change History

- Created by the directory topology repair command.
`
  },
  {
    path: "docs/architecture/adr/index.md",
    title: "Architecture Decision Record Index",
    owner: "Architecture",
    governanceLevel: "Binding",
    documentType: "ADR",
    upstream: ["docs/architecture/index.md"],
    downstream: [],
    body: `# Architecture Decision Record Index

## Purpose

Provide the authoritative index for Architecture Decision Records.

## ADR List

The ADR validator may regenerate this section from discovered ADR files.

## Change History

- Created by the directory topology repair command.
`
  },
  {
    path: "docs/changeplans/index.md",
    title: "ChangePlan Index",
    owner: "Engineering Productivity",
    governanceLevel: "Required",
    documentType: "ChangePlan",
    upstream: ["docs/index.md"],
    downstream: [],
    body: `# ChangePlan Index

## Purpose

Provide the governed index for ChangePlan documents.

## Change History

- Created by the directory topology repair command.
`
  },
  {
    path: "docs/lifecycle/index.md",
    title: "Lifecycle Index",
    owner: "Engineering Productivity",
    governanceLevel: "Required",
    documentType: "Lifecycle",
    upstream: ["docs/index.md"],
    downstream: [],
    body: `# Lifecycle Index

## Purpose

Provide the governed index for lifecycle documents.

## Change History

- Created by the directory topology repair command.
`
  },
  {
    path: "docs/standards/index.md",
    title: "Standards Index",
    owner: "Standards",
    governanceLevel: "Binding",
    documentType: "Standard",
    upstream: ["docs/index.md"],
    downstream: [],
    body: `# Standards Index

## Purpose

Provide the governed index for standards documents.

## Change History

- Created by the directory topology repair command.
`
  },
  {
    path: "docs/platform/index.md",
    title: "Platform Index",
    owner: "Platform",
    governanceLevel: "Required",
    documentType: "Platform",
    upstream: ["docs/index.md"],
    downstream: [],
    body: `# Platform Index

## Purpose

Provide the governed index for platform documents.

## Change History

- Created by the directory topology repair command.
`
  },
  {
    path: "docs/onboarding/index.md",
    title: "Onboarding Index",
    owner: "Documentation",
    governanceLevel: "Informational",
    documentType: "Onboarding",
    upstream: ["docs/index.md"],
    downstream: ["docs/onboarding/glossary-quickref.md"],
    body: `# Onboarding Index

## Purpose

Provide the governed index for onboarding documents.

## Change History

- Created by the directory topology repair command.
`
  }
];

export function createDirectoryRepairPlan(options: DirectoryRepairOptions): DirectoryRepairPlan {
  const docsDir = options.docsDir ?? "docs";
  const docsRoot = join(options.repoRoot, docsDir);
  const write = options.write ?? false;
  const messages: string[] = [];
  const actions: DirectoryRepairAction[] = [];

  if (!existsSync(docsRoot)) {
    actions.push({
      kind: "createDirectory",
      path: docsDir,
      description: `Create missing docs root directory: ${docsDir}`,
      willWrite: write
    });
  } else if (!statSync(docsRoot).isDirectory()) {
    return {
      ok: false,
      write,
      actionCount: 0,
      writeCount: 0,
      reportOnlyCount: 0,
      actions: [],
      messages: [`${docsDir} exists but is not a directory.`]
    };
  }

  for (const directory of canonicalDirectories) {
    if (!existsSync(join(options.repoRoot, directory))) {
      actions.push({
        kind: "createDirectory",
        path: directory,
        description: `Create missing canonical docs directory: ${directory}`,
        willWrite: write
      });
    }
  }

  for (const definition of indexDefinitions) {
    if (!existsSync(join(options.repoRoot, definition.path))) {
      actions.push({
        kind: "createIndex",
        path: definition.path,
        description: `Create missing docs index file: ${definition.path}`,
        willWrite: write
      });
    }
  }

  if (existsSync(docsRoot) && statSync(docsRoot).isDirectory()) {
    const inventory = scanDirectoryInventory(options.repoRoot, docsRoot);

    for (const directory of inventory.directories) {
      if (isTopLevelDocsDirectory(directory) && !allowedTopLevelDirectories.has(directory)) {
        actions.push({
          kind: "reportUnexpectedDirectory",
          path: directory,
          description: `Unexpected top-level docs directory should be reviewed: ${directory}`,
          willWrite: false
        });
      }

      if (legacyDirectories.has(directory)) {
        actions.push({
          kind: "reportLegacyDirectory",
          path: directory,
          description: `Legacy docs directory should eventually be migrated or explicitly accepted: ${directory}`,
          willWrite: false
        });
      }
    }

    for (const file of inventory.files) {
      if (isRootMarkdownFile(file) && !allowedRootMarkdownFiles.has(file)) {
        actions.push({
          kind: "reportRootMarkdown",
          path: file,
          description: `Root-level Markdown file should be moved into a governed docs domain: ${file}`,
          willWrite: false
        });
      }

      if (looksLikeAdrFile(file) && !isInAdrDirectory(file)) {
        actions.push({
          kind: "reportAdrPlacement",
          path: file,
          description: `ADR-like file should live in docs/architecture/adr or approved legacy docs/adr: ${file}`,
          willWrite: false
        });
      }

      if (looksLikeDiagramFile(file) && !file.startsWith("docs/architecture/diagrams/")) {
        actions.push({
          kind: "reportDiagramPlacement",
          path: file,
          description: `Diagram file should live in docs/architecture/diagrams: ${file}`,
          willWrite: false
        });
      }
    }
  }

  if (write) {
    applyDirectoryRepairActions({
      repoRoot: options.repoRoot,
      actions
    });
  }

  const writeCount = actions.filter((action) => action.willWrite).length;
  const reportOnlyCount = actions.length - writeCount;

  return {
    ok: true,
    write,
    actionCount: actions.length,
    writeCount,
    reportOnlyCount,
    actions,
    messages
  };
}

export function formatDirectoryRepairPlanAsText(plan: DirectoryRepairPlan): string {
  const lines: string[] = [];

  if (!plan.ok) {
    lines.push("Directory topology repair failed.");

    for (const message of plan.messages) {
      lines.push(`- ${message}`);
    }

    return lines.join("\\n");
  }

  lines.push(
    plan.write
      ? "Directory topology repair applied."
      : "Directory topology repair dry run."
  );

  lines.push("");
  lines.push(`Actions: ${plan.actionCount}`);
  lines.push(`Writable actions: ${plan.writeCount}`);
  lines.push(`Report-only actions: ${plan.reportOnlyCount}`);

  if (plan.actions.length > 0) {
    lines.push("");
    lines.push("Plan:");

    for (const action of plan.actions) {
      lines.push(`- ${action.kind}: ${action.path}`);
      lines.push(`  ${action.description}`);
      lines.push(`  will write: ${String(action.willWrite)}`);
    }
  }

  if (!plan.write) {
    lines.push("");
    lines.push("No files were written. Re-run with --write to apply writable actions.");
  }

  return lines.join("\\n");
}

export function formatDirectoryRepairPlanAsJson(plan: DirectoryRepairPlan): string {
  return JSON.stringify(plan, null, 2);
}

function applyDirectoryRepairActions(options: {
  readonly repoRoot: string;
  readonly actions: readonly DirectoryRepairAction[];
}): void {
  for (const action of options.actions) {
    if (!action.willWrite) {
      continue;
    }

    const absolutePath = join(options.repoRoot, action.path);

    if (action.kind === "createDirectory") {
      mkdirSync(absolutePath, { recursive: true });
      continue;
    }

    if (action.kind === "createIndex") {
      const definition = indexDefinitions.find((candidate) => candidate.path === action.path);

      if (!definition) {
        continue;
      }

      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, renderIndexDefinition(definition), "utf8");
    }
  }
}

function renderIndexDefinition(definition: IndexDefinition): string {
  const today = new Date().toISOString().slice(0, 10);

  return [
    "---",
    `title: "${yamlEscape(definition.title)}"`,
    `status: "Draft"`,
    `owner: "${yamlEscape(definition.owner)}"`,
    `lastUpdated: "${today}"`,
    `governanceLevel: "${definition.governanceLevel}"`,
    `documentType: "${definition.documentType}"`,
    renderArrayField("upstream", definition.upstream),
    renderArrayField("downstream", definition.downstream),
    renderArrayField("governanceLinks", ["docs/governance/documentation-governance.md"]),
    renderArrayField("adrLinks", []),
    renderArrayField("glossaryTerms", glossaryTermsForIndex(definition)),
    "---",
    "",
    definition.body
  ].join("\\n");
}

function renderArrayField(key: string, values: readonly string[]): string {
  if (values.length === 0) {
    return `${key}: []`;
  }

  return [
    `${key}:`,
    ...values.map((value) => `  - "${yamlEscape(value)}"`)
  ].join("\\n");
}

function glossaryTermsForIndex(definition: IndexDefinition): readonly string[] {
  if (definition.documentType === "ADR") {
    return ["ADR", "Architecture"];
  }

  if (definition.documentType === "ChangePlan") {
    return ["ChangePlan", "Lifecycle"];
  }

  if (definition.documentType === "Standard") {
    return ["Standard", "Governance"];
  }

  return [definition.documentType, "Documentation System"];
}

function scanDirectoryInventory(repoRoot: string, docsRoot: string): {
  readonly directories: readonly string[];
  readonly files: readonly string[];
} {
  const directories: string[] = [];
  const files: string[] = [];

  function walk(directory: string): void {
    const entries = readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = join(directory, entry.name);
      const relativePath = relative(repoRoot, absolutePath).replaceAll("\\\\", "/");

      if (entry.isDirectory()) {
        directories.push(relativePath);
        walk(absolutePath);
        continue;
      }

      if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  }

  walk(docsRoot);

  return {
    directories: directories.sort(),
    files: files.sort()
  };
}

function isTopLevelDocsDirectory(path: string): boolean {
  const parts = path.split("/");

  return parts.length === 2 && parts[0] === "docs";
}

function isRootMarkdownFile(path: string): boolean {
  const parts = path.split("/");

  return parts.length === 2 && parts[0] === "docs" && path.endsWith(".md");
}

function looksLikeAdrFile(path: string): boolean {
  const fileName = path.split("/").at(-1) ?? "";

  return /^(?:ADR-)?\\d{4}[-_].*\\.md$/i.test(fileName);
}

function isInAdrDirectory(path: string): boolean {
  return path.startsWith("docs/architecture/adr/") || path.startsWith("docs/adr/");
}

function looksLikeDiagramFile(path: string): boolean {
  return diagramExtensions.has(extensionOf(path));
}

function extensionOf(path: string): string {
  const fileName = path.split("/").at(-1) ?? path;
  const index = fileName.lastIndexOf(".");

  if (index < 0) {
    return "";
  }

  return fileName.slice(index).toLowerCase();
}

function yamlEscape(value: string): string {
  return value.replace(/\\\\/g, "\\\\\\\\").replace(/"/g, "\\\\\"");
}
''',

    "packages/cli/src/commands/docs/directory/repair.ts": '''import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  createDirectoryRepairPlan,
  formatDirectoryRepairPlanAsJson,
  formatDirectoryRepairPlanAsText
} from "../../../docs/directory-repair.js";

export default class DocsDirectoryRepair extends Command {
  static override summary = "Repair documentation directory topology.";

  static override description = `
Create missing canonical docs directories and missing index files.

This command is dry-run by default. It does not move, rename, or delete legacy
documentation paths. Legacy paths are reported so they can be migrated by a
future explicit migration command.
`;

  static override examples = [
    {
      description: "Preview directory topology repair actions.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Apply safe directory topology repairs.",
      command: "<%= config.bin %> <%= command.id %> --write"
    },
    {
      description: "Write a JSON repair plan.",
      command: "<%= config.bin %> <%= command.id %> --json --report-path .artifacts/docs/directory-repair-plan.json"
    }
  ];

  static override flags = {
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to repair."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the directory repair plan as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the directory repair JSON plan."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    }),
    write: Flags.boolean({
      default: false,
      description: "Apply writable repair actions."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsDirectoryRepair);
    const repoRoot = resolve(flags.root);

    const plan = createDirectoryRepairPlan({
      repoRoot,
      docsDir: flags["docs-dir"],
      write: flags.write
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatDirectoryRepairPlanAsJson(plan)}\\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatDirectoryRepairPlanAsJson(plan)
        : formatDirectoryRepairPlanAsText(plan)
    );

    if (!plan.ok) {
      this.exit(1);
    }
  }
}
''',

    "packages/cli/src/docs/index.ts": '''export {
  formatAdrValidationReportAsJson,
  formatAdrValidationReportAsText,
  validateAdrIndex
} from "./adr-validator.js";
export {
  createDirectoryRepairPlan,
  formatDirectoryRepairPlanAsJson,
  formatDirectoryRepairPlanAsText
} from "./directory-repair.js";
export {
  formatDirectoryValidationReportAsJson,
  formatDirectoryValidationReportAsText,
  validateDirectoryTopology
} from "./directory-validator.js";
export { runDocsValidation } from "./engine.js";
export {
  createValidationReport,
  formatValidationReportAsJson,
  formatValidationReportAsText
} from "./reporter.js";
export { scanMarkdownDocuments } from "./scanner.js";
export { parseMarkdownDocument } from "./frontmatter.js";
export { validateParsedDocument } from "./validator.js";
export {
  buildDocsGraph,
  summarizeDocsGraph
} from "./graph.js";
export {
  formatGraphValidationReportAsJson,
  formatGraphValidationReportAsText,
  validateDocsGraph
} from "./graph-validator.js";
export {
  formatGlossaryValidationReportAsJson,
  formatGlossaryValidationReportAsText,
  validateGlossary
} from "./glossary-validator.js";
export {
  createDocsVerificationArtifacts,
  formatDocsVerificationPipelineReportAsJson,
  formatDocsVerificationPipelineReportAsText,
  runDocsVerificationPipeline
} from "./pipeline.js";
export {
  formatRelationshipNormalizationPlanAsJson,
  formatRelationshipNormalizationPlanAsText,
  normalizeDocsRelationships
} from "./relationship-normalizer.js";
export type {
  AdrIndexEntry,
  AdrRecord,
  AdrValidationOptions,
  AdrValidationReport,
  AdrValidationSummary
} from "./adr-validator.js";
export type {
  DirectoryRepairAction,
  DirectoryRepairActionKind,
  DirectoryRepairOptions,
  DirectoryRepairPlan
} from "./directory-repair.js";
export type {
  DirectoryValidationOptions,
  DirectoryValidationReport,
  DirectoryValidationSummary
} from "./directory-validator.js";
export type {
  DocsGraph,
  DocsGraphBuildResult,
  DocsGraphEdge,
  DocsGraphEdgeType,
  DocsGraphNode,
  DocsGraphNodeKind
} from "./graph.js";
export type {
  DocsGraphValidationOptions,
  DocsGraphValidationReport,
  DocsGraphValidationSummary
} from "./graph-validator.js";
export type {
  GlossaryReferenceRecord,
  GlossaryTermRecord,
  GlossaryValidationOptions,
  GlossaryValidationReport,
  GlossaryValidationSummary
} from "./glossary-validator.js";
export type {
  DocsVerificationPipelineOptions,
  DocsVerificationPipelineReport
} from "./pipeline.js";
export type {
  RelationshipField,
  RelationshipNormalizationAction,
  RelationshipNormalizationFileChange,
  RelationshipNormalizationOptions,
  RelationshipNormalizationPlan
} from "./relationship-normalizer.js";
export type {
  DocsEngineOptions,
  DocsValidationIssue,
  DocsValidationReport,
  DocsValidationSummary,
  DocumentStatus,
  DocumentType,
  DocumentValidationResult,
  GovernanceLevel,
  MarkdownDocumentSource,
  ParsedFrontmatter,
  ParsedMarkdownDocument
} from "./types.js";
'''
}


def update_package_json_scripts() -> None:
    path = Path("package.json")

    if not path.exists():
        print("skip package.json update: package.json not found")
        return

    text = path.read_text(encoding="utf-8")
    decoder = json.JSONDecoder()

    try:
        data, end = decoder.raw_decode(text)
    except json.JSONDecodeError as error:
        print(f"skip package.json update: malformed JSON: {error}")
        return

    trailing = text[end:].strip()

    if trailing:
        print("package.json has trailing non-JSON content; preserving only first JSON object")

    scripts = data.setdefault("scripts", {})

    scripts.setdefault(
        "docs:directory:repair",
        "bun run foundry:build && node packages/cli/bin/run.js docs directory repair"
    )
    scripts.setdefault(
        "docs:directory:repair:write",
        "bun run foundry:build && node packages/cli/bin/run.js docs directory repair --write"
    )

    path.write_text(json.dumps(data, indent=2) + "\\n", encoding="utf-8")
    print("updated package.json")


def main() -> int:
    for file_name, content in FILES.items():
        path = Path(file_name)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        print(f"wrote {file_name}")

    update_package_json_scripts()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
