import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type RepositorySurfaceKind = "upgrade" | "evolve";

export interface RepositorySurfaceReport {
  readonly ok: boolean;
  readonly command: RepositorySurfaceKind;
  readonly mode: "diagnostic";
  readonly generatedAt: string;
  readonly repoRoot: string;
  readonly detected: {
    readonly packageJson: boolean;
    readonly foundryDirectory: boolean;
    readonly foundryManifest: boolean;
    readonly initProvenance: boolean;
    readonly docsDirectory: boolean;
    readonly gitDirectory: boolean;
  };
  readonly packageName: string | null;
  readonly nextSteps: readonly string[];
  readonly notes: readonly string[];
}

export interface RepositorySurfaceOptions {
  readonly command: RepositorySurfaceKind;
  readonly repoRoot: string;
}

export function createRepositorySurfaceReport(
  options: RepositorySurfaceOptions
): RepositorySurfaceReport {
  const repoRoot = resolve(options.repoRoot);
  const packageJsonPath = resolve(repoRoot, "package.json");

  const detected = {
    packageJson: existsSync(packageJsonPath),
    foundryDirectory: existsSync(resolve(repoRoot, ".foundry")),
    foundryManifest: existsSync(resolve(repoRoot, ".foundry/manifest.json")),
    initProvenance: existsSync(resolve(repoRoot, ".foundry/init/provenance.json")),
    docsDirectory: existsSync(resolve(repoRoot, "docs")),
    gitDirectory: existsSync(resolve(repoRoot, ".git"))
  };

  return {
    ok: true,
    command: options.command,
    mode: "diagnostic",
    generatedAt: new Date().toISOString(),
    repoRoot,
    detected,
    packageName: readPackageName(packageJsonPath),
    nextSteps: nextStepsForCommand(options.command),
    notes: [
      `${options.command} is registered as a read-only diagnostic command surface.`,
      "Repository mutation is intentionally deferred to a later governed implementation slice."
    ]
  };
}

export function formatRepositorySurfaceReportAsJson(
  report: RepositorySurfaceReport
): string {
  return JSON.stringify(report, null, 2);
}

export function formatRepositorySurfaceReportAsText(
  report: RepositorySurfaceReport
): string {
  const lines: string[] = [];

  lines.push(`Foundry ${report.command} diagnostic`);
  lines.push("");
  lines.push(`Status: ${report.ok ? "ok" : "failed"}`);
  lines.push(`Mode: ${report.mode}`);
  lines.push(`Repository root: ${report.repoRoot}`);
  lines.push(`Package name: ${report.packageName ?? "(not detected)"}`);
  lines.push("");
  lines.push("Detected:");
  lines.push(`- package.json: ${String(report.detected.packageJson)}`);
  lines.push(`- .foundry directory: ${String(report.detected.foundryDirectory)}`);
  lines.push(`- .foundry/manifest.json: ${String(report.detected.foundryManifest)}`);
  lines.push(`- .foundry/init/provenance.json: ${String(report.detected.initProvenance)}`);
  lines.push(`- docs directory: ${String(report.detected.docsDirectory)}`);
  lines.push(`- .git directory: ${String(report.detected.gitDirectory)}`);

  if (report.nextSteps.length > 0) {
    lines.push("");
    lines.push("Next steps:");

    for (const nextStep of report.nextSteps) {
      lines.push(`- ${nextStep}`);
    }
  }

  if (report.notes.length > 0) {
    lines.push("");
    lines.push("Notes:");

    for (const note of report.notes) {
      lines.push(`- ${note}`);
    }
  }

  return lines.join("\n");
}

export function writeRepositorySurfaceReport(
  options: {
    readonly report: RepositorySurfaceReport;
    readonly reportPath: string;
  }
): void {
  const outputPath = resolve(options.reportPath);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    `${formatRepositorySurfaceReportAsJson(options.report)}\n`,
    "utf8"
  );
}

function readPackageName(packageJsonPath: string): string | null {
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const name = (parsed as { readonly name?: unknown }).name;

    return typeof name === "string" && name.trim().length > 0 ? name : null;
  } catch {
    return null;
  }
}

function nextStepsForCommand(command: RepositorySurfaceKind): readonly string[] {
  if (command === "upgrade") {
    return [
      "Add upgrade inspect mode for existing Foundry workspaces.",
      "Add upgrade plan output without writing files.",
      "Add governed upgrade application after plan review."
    ];
  }

  return [
    "Add evolve inspect mode for repository capability detection.",
    "Add evolve plan output for adding providers, docs, CI, or apps.",
    "Add governed evolution application after plan review."
  ];
}
