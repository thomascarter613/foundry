import type {
  DocsValidationIssue,
  DocsValidationReport,
  DocsValidationSummary,
  DocumentValidationResult
} from "./types.js";

export function createValidationReport(
  documents: readonly DocumentValidationResult[],
  failOnWarnings = false
): DocsValidationReport {
  const issues = documents.flatMap((document) => [...document.issues]);
  const summary = summarizeIssues(documents.length, issues);
  const ok = summary.errorCount === 0 && (!failOnWarnings || summary.warningCount === 0);

  return {
    ok,
    summary,
    documents,
    issues
  };
}

export function formatValidationReportAsText(report: DocsValidationReport): string {
  const lines: string[] = [];

  if (report.ok) {
    lines.push("Docs verification passed.");
    lines.push(`Checked ${report.summary.checkedDocuments} Markdown file(s).`);
    lines.push(`${report.summary.warningCount} warning(s) found.`);

    return lines.join("\n");
  }

  lines.push("Docs verification failed.");
  lines.push("");

  for (const issue of report.issues) {
    lines.push(`- ${issue.path}: ${issue.message}`);
  }

  lines.push("");
  lines.push(`Checked ${report.summary.checkedDocuments} Markdown file(s).`);
  lines.push(`${report.summary.errorCount} error(s) found.`);
  lines.push(`${report.summary.warningCount} warning(s) found.`);

  return lines.join("\n");
}

export function formatValidationReportAsJson(report: DocsValidationReport): string {
  return JSON.stringify(report, null, 2);
}

function summarizeIssues(
  checkedDocuments: number,
  issues: readonly DocsValidationIssue[]
): DocsValidationSummary {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const issue of issues) {
    if (issue.severity === "error") {
      errorCount += 1;
      continue;
    }

    if (issue.severity === "warning") {
      warningCount += 1;
      continue;
    }

    infoCount += 1;
  }

  return {
    checkedDocuments,
    errorCount,
    warningCount,
    infoCount
  };
}
