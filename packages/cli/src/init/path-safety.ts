import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import type { InitValidationIssue } from "./types.js";

export interface ValidateDestinationOptions {
  readonly destination: string;
  readonly cwd?: string;
}

export interface DestinationValidationResult {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly exists: boolean;
  readonly isDirectory: boolean;
  readonly isEmpty: boolean;
  readonly issues: readonly InitValidationIssue[];
}

const RESERVED_PATH_NAMES = new Set([
  ".",
  "..",
  "aux",
  "com1",
  "com2",
  "com3",
  "com4",
  "com5",
  "com6",
  "com7",
  "com8",
  "com9",
  "con",
  "lpt1",
  "lpt2",
  "lpt3",
  "lpt4",
  "lpt5",
  "lpt6",
  "lpt7",
  "lpt8",
  "lpt9",
  "nul",
  "prn"
]);

export async function validateDestination(
  options: ValidateDestinationOptions
): Promise<DestinationValidationResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const destination = options.destination.trim();
  const issues: InitValidationIssue[] = [];

  if (destination.length === 0) {
    issues.push({
      level: "error",
      code: "destination-empty",
      message: "Destination must not be empty."
    });
  }

  if (path.isAbsolute(destination)) {
    issues.push({
      level: "error",
      code: "destination-absolute",
      message: "Destination must be repository-relative for this initializer slice."
    });
  }

  const pathSegments = destination.split(/[\\/]+/g).filter(Boolean);

  if (pathSegments.includes("..")) {
    issues.push({
      level: "error",
      code: "destination-path-traversal",
      message: "Destination must not contain '..' path traversal segments."
    });
  }

  for (const segment of pathSegments) {
    if (RESERVED_PATH_NAMES.has(segment.toLowerCase())) {
      issues.push({
        level: "error",
        code: "destination-reserved-name",
        message: `Destination path segment "${segment}" is reserved.`
      });
    }
  }

  const absolutePath = path.resolve(cwd, destination);
  const relativePath = path.relative(cwd, absolutePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    issues.push({
      level: "error",
      code: "destination-outside-cwd",
      message: "Destination resolves outside the current working directory."
    });
  }

  const fileSystemState = await readDestinationState(absolutePath);

  if (fileSystemState.exists && !fileSystemState.isDirectory) {
    issues.push({
      level: "error",
      code: "destination-not-directory",
      message: `Destination already exists and is not a directory: ${relativePath}`
    });
  }

  if (fileSystemState.exists && fileSystemState.isDirectory && !fileSystemState.isEmpty) {
    issues.push({
      level: "error",
      code: "destination-not-empty",
      message: `Destination already exists and is not empty: ${relativePath}`
    });
  }

  return {
    absolutePath,
    relativePath,
    exists: fileSystemState.exists,
    isDirectory: fileSystemState.isDirectory,
    isEmpty: fileSystemState.isEmpty,
    issues
  };
}

interface DestinationFileSystemState {
  readonly exists: boolean;
  readonly isDirectory: boolean;
  readonly isEmpty: boolean;
}

async function readDestinationState(absolutePath: string): Promise<DestinationFileSystemState> {
  try {
    const stats = await stat(absolutePath);

    if (!stats.isDirectory()) {
      return {
        exists: true,
        isDirectory: false,
        isEmpty: false
      };
    }

    const entries = await readdir(absolutePath);

    return {
      exists: true,
      isDirectory: true,
      isEmpty: entries.length === 0
    };
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return {
        exists: false,
        isDirectory: false,
        isEmpty: true
      };
    }

    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
