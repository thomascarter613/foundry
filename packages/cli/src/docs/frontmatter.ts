import type {
  MarkdownDocumentSource,
  ParsedFrontmatter,
  ParsedMarkdownDocument
} from "./types.js";

export function parseMarkdownDocument(source: MarkdownDocumentSource): ParsedMarkdownDocument {
  const normalizedContent = source.content.replace(/\r\n/g, "\n");
  const frontmatter = extractYamlFrontmatter(normalizedContent);

  if (!frontmatter) {
    return {
      absolutePath: source.absolutePath,
      relativePath: source.relativePath,
      content: normalizedContent,
      body: normalizedContent,
      frontmatter: null
    };
  }

  return {
    absolutePath: source.absolutePath,
    relativePath: source.relativePath,
    content: normalizedContent,
    body: normalizedContent.slice(frontmatter.endOffset).replace(/^\n+/, ""),
    frontmatter: {
      raw: frontmatter.raw,
      data: parseSimpleYaml(frontmatter.raw)
    }
  };
}

type ExtractedFrontmatter = {
  readonly raw: string;
  readonly endOffset: number;
};

function extractYamlFrontmatter(content: string): ExtractedFrontmatter | null {
  if (!content.startsWith("---\n")) {
    return null;
  }

  const closingMarkerIndex = content.indexOf("\n---\n", 4);

  if (closingMarkerIndex <= 0) {
    return null;
  }

  return {
    raw: content.slice(4, closingMarkerIndex),
    endOffset: closingMarkerIndex + "\n---\n".length
  };
}

function parseSimpleYaml(frontmatter: string): ParsedFrontmatter["data"] {
  const data: Record<string, unknown> = {};
  let activeArrayKey: string | null = null;

  for (const line of frontmatter.split("\n")) {
    if (line.trim() === "" || line.trim().startsWith("#")) {
      continue;
    }

    const arrayItemMatch = line.match(/^\s*-\s+(.*)$/);

    if (arrayItemMatch && activeArrayKey) {
      const current = data[activeArrayKey];

      if (Array.isArray(current)) {
        current.push(unquote(arrayItemMatch[1] ?? ""));
      }

      continue;
    }

    const keyValueMatch = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);

    if (!keyValueMatch) {
      activeArrayKey = null;
      continue;
    }

    const key = keyValueMatch[1];
    const rawValue = keyValueMatch[2] ?? "";

    if (!key) {
      activeArrayKey = null;
      continue;
    }

    if (rawValue.trim() === "" || rawValue.trim() === "[]") {
      data[key] = [];
      activeArrayKey = key;
      continue;
    }

    if (rawValue.trim().startsWith("[") && rawValue.trim().endsWith("]")) {
      data[key] = parseInlineArray(rawValue.trim());
      activeArrayKey = null;
      continue;
    }

    data[key] = unquote(rawValue);
    activeArrayKey = null;
  }

  return data;
}

function parseInlineArray(rawValue: string): string[] {
  const inner = rawValue.slice(1, -1).trim();

  if (inner.length === 0) {
    return [];
  }

  return inner.split(",").map((item) => unquote(item.trim()));
}

function unquote(value: string): string {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}
