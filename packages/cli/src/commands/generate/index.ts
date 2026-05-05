import { Command, Flags } from "@oclif/core";

import { createGeneratorAuditEvent, formatAuditEventAsJson, type GeneratorAuditEvent } from "../../generation/audit.js";
import { writeGeneratorAuditLog, type AuditLogWriteResult } from "../../generation/audit-log-writer.js";
import { createGeneratorPlan } from "../../generation/planner.js";
import { runScaffdogGenerator, type ScaffdogRunResult } from "../../generation/scaffdog-runner.js";
import { listGenerators, requireGeneratorById } from "../../generation/registry.js";
import type { GeneratorInputValues, GeneratorPlan } from "../../generation/types.js";

export default class Generate extends Command {
  static override summary = "Generate project artifacts.";

  static override description = `
Generate project artifacts through the governed Foundry scaffolding system.

By default, this command only previews generator plans. Use --execute to invoke
an available backend generator. The first supported execution backend is Scaffdog
for ADR and work-packet documents.
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
      description: "Execute a work-packet generator run.",
      command:
        '<%= config.bin %> <%= command.id %> --generator governance-artifact:work-packet --identifier WP-0001 --name "Add Scaffdog governance generator" --execute'
    },
    {
      description: "Persist an audit log for the dry-run plan.",
      command:
        '<%= config.bin %> <%= command.id %> --generator governance-artifact:adr --identifier ADR-0002 --name "Select package generator engine" --write-audit-log'
    }
  ];

  static override flags = {
    "audit-event": Flags.boolean({
      default: false,
      description: "Print a structured audit event for the generated dry-run plan."
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
      description: "Print the plan as JSON."
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
    const { argv, flags } = await this.parse(Generate);

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
      this.assertPlanIsExecutable(plan);

      if (generator.engine !== "scaffdog") {
        this.error(
          `Generator "${generator.id}" uses engine "${generator.engine}", but only Scaffdog execution is implemented in this slice.`,
          { exit: 1 }
        );
      }

      const scaffdogResult = await runScaffdogGenerator({
        generatorId: generator.id,
        inputs: plan.resolvedInputs
      });

      if (scaffdogResult.exitCode !== 0) {
        this.error(
          [
            `Scaffdog generator failed with exit code ${scaffdogResult.exitCode}.`,
            "",
            "Command:",
            scaffdogResult.command,
            "",
            "stderr:",
            scaffdogResult.stderr || "(empty)",
            "",
            "stdout:",
            scaffdogResult.stdout || "(empty)"
          ].join("\n"),
          { exit: scaffdogResult.exitCode }
        );
      }

      const auditLogResult = await this.maybeWriteAuditLog(flags["write-audit-log"], flags["audit-log-dir"], plan, argv);

      if (flags.json) {
        this.log(
          JSON.stringify(
            {
              plan,
              scaffdog: scaffdogResult,
              auditLog: auditLogResult
            },
            null,
            2
          )
        );
        return;
      }

      this.printPlan(plan, auditLogResult, scaffdogResult);
      return;
    }

    const auditLogResult = await this.maybeWriteAuditLog(flags["write-audit-log"], flags["audit-log-dir"], plan, argv);

    if (flags["audit-event"]) {
      const auditEvent = createGeneratorAuditEvent({
        plan,
        command: buildCommandString(argv)
      });

      this.log(formatAuditEventAsJson(auditEvent));
      return;
    }

    if (flags.json) {
      this.log(JSON.stringify(plan, null, 2));
      return;
    }

    this.printPlan(plan, auditLogResult);
  }

  private assertPlanIsExecutable(plan: GeneratorPlan): void {
    if (plan.issues.length === 0) {
      return;
    }

    const issueSummary = plan.issues
      .map((issue) => `- ${issue.level}: ${issue.message}`)
      .join("\n");

    this.error(
      [
        "Generator execution was blocked because the plan has unresolved issues.",
        "",
        issueSummary,
        "",
        "Run the command again with the required inputs."
      ].join("\n"),
      { exit: 1 }
    );
  }

  private async maybeWriteAuditLog(
    shouldWriteAuditLog: boolean,
    auditLogDir: string,
    plan: GeneratorPlan,
    argv: readonly string[]
  ): Promise<AuditLogWriteResult | undefined> {
    if (!shouldWriteAuditLog) {
      return undefined;
    }

    const auditEvent: GeneratorAuditEvent = createGeneratorAuditEvent({
      plan,
      command: buildCommandString(argv)
    });

    return await writeGeneratorAuditLog({
      auditRoot: auditLogDir,
      event: auditEvent
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
    this.log("  foundry generate --generator governance-artifact:adr --identifier ADR-0002 --name \"Example decision\" --execute");
  }

  private printPlan(
    plan: GeneratorPlan,
    auditLogResult?: AuditLogWriteResult,
    scaffdogResult?: ScaffdogRunResult
  ): void {
    this.log(`Generator: ${plan.generatorId}`);
    this.log(`Name: ${plan.generatorName}`);
    this.log(`Engine: ${plan.engine}`);
    this.log(`Dry run: ${scaffdogResult ? "no" : "yes"}`);
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

    if (scaffdogResult) {
      this.log("");
      this.log("Scaffdog execution:");
      this.log(`- document: ${scaffdogResult.documentName}`);
      this.log(`- command: ${scaffdogResult.command}`);
      this.log("- result: succeeded");

      const trimmedStdout = scaffdogResult.stdout.trim();
      if (trimmedStdout.length > 0) {
        this.log("");
        this.log(trimmedStdout);
      }
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

    if (scaffdogResult) {
      this.log("Scaffolded project files were written by Scaffdog.");
      return;
    }

    this.log("No scaffolded project files were written. Pass --execute to run an available backend generator.");
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
