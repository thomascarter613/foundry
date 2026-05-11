import {
  formatValidationReportAsText,
  runDocsValidation
} from "../../packages/cli/src/docs/index.ts";

const report = runDocsValidation({
  repoRoot: process.cwd(),
  docsDir: "docs"
});

console.log(formatValidationReportAsText(report));

if (!report.ok) {
  process.exit(1);
}
