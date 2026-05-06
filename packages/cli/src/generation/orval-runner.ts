import { spawn } from "node:child_process";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

export interface RunOrvalGeneratorOptions {
  readonly generatorId: string;
  readonly inputs: Record<string, string | boolean | number>;
  readonly cwd?: string;
}

export interface OrvalRunResult {
  readonly command: string;
  readonly configPath: string;
  readonly contractPath: string;
  readonly targetPath: string;
  readonly schemasPath: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export async function runOrvalGenerator(options: RunOrvalGeneratorOptions): Promise<OrvalRunResult> {
  const repositoryRoot = await findRepositoryRoot(options.cwd ?? process.cwd());

  if (options.generatorId !== "contract-artifact:openapi-typescript-client") {
    throw new Error(`Generator "${options.generatorId}" is not backed by Orval.`);
  }

  const name = resolveRequiredStringInput(options.inputs, "name");
  const slug = resolveRequiredStringInput(options.inputs, "slug");
  const contract = resolveRequiredStringInput(options.inputs, "contract");

  const contractPath = path.resolve(repositoryRoot, contract);
  const targetPath = path.resolve(repositoryRoot, "generated", "clients", slug, "index.ts");
  const schemasPath = path.resolve(repositoryRoot, "generated", "clients", slug, "model");
  const configPath = path.resolve(
    repositoryRoot,
    ".artifacts",
    "foundry",
    "orval",
    `${slug}.orval.config.ts`
  );

  await assertPathExists(contractPath, `OpenAPI contract does not exist: ${contract}`);
  await mkdir(path.dirname(configPath), { recursive: true });
  await mkdir(path.dirname(targetPath), { recursive: true });

  await writeFile(
    configPath,
    createOrvalConfig({
      projectName: slug,
      contractPath,
      targetPath,
      schemasPath
    }),
    "utf8"
  );

  const args = ["x", "orval", "--config", configPath];

  const result = await spawnBuffered("bun", args, repositoryRoot);

  return {
    command: formatCommand("bun", args),
    configPath: path.relative(repositoryRoot, configPath),
    contractPath: path.relative(repositoryRoot, contractPath),
    targetPath: path.relative(repositoryRoot, targetPath),
    schemasPath: path.relative(repositoryRoot, schemasPath),
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr
  };
}

function createOrvalConfig(options: {
  readonly projectName: string;
  readonly contractPath: string;
  readonly targetPath: string;
  readonly schemasPath: string;
}): string {
  return `import { defineConfig } from "orval";

export default defineConfig({
  ${JSON.stringify(options.projectName)}: {
    input: {
      target: ${JSON.stringify(options.contractPath)}
    },
    output: {
      target: ${JSON.stringify(options.targetPath)},
      schemas: ${JSON.stringify(options.schemasPath)},
      client: "fetch"
    }
  }
});
`;
}

function resolveRequiredStringInput(
  inputs: Record<string, string | boolean | number>,
  key: string
): string {
  const value = inputs[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required Orval input "${key}".`);
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

async function assertPathExists(candidatePath: string, message: string): Promise<void> {
  if (await pathExists(candidatePath)) {
    return;
  }

  throw new Error(message);
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
