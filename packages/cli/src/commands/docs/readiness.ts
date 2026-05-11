import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  assessDocsReadiness,
  formatDocsReadinessReportAsJson,
  formatDocsReadinessReportAsText
} from "../../docs/readiness.js";

export default class DocsReadiness extends Command {
  static override summary = "Assess documentation strict-mode readiness.";

  static override description = `
Assess whether the governed documentation system is ready to move from
bootstrap-mode validation to strict-mode enforcement.

This command is read-only. It summarizes directory, metadata, graph, ADR, and
glossary validation into a weighted readiness score.
`;

  static override examples = [
    {
      description: "Assess documentation strict-mode readiness.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Print readiness as JSON.",
      command: "<%= config.bin %> <%= command.id %> --json"
    },
    {
      description: "Write a readiness report artifact.",
      command: "<%= config.bin %> <%= command.id %> --report-path .artifacts/docs/readiness-report.json"
    }
  ];

  static override flags = {
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to assess."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the readiness report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the readiness JSON report."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsReadiness);
    const repoRoot = resolve(flags.root);

    const report = assessDocsReadiness({
      repoRoot,
      docsDir: flags["docs-dir"]
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatDocsReadinessReportAsJson(report)}\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatDocsReadinessReportAsJson(report)
        : formatDocsReadinessReportAsText(report)
    );

    if (report.status === "blocked") {
      this.exit(1);
    }
  }
}
