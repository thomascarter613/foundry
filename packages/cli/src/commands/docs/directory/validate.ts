import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  formatDirectoryValidationReportAsJson,
  formatDirectoryValidationReportAsText,
  validateDirectoryTopology
} from "../../../docs/directory-validator.js";

export default class DocsDirectoryValidate extends Command {
  static override summary = "Validate documentation directory topology.";

  static override description = `
Validate the filesystem topology of the governed documentation corpus.

This command checks canonical docs directories, required index files, legacy
paths, ADR placement, diagram placement, hidden entries, and root-level Markdown
placement.
`;

  static override examples = [
    {
      description: "Validate documentation directory topology in bootstrap mode.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Validate documentation directory topology strictly.",
      command: "<%= config.bin %> <%= command.id %> --strict --fail-on-warnings"
    },
    {
      description: "Write a JSON directory validation report.",
      command: "<%= config.bin %> <%= command.id %> --json --report-path .artifacts/docs/directory-validation-report.json"
    }
  ];

  static override flags = {
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to validate."
    }),
    "fail-on-warnings": Flags.boolean({
      default: false,
      description: "Exit non-zero when warnings are present."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the directory validation report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the directory validation JSON report."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    }),
    strict: Flags.boolean({
      default: false,
      description: "Treat legacy and topology warnings as errors where appropriate."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsDirectoryValidate);
    const repoRoot = resolve(flags.root);

    const report = validateDirectoryTopology({
      repoRoot,
      docsDir: flags["docs-dir"],
      strict: flags.strict,
      failOnWarnings: flags["fail-on-warnings"]
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatDirectoryValidationReportAsJson(report)}\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatDirectoryValidationReportAsJson(report)
        : formatDirectoryValidationReportAsText(report)
    );

    if (!report.ok) {
      this.exit(1);
    }
  }
}
