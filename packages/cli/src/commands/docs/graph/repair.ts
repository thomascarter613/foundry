import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  createGraphRepairPlan,
  formatGraphRepairPlanAsJson,
  formatGraphRepairPlanAsText
} from "../../../docs/graph-repair.js";

export default class DocsGraphRepair extends Command {
  static override summary = "Repair documentation graph relationship metadata.";

  static override description = `
Repair graph-related frontmatter relationship metadata.

This command removes self-referencing ADR links, normalizes ADR targets,
de-duplicates relationship arrays, and replaces stale documentation references.
It is dry-run by default. Pass --write to update Markdown files.
`;

  static override examples = [
    {
      description: "Preview graph relationship repair actions.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Apply graph relationship repairs.",
      command: "<%= config.bin %> <%= command.id %> --write"
    },
    {
      description: "Write a JSON graph repair plan.",
      command: "<%= config.bin %> <%= command.id %> --json --report-path .artifacts/docs/graph-repair-plan.json"
    }
  ];

  static override flags = {
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to repair."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the graph repair plan as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the graph repair JSON plan."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    }),
    write: Flags.boolean({
      default: false,
      description: "Write graph relationship repairs to Markdown files."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsGraphRepair);
    const repoRoot = resolve(flags.root);

    const plan = createGraphRepairPlan({
      repoRoot,
      docsDir: flags["docs-dir"],
      write: flags.write
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatGraphRepairPlanAsJson(plan)}\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatGraphRepairPlanAsJson(plan)
        : formatGraphRepairPlanAsText(plan)
    );

    if (!plan.ok) {
      this.exit(1);
    }
  }
}
