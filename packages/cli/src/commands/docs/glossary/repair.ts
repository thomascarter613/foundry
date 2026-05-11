import { Command, Flags } from "@oclif/core";
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
