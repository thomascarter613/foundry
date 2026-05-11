import { Command, Flags } from "@oclif/core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { parseMarkdownDocument } from "../../docs/frontmatter.js";
import {
  buildDocsGraph,
  summarizeDocsGraph
} from "../../docs/graph.js";
import { scanMarkdownDocuments } from "../../docs/scanner.js";

export default class DocsGraph extends Command {
  static override summary = "Build the documentation knowledge graph.";

  static override description = `
Scan and parse the governed documentation corpus, then construct the first
documentation knowledge graph from frontmatter metadata.

This command is intentionally read-only. It emits a graph summary by default,
or a machine-readable JSON graph when --json or --output is used.
`;

  static override examples = [
    {
      description: "Build the documentation graph and print a summary.",
      command: "<%= config.bin %> <%= command.id %>"
    },
    {
      description: "Build the documentation graph and print JSON.",
      command: "<%= config.bin %> <%= command.id %> --json"
    },
    {
      description: "Build the documentation graph and write JSON to disk.",
      command: "<%= config.bin %> <%= command.id %> --output .artifacts/docs/graph.json"
    }
  ];

  static override flags = {
    "docs-dir": Flags.string({
      default: "docs",
      description: "Repository-relative docs directory to scan."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the graph as JSON."
    }),
    output: Flags.string({
      description: "Optional repository-relative path to write the graph JSON."
    }),
    root: Flags.string({
      default: process.cwd(),
      description: "Repository root."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DocsGraph);
    const repoRoot = resolve(flags.root);

    const scanResult = scanMarkdownDocuments({
      repoRoot,
      docsDir: flags["docs-dir"]
    });

    if (!scanResult.ok) {
      this.error(scanResult.reason, { exit: 1 });
    }

    const parsedDocuments = scanResult.documents.map((document) => parseMarkdownDocument(document));
    const graphResult = buildDocsGraph(parsedDocuments);
    const graphPayload = {
      graph: graphResult.graph,
      issues: graphResult.issues
    };

    if (flags.output) {
      const outputPath = resolve(repoRoot, flags.output);
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, `${JSON.stringify(graphPayload, null, 2)}\n`, "utf8");
    }

    if (flags.json) {
      this.log(JSON.stringify(graphPayload, null, 2));
      return;
    }

    this.log(summarizeDocsGraph(graphResult.graph));

    if (graphResult.issues.length > 0) {
      this.log("");
      this.log("Graph warnings:");

      for (const issue of graphResult.issues) {
        this.log(`- ${issue.path}: ${issue.message}`);
      }
    }

    if (flags.output) {
      this.log("");
      this.log(`Graph JSON written to ${flags.output}`);
    }
  }
}
