import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  formatChangePlanValidationReportAsJson,
  formatChangePlanValidationReportAsText,
  validateChangePlans
} from "../../../docs/changeplan-validator.js";

export default class DocsChangeplansValidate extends Command {
  static override summary = "Validate documentation ChangePlans.";

  static override description = `
Validate governed ChangePlan documents under docs/changeplans and legacy
planning CP files under docs/planning.

This command checks CP numbering, duplicate CP numbers, index coverage, status
metadata, and canonical placement.
`;

  static override examples = [
    {
      description: "Validate ChangePlans in bootstrap mode.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Validate ChangePlans strictly.",
      command: "<%= config.bin %> <%= command.id %> --strict-index --strict-placement --fail-on-warnings"
    },
    {
      description: "Write a JSON ChangePlan validation report.",
      command: "<%= config.bin %> <%= command.id %> --json --report-path .artifacts/docs/changeplan-validation-report.json"
    }
  ];

  static override flags = {
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to scan."
    }),
    "fail-on-warnings": Flags.boolean({
      default: false,
      description: "Exit non-zero when warnings are present."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the ChangePlan validation report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the ChangePlan validation JSON report."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    }),
    "strict-index": Flags.boolean({
      default: false,
      description: "Treat ChangePlan index coverage issues as errors."
    }),
    "strict-placement": Flags.boolean({
      default: false,
      description: "Treat legacy ChangePlan placement issues as errors."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsChangeplansValidate);
    const repoRoot = resolve(flags.root);

    const report = validateChangePlans({
      repoRoot,
      docsDir: flags["docs-dir"],
      strictIndex: flags["strict-index"],
      strictPlacement: flags["strict-placement"],
      failOnWarnings: flags["fail-on-warnings"]
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatChangePlanValidationReportAsJson(report)}\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatChangePlanValidationReportAsJson(report)
        : formatChangePlanValidationReportAsText(report)
    );

    if (!report.ok) {
      this.exit(1);
    }
  }
}
