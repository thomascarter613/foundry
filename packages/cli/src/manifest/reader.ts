import { readFile } from "node:fs/promises";
import path from "node:path";

import type { FoundryManifest } from "./types.js";
import {
  validateFoundryManifest,
  type FoundryManifestValidationIssue
} from "./validator.js";

export type FoundryManifestReadStatus =
  | "found"
  | "missing"
  | "invalid-json"
  | "invalid-manifest"
  | "read-error";

export interface ReadFoundryManifestInput {
  readonly workspaceRoot?: string;
  readonly manifestPath?: string;
}

export interface FoundryManifestReadSuccess {
  readonly ok: true;
  readonly status: "found";
  readonly workspaceRoot: string;
  readonly manifestPath: string;
  readonly manifest: FoundryManifest;
  readonly issues: readonly [];
}

export interface FoundryManifestReadFailure {
  readonly ok: false;
  readonly status: Exclude<FoundryManifestReadStatus, "found">;
  readonly workspaceRoot: string;
  readonly manifestPath: string;
  readonly issues: readonly FoundryManifestValidationIssue[];
  readonly errorMessage: string;
}

export type FoundryManifestReadResult =
  | FoundryManifestReadSuccess
  | FoundryManifestReadFailure;

export class FoundryManifestReadError extends Error {
  readonly result: FoundryManifestReadFailure;

  constructor(result: FoundryManifestReadFailure) {
    super(result.errorMessage);
    this.name = "FoundryManifestReadError";
    this.result = result;
  }
}

export function getDefaultFoundryManifestPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, ".foundry/manifest.json");
}

export function resolveFoundryManifestReadInput(
  input: ReadFoundryManifestInput = {}
): {
  readonly workspaceRoot: string;
  readonly manifestPath: string;
} {
  const workspaceRoot = path.resolve(input.workspaceRoot ?? getInvocationCwd());

  if (input.manifestPath) {
    const manifestPath = path.isAbsolute(input.manifestPath)
      ? path.resolve(input.manifestPath)
      : path.resolve(workspaceRoot, input.manifestPath);

    return {
      workspaceRoot,
      manifestPath
    };
  }

  return {
    workspaceRoot,
    manifestPath: getDefaultFoundryManifestPath(workspaceRoot)
  };
}

export async function readFoundryManifest(
  input: ReadFoundryManifestInput = {}
): Promise<FoundryManifestReadResult> {
  const resolved = resolveFoundryManifestReadInput(input);

  let raw: string;

  try {
    raw = await readFile(resolved.manifestPath, "utf8");
  } catch (error) {
    if (isNodeErrorWithCode(error, "ENOENT")) {
      return createFailure({
        status: "missing",
        workspaceRoot: resolved.workspaceRoot,
        manifestPath: resolved.manifestPath,
        errorMessage: `Foundry manifest was not found: ${resolved.manifestPath}`,
        issues: [
          {
            code: "manifest-missing",
            path: resolved.manifestPath,
            message: "Foundry manifest was not found."
          }
        ]
      });
    }

    return createFailure({
      status: "read-error",
      workspaceRoot: resolved.workspaceRoot,
      manifestPath: resolved.manifestPath,
      errorMessage:
        error instanceof Error
          ? `Failed to read Foundry manifest: ${error.message}`
          : "Failed to read Foundry manifest.",
      issues: [
        {
          code: "manifest-read-error",
          path: resolved.manifestPath,
          message:
            error instanceof Error
              ? error.message
              : "Failed to read Foundry manifest."
        }
      ]
    });
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (error) {
    return createFailure({
      status: "invalid-json",
      workspaceRoot: resolved.workspaceRoot,
      manifestPath: resolved.manifestPath,
      errorMessage:
        error instanceof Error
          ? `Foundry manifest is not valid JSON: ${error.message}`
          : "Foundry manifest is not valid JSON.",
      issues: [
        {
          code: "manifest-invalid-json",
          path: resolved.manifestPath,
          message:
            error instanceof Error
              ? error.message
              : "Foundry manifest is not valid JSON."
        }
      ]
    });
  }

  const issues = validateFoundryManifest(parsed, resolved.manifestPath);

  if (issues.length > 0) {
    return createFailure({
      status: "invalid-manifest",
      workspaceRoot: resolved.workspaceRoot,
      manifestPath: resolved.manifestPath,
      errorMessage: `Foundry manifest failed validation: ${resolved.manifestPath}`,
      issues
    });
  }

  return {
    ok: true,
    status: "found",
    workspaceRoot: resolved.workspaceRoot,
    manifestPath: resolved.manifestPath,
    manifest: parsed as FoundryManifest,
    issues: []
  };
}

export async function readFoundryManifestOrThrow(
  input: ReadFoundryManifestInput = {}
): Promise<FoundryManifestReadSuccess> {
  const result = await readFoundryManifest(input);

  if (result.ok) {
    return result;
  }

  throw new FoundryManifestReadError(result);
}

function createFailure(input: {
  readonly status: Exclude<FoundryManifestReadStatus, "found">;
  readonly workspaceRoot: string;
  readonly manifestPath: string;
  readonly errorMessage: string;
  readonly issues: readonly FoundryManifestValidationIssue[];
}): FoundryManifestReadFailure {
  return {
    ok: false,
    status: input.status,
    workspaceRoot: input.workspaceRoot,
    manifestPath: input.manifestPath,
    errorMessage: input.errorMessage,
    issues: input.issues
  };
}

function getInvocationCwd(): string {
  const invocationCwd = process.env.FOUNDRY_INVOCATION_CWD;

  if (typeof invocationCwd === "string" && invocationCwd.trim().length > 0) {
    return path.resolve(invocationCwd);
  }

  return process.cwd();
}

function isNodeErrorWithCode(error: unknown, code: string): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { readonly code?: unknown }).code === code
  );
}
