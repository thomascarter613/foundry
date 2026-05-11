#!/usr/bin/env python3
from pathlib import Path

content = r'''import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import type { DocsValidationIssue } from "./types.js";

export type DirectoryValidationOptions = {
  readonly repoRoot: string;
  readonly docsDir?: string;
  readonly strict?: boolean;
  readonly failOnWarnings?: boolean;
};

export type DirectoryValidationSummary = {
  readonly checkedDirectories: number;
  readonly checkedFiles: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
};

export type DirectoryValidationReport = {
  readonly ok: boolean;
  readonly summary: DirectoryValidationSummary;
  readonly issues: readonly DocsValidationIssue[];
};

const canonicalDirectories = [
  "docs/planning",
  "docs/governance",
  "docs/architecture",
  "docs/architecture/adr",
  "docs/architecture/diagrams",
  "docs/changeplans",
  "docs/work-packets",
  "docs/lifecycle",
  "docs/standards",
  "docs/platform",
  "docs/onboarding"
] as const;

const requiredIndexFiles = [
  "docs/index.md",
  "docs/planning/index.md",
  "docs/governance/index.md",
  "docs/architecture/index.md",
  "docs/architecture/adr/index.md",
  "docs/changeplans/index.md",
  "docs/work-packets/index.md",
  "docs/lifecycle/index.md",
  "docs/standards/index.md",
  "docs/platform/index.md",
  "docs/onboarding/index.md"
] as const;

const acceptedLegacyDirectories = new Set([
  "docs/.ideas",
  "docs/adr",
  "docs/product",
  "docs/scaffolding"
]);

const allowedLegacyDirectories = new Set([
  "docs/.ideas",
  "docs/adr",
  "docs/product",
  "docs/scaffolding"
]);

const allowedTopLevelDirectories = new Set([
  ...canonicalDirectories
    .filter((directory) => directory.split("/").length === 2)
    .map((directory) => directory),
  ...allowedLegacyDirectories
]);

const allowedDocsRootMarkdownFiles = new Set([
  "docs/index.md",
  "docs/README.md",
  "docs/ci-constitutional-pipeline.md"
]);

const diagramExtensions = new Set([
  ".drawio",
  ".mmd",
  ".mermaid",
  ".puml",
  ".plantuml",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp"
]);

export function validateDirectoryTopology(
  options: DirectoryValidationOptions
): DirectoryValidationReport {
  const docsDir = options.docsDir ?? "docs";
  const docsRoot = join(options.repoRoot, docsDir);
  const issues: DocsValidationIssue[] = [];

  if (!existsSync(docsRoot)) {
    issues.push(createIssue({
      severity: "error",
      code: "directory.docsRootMissing",
      message: `missing docs root: ${docsDir}`,
      path: docsDir
    }));

    return createDirectoryValidationReport({
      checkedDirectories: 0,
      checkedFiles: 0,
      issues,
      failOnWarnings: options.failOnWarnings ?? false
    });
  }

  if (!statSync(docsRoot).isDirectory()) {
    issues.push(createIssue({
      severity: "error",
      code: "directory.docsRootNotDirectory",
      message: `${docsDir} exists but is not a directory`,
      path: docsDir
    }));

    return createDirectoryValidationReport({
      checkedDirectories: 0,
      checkedFiles: 0,
      issues,
      failOnWarnings: options.failOnWarnings ?? false
    });
  }

  const inventory = scanDirectoryInventory(options.repoRoot, docsRoot);

  validateCanonicalDirectories({
    repoRoot: options.repoRoot,
    issues
  });

  validateRequiredIndexFiles({
    repoRoot: options.repoRoot,
    issues,
    strict: options.strict ?? false
  });

  validateTopLevelDirectories({
    inventory,
    issues,
    strict: options.strict ?? false
  });

  validateLegacyDirectories({
    inventory,
    issues,
    strict: options.strict ?? false
  });

  validateHiddenEntries({
    inventory,
    issues,
    strict: options.strict ?? false
  });

  validateRootMarkdownFiles({
    inventory,
    issues,
    strict: options.strict ?? false
  });

  validateAdrPlacement({
    inventory,
    issues,
    strict: options.strict ?? false
  });

  validateDiagramPlacement({
    inventory,
    issues,
    strict: options.strict ?? false
  });

  return createDirectoryValidationReport({
    checkedDirectories: inventory.directories.length,
    checkedFiles: inventory.files.length,
    issues,
    failOnWarnings: options.failOnWarnings ?? false
  });
}

export function formatDirectoryValidationReportAsText(
  report: DirectoryValidationReport
): string {
  const lines: string[] = [];

  lines.push(report.ok ? "Directory topology validation passed." : "Directory topology validation failed.");
  lines.push("");
  lines.push("Summary:");
  lines.push(`- checked directories: ${report.summary.checkedDirectories}`);
  lines.push(`- checked files: ${report.summary.checkedFiles}`);
  lines.push(`- errors: ${report.summary.errorCount}`);
  lines.push(`- warnings: ${report.summary.warningCount}`);
  lines.push(`- info: ${report.summary.infoCount}`);

  if (report.issues.length > 0) {
    lines.push("");
    lines.push("Issues:");

    for (const issue of report.issues) {
      lines.push(`- ${issue.severity}: ${issue.path}: ${issue.message}`);
    }
  }

  return lines.join("\n");
}

export function formatDirectoryValidationReportAsJson(
  report: DirectoryValidationReport
): string {
  return JSON.stringify(report, null, 2);
}

type DirectoryInventory = {
  readonly directories: readonly string[];
  readonly files: readonly string[];
};

function scanDirectoryInventory(repoRoot: string, docsRoot: string): DirectoryInventory {
  const directories: string[] = [];
  const files: string[] = [];

  function walk(directory: string): void {
    const entries = readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = join(directory, entry.name);
      const relativePath = relative(repoRoot, absolutePath).replaceAll("\\", "/");

      if (entry.isDirectory()) {
        directories.push(relativePath);
        walk(absolutePath);
        continue;
      }

      if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  }

  walk(docsRoot);

  return {
    directories: directories.sort(),
    files: files.sort()
  };
}

function validateCanonicalDirectories(options: {
  readonly repoRoot: string;
  readonly issues: DocsValidationIssue[];
}): void {
  for (const directory of canonicalDirectories) {
    const absolutePath = join(options.repoRoot, directory);

    if (existsSync(absolutePath) && statSync(absolutePath).isDirectory()) {
      continue;
    }

    options.issues.push(createIssue({
      severity: "error",
      code: "directory.requiredDirectoryMissing",
      message: `missing required docs directory: ${directory}`,
      path: directory
    }));
  }
}

function validateRequiredIndexFiles(options: {
  readonly repoRoot: string;
  readonly issues: DocsValidationIssue[];
  readonly strict: boolean;
}): void {
  for (const indexFile of requiredIndexFiles) {
    const absolutePath = join(options.repoRoot, indexFile);

    if (existsSync(absolutePath) && statSync(absolutePath).isFile()) {
      continue;
    }

    options.issues.push(createIssue({
      severity: options.strict ? "error" : "warning",
      code: "directory.requiredIndexMissing",
      message: `missing required docs index file: ${indexFile}`,
      path: indexFile
    }));
  }
}

function validateTopLevelDirectories(options: {
  readonly inventory: DirectoryInventory;
  readonly issues: DocsValidationIssue[];
  readonly strict: boolean;
}): void {
  for (const directory of options.inventory.directories) {
    const parts = directory.split("/");

    if (parts.length !== 2 || parts[0] !== "docs") {
      continue;
    }

    if (allowedTopLevelDirectories.has(directory)) {
      continue;
    }

    options.issues.push(createIssue({
      severity: options.strict ? "error" : "warning",
      code: "directory.unexpectedTopLevelDirectory",
      message: `unexpected top-level docs directory: ${directory}`,
      path: directory
    }));
  }
}

function validateLegacyDirectories(options: {
  readonly inventory: DirectoryInventory;
  readonly issues: DocsValidationIssue[];
  readonly strict: boolean;
}): void {
  for (const directory of options.inventory.directories) {
    if (!allowedLegacyDirectories.has(directory)) {
      continue;
    }

    if (acceptedLegacyDirectories.has(directory)) {
      options.issues.push(createIssue({
        severity: "info",
        code: "directory.acceptedLegacyDirectory",
        message: `accepted legacy docs directory is governed by docs/governance/legacy-docs-topology.md: ${directory}`,
        path: directory
      }));
      continue;
    }

    options.issues.push(createIssue({
      severity: options.strict ? "error" : "warning",
      code: "directory.legacyDirectory",
      message: `legacy docs directory is still present and should eventually be migrated: ${directory}`,
      path: directory
    }));
  }
}

function validateHiddenEntries(options: {
  readonly inventory: DirectoryInventory;
  readonly issues: DocsValidationIssue[];
  readonly strict: boolean;
}): void {
  for (const directory of options.inventory.directories) {
    const name = directory.split("/").at(-1) ?? "";

    if (!name.startsWith(".")) {
      continue;
    }

    if (directory === "docs/.ideas") {
      continue;
    }

    options.issues.push(createIssue({
      severity: options.strict ? "error" : "warning",
      code: "directory.hiddenDirectory",
      message: `hidden docs directory is not governed: ${directory}`,
      path: directory
    }));
  }

  for (const file of options.inventory.files) {
    const name = file.split("/").at(-1) ?? "";

    if (!name.startsWith(".")) {
      continue;
    }

    if (name === ".keep") {
      continue;
    }

    options.issues.push(createIssue({
      severity: options.strict ? "error" : "warning",
      code: "directory.hiddenFile",
      message: `hidden docs file is not governed: ${file}`,
      path: file
    }));
  }
}

function validateRootMarkdownFiles(options: {
  readonly inventory: DirectoryInventory;
  readonly issues: DocsValidationIssue[];
  readonly strict: boolean;
}): void {
  for (const file of options.inventory.files) {
    const parts = file.split("/");

    if (parts.length !== 2 || parts[0] !== "docs" || !file.endsWith(".md")) {
      continue;
    }

    if (allowedDocsRootMarkdownFiles.has(file)) {
      continue;
    }

    options.issues.push(createIssue({
      severity: options.strict ? "error" : "warning",
      code: "directory.rootMarkdownFile",
      message: `root-level Markdown file should be moved into a governed docs domain: ${file}`,
      path: file
    }));
  }
}

function validateAdrPlacement(options: {
  readonly inventory: DirectoryInventory;
  readonly issues: DocsValidationIssue[];
  readonly strict: boolean;
}): void {
  for (const file of options.inventory.files) {
    if (!file.endsWith(".md")) {
      continue;
    }

    const fileName = file.split("/").at(-1) ?? "";
    const looksLikeAdr = /^(?:ADR-)?\d{4}[-_].*\.md$/i.test(fileName);

    if (!looksLikeAdr) {
      continue;
    }

    if (file.startsWith("docs/architecture/adr/") || file.startsWith("docs/adr/")) {
      continue;
    }

    options.issues.push(createIssue({
      severity: options.strict ? "error" : "warning",
      code: "directory.adrOutsideAdrDirectory",
      message: `ADR-like file is outside an ADR directory: ${file}`,
      path: file
    }));
  }

  for (const file of options.inventory.files) {
    if (!file.startsWith("docs/architecture/adr/") && !file.startsWith("docs/adr/")) {
      continue;
    }

    if (!file.endsWith(".md")) {
      options.issues.push(createIssue({
        severity: options.strict ? "error" : "warning",
        code: "directory.nonMarkdownAdrFile",
        message: `non-Markdown file found in ADR directory: ${file}`,
        path: file
      }));
    }
  }
}

function validateDiagramPlacement(options: {
  readonly inventory: DirectoryInventory;
  readonly issues: DocsValidationIssue[];
  readonly strict: boolean;
}): void {
  for (const file of options.inventory.files) {
    const extension = extensionOf(file);

    if (!diagramExtensions.has(extension)) {
      continue;
    }

    if (file.startsWith("docs/architecture/diagrams/")) {
      continue;
    }

    options.issues.push(createIssue({
      severity: options.strict ? "error" : "warning",
      code: "directory.diagramOutsideDiagramDirectory",
      message: `diagram file is outside docs/architecture/diagrams: ${file}`,
      path: file
    }));
  }

  for (const file of options.inventory.files) {
    if (!file.startsWith("docs/architecture/diagrams/")) {
      continue;
    }

    const extension = extensionOf(file);

    if (diagramExtensions.has(extension) || file.endsWith(".meta.md")) {
      continue;
    }

    options.issues.push(createIssue({
      severity: options.strict ? "error" : "warning",
      code: "directory.unexpectedDiagramDirectoryFile",
      message: `unexpected file in diagram directory: ${file}`,
      path: file
    }));
  }
}

function createDirectoryValidationReport(options: {
  readonly checkedDirectories: number;
  readonly checkedFiles: number;
  readonly issues: readonly DocsValidationIssue[];
  readonly failOnWarnings: boolean;
}): DirectoryValidationReport {
  const summary = summarizeDirectoryValidation({
    checkedDirectories: options.checkedDirectories,
    checkedFiles: options.checkedFiles,
    issues: options.issues
  });

  return {
    ok: summary.errorCount === 0 && (!options.failOnWarnings || summary.warningCount === 0),
    summary,
    issues: options.issues
  };
}

function summarizeDirectoryValidation(options: {
  readonly checkedDirectories: number;
  readonly checkedFiles: number;
  readonly issues: readonly DocsValidationIssue[];
}): DirectoryValidationSummary {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const issue of options.issues) {
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
    checkedDirectories: options.checkedDirectories,
    checkedFiles: options.checkedFiles,
    errorCount,
    warningCount,
    infoCount
  };
}

function extensionOf(path: string): string {
  const fileName = path.split("/").at(-1) ?? path;
  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex < 0) {
    return "";
  }

  return fileName.slice(dotIndex).toLowerCase();
}

function createIssue(options: {
  readonly severity: DocsValidationIssue["severity"];
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly field?: string;
}): DocsValidationIssue {
  const issue = {
    severity: options.severity,
    code: options.code,
    message: options.message,
    path: options.path
  };

  return options.field ? { ...issue, field: options.field } : issue;
}
'''

Path("packages/cli/src/docs/directory-validator.ts").write_text(content, encoding="utf-8")
print("rewrote packages/cli/src/docs/directory-validator.ts")
