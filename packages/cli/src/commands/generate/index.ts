import { runOrvalGenerator, type OrvalRunResult } from "../../generation/orval-runner.js";
import { runCopierGenerator, type CopierRunResult } from "../../generation/copier-runner.js";
import { Command, Flags } from "@oclif/core";

import {
  createGeneratorAuditEvent,
  formatAuditEventAsJson,
  type AuditBackendExecution,
  type AuditEventResult,
  type AuditPreflight,
  type GeneratorAuditEvent
} from "../../generation/audit.js";
import { writeGeneratorAuditLog, type AuditLogWriteResult } from "../../generation/audit-log-writer.js";
import { createGeneratorPlan } from "../../generation/planner.js";
import { runPlopGenerator, type PlopRunResult } from "../../generation/plop-runner.js";
import {
  formatPreflightFailure,
  runExecutionPreflight,
  type PreflightCheckResult
} from "../../generation/preflight.js";
import { runScaffdogGenerator, type ScaffdogRunResult } from "../../generation/scaffdog-runner.js";
import { listGenerators, requireGeneratorById } from "../../generation/registry.js";
import type { GeneratorInputValues, GeneratorPlan } from "../../generation/types.js";

type BackendRunResult =
  | {
      readonly kind: "scaffdog";
      readonly result: ScaffdogRunResult;
    }
  | {
      readonly kind: "plop";
      readonly result: PlopRunResult;
    }
  | {
      readonly kind: "copier";
      readonly result: CopierRunResult;
    }
  | {
      readonly kind: "orval";
      readonly result: OrvalRunResult;
    };

export default class Generate extends Command {
  static override summary = "Generate project artifacts.";

  static override description = `
Generate project artifacts through the governed Foundry scaffolding system.

By default, this command only previews generator plans. Use --execute to invoke
an available backend generator. Execution audit logs distinguish planned,
blocked, succeeded, and failed runs.
`;

  static override examples = [
    {
      description: "List available generators.",
      command: "<%= config.bin %> <%= command.id %> --list"
    },
    {
      description: "Preview an ADR generator run.",
      command:
        '<%= config.bin %> <%= command.id %> --generator governance-artifact:adr --identifier ADR-0002 --name "Select package generator engine"'
    },
    {
      description: "Execute an ADR generator run.",
      command:
        '<%= config.bin %> <%= command.id %> --generator governance-artifact:adr --identifier ADR-0002 --name "Select package generator engine" --execute'
    },
    {
      description: "Execute a TypeScript library package generator run.",
      command: '<%= config.bin %> <%= command.id %> --generator package:typescript-library --name "logger" --execute'
    },
    {
      description: "Persist an execution audit log for a package generator run.",
      command:
        '<%= config.bin %> <%= command.id %> --generator package:typescript-library --name "logger" --execute --write-audit-log'
    }
  ];

  static override flags = {
    "audit-event": Flags.boolean({
      default: false,
      description: "Print a structured audit event for the generated dry-run plan or execution result."
    }),
    "audit-log-dir": Flags.string({
      default: ".artifacts/foundry/audit",
      description: "Repository-relative directory where audit logs are written."
    }),
    contract: Flags.string({
      description: "Contract path for contract-derived generators."
    }),
    "dry-run": Flags.boolean({
      allowNo: false,
      default: true,
      description: "Preview planned operations without writing files."
    }),
    execute: Flags.boolean({
      default: false,
      description: "Execute the selected generator backend. Required for file writes."
    }),
    generator: Flags.string({
      char: "g",
      default: "governance-artifact:adr",
      description: "Generator ID to preview or execute."
    }),
    identifier: Flags.string({
      char: "i",
      description: "Stable identifier for generated governance artifacts."
    }),
    json: Flags.boolean({
      default: false,
      description: "Print the plan or execution result as JSON."
    }),
    list: Flags.boolean({
      char: "l",
      default: false,
      description: "List registered generators."
    }),
    name: Flags.string({
      char: "n",
      description: "Human-readable artifact name."
    }),
    status: Flags.string({
      description: "Artifact status, when supported by the generator."
    }),
    "write-audit-log": Flags.boolean({
      default: false,
      description: "Persist a structured audit event under the audit log directory."
    })
  };

  async run(): Promise<void> {
    const { argv: rawArgv, flags } = await this.parse(Generate);
    const argv = rawArgv.map((arg) => String(arg));

    if (flags.list) {
      this.printGeneratorList();
      return;
    }

    const generator = requireGeneratorById(flags.generator);
    const values: GeneratorInputValues = {
      contract: flags.contract,
      identifier: flags.identifier,
      name: flags.name,
      status: flags.status
    };

    const plan = createGeneratorPlan({
      generator,
      values
    });

    if (flags.execute) {
      if (plan.issues.length > 0) {
        const auditLogResult = await this.maybeWriteAuditLog({
          shouldWriteAuditLog: flags["write-audit-log"],
          auditLogDir: flags["audit-log-dir"],
          plan,
          argv,
          result: "blocked"
        });

        const auditEvent = this.createAuditEventForOutput({
          plan,
          argv,
          result: "blocked"
        });

        if (flags["audit-event"]) {
          this.log(formatAuditEventAsJson(auditEvent));
          return;
        }

        if (flags.json) {
          this.log(
            JSON.stringify(
              {
                plan,
                auditEvent,
                auditLog: auditLogResult
              },
              null,
              2
            )
          );
          return;
        }

        this.error(formatPlanIssueFailure(plan, auditLogResult), { exit: 1 });
      }

      const preflightResult = await runExecutionPreflight(plan);

      if (!preflightResult.ok) {
        const auditPreflight = auditPreflightFromPreflightResult(preflightResult);

        const auditLogResult = await this.maybeWriteAuditLog({
          shouldWriteAuditLog: flags["write-audit-log"],
          auditLogDir: flags["audit-log-dir"],
          plan,
          argv,
          result: "blocked",
          preflight: auditPreflight
        });

        const auditEvent = this.createAuditEventForOutput({
          plan,
          argv,
          result: "blocked",
          preflight: auditPreflight
        });

        if (flags["audit-event"]) {
          this.log(formatAuditEventAsJson(auditEvent));
          return;
        }

        if (flags.json) {
          this.log(
            JSON.stringify(
              {
                plan,
                preflight: preflightResult,
                auditEvent,
                auditLog: auditLogResult
              },
              null,
              2
            )
          );
          return;
        }

        this.error(formatPreflightFailureWithAuditLog(preflightResult, auditLogResult), { exit: 1 });
      }

      const backendRunResult = await this.executeBackend(plan);
      const backendAudit = auditBackendFromBackendRunResult(backendRunResult);
      const executionResult: AuditEventResult = backendAudit.exitCode === 0 ? "succeeded" : "failed";

      const auditLogResult = await this.maybeWriteAuditLog({
        shouldWriteAuditLog: flags["write-audit-log"],
        auditLogDir: flags["audit-log-dir"],
        plan,
        argv,
        result: executionResult,
        preflight: auditPreflightFromPreflightResult(preflightResult),
        backend: backendAudit
      });

      const auditEvent = this.createAuditEventForOutput({
        plan,
        argv,
        result: executionResult,
        preflight: auditPreflightFromPreflightResult(preflightResult),
        backend: backendAudit
      });

      if (backendAudit.exitCode !== 0) {
        if (flags["audit-event"]) {
          this.log(formatAuditEventAsJson(auditEvent));
          return;
        }

        if (flags.json) {
          this.log(
            JSON.stringify(
              {
                plan,
                preflight: preflightResult,
                backend: backendRunResult,
                auditEvent,
                auditLog: auditLogResult
              },
              null,
              2
            )
          );
          return;
        }

        this.error(formatBackendFailure(backendRunResult, auditLogResult), {
          exit: backendAudit.exitCode || 1
        });
      }

      if (flags["audit-event"]) {
        this.log(formatAuditEventAsJson(auditEvent));
        return;
      }

      if (flags.json) {
        this.log(
          JSON.stringify(
            {
              plan,
              preflight: preflightResult,
              backend: backendRunResult,
              auditEvent,
              auditLog: auditLogResult
            },
            null,
            2
          )
        );
        return;
      }

      this.printPlan(plan, auditLogResult, backendRunResult, preflightResult);
      return;
    }

    const auditLogResult = await this.maybeWriteAuditLog({
      shouldWriteAuditLog: flags["write-audit-log"],
      auditLogDir: flags["audit-log-dir"],
      plan,
      argv,
      result: "planned"
    });

    const auditEvent = this.createAuditEventForOutput({
      plan,
      argv,
      result: "planned"
    });

    if (flags["audit-event"]) {
      this.log(formatAuditEventAsJson(auditEvent));
      return;
    }

    if (flags.json) {
      this.log(JSON.stringify(plan, null, 2));
      return;
    }

    this.printPlan(plan, auditLogResult);
  }

  private async executeBackend(plan: GeneratorPlan): Promise<BackendRunResult> {
    if (plan.engine === "scaffdog") {
      const scaffdogResult = await runScaffdogGenerator({
        generatorId: plan.generatorId,
        inputs: plan.resolvedInputs
      });

      return {
        kind: "scaffdog",
        result: scaffdogResult
      };
    }

    if (plan.engine === "plop") {
      const plopResult = await runPlopGenerator({
        generatorId: plan.generatorId,
        inputs: plan.resolvedInputs
      });

      return {
        kind: "plop",
        result: plopResult
      };
    }

    if (plan.engine === "copier") {
      const copierResult = await runCopierGenerator({
        generatorId: plan.generatorId,
        inputs: plan.resolvedInputs
      });

      return {
        kind: "copier",
        result: copierResult
      };
    }

    if (plan.engine === "orval") {
      const orvalResult = await runOrvalGenerator({
        generatorId: plan.generatorId,
        inputs: plan.resolvedInputs
      });

      return {
        kind: "orval",
        result: orvalResult
      };
    }

    this.error(
      `Generator "${plan.generatorId}" uses engine "${plan.engine}", but that execution backend is not implemented yet.`,
      { exit: 1 }
    );
  }

  private async maybeWriteAuditLog(options: {
    readonly shouldWriteAuditLog: boolean;
    readonly auditLogDir: string;
    readonly plan: GeneratorPlan;
    readonly argv: readonly string[];
    readonly result: AuditEventResult;
    readonly preflight?: AuditPreflight;
    readonly backend?: AuditBackendExecution;
  }): Promise<AuditLogWriteResult | undefined> {
    if (!options.shouldWriteAuditLog) {
      return undefined;
    }

    const auditEvent: GeneratorAuditEvent = this.createAuditEventForOutput(options);

    return await writeGeneratorAuditLog({
      auditRoot: options.auditLogDir,
      event: auditEvent
    });
  }

  private createAuditEventForOutput(options: {
    readonly plan: GeneratorPlan;
    readonly argv: readonly string[];
    readonly result: AuditEventResult;
    readonly preflight?: AuditPreflight;
    readonly backend?: AuditBackendExecution;
  }): GeneratorAuditEvent {
    return createGeneratorAuditEvent({
      plan: options.plan,
      command: buildCommandString(options.argv),
      result: options.result,
      ...(options.preflight ? { preflight: options.preflight } : {}),
      ...(options.backend ? { backend: options.backend } : {})
    });
  }

  private printGeneratorList(): void {
    const generators = listGenerators();

    this.log("Registered generators:");
    this.log("");

    for (const generator of generators) {
      this.log(`- ${generator.id}`);
      this.log(`  name: ${generator.name}`);
      this.log(`  category: ${generator.category}`);
      this.log(`  engine: ${generator.engine}`);
      this.log(`  status: ${generator.status}`);
      this.log(`  overwrite policy: ${generator.overwritePolicy}`);
      this.log("");
    }

    this.log("Preview a generator:");
    this.log("  foundry generate --generator governance-artifact:adr --identifier ADR-0002 --name \"Example decision\"");
    this.log("");
    this.log("Execute an available generator:");
    this.log("  foundry generate --generator package:typescript-library --name \"logger\" --execute");
  }

  private printPlan(
    plan: GeneratorPlan,
    auditLogResult?: AuditLogWriteResult,
    backendRunResult?: BackendRunResult,
    preflightResult?: PreflightCheckResult
  ): void {
    this.log(`Generator: ${plan.generatorId}`);
    this.log(`Name: ${plan.generatorName}`);
    this.log(`Engine: ${plan.engine}`);
    this.log(`Dry run: ${backendRunResult ? "no" : "yes"}`);
    this.log("");
    this.log(plan.summary);
    this.log("");

    this.log("Resolved inputs:");
    for (const [key, value] of Object.entries(plan.resolvedInputs)) {
      this.log(`- ${key}: ${String(value)}`);
    }

    this.log("");
    this.log("Planned operations:");
    for (const operation of plan.operations) {
      this.log(`- ${operation.action}: ${operation.path}`);
      this.log(`  overwrite policy: ${operation.overwritePolicy}`);
      this.log(`  ${operation.description}`);
    }

    if (preflightResult) {
      this.log("");
      this.log("Execution preflight:");
      this.log(`- result: ${preflightResult.ok ? "passed" : "blocked"}`);
      this.log(`- checked paths: ${preflightResult.checkedPaths.length}`);

      if (preflightResult.issues.length > 0) {
        this.log("- issues:");
        for (const issue of preflightResult.issues) {
          this.log(`  - ${issue.code}: ${issue.path}`);
          this.log(`    ${issue.message}`);
        }
      }
    }

    if (backendRunResult) {
      this.printBackendRunResult(backendRunResult);
    }

    if (plan.validationCommands.length > 0) {
      this.log("");
      this.log("Recommended verification:");
      for (const command of plan.validationCommands) {
        this.log(`- ${command}`);
      }
    }

    if (plan.issues.length > 0) {
      this.log("");
      this.log("Plan issues:");
      for (const issue of plan.issues) {
        this.log(`- ${issue.level}: ${issue.message}`);
      }
    }

    if (auditLogResult) {
      this.log("");
      this.log("Audit log written:");
      this.log(`- ${auditLogResult.relativePath}`);
      this.log(`- ${auditLogResult.bytesWritten} bytes`);
    }

    this.log("");

    if (backendRunResult) {
      this.log("Scaffolded project files were written by the selected backend.");
      return;
    }

    this.log("No scaffolded project files were written. Pass --execute to run an available backend generator.");
  }

  private printBackendRunResult(backendRunResult: BackendRunResult): void {
    this.log("");

    if (backendRunResult.kind === "copier") {
      this.log("Copier execution:");
      this.log(`- template: ${backendRunResult.result.templatePath}`);
      this.log(`- destination: ${backendRunResult.result.destinationPath}`);
      this.log(`- command: ${backendRunResult.result.command}`);
      this.log(`- result: ${backendRunResult.result.exitCode === 0 ? "succeeded" : "failed"}`);

      const trimmedStdout = backendRunResult.result.stdout.trim();
      if (trimmedStdout.length > 0) {
        this.log("");
        this.log(trimmedStdout);
      }

      return;
    }

    if (backendRunResult.kind === "scaffdog") {
      this.log("Scaffdog execution:");
      this.log(`- document: ${backendRunResult.result.documentName}`);
      this.log(`- command: ${backendRunResult.result.command}`);
      this.log(`- result: ${backendRunResult.result.exitCode === 0 ? "succeeded" : "failed"}`);

      const trimmedStdout = backendRunResult.result.stdout.trim();
      if (trimmedStdout.length > 0) {
        this.log("");
        this.log(trimmedStdout);
      }

      return;
    }

    if (backendRunResult.kind === "orval") {
      this.log("Orval execution:");
      this.log(`- contract: ${backendRunResult.result.contractPath}`);
      this.log(`- target: ${backendRunResult.result.targetPath}`);
      this.log(`- schemas: ${backendRunResult.result.schemasPath}`);
      this.log(`- config: ${backendRunResult.result.configPath}`);
      this.log(`- command: ${backendRunResult.result.command}`);
      this.log(`- result: ${backendRunResult.result.exitCode === 0 ? "succeeded" : "failed"}`);

      const trimmedStdout = backendRunResult.result.stdout.trim();
      if (trimmedStdout.length > 0) {
        this.log("");
        this.log(trimmedStdout);
      }

      return;
    }

    this.log("Plop execution:");
    this.log(`- generator: ${backendRunResult.result.generatorName}`);
    this.log(`- command: ${backendRunResult.result.command}`);
    this.log(`- result: ${backendRunResult.result.exitCode === 0 ? "succeeded" : "failed"}`);

    const trimmedStdout = backendRunResult.result.stdout.trim();
    if (trimmedStdout.length > 0) {
      this.log("");
      this.log(trimmedStdout);
    }
  }
}

function buildCommandString(argv: readonly string[]): string {
  const escapedArgs = argv.map((arg) => {
    if (/^[a-zA-Z0-9:./=_-]+$/.test(arg)) {
      return arg;
    }

    return JSON.stringify(arg);
  });

  return ["foundry", "generate", ...escapedArgs].join(" ");
}

function auditPreflightFromPreflightResult(preflightResult: PreflightCheckResult): AuditPreflight {
  return {
    ok: preflightResult.ok,
    checkedPaths: preflightResult.checkedPaths,
    issues: preflightResult.issues.map((issue) => ({
      code: issue.code,
      path: issue.path,
      message: issue.message
    }))
  };
}

function auditBackendFromBackendRunResult(backendRunResult: BackendRunResult): AuditBackendExecution {
  if (backendRunResult.kind === "copier") {
    return {
      kind: "copier",
      command: backendRunResult.result.command,
      exitCode: backendRunResult.result.exitCode,
      stdoutPreview: backendRunResult.result.stdout,
      stderrPreview: backendRunResult.result.stderr,
      generatorName: backendRunResult.result.templatePath
    };
  }

  if (backendRunResult.kind === "scaffdog") {
    return {
      kind: "scaffdog",
      command: backendRunResult.result.command,
      exitCode: backendRunResult.result.exitCode,
      stdoutPreview: backendRunResult.result.stdout,
      stderrPreview: backendRunResult.result.stderr,
      documentName: backendRunResult.result.documentName
    };
  }


  if (backendRunResult.kind === "orval") {
    return {
      kind: "orval",
      command: backendRunResult.result.command,
      exitCode: backendRunResult.result.exitCode,
      stdoutPreview: backendRunResult.result.stdout,
      stderrPreview: backendRunResult.result.stderr,
      generatorName: backendRunResult.result.targetPath
    };
  }

  return {
    kind: "plop",
    command: backendRunResult.result.command,
    exitCode: backendRunResult.result.exitCode,
    stdoutPreview: backendRunResult.result.stdout,
    stderrPreview: backendRunResult.result.stderr,
    generatorName: backendRunResult.result.generatorName
  };
}

function formatPlanIssueFailure(plan: GeneratorPlan, auditLogResult?: AuditLogWriteResult): string {
  const issueSummary = plan.issues
    .map((issue) => `- ${issue.level}: ${issue.message}`)
    .join("\n");

  return [
    "Generator execution was blocked because the plan has unresolved issues.",
    "",
    issueSummary,
    "",
    ...(auditLogResult
      ? [
          "Audit log written:",
          `- ${auditLogResult.relativePath}`,
          `- ${auditLogResult.bytesWritten} bytes`,
          ""
        ]
      : []),
    "Run the command again with the required inputs."
  ].join("\n");
}

function formatPreflightFailureWithAuditLog(
  preflightResult: PreflightCheckResult,
  auditLogResult?: AuditLogWriteResult
): string {
  return [
    formatPreflightFailure(preflightResult),
    ...(auditLogResult
      ? [
          "",
          "Audit log written:",
          `- ${auditLogResult.relativePath}`,
          `- ${auditLogResult.bytesWritten} bytes`
        ]
      : [])
  ].join("\n");
}

function formatBackendFailure(
  backendRunResult: BackendRunResult,
  auditLogResult?: AuditLogWriteResult
): string {
  const backendName =
    backendRunResult.kind === "scaffdog"
      ? "Scaffdog"
      : backendRunResult.kind === "copier"
        ? "Copier"
        : backendRunResult.kind === "orval"
          ? "Orval"
          : "Plop";
  const command = backendRunResult.result.command;
  const exitCode = backendRunResult.result.exitCode;
  const stderr = backendRunResult.result.stderr || "(empty)";
  const stdout = backendRunResult.result.stdout || "(empty)";

  return [
    `${backendName} generator failed with exit code ${exitCode}.`,
    "",
    "Command:",
    command,
    "",
    "stderr:",
    stderr,
    "",
    "stdout:",
    stdout,
    ...(auditLogResult
      ? [
          "",
          "Audit log written:",
          `- ${auditLogResult.relativePath}`,
          `- ${auditLogResult.bytesWritten} bytes`
        ]
      : [])
  ].join("\n");
}
