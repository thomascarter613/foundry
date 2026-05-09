import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { parseMarkdownDocument } from "../../../docs/frontmatter.js";
import { buildDocsGraph } from "../../../docs/graph.js";
import {
  formatGraphValidationReportAsJson,
  formatGraphValidationReportAsText,
  validateDocsGraph
} from "../../../docs/graph-validator.js";
import { scanMarkdownDocuments } from "../../../docs/scanner.js";

export default class DocsGraphValidate extends Command {
  static override summary = "Validate the documentation knowledge graph.";

  static override description = `
Build and validate the documentation knowledge graph.

This command validates graph-level integrity after the docs corpus has been
scanned and parsed. It is intentionally read-only.
`;

  static override examples = [
    {
      description: "Validate the documentation graph.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Validate the documentation graph and print JSON.",
      command: "<%= config.bin %> <%= command.id %> --json"
    },
    {
      description: "Validate the graph and write a report artifact.",
      command: "<%= config.bin %> <%= command.id %> --report-path .artifacts/docs/graph-validation-report.json"
    }
  ];

  static override flags = {
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to scan."
    }),
    "fail-on-warnings": Flags.boolean({
      default: false,
      description: "Exit non-zero when graph warnings are present."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the graph validation report as JSON."
    }),
    "report-path": Flags.string({
      description: "Optional repository-relative path to write the graph validation JSON report."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    }),
    "skip-orphan-warnings": Flags.boolean({
      default: false,
      description: "Do not warn about document nodes with no graph edges."
    }),
    "skip-reciprocal-warnings": Flags.boolean({
      default: false,
      description: "Do not warn about missing reciprocal Upstream/Downstream edges."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsGraphValidate);
    const repoRoot = resolve(flags.root);

    const scanResult = scanMarkdownDocuments({
      repoRoot,
      docsDir: flags["docs-dir"]
    });

    if (!scanResult.ok) {
      this.error(scanResult.reason, { exit: 1 });
    }

    const parsedDocuments = scanResult.documents.map((document) => parseMarkdownDocument(document));
    const buildResult = buildDocsGraph(parsedDocuments);
    const validationReport = validateDocsGraph(buildResult.graph, buildResult.issues, {
      includeOrphanWarnings: !flags["skip-orphan-warnings"],
      requireReciprocalLinks: !flags["skip-reciprocal-warnings"],
      failOnWarnings: flags["fail-on-warnings"]
    });

    if (flags["report-path"]) {
      const reportPath = resolve(repoRoot, flags["report-path"]);
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${formatGraphValidationReportAsJson(validationReport)}\n`, "utf8");
    }

    this.log(
      flags.json
        ? formatGraphValidationReportAsJson(validationReport)
        : formatGraphValidationReportAsText(validationReport)
    );

    if (!validationReport.ok) {
      this.exit(1);
    }
  }
}
