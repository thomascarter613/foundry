import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { formatAuditEventAsJson, type GeneratorAuditEvent } from "./audit.js";

export interface WriteGeneratorAuditLogOptions {
  readonly event: GeneratorAuditEvent;
  readonly cwd?: string;
  readonly auditRoot?: string;
}

export interface AuditLogWriteResult {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly bytesWritten: number;
}

export async function writeGeneratorAuditLog(
  options: WriteGeneratorAuditLogOptions
): Promise<AuditLogWriteResult> {
  const cwd = options.cwd ?? process.cwd();
  const repositoryRoot = await findRepositoryRoot(cwd);
  const auditRoot = options.auditRoot ?? ".artifacts/foundry/audit";
  const occurredDate = options.event.occurredAt.slice(0, 10);

  const auditDirectory = path.resolve(
    repositoryRoot,
    auditRoot,
    "generator-plans",
    occurredDate
  );

  await mkdir(auditDirectory, { recursive: true });

  const fileName = `${sanitizeFileName(options.event.eventId)}.json`;
  const absolutePath = path.join(auditDirectory, fileName);
  const json = `${formatAuditEventAsJson(options.event)}\n`;

  await writeFile(absolutePath, json, {
    encoding: "utf8",
    flag: "wx"
  });

  return {
    absolutePath,
    relativePath: path.relative(repositoryRoot, absolutePath),
    bytesWritten: Buffer.byteLength(json, "utf8")
  };
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

function sanitizeFileName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9._-]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
