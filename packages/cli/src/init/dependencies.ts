import { spawn } from "node:child_process";

export interface InstallWorkspaceDependenciesInput {
  readonly destination: string;
}

export interface InstallWorkspaceDependenciesResult {
  readonly installed: boolean;
  readonly command: string;
}

export async function installWorkspaceDependencies(
  input: InstallWorkspaceDependenciesInput
): Promise<InstallWorkspaceDependenciesResult> {
  const command = "bun install";

  await runCommand({
    command: "bun",
    args: ["install"],
    cwd: input.destination
  });

  return {
    installed: true,
    command
  };
}

interface RunCommandInput {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
}

async function runCommand(input: RunCommandInput): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(input.command, [...input.args], {
      cwd: input.cwd,
      env: process.env,
      stdio: "inherit"
    });

    child.once("error", (error) => {
      reject(
        new Error(
          `Failed to run "${formatCommand(input)}" in ${input.cwd}: ${error.message}`
        )
      );
    });

    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      if (typeof signal === "string") {
        reject(
          new Error(
            `Command "${formatCommand(input)}" was terminated by signal ${signal}.`
          )
        );
        return;
      }

      reject(
        new Error(
          `Command "${formatCommand(input)}" failed with exit code ${code ?? "unknown"}.`
        )
      );
    });
  });
}

function formatCommand(input: RunCommandInput): string {
  return [input.command, ...input.args].join(" ");
}