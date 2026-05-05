import { Command, Flags } from "@oclif/core";

export default class Generate extends Command {
  static override summary = "Generate project artifacts.";

  static override description = `
Generate project artifacts through the governed Foundry scaffolding system.

This command is intentionally minimal in this slice. It proves that the oclif
command surface is wired correctly before generator engines are added.
`;

  static override examples = [
    {
      description: "Show the generate command help.",
      command: "<%= config.bin %> <%= command.id %> --help"
    },
    {
      description: "Preview a future generator run.",
      command: "<%= config.bin %> <%= command.id %> --dry-run"
    }
  ];

  static override flags = {
    "dry-run": Flags.boolean({
      char: "d",
      default: false,
      description: "Preview the command without writing files."
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Generate);

    this.log("Foundry generator command surface is installed.");
    this.log(`Dry run: ${flags["dry-run"] ? "yes" : "no"}`);
    this.log("");
    this.log("Next implementation step:");
    this.log("  Add the generator registry and planning model.");
  }
}
