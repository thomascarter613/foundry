import { Command, Flags } from "@oclif/core";

import { createGeneratorPlan } from "../../generation/planner.js";
import { listGenerators, requireGeneratorById } from "../../generation/registry.js";
import type { GeneratorInputValues, GeneratorPlan } from "../../generation/types.js";

export default class Generate extends Command {
  static override summary = "Generate project artifacts.";

  static override description = `
Generate project artifacts through the governed Foundry scaffolding system.

This command currently supports registry listing and dry-run planning only.
It does not write files yet.
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
    }
  ];

  static override flags = {
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
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Generate);

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

    if (flags.json) {
      this.log(JSON.stringify(plan, null, 2));
      return;
    }

    this.printPlan(plan);
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

  private printPlan(plan: GeneratorPlan): void {
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

    this.log("");
    this.log("No files were written. File writing will be added in a later generator-engine slice.");
  }
}
