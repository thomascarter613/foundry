import { parseMarkdownDocument } from "./frontmatter.js";
import { createValidationReport } from "./reporter.js";
import { scanMarkdownDocuments } from "./scanner.js";
import type { DocsEngineOptions, DocsValidationReport, DocumentValidationResult } from "./types.js";
import { validateParsedDocument } from "./validator.js";

export function runDocsValidation(options: DocsEngineOptions): DocsValidationReport {
  const scanResult = scanMarkdownDocuments({
    repoRoot: options.repoRoot,
    ...(options.docsDir ? { docsDir: options.docsDir } : {})
  });

  if (!scanResult.ok) {
    const result: DocumentValidationResult = {
      path: options.docsDir ?? "docs",
      issues: [
        {
          severity: "error",
          code: "docs.scanFailed",
          message: scanResult.reason,
          path: options.docsDir ?? "docs"
        }
      ]
    };

    return createValidationReport([result], options.failOnWarnings ?? false);
  }

  const documentResults = scanResult.documents.map((source) =>
    validateParsedDocument(parseMarkdownDocument(source), {
      strictDirectoryTypes: false
    })
  );

  return createValidationReport(documentResults, options.failOnWarnings ?? false);
}
