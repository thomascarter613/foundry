import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { createDefaultFoundryManifest } from "./defaults.js";

interface VerificationIssue {
  readonly code: string;
  readonly message: string;
}

interface CommandResult {
  readonly command: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function main(): Promise<void> {
  const issues = await verifyManifestValidateCommand();

  if (issues.length > 0) {
    console.error("verify:manifest-command: failed");
    console.error("");

    for (const issue of issues) {
      console.error(`- ${issue.code}: ${issue.message}`);
    }

    process.exit(1);
  }

  console.log("verify:manifest-command: ok");
}

export async function verifyManifestValidateCommand(): Promise<
  readonly VerificationIssue[]
> {
  const fixtureRoot = path.resolve(".artifacts/foundry/tests/manifest-command");
  const issues: VerificationIssue[] = [];

  await rm(fixtureRoot, { recursive: true, force: true });
  await mkdir(fixtureRoot, { recursive: true });

  try {
    issues.push(...(await verifyValidWorkspace(fixtureRoot)));
    issues.push(...(await verifyJsonOutput(fixtureRoot)));
    issues.push(...(await verifyCheckModeFailsForMissingManifest(fixtureRoot)));
    issues.push(...(await verifyCustomManifestPath(fixtureRoot)));
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }

  return issues;
}

async function verifyValidWorkspace(
  fixtureRoot: string
): Promise<readonly VerificationIssue[]> {
  const workspaceRoot = path.join(fixtureRoot, "valid-workspace");
  const manifestPath = path.join(workspaceRoot, ".foundry/manifest.json");

  await writeJsonFile(
    manifestPath,
    createDefaultFoundryManifest({
      workspaceName: "valid-workspace"
    })
  );

  const result = await runFoundry([
    "manifest",
    "validate",
    workspaceRoot,
    "--check"
  ]);

  if (result.exitCode !== 0) {
    return [
      {
        code: "valid-workspace-check-failed",
        message: formatCommandFailure(
          "Expected valid workspace check to pass.",
          result
        )
      }
    ];
  }

  if (!result.stdout.includes("Manifest is valid.")) {
    return [
      {
        code: "valid-workspace-output-missing-success",
        message: formatCommandFailure(
          "Expected human output to report that manifest is valid.",
          result
        )
      }
    ];
  }

  return [];
}

async function verifyJsonOutput(
  fixtureRoot: string
): Promise<readonly VerificationIssue[]> {
  const workspaceRoot = path.join(fixtureRoot, "json-workspace");
  const manifestPath = path.join(workspaceRoot, ".foundry/manifest.json");

  await writeJsonFile(
    manifestPath,
    createDefaultFoundryManifest({
      workspaceName: "json-workspace",
      databaseProviderId: "supabase:client"
    })
  );

  const result = await runFoundry([
    "manifest",
    "validate",
    workspaceRoot,
    "--json"
  ]);

  if (result.exitCode !== 0) {
    return [
      {
        code: "json-output-command-failed",
        message: formatCommandFailure(
          "Expected JSON validation command to pass.",
          result
        )
      }
    ];
  }

  try {
    const parsed = JSON.parse(result.stdout) as {
      readonly ok?: unknown;
      readonly manifest?: {
        readonly workspace?: {
          readonly name?: unknown;
        };
        readonly providers?: {
          readonly database?: readonly {
            readonly id?: unknown;
          }[];
        };
      };
    };

    const providerId = parsed.manifest?.providers?.database?.[0]?.id;

    if (parsed.ok !== true) {
      return [
        {
          code: "json-output-not-ok",
          message: formatCommandFailure(
            "Expected JSON result ok to be true.",
            result
          )
        }
      ];
    }

    if (parsed.manifest?.workspace?.name !== "json-workspace") {
      return [
        {
          code: "json-output-workspace-name",
          message: formatCommandFailure(
            "Expected JSON result to include workspace name.",
            result
          )
        }
      ];
    }

    if (providerId !== "supabase:client") {
      return [
        {
          code: "json-output-provider-id",
          message: formatCommandFailure(
            `Expected provider supabase:client, received ${String(providerId)}.`,
            result
          )
        }
      ];
    }
  } catch (error) {
    return [
      {
        code: "json-output-parse-failed",
        message: formatCommandFailure(
          error instanceof Error
            ? error.message
            : "Failed to parse JSON output.",
          result
        )
      }
    ];
  }

  return [];
}

async function verifyCheckModeFailsForMissingManifest(
  fixtureRoot: string
): Promise<readonly VerificationIssue[]> {
  const workspaceRoot = path.join(fixtureRoot, "missing-manifest");

  await mkdir(workspaceRoot, { recursive: true });

  const humanResult = await runFoundry([
    "manifest",
    "validate",
    workspaceRoot,
    "--check"
  ]);

  if (humanResult.exitCode === 0) {
    return [
      {
        code: "missing-manifest-check-passed",
        message: formatCommandFailure(
          "Expected --check to fail for missing manifest.",
          humanResult
        )
      }
    ];
  }

  const jsonResult = await runFoundry([
    "manifest",
    "validate",
    workspaceRoot,
    "--json"
  ]);

  if (jsonResult.exitCode !== 0) {
    return [
      {
        code: "missing-manifest-json-failed",
        message: formatCommandFailure(
          "Expected missing manifest JSON command to print a result without --check.",
          jsonResult
        )
      }
    ];
  }

  try {
    const parsed = JSON.parse(jsonResult.stdout) as {
      readonly ok?: unknown;
      readonly status?: unknown;
    };

    if (parsed.ok !== false || parsed.status !== "missing") {
      return [
        {
          code: "missing-manifest-json-shape",
          message: formatCommandFailure(
            "Expected missing manifest JSON result with ok=false and status=missing.",
            jsonResult
          )
        }
      ];
    }
  } catch (error) {
    return [
      {
        code: "missing-manifest-json-parse-failed",
        message: formatCommandFailure(
          error instanceof Error
            ? error.message
            : "Failed to parse missing manifest JSON output.",
          jsonResult
        )
      }
    ];
  }

  return [];
}

async function verifyCustomManifestPath(
  fixtureRoot: string
): Promise<readonly VerificationIssue[]> {
  const workspaceRoot = path.join(fixtureRoot, "custom-manifest");
  const customManifestPath = "config/foundry/custom-manifest.json";

  await writeJsonFile(
    path.join(workspaceRoot, customManifestPath),
    createDefaultFoundryManifest({
      workspaceName: "custom-manifest"
    })
  );

  const result = await runFoundry([
    "manifest",
    "validate",
    workspaceRoot,
    "--manifest",
    customManifestPath,
    "--check"
  ]);

  if (result.exitCode !== 0) {
    return [
      {
        code: "custom-manifest-command-failed",
        message: formatCommandFailure(
          "Expected custom manifest path validation to pass.",
          result
        )
      }
    ];
  }

  return [];
}

async function runFoundry(args: readonly string[]): Promise<CommandResult> {
  const commandParts = ["bash", "tools/scripts/foundry.sh", ...args];

  const process = Bun.spawn(commandParts, {
    stdout: "pipe",
    stderr: "pipe"
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited
  ]);

  return {
    command: commandParts.join(" "),
    exitCode,
    stdout,
    stderr
  };
}

function formatCommandFailure(
  message: string,
  result: CommandResult
): string {
  return `${message}

Command:
${result.command}

Exit code:
${result.exitCode}

stdout:
${result.stdout.trim().length > 0 ? result.stdout : "(empty)"}

stderr:
${result.stderr.trim().length > 0 ? result.stderr : "(empty)"}`;
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

await main();
