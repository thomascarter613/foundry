import { Command, Flags } from "@oclif/core";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  formatValidationReportAsJson,
  formatValidationReportAsText,
  runDocsValidation
} from "../../docs/index.js";

export default class DocsValidate extends Command {
  static override summary = "Validate the governed documentation corpus.";

  static override description = `
Scan, parse, validate, and report on the repository documentation corpus.

This is the first docs-engine slice. It validates Markdown discovery,
YAML frontmatter parsing, governed metadata fields, enum values,
document type placement warnings, forbidden citation artifacts, and merge
conflict markers.
`;

  static override examples = [
    {
      description: "Validate docs with human-readable output.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Validate docs and print JSON.",
      command: "<%= config.bin %> <%= command.id %> --json"
    },
    {
      description: "Validate docs and write a JSON report.",
      command: "<%= config.bin %> <%= command.id %> --report-path .artifacts/docs/validation-report.json"
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
      description: "Print the validation report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional path to write a JSON validation report."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsValidate);
    const repoRoot = resolve(flags.root);

    const report = runDocsValidation({
      repoRoot,
      docsDir: flags["docs-dir"],
      failOnWarnings: flags["fail-on-warnings"]
    });

    if (flags["report-path"]) {
      writeFileSync(resolve(repoRoot, flags["report-path"]), formatValidationReportAsJson(report));
    }

    this.log(flags.json ? formatValidationReportAsJson(report) : formatValidationReportAsText(report));

    if (!report.ok) {
      this.exit(1);
    }
  }
}
