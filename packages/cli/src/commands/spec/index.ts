import { Command } from "@oclif/core";

export default class Spec extends Command {
  static override description = "Work with Foundry native specifications.";

  static override examples = [
    '$ foundry spec create "Add authentication"',
    "$ foundry spec validate specs/features/0001-add-authentication/spec.md",
    "$ foundry spec clarify specs/features/0001-add-authentication/spec.md",
    "$ foundry spec plan specs/features/0001-add-authentication/spec.md",
    "$ foundry spec tasks specs/features/0001-add-authentication/implementation-plan.md",
    "$ foundry spec validate specs/features/0001-add-authentication/spec.md --json",
  ];

  async run(): Promise<void> {
    this.log("Foundry native specification commands.");
    this.log("");
    this.log("USAGE");
    this.log("  $ foundry spec create TITLE");
    this.log("  $ foundry spec validate SPEC_PATH");
    this.log("  $ foundry spec clarify SPEC_PATH");
    this.log("  $ foundry spec plan SPEC_PATH");
    this.log("  $ foundry spec tasks PLAN_PATH");
    this.log("");
    this.log("COMMANDS");
    this.log("  spec create    Create a Foundry native specification file.");
    this.log("  spec validate  Validate a Foundry native specification file.");
    this.log("  spec clarify   Generate a clarification report for a native spec.");
    this.log("  spec plan      Generate an implementation plan for a native spec.");
    this.log("  spec tasks     Generate implementation tasks from a native spec plan.");
  }
}