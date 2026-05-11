import { readFile } from "node:fs/promises";
import type { ParsedFoundrySpec } from "./spec-types.js";

export async function parseFoundrySpecFile(filePath: string): Promise<ParsedFoundrySpec> {
  const content = await readFile(filePath, "utf8");
  return parseFoundrySpecContent(filePath, content);
}

export function parseFoundrySpecContent(filePath: string, content: string): ParsedFoundrySpec {
  const normalized = content.replace(/\r\n/g, "\n");

  if (!normalized.startsWith("---\n")) {
    return {
      filePath,
      frontmatter: {},
      body: normalized,
    };
  }

  const closingIndex = normalized.indexOf("\n---\n", 4);

  if (closingIndex === -1) {
    return {
      filePath,
      frontmatter: {},
      body: normalized,
    };
  }

  const rawFrontmatter = normalized.slice(4, closingIndex);
  const body = normalized.slice(closingIndex + "\n---\n".length);

  return {
    filePath,
    frontmatter: parseSimpleYamlFrontmatter(rawFrontmatter),
    body,
  };
}

function parseSimpleYamlFrontmatter(raw: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = raw.split("\n");

  let currentArrayKey: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      continue;
    }

    if (trimmed.startsWith("- ") && currentArrayKey) {
      const current = result[currentArrayKey];

      if (Array.isArray(current)) {
        current.push(parseScalar(trimmed.slice(2).trim()));
      }

      continue;
    }

    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      currentArrayKey = null;
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();

    if (rawValue === "[]") {
      result[key] = [];
      currentArrayKey = key;
      continue;
    }

    if (rawValue === "") {
      result[key] = [];
      currentArrayKey = key;
      continue;
    }

    result[key] = parseScalar(rawValue);
    currentArrayKey = null;
  }

  return result;
}

function parseScalar(value: string): string | boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value.replace(/^["']|["']$/g, "");
}
