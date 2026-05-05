import { Command, Flags } from "@oclif/core";

import { createGeneratorAuditEvent, formatAuditEventAsJson, type GeneratorAuditEvent } from "../../generation/audit.js";
import { writeGeneratorAuditLog, type AuditLogWriteResult } from "../../generation/audit-log-writer.js";
import { createGeneratorPlan } from "../../generation/planner.js";
import { listGenerators, requireGeneratorById } from "../../generation/registry.js";
import type { GeneratorInputValues, GeneratorPlan } from "../../generation/types.js";

export default class Generate extends Command {
  static override summary = "Generate project artifacts.";

  static override description = `
Generate project artifacts through the governed Foundry scaffolding system.

This command currently supports registry listing, dry-run planning, audit event
preview, and explicit audit-log persistence. It does not scaffold project files yet.
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
      description: "Preview a TypeScript package generator run.",
      command: '<%= config.bin %> <%= command.id %> --generator package:typescript-library --name "logger"'
    },
    {
      description: "Print the dry-run plan as JSON.",
      command: '<%= config.bin %> <%= command.id %> --generator package:typescript-library --name "logger" --json'
    },
    {
      description: "Print a structured audit event for the dry-run plan.",
      command: '<%= config.bin %> <%= command.id %> --generator package:typescript-library --name "logger" --audit-event'
    },
    {
      description: "Persist an audit log for the dry-run plan.",
      command:
        '<%= config.bin %> <%= command.id %> --generator package:typescript-library --name "logger" --write-audit-log'
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
    generator: Flags.string({
      char: "g",
      default: "governance-artifact:adr",
      description: "Generator ID to preview."
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

    let auditEvent: GeneratorAuditEvent | undefined;
    let auditLogResult: AuditLogWriteResult | undefined;

    if (flags["audit-event"] || flags["write-audit-log"]) {
      auditEvent = createGeneratorAuditEvent({
        plan,
        command: buildCommandString(argv)
      });
    }

    if (flags["write-audit-log"]) {
      if (!auditEvent) {
        throw new Error("Cannot write audit log without an audit event.");
      }

      auditLogResult = await writeGeneratorAuditLog({
        auditRoot: flags["audit-log-dir"],
        event: auditEvent
      });
    }

    if (flags["audit-event"]) {
      if (!auditEvent) {
        throw new Error("Cannot print audit event because no audit event was created.");
      }

      this.log(formatAuditEventAsJson(auditEvent));
      return;
    }

    if (flags.json) {
      this.log(JSON.stringify(plan, null, 2));
      return;
    }

    this.printPlan(plan, auditLogResult);
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
  }

  private printPlan(plan: GeneratorPlan, auditLogResult?: AuditLogWriteResult): void {
    this.log(`Generator: ${plan.generatorId}`);
    this.log(`Name: ${plan.generatorName}`);
    this.log(`Engine: ${plan.engine}`);
    this.log(`Dry run: ${plan.dryRun ? "yes" : "no"}`);
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
    this.log("No scaffolded project files were written. Only the audit log is persisted when --write-audit-log is used.");
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
