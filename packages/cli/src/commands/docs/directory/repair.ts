import { Command, Flags } from "@oclif/core";
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
      writeFileSync(reportPath, `${formatDirectoryRepairPlanAsJson(plan)}\n`, "utf8");
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
