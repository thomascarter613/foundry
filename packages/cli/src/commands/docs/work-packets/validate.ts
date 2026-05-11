import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  formatWorkPacketValidationReportAsJson,
  formatWorkPacketValidationReportAsText,
  validateWorkPackets
} from "../../../docs/work-packet-validator.js";

export default class DocsWorkPacketsValidate extends Command {
  static override summary = "Validate documentation Work Packets.";

  static override description = `
Validate governed Work Packet documents under docs/work-packets and legacy
planning WP files under docs/planning.

This command checks WP numbering, duplicate WP numbers, index coverage, status
metadata, and canonical placement.
`;

  static override examples = [
    {
      description: "Validate Work Packets in bootstrap mode.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Validate Work Packets strictly.",
      command: "<%= config.bin %> <%= command.id %> --strict-index --strict-placement --fail-on-warnings"
    },
    {
      description: "Write a JSON Work Packet validation report.",
      command: "<%= config.bin %> <%= command.id %> --json --report-path .artifacts/docs/work-packet-validation-report.json"
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
      description: "Print the Work Packet validation report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the Work Packet validation JSON report."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    }),
    "strict-index": Flags.boolean({
      default: false,
      description: "Treat Work Packet index coverage issues as errors."
    }),
    "strict-placement": Flags.boolean({
      default: false,
      description: "Treat legacy Work Packet placement issues as errors."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsWorkPacketsValidate);
    const repoRoot = resolve(flags.root);

    const report = validateWorkPackets({
      repoRoot,
      docsDir: flags["docs-dir"],
      strictIndex: flags["strict-index"],
      strictPlacement: flags["strict-placement"],
      failOnWarnings: flags["fail-on-warnings"]
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatWorkPacketValidationReportAsJson(report)}\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatWorkPacketValidationReportAsJson(report)
        : formatWorkPacketValidationReportAsText(report)
    );

    if (!report.ok) {
      this.exit(1);
    }
  }
}
