import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  formatGlossaryValidationReportAsJson,
  formatGlossaryValidationReportAsText,
  validateGlossary
} from "../../../docs/glossary-validator.js";

export default class DocsGlossaryValidate extends Command {
  static override summary = "Validate glossary terms and glossary references.";

  static override description = `
Validate the canonical glossary, onboarding quickref, and glossaryTerms
frontmatter references across the governed documentation corpus.
`;

  static override examples = [
    {
      description: "Validate glossary references in bootstrap mode.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Validate glossary references and fail on warnings.",
      command: "<%= config.bin %> <%= command.id %> --fail-on-warnings"
    },
    {
      description: "Validate glossary quickref coverage.",
      command: "<%= config.bin %> <%= command.id %> --require-quickref-coverage"
    },
    {
      description: "Write a JSON glossary validation report.",
      command: "<%= config.bin %> <%= command.id %> --json --report-path .artifacts/docs/glossary-validation-report.json"
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
      description: "Print the glossary validation report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the glossary validation JSON report."
    }),
    "require-quickref-coverage": Flags.boolean({
      default: false,
      description: "Warn when referenced glossary terms are missing from onboarding quickref."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsGlossaryValidate);
    const repoRoot = resolve(flags.root);

    const report = validateGlossary({
      repoRoot,
      docsDir: flags["docs-dir"],
      failOnWarnings: flags["fail-on-warnings"],
      requireQuickrefCoverage: flags["require-quickref-coverage"]
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatGlossaryValidationReportAsJson(report)}\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatGlossaryValidationReportAsJson(report)
        : formatGlossaryValidationReportAsText(report)
    );

    if (!report.ok) {
      this.exit(1);
    }
  }
}
