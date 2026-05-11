import { Args, Command, Flags } from "@oclif/core";
import { isAbsolute, resolve } from "node:path";
import {
  parseFoundrySpecFile,
  validateFoundrySpec,
  type SpecValidationIssue,
  type SpecValidationResult,
} from "../../spec/index.js";

export default class SpecValidate extends Command {
  static override description =
    "Validate a Foundry native specification file.";

  static override examples = [
    "$ foundry spec validate docs/specs/features/0001-example/spec.md",
    "$ foundry spec validate docs/specs/features/0001-example/spec.md --json",
    "$ foundry spec validate docs/specs/features/0001-example/spec.md --warnings-as-errors",
  ];

  static override args = {
    specPath: Args.string({
      description: "Path to the Foundry native specification file to validate.",
      required: true,
    }),
  };

  static override flags = {
    json: Flags.boolean({
      description: "Print validation results as JSON.",
      default: false,
    }),
    "warnings-as-errors": Flags.boolean({
      description: "Treat warnings as validation failures.",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SpecValidate);

    const resolvedSpecPath = resolveWorkspacePath(args.specPath);
    const spec = await parseFoundrySpecFile(resolvedSpecPath);
    const result = validateFoundrySpec({
      ...spec,
      filePath: args.specPath,
    });

    const hasWarnings = result.issues.some((issue) => issue.severity === "warning");
    const failed = !result.ok || (flags["warnings-as-errors"] && hasWarnings);

    if (flags.json) {
      this.log(
        JSON.stringify(
          {
            ...result,
            ok: !failed,
            warningsAsErrors: flags["warnings-as-errors"],
          },
          null,
          2,
        ),
      );

      if (failed) {
        this.exit(1);
      }

      return;
    }

    printHumanValidationResult(this, result, {
      warningsAsErrors: flags["warnings-as-errors"],
      failed,
    });

    if (failed) {
      this.exit(1);
    }
  }
}

interface HumanValidationOptions {
  readonly warningsAsErrors: boolean;
  readonly failed: boolean;
}

function resolveWorkspacePath(inputPath: string): string {
  if (isAbsolute(inputPath)) {
    return inputPath;
  }

  const workspaceCwd =
    process.env.FOUNDRY_WORKSPACE_CWD ??
    process.env.INIT_CWD ??
    process.cwd();

  return resolve(workspaceCwd, inputPath);
}

function printHumanValidationResult(
  command: Command,
  result: SpecValidationResult,
  options: HumanValidationOptions,
): void {
  const errors = result.issues.filter((issue) => issue.severity === "error");
  const warnings = result.issues.filter((issue) => issue.severity === "warning");

  command.log(`Foundry spec validation: ${options.failed ? "failed" : "passed"}`);
  command.log(`File: ${result.filePath}`);
  command.log("");

  if (errors.length === 0 && warnings.length === 0) {
    command.log("No validation issues found.");
    return;
  }

  if (errors.length > 0) {
    command.log("Errors:");
    for (const issue of errors) {
      command.log(formatIssue(issue));
    }
    command.log("");
  }

  if (warnings.length > 0) {
    command.log("Warnings:");
    for (const issue of warnings) {
      command.log(formatIssue(issue));
    }

    if (options.warningsAsErrors) {
      command.log("");
      command.log("Warnings were treated as errors because --warnings-as-errors was passed.");
    }
  }
}

function formatIssue(issue: SpecValidationIssue): string {
  const target = issue.field ?? issue.section ?? "spec";

  return `- ${issue.code} [${target}]: ${issue.message}`;
}
