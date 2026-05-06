import { stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import type { GeneratorPlan, PlanOperation } from "./types.js";

export type PreflightIssueCode =
  | "path-already-exists"
  | "unsafe-path"
  | "unsupported-operation";

export interface PreflightIssue {
  readonly code: PreflightIssueCode;
  readonly path: string;
  readonly message: string;
}

export interface PreflightCheckResult {
  readonly ok: boolean;
  readonly repositoryRoot: string;
  readonly checkedPaths: readonly string[];
  readonly issues: readonly PreflightIssue[];
}

export async function runExecutionPreflight(plan: GeneratorPlan): Promise<PreflightCheckResult> {
  const repositoryRoot = await findRepositoryRoot(process.cwd());
  const issues: PreflightIssue[] = [];
  const checkedPaths: string[] = [];

  for (const operation of plan.operations) {
    const pathSafetyIssue = validateOperationPath(repositoryRoot, operation.path);

    if (pathSafetyIssue) {
      issues.push(pathSafetyIssue);
      continue;
    }

    checkedPaths.push(operation.path);

    if (operation.action !== "create") {
      issues.push({
        code: "unsupported-operation",
        path: operation.path,
        message: `Execution preflight only supports create operations right now. Operation "${operation.action}" is not executable yet.`
      });

      continue;
    }

    if (operation.overwritePolicy === "fail" && (await pathExists(path.resolve(repositoryRoot, operation.path)))) {
      issues.push({
        code: "path-already-exists",
        path: operation.path,
        message: `Refusing to execute because "${operation.path}" already exists.`
      });
    }
  }

  return {
    ok: issues.length === 0,
    repositoryRoot,
    checkedPaths,
    issues
  };
}

export function formatPreflightFailure(result: PreflightCheckResult): string {
  const issueLines = result.issues.map((issue) => {
    return `- ${issue.code}: ${issue.path}\n  ${issue.message}`;
  });

  return [
    "Generator execution was blocked by preflight checks.",
    "",
    "No backend generator was invoked and no scaffolded files were written.",
    "",
    "Issues:",
    ...issueLines,
    "",
    "Resolve the collisions or choose a different artifact name, then run the command again."
  ].join("\n");
}

function validateOperationPath(repositoryRoot: string, operationPath: string): PreflightIssue | undefined {
  if (operationPath.trim().length === 0) {
    return {
      code: "unsafe-path",
      path: operationPath,
      message: "Generated output path is empty."
    };
  }

  if (path.isAbsolute(operationPath)) {
    return {
      code: "unsafe-path",
      path: operationPath,
      message: "Generated output paths must be repository-relative, not absolute."
    };
  }

  const pathSegments = operationPath.split(/[\\/]+/g);

  if (pathSegments.includes("..")) {
    return {
      code: "unsafe-path",
      path: operationPath,
      message: "Generated output paths must not contain '..' path traversal segments."
    };
  }

  const resolvedPath = path.resolve(repositoryRoot, operationPath);
  const relativePath = path.relative(repositoryRoot, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return {
      code: "unsafe-path",
      path: operationPath,
      message: "Generated output path resolves outside the repository root."
    };
  }

  return undefined;
}

async function findRepositoryRoot(startDirectory: string): Promise<string> {
  let currentDirectory = path.resolve(startDirectory);

  while (true) {
    const gitPath = path.join(currentDirectory, ".git");

    if (await pathExists(gitPath)) {
      return currentDirectory;
    }

    const parentDirectory = path.dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      return path.resolve(startDirectory);
    }

    currentDirectory = parentDirectory;
  }
}

async function pathExists(candidatePath: string): Promise<boolean> {
  try {
    await stat(candidatePath);
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
