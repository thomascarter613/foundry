import { Command, Flags } from "@oclif/core";
import { resolve } from "node:path";

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

This command is intentionally read-only in this slice. Future slices will add
evolution planning and governed application behavior.
`;

  static override readonly examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> --json",
    "<%= config.bin %> <%= command.id %> --report-path .artifacts/foundry/evolve/report.json"
  ];

  static override readonly flags = {
    json: Flags.boolean({
      default: false,
      description: "Print the diagnostic report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional path to write the diagnostic JSON report."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root to inspect."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Evolve);

    const report = createRepositorySurfaceReport({
      command: "evolve",
      repoRoot: resolve(flags.root)
    });

    if (flags["report-path"]) {
      writeRepositorySurfaceReport({
        report,
        reportPath: flags["report-path"]
      });
    }

    this.log(
      flags.json
        ? formatRepositorySurfaceReportAsJson(report)
        : formatRepositorySurfaceReportAsText(report)
    );
  }
}
