import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

export interface RunScaffdogGeneratorOptions {
  readonly generatorId: string;
  readonly inputs: Record<string, string | boolean | number>;
  readonly cwd?: string;
}

export interface ScaffdogRunResult {
  readonly command: string;
  readonly documentName: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export async function runScaffdogGenerator(
  options: RunScaffdogGeneratorOptions
): Promise<ScaffdogRunResult> {
  const repositoryRoot = await findRepositoryRoot(options.cwd ?? process.cwd());
  const documentName = resolveScaffdogDocumentName(options.generatorId);

  const args = [
    "x",
    "scaffdog",
    "generate",
    documentName,
    "--project",
    repositoryRoot,
    "--output",
    ".",
    "--force",
    ...buildAnswerArgs(options.inputs)
  ];

  const result = await spawnBuffered("bun", args, repositoryRoot);

  return {
    command: formatCommand("bun", args),
    documentName,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr
  };
}

function resolveScaffdogDocumentName(generatorId: string): string {
  switch (generatorId) {
    case "governance-artifact:adr":
      return "adr";

    case "governance-artifact:work-packet":
      return "work-packet";

    default:
      throw new Error(`Generator "${generatorId}" is not backed by a Scaffdog document.`);
  }
}

function buildAnswerArgs(inputs: Record<string, string | boolean | number>): string[] {
  const ignoredKeys = new Set(["slug", "commandPath"]);
  const args: string[] = [];

  for (const [key, value] of Object.entries(inputs)) {
    if (ignoredKeys.has(key)) {
      continue;
    }

    args.push("--answer", `${key}:${String(value)}`);
  }

  return args;
}

interface SpawnBufferedResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function spawnBuffered(
  command: string,
  args: readonly string[],
  cwd: string
): Promise<SpawnBufferedResult> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", reject);

    child.on("close", (exitCode) => {
      resolve({
        exitCode: exitCode ?? 1,
        stdout,
        stderr
      });
    });
  });
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

function formatCommand(command: string, args: readonly string[]): string {
  return [command, ...args.map(quoteShellArg)].join(" ");
}

function quoteShellArg(value: string): string {
  if (/^[a-zA-Z0-9:./=_-]+$/.test(value)) {
    return value;
  }

  return JSON.stringify(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
