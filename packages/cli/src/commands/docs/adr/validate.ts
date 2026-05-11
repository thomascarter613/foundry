import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  formatAdrValidationReportAsJson,
  formatAdrValidationReportAsText,
  validateAdrIndex
} from "../../../docs/adr-validator.js";

export default class DocsAdrValidate extends Command {
  static override summary = "Validate ADR files and ADR indexes.";

  static override description = `
Validate Architecture Decision Records across docs/architecture/adr and docs/adr.

This command checks ADR numbering, duplicate ADR numbers, filename consistency,
ADR index entries, and index/file status consistency.
`;

  static override examples = [
    {
      description: "Validate ADRs in bootstrap mode.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Validate ADRs with strict index enforcement.",
      command: "<%= config.bin %> <%= command.id %> --strict-index --fail-on-warnings"
    },
    {
      description: "Write an ADR validation JSON report.",
      command: "<%= config.bin %> <%= command.id %> --json --report-path .artifacts/docs/adr-validation-report.json"
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
      description: "Print the ADR validation report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the ADR validation JSON report."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    }),
    "strict-index": Flags.boolean({
      default: false,
      description: "Treat ADR index coverage issues as errors instead of warnings."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsAdrValidate);
    const repoRoot = resolve(flags.root);

    const report = validateAdrIndex({
      repoRoot,
      docsDir: flags["docs-dir"],
      strictIndex: flags["strict-index"],
      failOnWarnings: flags["fail-on-warnings"]
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatAdrValidationReportAsJson(report)}\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatAdrValidationReportAsJson(report)
        : formatAdrValidationReportAsText(report)
    );

    if (!report.ok) {
      this.exit(1);
    }
  }
}
