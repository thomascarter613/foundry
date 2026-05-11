import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, join, resolve } from "node:path";

export type RepositorySurfaceKind = "upgrade" | "evolve";

export interface RepositorySurfaceReport {
  readonly ok: boolean;
  readonly command: RepositorySurfaceKind;
  readonly mode: "diagnostic";
  readonly generatedAt: string;
  readonly repoRoot: string;
  readonly inspection: RepositoryInspectionReport;
  readonly nextSteps: readonly string[];
  readonly notes: readonly string[];
}

export interface RepositoryInspectionReport {
  readonly packageJson: PackageJsonInspection;
  readonly packageManager: PackageManagerInspection;
  readonly workspace: WorkspaceInspection;
  readonly foundry: FoundryInspection;
  readonly docs: DocsInspection;
  readonly ci: CiInspection;
  readonly scripts: ScriptInspection;
  readonly repositoryShape: RepositoryShapeInspection;
}

export interface PackageJsonInspection {
  readonly exists: boolean;
  readonly path: string;
  readonly validJson: boolean;
  readonly parseError: string | null;
  readonly name: string | null;
  readonly private: boolean | null;
  readonly version: string | null;
}

export interface PackageManagerInspection {
  readonly detected: string | null;
  readonly lockfiles: readonly string[];
  readonly packageManagerField: string | null;
  readonly bunConfigured: boolean;
}

export interface WorkspaceInspection {
  readonly hasPnpmWorkspace: boolean;
  readonly hasTurboConfig: boolean;
  readonly hasTsconfigBase: boolean;
  readonly hasBunfig: boolean;
  readonly hasPackageWorkspaces: boolean;
  readonly packageWorkspaces: readonly string[];
}

export interface FoundryInspection {
  readonly hasFoundryDirectory: boolean;
  readonly hasManifest: boolean;
  readonly hasInitProvenance: boolean;
  readonly hasInitAudit: boolean;
  readonly manifestPath: string;
  readonly provenancePath: string;
  readonly auditPath: string;
}

export interface DocsInspection {
  readonly hasDocsDirectory: boolean;
  readonly hasDocsIndex: boolean;
  readonly hasGovernanceDocs: boolean;
  readonly hasWorkPackets: boolean;
  readonly hasChangePlans: boolean;
  readonly hasAdrDirectory: boolean;
}

export interface CiInspection {
  readonly hasGithubWorkflows: boolean;
  readonly workflows: readonly string[];
}

export interface ScriptInspection {
  readonly packageScripts: readonly string[];
  readonly hasVerifyScript: boolean;
  readonly hasFoundryScript: boolean;
  readonly hasToolsVerify: boolean;
  readonly hasToolsFoundry: boolean;
}

export interface RepositoryShapeInspection {
  readonly hasGitDirectory: boolean;
  readonly topLevelDirectories: readonly string[];
  readonly topLevelFiles: readonly string[];
  readonly recognizedDirectories: readonly string[];
  readonly missingCommonDirectories: readonly string[];
}

export interface RepositorySurfaceOptions {
  readonly command: RepositorySurfaceKind;
  readonly repoRoot: string;
}

type JsonObject = Record<string, unknown>;

const commonFoundryDirectories = [
  "apps",
  "services",
  "packages",
  "docs",
  "tools",
  "contracts",
  "generated",
  "config",
  "templates"
] as const;

export function createRepositorySurfaceReport(
  options: RepositorySurfaceOptions
): RepositorySurfaceReport {
  const repoRoot = resolve(options.repoRoot);
  const inspection = inspectRepository(repoRoot);

  return {
    ok: true,
    command: options.command,
    mode: "diagnostic",
    generatedAt: new Date().toISOString(),
    repoRoot,
    inspection,
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
  const inspection = report.inspection;
  const lines: string[] = [];

  lines.push(`Foundry ${report.command} diagnostic`);
  lines.push("");
  lines.push(`Status: ${report.ok ? "ok" : "failed"}`);
  lines.push(`Mode: ${report.mode}`);
  lines.push(`Repository root: ${report.repoRoot}`);
  lines.push(`Package name: ${inspection.packageJson.name ?? "(not detected)"}`);
  lines.push(`Package manager: ${inspection.packageManager.detected ?? "(not detected)"}`);

  lines.push("");
  lines.push("Package:");
  lines.push(`- package.json: ${String(inspection.packageJson.exists)}`);
  lines.push(`- valid JSON: ${String(inspection.packageJson.validJson)}`);
  lines.push(`- private: ${String(inspection.packageJson.private)}`);
  lines.push(`- version: ${inspection.packageJson.version ?? "(not detected)"}`);

  lines.push("");
  lines.push("Workspace:");
  lines.push(`- package workspaces: ${String(inspection.workspace.hasPackageWorkspaces)}`);
  lines.push(`- workspace globs: ${inspection.workspace.packageWorkspaces.join(", ") || "(none)"}`);
  lines.push(`- turbo.json: ${String(inspection.workspace.hasTurboConfig)}`);
  lines.push(`- tsconfig.base.json: ${String(inspection.workspace.hasTsconfigBase)}`);
  lines.push(`- bunfig.toml: ${String(inspection.workspace.hasBunfig)}`);
  lines.push(`- pnpm-workspace.yaml: ${String(inspection.workspace.hasPnpmWorkspace)}`);

  lines.push("");
  lines.push("Foundry:");
  lines.push(`- .foundry directory: ${String(inspection.foundry.hasFoundryDirectory)}`);
  lines.push(`- manifest: ${String(inspection.foundry.hasManifest)}`);
  lines.push(`- init provenance: ${String(inspection.foundry.hasInitProvenance)}`);
  lines.push(`- init audit: ${String(inspection.foundry.hasInitAudit)}`);

  lines.push("");
  lines.push("Documentation:");
  lines.push(`- docs directory: ${String(inspection.docs.hasDocsDirectory)}`);
  lines.push(`- docs index: ${String(inspection.docs.hasDocsIndex)}`);
  lines.push(`- governance docs: ${String(inspection.docs.hasGovernanceDocs)}`);
  lines.push(`- work packets: ${String(inspection.docs.hasWorkPackets)}`);
  lines.push(`- change plans: ${String(inspection.docs.hasChangePlans)}`);
  lines.push(`- ADR directory: ${String(inspection.docs.hasAdrDirectory)}`);

  lines.push("");
  lines.push("CI:");
  lines.push(`- GitHub workflows: ${String(inspection.ci.hasGithubWorkflows)}`);
  for (const workflow of inspection.ci.workflows) {
    lines.push(`  - ${workflow}`);
  }

  lines.push("");
  lines.push("Scripts:");
  lines.push(`- package scripts: ${inspection.scripts.packageScripts.join(", ") || "(none)"}`);
  lines.push(`- package verify script: ${String(inspection.scripts.hasVerifyScript)}`);
  lines.push(`- package foundry script: ${String(inspection.scripts.hasFoundryScript)}`);
  lines.push(`- tools/scripts/verify.sh: ${String(inspection.scripts.hasToolsVerify)}`);
  lines.push(`- tools/scripts/foundry.sh: ${String(inspection.scripts.hasToolsFoundry)}`);

  lines.push("");
  lines.push("Repository shape:");
  lines.push(`- .git directory: ${String(inspection.repositoryShape.hasGitDirectory)}`);
  lines.push(`- recognized directories: ${inspection.repositoryShape.recognizedDirectories.join(", ") || "(none)"}`);
  lines.push(`- missing common directories: ${inspection.repositoryShape.missingCommonDirectories.join(", ") || "(none)"}`);

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

function inspectRepository(repoRoot: string): RepositoryInspectionReport {
  const packageJson = inspectPackageJson(repoRoot);
  const packageScripts = readPackageScripts(repoRoot);

  return {
    packageJson,
    packageManager: inspectPackageManager(repoRoot, packageJson),
    workspace: inspectWorkspace(repoRoot, packageJson),
    foundry: inspectFoundry(repoRoot),
    docs: inspectDocs(repoRoot),
    ci: inspectCi(repoRoot),
    scripts: inspectScripts(repoRoot, packageScripts),
    repositoryShape: inspectRepositoryShape(repoRoot)
  };
}

function inspectPackageJson(repoRoot: string): PackageJsonInspection {
  const path = join(repoRoot, "package.json");

  if (!existsSync(path)) {
    return {
      exists: false,
      path,
      validJson: false,
      parseError: null,
      name: null,
      private: null,
      version: null
    };
  }

  const parsed = readJsonObject(path);

  if (!parsed.ok) {
    return {
      exists: true,
      path,
      validJson: false,
      parseError: parsed.error,
      name: null,
      private: null,
      version: null
    };
  }

  return {
    exists: true,
    path,
    validJson: true,
    parseError: null,
    name: getString(parsed.value, "name"),
    private: getBoolean(parsed.value, "private"),
    version: getString(parsed.value, "version")
  };
}

function inspectPackageManager(
  repoRoot: string,
  packageJson: PackageJsonInspection
): PackageManagerInspection {
  const lockfiles = [
    "bun.lock",
    "bun.lockb",
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock"
  ].filter((file) => existsSync(join(repoRoot, file)));

  const packageJsonObject = readPackageJsonObject(repoRoot);
  const packageManagerField = packageJsonObject
    ? getString(packageJsonObject, "packageManager")
    : null;

  return {
    detected: detectPackageManager(lockfiles, packageManagerField),
    lockfiles,
    packageManagerField,
    bunConfigured:
      lockfiles.includes("bun.lock") ||
      lockfiles.includes("bun.lockb") ||
      Boolean(packageManagerField?.startsWith("bun@")) ||
      existsSync(join(repoRoot, "bunfig.toml")) ||
      packageJson.name === "foundry"
  };
}

function inspectWorkspace(
  repoRoot: string,
  packageJson: PackageJsonInspection
): WorkspaceInspection {
  const packageJsonObject = readPackageJsonObject(repoRoot);
  const packageWorkspaces = packageJsonObject
    ? readStringArray(packageJsonObject, "workspaces")
    : [];

  return {
    hasPnpmWorkspace: existsSync(join(repoRoot, "pnpm-workspace.yaml")),
    hasTurboConfig: existsSync(join(repoRoot, "turbo.json")),
    hasTsconfigBase: existsSync(join(repoRoot, "tsconfig.base.json")),
    hasBunfig: existsSync(join(repoRoot, "bunfig.toml")),
    hasPackageWorkspaces: packageJson.exists && packageWorkspaces.length > 0,
    packageWorkspaces
  };
}

function inspectFoundry(repoRoot: string): FoundryInspection {
  return {
    hasFoundryDirectory: existsSync(join(repoRoot, ".foundry")),
    hasManifest: existsSync(join(repoRoot, ".foundry/manifest.json")),
    hasInitProvenance: existsSync(join(repoRoot, ".foundry/init/provenance.json")),
    hasInitAudit: existsSync(join(repoRoot, ".foundry/init/audit.ndjson")),
    manifestPath: join(repoRoot, ".foundry/manifest.json"),
    provenancePath: join(repoRoot, ".foundry/init/provenance.json"),
    auditPath: join(repoRoot, ".foundry/init/audit.ndjson")
  };
}

function inspectDocs(repoRoot: string): DocsInspection {
  return {
    hasDocsDirectory: existsSync(join(repoRoot, "docs")),
    hasDocsIndex:
      existsSync(join(repoRoot, "docs/index.md")) ||
      existsSync(join(repoRoot, "docs/README.md")),
    hasGovernanceDocs: existsSync(join(repoRoot, "docs/governance")),
    hasWorkPackets: existsSync(join(repoRoot, "docs/work-packets")),
    hasChangePlans: existsSync(join(repoRoot, "docs/changeplans")),
    hasAdrDirectory:
      existsSync(join(repoRoot, "docs/adr")) ||
      existsSync(join(repoRoot, "docs/architecture/adr"))
  };
}

function inspectCi(repoRoot: string): CiInspection {
  const workflowsDirectory = join(repoRoot, ".github/workflows");

  if (!existsSync(workflowsDirectory)) {
    return {
      hasGithubWorkflows: false,
      workflows: []
    };
  }

  return {
    hasGithubWorkflows: true,
    workflows: safeReadDirectory(workflowsDirectory)
      .filter((entry) => entry.endsWith(".yml") || entry.endsWith(".yaml"))
      .sort()
  };
}

function inspectScripts(
  repoRoot: string,
  packageScripts: readonly string[]
): ScriptInspection {
  return {
    packageScripts,
    hasVerifyScript: packageScripts.includes("verify"),
    hasFoundryScript: packageScripts.includes("foundry"),
    hasToolsVerify: existsSync(join(repoRoot, "tools/scripts/verify.sh")),
    hasToolsFoundry: existsSync(join(repoRoot, "tools/scripts/foundry.sh"))
  };
}

function inspectRepositoryShape(repoRoot: string): RepositoryShapeInspection {
  const entries = safeReadDirectory(repoRoot);

  const topLevelDirectories = entries
    .filter((entry) => safeIsDirectory(join(repoRoot, entry)))
    .sort();

  const topLevelFiles = entries
    .filter((entry) => safeIsFile(join(repoRoot, entry)))
    .sort();

  const recognizedDirectories = commonFoundryDirectories.filter((directory) =>
    topLevelDirectories.includes(directory)
  );

  const missingCommonDirectories = commonFoundryDirectories.filter(
    (directory) => !topLevelDirectories.includes(directory)
  );

  return {
    hasGitDirectory: existsSync(join(repoRoot, ".git")),
    topLevelDirectories,
    topLevelFiles,
    recognizedDirectories,
    missingCommonDirectories
  };
}

function readPackageScripts(repoRoot: string): readonly string[] {
  const packageJsonObject = readPackageJsonObject(repoRoot);
  const scripts = packageJsonObject?.scripts;

  if (!scripts || typeof scripts !== "object" || Array.isArray(scripts)) {
    return [];
  }

  return Object.keys(scripts).sort();
}

function readPackageJsonObject(repoRoot: string): JsonObject | null {
  const path = join(repoRoot, "package.json");

  if (!existsSync(path)) {
    return null;
  }

  const parsed = readJsonObject(path);

  return parsed.ok ? parsed.value : null;
}

function readJsonObject(path: string):
  | { readonly ok: true; readonly value: JsonObject }
  | { readonly ok: false; readonly error: string } {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        ok: false,
        error: "top-level JSON value must be an object"
      };
    }

    return {
      ok: true,
      value: parsed as JsonObject
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function detectPackageManager(
  lockfiles: readonly string[],
  packageManagerField: string | null
): string | null {
  if (packageManagerField) {
    return packageManagerField.split("@")[0] ?? packageManagerField;
  }

  if (lockfiles.includes("bun.lock") || lockfiles.includes("bun.lockb")) {
    return "bun";
  }

  if (lockfiles.includes("pnpm-lock.yaml")) {
    return "pnpm";
  }

  if (lockfiles.includes("yarn.lock")) {
    return "yarn";
  }

  if (lockfiles.includes("package-lock.json")) {
    return "npm";
  }

  return null;
}

function readStringArray(record: JsonObject, key: string): readonly string[] {
  const value = record[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function getString(record: JsonObject, key: string): string | null {
  const value = record[key];

  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getBoolean(record: JsonObject, key: string): boolean | null {
  const value = record[key];

  return typeof value === "boolean" ? value : null;
}

function safeReadDirectory(path: string): readonly string[] {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}

function safeIsDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function safeIsFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
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
