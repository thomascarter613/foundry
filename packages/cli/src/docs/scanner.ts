import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import type { MarkdownDocumentSource } from "./types.js";

export type ScanDocsOptions = {
  readonly repoRoot: string;
  readonly docsDir?: string;
};

export type ScanDocsResult =
  | {
      readonly ok: true;
      readonly docsRoot: string;
      readonly documents: readonly MarkdownDocumentSource[];
    }
  | {
      readonly ok: false;
      readonly docsRoot: string;
      readonly reason: string;
    };

export function scanMarkdownDocuments(options: ScanDocsOptions): ScanDocsResult {
  const docsRoot = join(options.repoRoot, options.docsDir ?? "docs");

  if (!existsSync(docsRoot)) {
    return {
      ok: false,
      docsRoot,
      reason: "Missing docs/ directory."
    };
  }

  if (!statSync(docsRoot).isDirectory()) {
    return {
      ok: false,
      docsRoot,
      reason: "docs exists but is not a directory."
    };
  }

  const documents = walkMarkdownFiles(docsRoot)
    .sort()
    .map((absolutePath) => ({
      absolutePath,
      relativePath: relative(options.repoRoot, absolutePath).replaceAll("\\", "/"),
      content: readFileSync(absolutePath, "utf8")
    }));

  return {
    ok: true,
    docsRoot,
    documents
  };
}

function walkMarkdownFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return walkMarkdownFiles(absolutePath);
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      return [absolutePath];
    }

    return [];
  });
}
