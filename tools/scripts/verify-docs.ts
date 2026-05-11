import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  createDocsVerificationArtifacts,
  formatDocsVerificationPipelineReportAsText,
  runDocsVerificationPipeline
} from "../../packages/cli/src/docs/index.ts";

const repoRoot = process.cwd();
const artifactsDir = join(repoRoot, ".artifacts", "docs");

const report = runDocsVerificationPipeline({
  repoRoot,
  docsDir: "docs",
  directory: {
    strict: false,
    failOnWarnings: false
  },
  graph: {
    includeOrphanWarnings: false,
    requireReciprocalLinks: false,
    failOnWarnings: false
  },
  adr: {
    strictIndex: false,
    failOnWarnings: false
  },
  glossary: {
    requireQuickrefCoverage: false,
    failOnWarnings: false
  },
  changeplans: {
    strictIndex: false,
    strictPlacement: false,
    failOnWarnings: false
  },
  workPackets: {
    strictIndex: false,
    strictPlacement: false,
    failOnWarnings: false
  }
});

mkdirSync(artifactsDir, { recursive: true });

const artifacts = createDocsVerificationArtifacts(report);

for (const [fileName, content] of Object.entries(artifacts)) {
  writeFileSync(join(artifactsDir, fileName), `${content}\n`, "utf8");
}

console.log(formatDocsVerificationPipelineReportAsText(report));
console.log("");
console.log("Documentation verification artifacts written:");
console.log("- .artifacts/docs/directory-validation-report.json");
console.log("- .artifacts/docs/validation-report.json");
console.log("- .artifacts/docs/graph.json");
console.log("- .artifacts/docs/graph-validation-report.json");
console.log("- .artifacts/docs/adr-validation-report.json");
console.log("- .artifacts/docs/glossary-validation-report.json");
console.log("- .artifacts/docs/changeplan-validation-report.json");
console.log("- .artifacts/docs/work-packet-validation-report.json");
console.log("- .artifacts/docs/verification-pipeline-report.json");

if (!report.ok) {
  process.exit(1);
}
