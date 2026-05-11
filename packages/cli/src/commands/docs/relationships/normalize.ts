import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  formatRelationshipNormalizationPlanAsJson,
  formatRelationshipNormalizationPlanAsText,
  normalizeDocsRelationships
} from "../../../docs/relationship-normalizer.js";

export default class DocsRelationshipsNormalize extends Command {
  static override summary = "Normalize documentation relationship metadata.";

  static override description = `
Infer and normalize frontmatter relationship fields across the governed
documentation corpus.

This command populates upstream, downstream, governanceLinks, adrLinks, and
glossaryTerms. It runs as a dry run by default. Pass --write to update files.
`;

  static override examples = [
    {
      description: "Preview relationship normalization changes.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Apply relationship normalization changes.",
      command: "<%= config.bin %> <%= command.id %> --write"
    },
    {
      description: "Write a JSON normalization plan.",
      command: "<%= config.bin %> <%= command.id %> --json --report-path .artifacts/docs/relationship-normalization-plan.json"
    }
  ];

  static override flags = {
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to scan."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the normalization plan as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the normalization plan JSON."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    }),
    write: Flags.boolean({
      default: false,
      description: "Write normalized frontmatter back to Markdown files."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsRelationshipsNormalize);
    const repoRoot = resolve(flags.root);

    const plan = normalizeDocsRelationships({
      repoRoot,
      docsDir: flags["docs-dir"],
      write: flags.write
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatRelationshipNormalizationPlanAsJson(plan)}\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatRelationshipNormalizationPlanAsJson(plan)
        : formatRelationshipNormalizationPlanAsText(plan)
    );

    if (!plan.ok) {
      this.exit(1);
    }
  }
}
