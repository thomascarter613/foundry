#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


FILES: dict[str, str] = {
    "packages/cli/src/docs/glossary-repair.ts": r'''import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { getFrontmatterArray } from "./metadata.js";
import { parseMarkdownDocument } from "./frontmatter.js";
import { scanMarkdownDocuments } from "./scanner.js";

export type GlossaryQuickrefRepairAction = {
  readonly term: string;
  readonly definitionSource: "canonical" | "placeholder";
  readonly description: string;
};

export type GlossaryQuickrefRepairPlan = {
  readonly ok: boolean;
  readonly write: boolean;
  readonly checkedDocuments: number;
  readonly referencedTermCount: number;
  readonly existingQuickrefTermCount: number;
  readonly missingQuickrefTermCount: number;
  readonly actions: readonly GlossaryQuickrefRepairAction[];
  readonly messages: readonly string[];
};

export type GlossaryQuickrefRepairOptions = {
  readonly repoRoot: string;
  readonly docsDir?: string;
  readonly write?: boolean;
};

type GlossaryDefinition = {
  readonly term: string;
  readonly normalizedTerm: string;
  readonly definition: string;
};

const canonicalGlossaryPath = "docs/planning/glossary.md";
const quickrefPath = "docs/onboarding/glossary-quickref.md";

export function createGlossaryQuickrefRepairPlan(
  options: GlossaryQuickrefRepairOptions
): GlossaryQuickrefRepairPlan {
  const scanResult = scanMarkdownDocuments({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {})
  });

  if (!scanResult.ok) {
    return {
      ok: false,
      write: options.write ?? false,
      checkedDocuments: 0,
      referencedTermCount: 0,
      existingQuickrefTermCount: 0,
      missingQuickrefTermCount: 0,
      actions: [],
      messages: [scanResult.reason]
    };
  }

  const documents = scanResult.documents.map((document) => parseMarkdownDocument(document));
  const referencedTerms = collectReferencedGlossaryTerms(documents);
  const canonicalDefinitions = readCanonicalGlossaryDefinitions(options.repoRoot);
  const existingQuickrefTerms = readQuickrefTerms(options.repoRoot);

  const actions: GlossaryQuickrefRepairAction[] = [];

  for (const term of referencedTerms) {
    if (existingQuickrefTerms.has(normalizeTerm(term))) {
      continue;
    }

    const definition = canonicalDefinitions.get(normalizeTerm(term));

    actions.push({
      term,
      definitionSource: definition ? "canonical" : "placeholder",
      description: definition
        ? `Add ${term} to glossary quickref using canonical glossary definition.`
        : `Add ${term} to glossary quickref with placeholder definition requiring follow-up refinement.`
    });
  }

  const plan: GlossaryQuickrefRepairPlan = {
    ok: true,
    write: options.write ?? false,
    checkedDocuments: documents.length,
    referencedTermCount: referencedTerms.length,
    existingQuickrefTermCount: existingQuickrefTerms.size,
    missingQuickrefTermCount: actions.length,
    actions,
    messages: []
  };

  if (options.write ?? false) {
    writeQuickref({
      repoRoot: options.repoRoot,
      referencedTerms,
      canonicalDefinitions
    });
  }

  return plan;
}

export function formatGlossaryQuickrefRepairPlanAsText(
  plan: GlossaryQuickrefRepairPlan
): string {
  const lines: string[] = [];

  if (!plan.ok) {
    lines.push("Glossary quickref repair failed.");

    for (const message of plan.messages) {
      lines.push(`- ${message}`);
    }

    return lines.join("\n");
  }

  lines.push(plan.write ? "Glossary quickref repair applied." : "Glossary quickref repair dry run.");
  lines.push("");
  lines.push(`Checked documents: ${plan.checkedDocuments}`);
  lines.push(`Referenced glossary terms: ${plan.referencedTermCount}`);
  lines.push(`Existing quickref terms: ${plan.existingQuickrefTermCount}`);
  lines.push(`Missing quickref terms: ${plan.missingQuickrefTermCount}`);

  if (plan.actions.length > 0) {
    lines.push("");
    lines.push("Actions:");

    for (const action of plan.actions) {
      lines.push(`- ${action.term}`);
      lines.push(`  source: ${action.definitionSource}`);
      lines.push(`  ${action.description}`);
    }
  }

  if (!plan.write) {
    lines.push("");
    lines.push("No files were written. Re-run with --write to regenerate the quickref.");
  }

  return lines.join("\n");
}

export function formatGlossaryQuickrefRepairPlanAsJson(
  plan: GlossaryQuickrefRepairPlan
): string {
  return JSON.stringify(plan, null, 2);
}

function collectReferencedGlossaryTerms(
  documents: readonly ReturnType<typeof parseMarkdownDocument>[]
): string[] {
  const terms: string[] = [];

  for (const document of documents) {
    const glossaryTerms = getFrontmatterArray(document, "glossaryTerms") ?? [];

    for (const term of glossaryTerms) {
      pushUniqueByNormalizedTerm(terms, term);
    }
  }

  return terms.sort((left, right) => normalizeTerm(left).localeCompare(normalizeTerm(right)));
}

function readCanonicalGlossaryDefinitions(repoRoot: string): ReadonlyMap<string, GlossaryDefinition> {
  const path = join(repoRoot, canonicalGlossaryPath);

  if (!existsSync(path)) {
    return new Map();
  }

  const content = readFileSync(path, "utf8");
  const definitions = new Map<string, GlossaryDefinition>();
  const sections = parseHeadingSections(content);

  for (const section of sections) {
    const normalizedTerm = normalizeTerm(section.term);

    if (!normalizedTerm || isIgnoredHeading(normalizedTerm)) {
      continue;
    }

    definitions.set(normalizedTerm, {
      term: section.term,
      normalizedTerm,
      definition: firstMeaningfulParagraph(section.body) ?? `Definition pending for ${section.term}.`
    });
  }

  return definitions;
}

function readQuickrefTerms(repoRoot: string): ReadonlySet<string> {
  const path = join(repoRoot, quickrefPath);

  if (!existsSync(path)) {
    return new Set();
  }

  const content = readFileSync(path, "utf8");
  const terms = new Set<string>();

  for (const section of parseHeadingSections(content)) {
    const normalizedTerm = normalizeTerm(section.term);

    if (!normalizedTerm || isIgnoredHeading(normalizedTerm)) {
      continue;
    }

    terms.add(normalizedTerm);
  }

  return terms;
}

function writeQuickref(options: {
  readonly repoRoot: string;
  readonly referencedTerms: readonly string[];
  readonly canonicalDefinitions: ReadonlyMap<string, GlossaryDefinition>;
}): void {
  const absolutePath = join(options.repoRoot, quickrefPath);
  const today = new Date().toISOString().slice(0, 10);

  const lines: string[] = [
    "---",
    'title: "Glossary Quickref"',
    'status: "Draft"',
    'owner: "Documentation"',
    `lastUpdated: "${today}"`,
    'governanceLevel: "Informational"',
    'documentType: "Onboarding"',
    "upstream:",
    `  - "${canonicalGlossaryPath}"`,
    "downstream: []",
    "governanceLinks:",
    '  - "docs/governance/documentation-governance.md"',
    "adrLinks: []",
    "glossaryTerms:",
    '  - "Onboarding"',
    '  - "Documentation System"',
    "---",
    "",
    "# Glossary Quickref",
    "",
    "## Purpose",
    "",
    "Provide a concise onboarding reference for glossary terms used across the governed documentation corpus.",
    "",
    "## Terms",
    ""
  ];

  for (const term of options.referencedTerms) {
    const definition = options.canonicalDefinitions.get(normalizeTerm(term));
    lines.push(`## ${term}`);
    lines.push("");
    lines.push(definition?.definition ?? `Definition pending for ${term}.`);
    lines.push("");
  }

  lines.push("## Change History");
  lines.push("");
  lines.push("- Regenerated glossary quickref from governed glossaryTerms references.");
  lines.push("");

  writeFileSync(absolutePath, lines.join("\n"), "utf8");
}

function parseHeadingSections(content: string): Array<{ readonly term: string; readonly body: string }> {
  const body = stripFrontmatter(content);
  const lines = body.split("\n");
  const sections: Array<{ term: string; bodyLines: string[] }> = [];
  let current: { term: string; bodyLines: string[] } | null = null;

  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/);

    if (match?.[1]) {
      if (current) {
        sections.push(current);
      }

      current = {
        term: cleanHeading(match[1]),
        bodyLines: []
      };
      continue;
    }

    if (current) {
      current.bodyLines.push(line);
    }
  }

  if (current) {
    sections.push(current);
  }

  return sections.map((section) => ({
    term: section.term,
    body: section.bodyLines.join("\n").trim()
  }));
}

function stripFrontmatter(content: string): string {
  const normalized = content.replaceAll("\r\n", "\n");

  if (!normalized.startsWith("---\n")) {
    return normalized;
  }

  const end = normalized.indexOf("\n---\n", 4);

  if (end < 0) {
    return normalized;
  }

  return normalized.slice(end + "\n---\n".length);
}

function firstMeaningfulParagraph(body: string): string | null {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .filter((paragraph) => !paragraph.startsWith("|"))
    .filter((paragraph) => !paragraph.startsWith("- "))
    .filter((paragraph) => !paragraph.startsWith("## "));

  return paragraphs[0] ?? null;
}

function cleanHeading(value: string): string {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[:：]\s*$/, "")
    .trim();
}

function normalizeTerm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isIgnoredHeading(normalizedTerm: string): boolean {
  return new Set([
    "purpose",
    "terms",
    "change history",
    "governance links",
    "related documents"
  ]).has(normalizedTerm);
}

function pushUniqueByNormalizedTerm(values: string[], value: string): void {
  const normalized = normalizeTerm(value);

  if (normalized.length === 0) {
    return;
  }

  if (values.some((existing) => normalizeTerm(existing) === normalized)) {
    return;
  }

  values.push(value.trim());
}
''',

    "packages/cli/src/commands/docs/glossary/repair.ts": r'''import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  createGlossaryQuickrefRepairPlan,
  formatGlossaryQuickrefRepairPlanAsJson,
  formatGlossaryQuickrefRepairPlanAsText
} from "../../../docs/glossary-repair.js";

export default class DocsGlossaryRepair extends Command {
  static override summary = "Repair glossary quickref coverage.";

  static override description = `
Repair onboarding glossary quickref coverage from referenced glossaryTerms.

This command is dry-run by default. Pass --write to regenerate
docs/onboarding/glossary-quickref.md.
`;

  static override examples = [
    {
      description: "Preview glossary quickref repair.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Regenerate glossary quickref.",
      command: "<%= config.bin %> <%= command.id %> --write"
    },
    {
      description: "Write a JSON repair plan.",
      command: "<%= config.bin %> <%= command.id %> --json --report-path .artifacts/docs/glossary-repair-plan.json"
    }
  ];

  static override flags = {
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to scan."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the glossary quickref repair plan as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the glossary repair JSON plan."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    }),
    write: Flags.boolean({
      default: false,
      description: "Write glossary quickref repair changes."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsGlossaryRepair);
    const repoRoot = resolve(flags.root);

    const plan = createGlossaryQuickrefRepairPlan({
      repoRoot,
      docsDir: flags["docs-dir"],
      write: flags.write
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatGlossaryQuickrefRepairPlanAsJson(plan)}\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatGlossaryQuickrefRepairPlanAsJson(plan)
        : formatGlossaryQuickrefRepairPlanAsText(plan)
    );

    if (!plan.ok) {
      this.exit(1);
    }
  }
}
''',
}


def patch_index_exports() -> None:
    path = Path("packages/cli/src/docs/index.ts")
    content = path.read_text(encoding="utf-8")

    if 'from "./glossary-repair.js";' not in content:
        marker = '''export {
  formatGlossaryValidationReportAsJson,
  formatGlossaryValidationReportAsText,
  validateGlossary
} from "./glossary-validator.js";'''

        replacement = marker + '''

export {
  createGlossaryQuickrefRepairPlan,
  formatGlossaryQuickrefRepairPlanAsJson,
  formatGlossaryQuickrefRepairPlanAsText
} from "./glossary-repair.js";'''

        content = content.replace(marker, replacement)

    if 'GlossaryQuickrefRepairPlan' not in content:
        marker = '''export type {
  GlossaryReferenceRecord,
  GlossaryTermRecord,
  GlossaryValidationOptions,
  GlossaryValidationReport,
  GlossaryValidationSummary
} from "./glossary-validator.js";'''

        replacement = marker + '''

export type {
  GlossaryQuickrefRepairAction,
  GlossaryQuickrefRepairOptions,
  GlossaryQuickrefRepairPlan
} from "./glossary-repair.js";'''

        content = content.replace(marker, replacement)

    path.write_text(content, encoding="utf-8")
    print(f"patched {path}")


def patch_package_scripts() -> None:
    path = Path("package.json")

    if not path.exists():
        print("skip package.json update: missing")
        return

    data = json.loads(path.read_text(encoding="utf-8"))
    scripts = data.setdefault("scripts", {})

    scripts.setdefault(
        "docs:glossary:repair",
        "bun run foundry:build && node packages/cli/bin/run.js docs glossary repair"
    )
    scripts.setdefault(
        "docs:glossary:repair:write",
        "bun run foundry:build && node packages/cli/bin/run.js docs glossary repair --write"
    )

    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"patched {path}")


def main() -> int:
    for file_name, content in FILES.items():
        path = Path(file_name)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        print(f"wrote {path}")

    patch_index_exports()
    patch_package_scripts()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
