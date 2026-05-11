import { Command } from "@oclif/core";

export default class Spec extends Command {
  static override description = "Work with Foundry native specifications.";

  static override examples = [
    '$ foundry spec create "Add authentication"',
    "$ foundry spec validate specs/features/0001-add-authentication/spec.md",
    "$ foundry spec validate specs/features/0001-add-authentication/spec.md --json",
    "$ foundry spec validate specs/features/0001-add-authentication/spec.md --warnings-as-errors",
  ];

  async run(): Promise<void> {
    this.log("Foundry native specification commands.");
    this.log("");
    this.log("USAGE");
    this.log("  $ foundry spec create TITLE");
    this.log("  $ foundry spec validate SPEC_PATH");
    this.log("");
    this.log("COMMANDS");
    this.log("  spec create    Create a Foundry native specification file.");
    this.log("  spec validate  Validate a Foundry native specification file.");
  }
}
