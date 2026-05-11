import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type {
  RepositoryInspectionReport,
  RepositorySurfaceReport
} from "./repo-surface.js";

export type UpgradePlanPriority = "critical" | "high" | "medium" | "low";

export type UpgradePlanActionStatus = "planned" | "already-satisfied";

export interface UpgradePlanAction {
  readonly id: string;
  readonly priority: UpgradePlanPriority;
  readonly status: UpgradePlanActionStatus;
  readonly title: string;
  readonly detail: string;
  readonly rationale: string;
  readonly verification: readonly string[];
}

export interface UpgradePlanSummary {
  readonly actionCount: number;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly mediumCount: number;
  readonly lowCount: number;
  readonly plannedCount: number;
  readonly alreadySatisfiedCount: number;
}

export interface UpgradePlanReport {
  readonly ok: true;
  readonly kind: "upgrade-plan";
  readonly mode: "read-only";
  readonly generatedAt: string;
  readonly repoRoot: string;
  readonly packageName: string | null;
  readonly summary: UpgradePlanSummary;
  readonly actions: readonly UpgradePlanAction[];
  readonly inspection: RepositoryInspectionReport;
  readonly notes: readonly string[];
}

export function createUpgradePlanReport(
  surfaceReport: RepositorySurfaceReport
): UpgradePlanReport {
  const actions = createUpgradePlanActions(surfaceReport.inspection);

  return {
    ok: true,
    kind: "upgrade-plan",
    mode: "read-only",
    generatedAt: new Date().toISOString(),
    repoRoot: surfaceReport.repoRoot,
    packageName: surfaceReport.inspection.packageJson.name,
    summary: summarizeActions(actions),
    actions,
    inspection: surfaceReport.inspection,
    notes: [
      "This is a read-only upgrade plan.",
      "No files were changed.",
      "A future governed slice will add apply/review behavior."
    ]
  };
}

export function formatUpgradePlanReportAsJson(
  report: UpgradePlanReport
): string {
  return JSON.stringify(report, null, 2);
}

export function formatUpgradePlanReportAsText(
  report: UpgradePlanReport
): string {
  const lines: string[] = [];

  lines.push("Foundry upgrade plan");
  lines.push("");
  lines.push(`Status: ${report.ok ? "ok" : "failed"}`);
  lines.push(`Mode: ${report.mode}`);
  lines.push(`Repository root: ${report.repoRoot}`);
  lines.push(`Package name: ${report.packageName ?? "(not detected)"}`);
  lines.push("");
  lines.push("Summary:");
  lines.push(`- actions: ${report.summary.actionCount}`);
  lines.push(`- critical: ${report.summary.criticalCount}`);
  lines.push(`- high: ${report.summary.highCount}`);
  lines.push(`- medium: ${report.summary.mediumCount}`);
  lines.push(`- low: ${report.summary.lowCount}`);
  lines.push(`- planned: ${report.summary.plannedCount}`);
  lines.push(`- already satisfied: ${report.summary.alreadySatisfiedCount}`);

  for (const priority of ["critical", "high", "medium", "low"] as const) {
    const actions = report.actions.filter((action) => action.priority === priority);

    if (actions.length === 0) {
      continue;
    }

    lines.push("");
    lines.push(`${priority.toUpperCase()} actions:`);

    for (const action of actions) {
      lines.push(`- [${action.status}] ${action.id}: ${action.title}`);
      lines.push(`  ${action.detail}`);
      lines.push(`  Rationale: ${action.rationale}`);

      if (action.verification.length > 0) {
        lines.push("  Verification:");
        for (const command of action.verification) {
          lines.push(`  - ${command}`);
        }
      }
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

export function writeUpgradePlanReport(options: {
  readonly report: UpgradePlanReport;
  readonly reportPath: string;
}): void {
  const outputPath = resolve(options.reportPath);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    `${formatUpgradePlanReportAsJson(options.report)}\n`,
    "utf8"
  );
}

function createUpgradePlanActions(
  inspection: RepositoryInspectionReport
): UpgradePlanAction[] {
  return [
    packageJsonAction(inspection),
    packageManagerAction(inspection),
    workspaceConfigAction(inspection),
    foundryManifestAction(inspection),
    provenanceAction(inspection),
    docsGovernanceAction(inspection),
    ciWorkflowAction(inspection),
    verifyScriptAction(inspection),
    repoShapeAction(inspection)
  ];
}

function packageJsonAction(
  inspection: RepositoryInspectionReport
): UpgradePlanAction {
  if (inspection.packageJson.exists && inspection.packageJson.validJson) {
    return satisfied({
      id: "upgrade.package-json.present",
      priority: "critical",
      title: "Package manifest is present and parseable.",
      detail: "package.json exists and parses as JSON.",
      rationale: "Foundry upgrade planning needs package metadata before making safe recommendations.",
      verification: ["test -f package.json", "python3 -m json.tool package.json >/dev/null"]
    });
  }

  return planned({
    id: "upgrade.package-json.create-or-repair",
    priority: "critical",
    title: "Create or repair package.json.",
    detail: inspection.packageJson.exists
      ? "package.json exists but is not valid JSON."
      : "package.json is missing.",
    rationale: "Foundry needs a valid root package manifest to determine scripts, workspace layout, and package manager conventions.",
    verification: ["python3 -m json.tool package.json >/dev/null"]
  });
}

function packageManagerAction(
  inspection: RepositoryInspectionReport
): UpgradePlanAction {
  if (inspection.packageManager.detected === "bun" || inspection.packageManager.bunConfigured) {
    return satisfied({
      id: "upgrade.package-manager.bun",
      priority: "high",
      title: "Bun package manager signal is present.",
      detail: "The repository has Bun-compatible package manager signals.",
      rationale: "Foundry currently standardizes its MVP verification workflow around Bun.",
      verification: ["bun --version", "bun install --frozen-lockfile"]
    });
  }

  return planned({
    id: "upgrade.package-manager.align",
    priority: "high",
    title: "Align package manager configuration.",
    detail: `Detected package manager: ${inspection.packageManager.detected ?? "none"}.`,
    rationale: "A clear package manager signal prevents non-reproducible installs and CI drift.",
    verification: ["bun install --frozen-lockfile"]
  });
}

function workspaceConfigAction(
  inspection: RepositoryInspectionReport
): UpgradePlanAction {
  if (
    inspection.workspace.hasPackageWorkspaces &&
    inspection.workspace.hasTurboConfig &&
    inspection.workspace.hasTsconfigBase
  ) {
    return satisfied({
      id: "upgrade.workspace.configured",
      priority: "high",
      title: "Workspace configuration is present.",
      detail: "package workspaces, turbo.json, and tsconfig.base.json are present.",
      rationale: "Foundry upgrade and evolution workflows need a predictable workspace topology.",
      verification: ["test -f turbo.json", "test -f tsconfig.base.json"]
    });
  }

  return planned({
    id: "upgrade.workspace.configure",
    priority: "high",
    title: "Configure workspace topology.",
    detail: "One or more workspace configuration anchors are missing.",
    rationale: "Workspace configuration is required before Foundry can safely add apps, packages, services, providers, or generated code.",
    verification: ["test -f turbo.json", "test -f tsconfig.base.json"]
  });
}

function foundryManifestAction(
  inspection: RepositoryInspectionReport
): UpgradePlanAction {
  if (inspection.foundry.hasFoundryDirectory && inspection.foundry.hasManifest) {
    return satisfied({
      id: "upgrade.foundry.manifest.present",
      priority: "high",
      title: "Foundry manifest is present.",
      detail: ".foundry/manifest.json exists.",
      rationale: "The manifest is the durable anchor for future repo evolution state.",
      verification: ["test -f .foundry/manifest.json"]
    });
  }

  return planned({
    id: "upgrade.foundry.manifest.create",
    priority: "high",
    title: "Create Foundry manifest.",
    detail: ".foundry/manifest.json is missing.",
    rationale: "Foundry needs a durable local manifest before upgrade/evolve commands can track repo capabilities safely.",
    verification: ["test -f .foundry/manifest.json"]
  });
}

function provenanceAction(
  inspection: RepositoryInspectionReport
): UpgradePlanAction {
  if (inspection.foundry.hasInitProvenance && inspection.foundry.hasInitAudit) {
    return satisfied({
      id: "upgrade.provenance.present",
      priority: "medium",
      title: "Init provenance and audit anchors are present.",
      detail: ".foundry/init/provenance.json and .foundry/init/audit.ndjson exist.",
      rationale: "Provenance and audit records provide the traceability needed for governed repository evolution.",
      verification: [
        "test -f .foundry/init/provenance.json",
        "test -f .foundry/init/audit.ndjson"
      ]
    });
  }

  return planned({
    id: "upgrade.provenance.bootstrap",
    priority: "medium",
    title: "Bootstrap Foundry provenance and audit anchors.",
    detail: "One or more init provenance/audit anchors are missing.",
    rationale: "Future upgrade application should leave a durable audit trail.",
    verification: [
      "test -f .foundry/init/provenance.json",
      "test -f .foundry/init/audit.ndjson"
    ]
  });
}

function docsGovernanceAction(
  inspection: RepositoryInspectionReport
): UpgradePlanAction {
  if (
    inspection.docs.hasDocsDirectory &&
    inspection.docs.hasGovernanceDocs &&
    inspection.docs.hasWorkPackets &&
    inspection.docs.hasChangePlans &&
    inspection.docs.hasAdrDirectory
  ) {
    return satisfied({
      id: "upgrade.docs.governed",
      priority: "medium",
      title: "Governed docs topology is present.",
      detail: "Governance docs, work packets, change plans, and ADRs are present.",
      rationale: "Foundry upgrades should be planned and verified through governed documentation.",
      verification: ["node packages/cli/bin/run.js docs verify"]
    });
  }

  return planned({
    id: "upgrade.docs.bootstrap-governance",
    priority: "medium",
    title: "Bootstrap governed docs topology.",
    detail: "One or more governed documentation anchors are missing.",
    rationale: "Upgrade/evolve actions need a traceable control layer for decisions and verification.",
    verification: ["node packages/cli/bin/run.js docs verify"]
  });
}

function ciWorkflowAction(
  inspection: RepositoryInspectionReport
): UpgradePlanAction {
  if (inspection.ci.hasGithubWorkflows && inspection.ci.workflows.length > 0) {
    return satisfied({
      id: "upgrade.ci.present",
      priority: "medium",
      title: "CI workflow configuration is present.",
      detail: `Detected workflows: ${inspection.ci.workflows.join(", ")}.`,
      rationale: "CI prevents generated repository contracts from regressing silently.",
      verification: ["ls .github/workflows"]
    });
  }

  return planned({
    id: "upgrade.ci.add",
    priority: "medium",
    title: "Add CI workflow configuration.",
    detail: "No GitHub Actions workflows were detected.",
    rationale: "Foundry-generated and Foundry-evolved repositories should verify themselves in CI.",
    verification: ["test -d .github/workflows"]
  });
}

function verifyScriptAction(
  inspection: RepositoryInspectionReport
): UpgradePlanAction {
  if (
    inspection.scripts.hasVerifyScript &&
    inspection.scripts.hasToolsVerify
  ) {
    return satisfied({
      id: "upgrade.verify.present",
      priority: "high",
      title: "Verification script is present.",
      detail: "package.json has a verify script and tools/scripts/verify.sh exists.",
      rationale: "Foundry needs one command that proves repository health.",
      verification: ["bun run verify", "bash tools/scripts/verify.sh"]
    });
  }

  return planned({
    id: "upgrade.verify.add",
    priority: "high",
    title: "Add repository verification script.",
    detail: "The repository is missing either a package verify script or tools/scripts/verify.sh.",
    rationale: "A deterministic verification command is required before any upgrade can be safely applied.",
    verification: ["bun run verify"]
  });
}

function repoShapeAction(
  inspection: RepositoryInspectionReport
): UpgradePlanAction {
  if (inspection.repositoryShape.missingCommonDirectories.length === 0) {
    return satisfied({
      id: "upgrade.repo-shape.complete",
      priority: "low",
      title: "Common Foundry directories are present.",
      detail: "The repository contains the common Foundry top-level directories.",
      rationale: "A complete top-level shape improves discoverability and future generator behavior.",
      verification: ["find . -maxdepth 1 -type d | sort"]
    });
  }

  return planned({
    id: "upgrade.repo-shape.complete",
    priority: "low",
    title: "Add missing common Foundry directories.",
    detail: `Missing: ${inspection.repositoryShape.missingCommonDirectories.join(", ")}.`,
    rationale: "A predictable top-level shape makes generated repositories easier to inspect, verify, and evolve.",
    verification: ["find . -maxdepth 1 -type d | sort"]
  });
}

function planned(input: Omit<UpgradePlanAction, "status">): UpgradePlanAction {
  return {
    ...input,
    status: "planned"
  };
}

function satisfied(input: Omit<UpgradePlanAction, "status">): UpgradePlanAction {
  return {
    ...input,
    status: "already-satisfied"
  };
}

function summarizeActions(
  actions: readonly UpgradePlanAction[]
): UpgradePlanSummary {
  return {
    actionCount: actions.length,
    criticalCount: countByPriority(actions, "critical"),
    highCount: countByPriority(actions, "high"),
    mediumCount: countByPriority(actions, "medium"),
    lowCount: countByPriority(actions, "low"),
    plannedCount: actions.filter((action) => action.status === "planned").length,
    alreadySatisfiedCount: actions.filter((action) => action.status === "already-satisfied").length
  };
}

function countByPriority(
  actions: readonly UpgradePlanAction[],
  priority: UpgradePlanPriority
): number {
  return actions.filter((action) => action.priority === priority).length;
}
