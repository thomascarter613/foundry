import { Command, Flags } from "@oclif/core";
import { resolve } from "node:path";

import {
  createEvolvePlanReport,
  formatEvolvePlanReportAsJson,
  formatEvolvePlanReportAsText,
  writeEvolvePlanReport
} from "../shared/evolve-plan.js";
import {
  createRepositorySurfaceReport,
  formatRepositorySurfaceReportAsJson,
  formatRepositorySurfaceReportAsText,
  writeRepositorySurfaceReport
} from "../shared/repo-surface.js";

export default class Evolve extends Command {
  static override readonly summary =
    "Inspect the current repository for future Foundry evolution support.";

  static override readonly description = `
Inspect the current repository and report the current evolve command surface.

By default, this command prints a read-only repository inspection report.
Use --plan to print a deterministic read-only evolution plan.
`;

  static override readonly examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> --json",
    "<%= config.bin %> <%= command.id %> --plan",
    "<%= config.bin %> <%= command.id %> --plan --json",
    "<%= config.bin %> <%= command.id %> --plan --json --report-path .artifacts/foundry/evolve/plan.json"
  ];

  static override readonly flags = {
    json: Flags.boolean({
      default: false,
      description: "Print the report as JSON."
    }),
    plan: Flags.boolean({
      default: false,
      description: "Print a read-only evolution plan instead of only inspection details."
    }),
    "report-path": Flags.string({
      description: "Optional path to write the JSON report."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root to inspect."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Evolve);

    const surfaceReport = createRepositorySurfaceReport({
      command: "evolve",
      repoRoot: resolve(flags.root)
    });

    if (flags.plan) {
      const planReport = createEvolvePlanReport(surfaceReport);

      if (flags["report-path"]) {
        writeEvolvePlanReport({
          report: planReport,
          reportPath: flags["report-path"]
        });
      }

      this.log(
        flags.json
          ? formatEvolvePlanReportAsJson(planReport)
          : formatEvolvePlanReportAsText(planReport)
      );

      return;
    }

    if (flags["report-path"]) {
      writeRepositorySurfaceReport({
        report: surfaceReport,
        reportPath: flags["report-path"]
      });
    }

    this.log(
      flags.json
        ? formatRepositorySurfaceReportAsJson(surfaceReport)
        : formatRepositorySurfaceReportAsText(surfaceReport)
    );
  }
}
