import { Args, Command, Flags } from "@oclif/core";
import path from "node:path";

import {
  readFoundryManifest,
  type FoundryManifestReadFailure,
  type FoundryManifestReadResult,
  type FoundryManifestReadSuccess
} from "../../manifest/reader.js";

export default class Manifest extends Command {
  static override readonly description = "Inspect and validate Foundry manifests.";

  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> validate",
    "<%= config.bin %> <%= command.id %> validate .",
    "<%= config.bin %> <%= command.id %> validate myapp",
    "<%= config.bin %> <%= command.id %> validate myapp --json",
    "<%= config.bin %> <%= command.id %> validate myapp --check",
    "<%= config.bin %> <%= command.id %> validate myapp --manifest .foundry/manifest.json"
  ];

  static override readonly args = {
    action: Args.string({
      description: "Manifest action to run.",
      required: true,
      options: ["validate"]
    }),

    workspace: Args.string({
      description:
        "Workspace directory to inspect. Defaults to the current invocation directory.",
      required: false
    })
  };

  static override readonly flags = {
    json: Flags.boolean({
      default: false,
      description: "Print validation result as JSON."
    }),

    check: Flags.boolean({
      default: false,
      description: "Exit non-zero when the manifest is missing or invalid."
    }),

    manifest: Flags.string({
      description:
        "Manifest path. Relative paths are resolved from the workspace root."
    })
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Manifest);

    if (args.action !== "validate") {
      this.error(`Unsupported manifest action: ${args.action}`, {
        exit: 2
      });
    }

    const workspaceRoot = resolveWorkspaceRoot(args.workspace);
    const result = await readFoundryManifest({
      workspaceRoot,
      ...(flags.manifest ? { manifestPath: flags.manifest } : {})
    });

    if (flags.json) {
      this.log(JSON.stringify(toJsonResult(result), null, 2));
    } else {
      printHumanResult(this, result);
    }

    if (flags.check && !result.ok) {
      this.exit(1);
    }
  }
}

function resolveWorkspaceRoot(workspace: string | undefined): string {
  const invocationCwd = getInvocationCwd();
  const workspaceValue = workspace ?? ".";

  return path.isAbsolute(workspaceValue)
    ? path.resolve(workspaceValue)
    : path.resolve(invocationCwd, workspaceValue);
}

function getInvocationCwd(): string {
  const invocationCwd = process.env.FOUNDRY_INVOCATION_CWD;

  if (typeof invocationCwd === "string" && invocationCwd.trim().length > 0) {
    return path.resolve(invocationCwd);
  }

  return process.cwd();
}

function printHumanResult(
  command: Command,
  result: FoundryManifestReadResult
): void {
  command.log("");
  command.log("Foundry manifest validation");
  command.log("");
  command.log(`Workspace: ${result.workspaceRoot}`);
  command.log(`Manifest: ${result.manifestPath}`);
  command.log(`Status: ${result.status}`);
  command.log(`Valid: ${result.ok ? "yes" : "no"}`);

  if (result.ok) {
    printManifestSummary(command, result);
    return;
  }

  printFailure(command, result);
}

function printManifestSummary(
  command: Command,
  result: FoundryManifestReadSuccess
): void {
  command.log("");
  command.log("Manifest summary:");
  command.log(`- Workspace name: ${result.manifest.workspace.name}`);
  command.log(`- Workspace kind: ${result.manifest.workspace.kind}`);
  command.log(`- Package manager: ${result.manifest.workspace.packageManager}`);
  command.log(`- Source of truth: ${result.manifest.workspace.sourceOfTruth}`);
  command.log(`- Foundry version: ${result.manifest.foundryVersion}`);
  command.log(`- Lifecycle model: ${result.manifest.lifecycle.model}`);
  command.log(`- AI mode: ${result.manifest.ai.mode}`);
  command.log(
    `- AI provider required: ${result.manifest.ai.providerRequired ? "yes" : "no"}`
  );

  const databaseProviders = result.manifest.providers?.database ?? [];
  const aiProviders = result.manifest.providers?.ai ?? [];

  if (databaseProviders.length > 0 || aiProviders.length > 0) {
    command.log("");
    command.log("Providers:");

    for (const provider of databaseProviders) {
      command.log(`- database: ${provider.id} (${provider.source ?? "unknown"})`);
    }

    for (const provider of aiProviders) {
      command.log(`- ai: ${provider.id} (${provider.source ?? "unknown"})`);
    }
  }

  command.log("");
  command.log("Result:");
  command.log("- Manifest is valid.");
}

function printFailure(command: Command, result: FoundryManifestReadFailure): void {
  command.log("");
  command.log("Issues:");

  for (const issue of result.issues) {
    command.log(`- ${issue.code}`);
    command.log(`  Path: ${issue.path}`);
    command.log(`  ${issue.message}`);
  }

  command.log("");
  command.log("Result:");
  command.log(`- ${result.errorMessage}`);
}

function toJsonResult(result: FoundryManifestReadResult): unknown {
  if (result.ok) {
    return {
      ok: true,
      status: result.status,
      workspaceRoot: result.workspaceRoot,
      manifestPath: result.manifestPath,
      issues: [],
      manifest: result.manifest
    };
  }

  return {
    ok: false,
    status: result.status,
    workspaceRoot: result.workspaceRoot,
    manifestPath: result.manifestPath,
    errorMessage: result.errorMessage,
    issues: result.issues
  };
}
