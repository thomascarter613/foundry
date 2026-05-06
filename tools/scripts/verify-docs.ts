import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

type VerificationFailure = {
  file: string;
  reason: string;
};

const repoRoot = process.cwd();
const docsDir = join(repoRoot, "docs");

const failures: VerificationFailure[] = [];

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

function hasYamlFrontmatter(content: string): boolean {
  const normalized = content.replace(/\r\n/g, "\n");

  if (!normalized.startsWith("---\n")) {
    return false;
  }

  const closingMarkerIndex = normalized.indexOf("\n---\n", 4);

  return closingMarkerIndex > 0;
}

function verifyMarkdownFile(filePath: string): void {
  const relativePath = relative(repoRoot, filePath);
  const content = readFileSync(filePath, "utf8");

  if (!hasYamlFrontmatter(content)) {
    failures.push({
      file: relativePath,
      reason: "missing YAML frontmatter block",
    });
  }

  if (content.includes("contentReference[oaicite:")) {
    failures.push({
      file: relativePath,
      reason: "contains forbidden contentReference citation artifact",
    });
  }

  if (
    content.includes("<<<<<<<") ||
    content.includes("=======") ||
    content.includes(">>>>>>>")
  ) {
    failures.push({
      file: relativePath,
      reason: "contains possible merge conflict marker",
    });
  }
}

function main(): void {
  if (!existsSync(docsDir)) {
    console.error("Docs verification failed.");
    console.error("Missing docs/ directory.");
    process.exit(1);
  }

  if (!statSync(docsDir).isDirectory()) {
    console.error("Docs verification failed.");
    console.error("docs exists but is not a directory.");
    process.exit(1);
  }

  const markdownFiles = walkMarkdownFiles(docsDir).sort();

  if (markdownFiles.length === 0) {
    console.error("Docs verification failed.");
    console.error("No Markdown files found under docs/.");
    process.exit(1);
  }

  for (const filePath of markdownFiles) {
    verifyMarkdownFile(filePath);
  }

  if (failures.length > 0) {
    console.error("Docs verification failed.");
    console.error("");

    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.reason}`);
    }

    console.error("");
    console.error(`Checked ${markdownFiles.length} Markdown file(s).`);
    console.error(`${failures.length} failure(s) found.`);

    process.exit(1);
  }

  console.log("Docs verification passed.");
  console.log(`Checked ${markdownFiles.length} Markdown file(s).`);
}

main();