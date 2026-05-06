import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

export interface RunCopierGeneratorOptions {
  readonly generatorId: string;
  readonly inputs: Record<string, string | boolean | number>;
  readonly cwd?: string;
}

export interface CopierRunResult {
  readonly command: string;
  readonly templatePath: string;
  readonly destinationPath: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export async function runCopierGenerator(options: RunCopierGeneratorOptions): Promise<CopierRunResult> {
  const repositoryRoot = await findRepositoryRoot(options.cwd ?? process.cwd());
  const templatePath = resolveCopierTemplatePath(repositoryRoot, options.generatorId);
  const destinationPath = resolveCopierDestinationPath(repositoryRoot, options.generatorId, options.inputs);
  const serviceName = resolveRequiredStringInput(options.inputs, "name");
  const serviceSlug = resolveRequiredStringInput(options.inputs, "slug");

  const args = [
    "tools/scripts/copier.sh",
    "copy",
    "--trust",
    "--defaults",
    "--data",
    `service_name=${serviceName}`,
    "--data",
    `service_slug=${serviceSlug}`,
    "--data",
    `package_name=@repo/${serviceSlug}`,
    templatePath,
    destinationPath
  ];

  const result = await spawnBuffered("bash", args, repositoryRoot);

  return {
    command: formatCommand("bash", args),
    templatePath: path.relative(repositoryRoot, templatePath),
    destinationPath: path.relative(repositoryRoot, destinationPath),
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr
  };
}

function resolveCopierTemplatePath(repositoryRoot: string, generatorId: string): string {
  switch (generatorId) {
    case "service:hono-api":
      return path.join(repositoryRoot, "templates/copier/service-hono-api");

    default:
      throw new Error(`Generator "${generatorId}" is not backed by a Copier template.`);
  }
}

function resolveCopierDestinationPath(
  repositoryRoot: string,
  generatorId: string,
  inputs: Record<string, string | boolean | number>
): string {
  const slug = resolveRequiredStringInput(inputs, "slug");

  switch (generatorId) {
    case "service:hono-api":
      return path.join(repositoryRoot, "services", slug);

    default:
      throw new Error(`Generator "${generatorId}" is not backed by a Copier destination.`);
  }
}

function resolveRequiredStringInput(
  inputs: Record<string, string | boolean | number>,
  key: string
): string {
  const value = inputs[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required Copier input "${key}".`);
  }

  return value;
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
