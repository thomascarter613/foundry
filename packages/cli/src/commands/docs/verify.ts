import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  createDocsVerificationArtifacts,
  formatDocsVerificationPipelineReportAsJson,
  formatDocsVerificationPipelineReportAsText,
  runDocsVerificationPipeline
} from "../../docs/index.js";

export default class DocsVerify extends Command {
  static override summary = "Run the full documentation verification pipeline.";

  static override description = `
Run directory topology validation, metadata validation, graph construction,
graph validation, ADR validation, glossary validation, ChangePlan validation,
and Work Packet validation as one governed documentation verification pipeline.

The command writes machine-readable artifacts by default under .artifacts/docs.
`;

  static override examples = [
    {
      description: "Run bootstrap-mode docs verification.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Run strict docs verification.",
      command: "<%= config.bin %> <%= command.id %> --strict"
    },
    {
      description: "Run docs verification and print JSON.",
      command: "<%= config.bin %> <%= command.id %> --json"
    },
    {
      description: "Write artifacts under a custom directory.",
      command: "<%= config.bin %> <%= command.id %> --artifacts-dir .artifacts/docs"
    }
  ];

  static override flags = {
    "artifacts-dir": Flags.string({
      default: ".artifacts/docs",
      description: "Repository-relative artifact directory for JSON reports."
    }),
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to verify."
    }),
    "fail-on-warnings": Flags.boolean({
      default: false,
      description: "Exit non-zero when warnings are present."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the full verification pipeline report as JSON."
    }),
    "no-artifacts": Flags.boolean({
      default: false,
      description: "Do not write JSON report artifacts."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    }),
    strict: Flags.boolean({
      default: false,
      description: "Enable strict directory, graph, ADR, glossary, ChangePlan, and Work Packet checks."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsVerify);
    const repoRoot = resolve(flags.root);
    const failOnWarnings = flags["fail-on-warnings"] || flags.strict;

    const report = runDocsVerificationPipeline({
      repoRoot,
      docsDir: flags["docs-dir"],
      failOnWarnings,
      directory: {
        strict: flags.strict,
        failOnWarnings
      },
      graph: {
        includeOrphanWarnings: flags.strict,
        requireReciprocalLinks: flags.strict,
        failOnWarnings
      },
      adr: {
        strictIndex: flags.strict,
        failOnWarnings
      },
      glossary: {
        requireQuickrefCoverage: flags.strict,
        failOnWarnings
      },
      changeplans: {
        strictIndex: flags.strict,
        strictPlacement: flags.strict,
        failOnWarnings
      },
      workPackets: {
        strictIndex: flags.strict,
        strictPlacement: flags.strict,
        failOnWarnings
      }
    });

    if (!flags["no-artifacts"]) {
      const artifactsDir = resolve(repoRoot, flags["artifacts-dir"]);
      mkdirSync(artifactsDir, { recursive: true });

      const artifacts = createDocsVerificationArtifacts(report);

      for (const [fileName, content] of Object.entries(artifacts)) {
        writeFileSync(join(artifactsDir, fileName), `${content}\n`, "utf8");
      }
    }

    this.log(
      flags.json
        ? formatDocsVerificationPipelineReportAsJson(report)
        : formatDocsVerificationPipelineReportAsText(report)
    );

    if (!flags["no-artifacts"]) {
      this.log("");
      this.log("Documentation verification artifacts written:");
      this.log(`- ${flags["artifacts-dir"]}/directory-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/graph.json`);
      this.log(`- ${flags["artifacts-dir"]}/graph-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/adr-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/glossary-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/changeplan-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/work-packet-validation-report.json`);
      this.log(`- ${flags["artifacts-dir"]}/verification-pipeline-report.json`);
    }

    if (!report.ok) {
      this.exit(1);
    }
  }
}
