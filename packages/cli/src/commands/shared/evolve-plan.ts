import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type {
  RepositoryInspectionReport,
  RepositorySurfaceReport
} from "./repo-surface.js";

export type EvolvePlanPriority = "critical" | "high" | "medium" | "low";

export type EvolvePlanActionStatus = "planned" | "already-satisfied";

export type EvolveCapability =
  | "apps"
  | "services"
  | "packages"
  | "docs"
  | "ci"
  | "providers"
  | "verification"
  | "ai-context"
  | "governance"
  | "generated-clients";

export interface EvolvePlanAction {
  readonly id: string;
  readonly capability: EvolveCapability;
  readonly priority: EvolvePlanPriority;
  readonly status: EvolvePlanActionStatus;
  readonly title: string;
  readonly detail: string;
  readonly rationale: string;
  readonly verification: readonly string[];
}

export interface EvolvePlanSummary {
  readonly actionCount: number;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly mediumCount: number;
  readonly lowCount: number;
  readonly plannedCount: number;
  readonly alreadySatisfiedCount: number;
  readonly capabilities: readonly EvolveCapability[];
}

export interface EvolvePlanReport {
  readonly ok: true;
  readonly kind: "evolve-plan";
  readonly mode: "read-only";
  readonly generatedAt: string;
  readonly repoRoot: string;
  readonly packageName: string | null;
  readonly summary: EvolvePlanSummary;
  readonly actions: readonly EvolvePlanAction[];
  readonly inspection: RepositoryInspectionReport;
  readonly notes: readonly string[];
}

export function createEvolvePlanReport(
  surfaceReport: RepositorySurfaceReport
): EvolvePlanReport {
  const actions = createEvolvePlanActions(surfaceReport.inspection);

  return {
    ok: true,
    kind: "evolve-plan",
    mode: "read-only",
    generatedAt: new Date().toISOString(),
    repoRoot: surfaceReport.repoRoot,
    packageName: surfaceReport.inspection.packageJson.name,
    summary: summarizeActions(actions),
    actions,
    inspection: surfaceReport.inspection,
    notes: [
      "This is a read-only evolve plan.",
      "No files were changed.",
      "A future governed slice will add apply/review behavior for selected capability additions."
    ]
  };
}

export function formatEvolvePlanReportAsJson(
  report: EvolvePlanReport
): string {
  return JSON.stringify(report, null, 2);
}

export function formatEvolvePlanReportAsText(
  report: EvolvePlanReport
): string {
  const lines: string[] = [];

  lines.push("Foundry evolve plan");
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
  lines.push(`- capabilities: ${report.summary.capabilities.join(", ") || "(none)"}`);

  for (const priority of ["critical", "high", "medium", "low"] as const) {
    const actions = report.actions.filter((action) => action.priority === priority);

    if (actions.length === 0) {
      continue;
    }

    lines.push("");
    lines.push(`${priority.toUpperCase()} actions:`);

    for (const action of actions) {
      lines.push(`- [${action.status}] ${action.id}: ${action.title}`);
      lines.push(`  Capability: ${action.capability}`);
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

export function writeEvolvePlanReport(options: {
  readonly report: EvolvePlanReport;
  readonly reportPath: string;
}): void {
  const outputPath = resolve(options.reportPath);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    `${formatEvolvePlanReportAsJson(options.report)}\n`,
    "utf8"
  );
}

function createEvolvePlanActions(
  inspection: RepositoryInspectionReport
): EvolvePlanAction[] {
  return [
    appsSurfaceAction(inspection),
    servicesSurfaceAction(inspection),
    packagesSurfaceAction(inspection),
    generatedClientsAction(inspection),
    docsGovernanceAction(inspection),
    aiContextAction(inspection),
    ciEvolutionAction(inspection),
    providerEvolutionAction(inspection),
    verificationEvolutionAction(inspection),
    governanceEvolutionAction(inspection)
  ];
}

function appsSurfaceAction(
  inspection: RepositoryInspectionReport
): EvolvePlanAction {
  if (inspection.repositoryShape.recognizedDirectories.includes("apps")) {
    return satisfied({
      id: "evolve.apps.surface-present",
      capability: "apps",
      priority: "medium",
      title: "Application surface directory is present.",
      detail: "The repository has an apps directory.",
      rationale: "Foundry evolution can add web, admin, docs, or other application surfaces under apps.",
      verification: ["test -d apps"]
    });
  }

  return planned({
    id: "evolve.apps.add-surface",
    capability: "apps",
    priority: "medium",
    title: "Add application surface directory.",
    detail: "The repository is missing an apps directory.",
    rationale: "A predictable apps directory enables future app-generation workflows.",
    verification: ["test -d apps"]
  });
}

function servicesSurfaceAction(
  inspection: RepositoryInspectionReport
): EvolvePlanAction {
  if (inspection.repositoryShape.recognizedDirectories.includes("services")) {
    return satisfied({
      id: "evolve.services.surface-present",
      capability: "services",
      priority: "medium",
      title: "Service surface directory is present.",
      detail: "The repository has a services directory.",
      rationale: "Foundry evolution can add APIs, workers, and background services under services.",
      verification: ["test -d services"]
    });
  }

  return planned({
    id: "evolve.services.add-surface",
    capability: "services",
    priority: "medium",
    title: "Add service surface directory.",
    detail: "The repository is missing a services directory.",
    rationale: "A predictable services directory enables future service-generation workflows.",
    verification: ["test -d services"]
  });
}

function packagesSurfaceAction(
  inspection: RepositoryInspectionReport
): EvolvePlanAction {
  if (
    inspection.repositoryShape.recognizedDirectories.includes("packages") &&
    inspection.workspace.hasPackageWorkspaces
  ) {
    return satisfied({
      id: "evolve.packages.surface-present",
      capability: "packages",
      priority: "medium",
      title: "Package surface and workspace registration are present.",
      detail: "The repository has a packages directory and package workspace configuration.",
      rationale: "Shared internal packages need both directory topology and workspace registration.",
      verification: ["test -d packages", "cat package.json"]
    });
  }

  return planned({
    id: "evolve.packages.configure-surface",
    capability: "packages",
    priority: "medium",
    title: "Configure package surface.",
    detail: "The repository is missing either a packages directory or package workspace configuration.",
    rationale: "Generated packages should be discoverable by the package manager and task runner.",
    verification: ["test -d packages", "cat package.json"]
  });
}

function generatedClientsAction(
  inspection: RepositoryInspectionReport
): EvolvePlanAction {
  if (
    inspection.repositoryShape.recognizedDirectories.includes("contracts") &&
    inspection.repositoryShape.recognizedDirectories.includes("generated")
  ) {
    return satisfied({
      id: "evolve.generated-clients.surface-present",
      capability: "generated-clients",
      priority: "low",
      title: "Contract and generated-client surfaces are present.",
      detail: "The repository has contracts and generated directories.",
      rationale: "API contract generation needs source contracts and generated output locations.",
      verification: ["test -d contracts", "test -d generated"]
    });
  }

  return planned({
    id: "evolve.generated-clients.add-surfaces",
    capability: "generated-clients",
    priority: "low",
    title: "Add contract and generated-client surfaces.",
    detail: "The repository is missing contracts or generated directories.",
    rationale: "Future API/client generation needs stable locations for OpenAPI specs and generated clients.",
    verification: ["test -d contracts", "test -d generated"]
  });
}

function docsGovernanceAction(
  inspection: RepositoryInspectionReport
): EvolvePlanAction {
  if (
    inspection.docs.hasDocsDirectory &&
    inspection.docs.hasWorkPackets &&
    inspection.docs.hasChangePlans &&
    inspection.docs.hasAdrDirectory
  ) {
    return satisfied({
      id: "evolve.docs.governance-present",
      capability: "docs",
      priority: "high",
      title: "Governed documentation surfaces are present.",
      detail: "Docs, Work Packets, ChangePlans, and ADR surfaces are present.",
      rationale: "Evolve actions should be planned through governed documentation.",
      verification: ["node packages/cli/bin/run.js docs verify"]
    });
  }

  return planned({
    id: "evolve.docs.bootstrap-governance",
    capability: "docs",
    priority: "high",
    title: "Bootstrap governed documentation surfaces.",
    detail: "One or more governed documentation surfaces are missing.",
    rationale: "Repository evolution needs a durable planning and decision trail.",
    verification: ["node packages/cli/bin/run.js docs verify"]
  });
}

function aiContextAction(
  inspection: RepositoryInspectionReport
): EvolvePlanAction {
  const hasAiBootstrap =
    inspection.repositoryShape.topLevelDirectories.includes("docs") &&
    inspection.repositoryShape.topLevelFiles.includes("README.md");

  if (hasAiBootstrap) {
    return satisfied({
      id: "evolve.ai-context.present",
      capability: "ai-context",
      priority: "low",
      title: "Basic AI-readable context anchors are present.",
      detail: "The repository has docs and README anchors that can support AI context hydration.",
      rationale: "AI-native workflows need durable context entry points.",
      verification: ["test -d docs", "test -f README.md"]
    });
  }

  return planned({
    id: "evolve.ai-context.bootstrap",
    capability: "ai-context",
    priority: "low",
    title: "Bootstrap AI-readable context anchors.",
    detail: "The repository is missing docs or README anchors.",
    rationale: "Future AI-assisted evolution should have stable context documents.",
    verification: ["test -d docs", "test -f README.md"]
  });
}

function ciEvolutionAction(
  inspection: RepositoryInspectionReport
): EvolvePlanAction {
  if (inspection.ci.hasGithubWorkflows && inspection.ci.workflows.length > 0) {
    return satisfied({
      id: "evolve.ci.present",
      capability: "ci",
      priority: "high",
      title: "CI workflows are present.",
      detail: `Detected workflows: ${inspection.ci.workflows.join(", ")}.`,
      rationale: "Repository evolution must remain protected by automated verification.",
      verification: ["ls .github/workflows"]
    });
  }

  return planned({
    id: "evolve.ci.add",
    capability: "ci",
    priority: "high",
    title: "Add CI workflows.",
    detail: "No GitHub Actions workflows were detected.",
    rationale: "Generated evolution actions should be enforced by CI.",
    verification: ["test -d .github/workflows"]
  });
}

function providerEvolutionAction(
  inspection: RepositoryInspectionReport
): EvolvePlanAction {
  if (inspection.repositoryShape.recognizedDirectories.includes("config")) {
    return satisfied({
      id: "evolve.providers.config-present",
      capability: "providers",
      priority: "medium",
      title: "Provider configuration surface is present.",
      detail: "The repository has a config directory.",
      rationale: "Provider additions need a stable configuration surface.",
      verification: ["test -d config"]
    });
  }

  return planned({
    id: "evolve.providers.add-config-surface",
    capability: "providers",
    priority: "medium",
    title: "Add provider configuration surface.",
    detail: "The repository is missing a config directory.",
    rationale: "Future provider additions should write configuration into a predictable location.",
    verification: ["test -d config"]
  });
}

function verificationEvolutionAction(
  inspection: RepositoryInspectionReport
): EvolvePlanAction {
  if (inspection.scripts.hasVerifyScript && inspection.scripts.hasToolsVerify) {
    return satisfied({
      id: "evolve.verification.present",
      capability: "verification",
      priority: "critical",
      title: "Repository verification command is present.",
      detail: "The repository has a package verify script and tools/scripts/verify.sh.",
      rationale: "Foundry should not evolve a repository without a deterministic verification command.",
      verification: ["bun run verify", "bash tools/scripts/verify.sh"]
    });
  }

  return planned({
    id: "evolve.verification.add",
    capability: "verification",
    priority: "critical",
    title: "Add repository verification command.",
    detail: "The repository is missing a package verify script or tools/scripts/verify.sh.",
    rationale: "A deterministic verification command is required before applying evolution actions.",
    verification: ["bun run verify"]
  });
}

function governanceEvolutionAction(
  inspection: RepositoryInspectionReport
): EvolvePlanAction {
  if (
    inspection.foundry.hasManifest &&
    inspection.foundry.hasInitProvenance &&
    inspection.foundry.hasInitAudit
  ) {
    return satisfied({
      id: "evolve.governance.anchors-present",
      capability: "governance",
      priority: "high",
      title: "Foundry governance anchors are present.",
      detail: "Foundry manifest, init provenance, and init audit anchors are present.",
      rationale: "Repository evolution should maintain a durable governance and audit trail.",
      verification: [
        "test -f .foundry/manifest.json",
        "test -f .foundry/init/provenance.json",
        "test -f .foundry/init/audit.ndjson"
      ]
    });
  }

  return planned({
    id: "evolve.governance.bootstrap-anchors",
    capability: "governance",
    priority: "high",
    title: "Bootstrap Foundry governance anchors.",
    detail: "One or more Foundry governance anchors are missing.",
    rationale: "Evolve actions need a durable manifest, provenance, and audit layer.",
    verification: [
      "test -f .foundry/manifest.json",
      "test -f .foundry/init/provenance.json",
      "test -f .foundry/init/audit.ndjson"
    ]
  });
}

function planned(input: Omit<EvolvePlanAction, "status">): EvolvePlanAction {
  return {
    ...input,
    status: "planned"
  };
}

function satisfied(input: Omit<EvolvePlanAction, "status">): EvolvePlanAction {
  return {
    ...input,
    status: "already-satisfied"
  };
}

function summarizeActions(
  actions: readonly EvolvePlanAction[]
): EvolvePlanSummary {
  return {
    actionCount: actions.length,
    criticalCount: countByPriority(actions, "critical"),
    highCount: countByPriority(actions, "high"),
    mediumCount: countByPriority(actions, "medium"),
    lowCount: countByPriority(actions, "low"),
    plannedCount: actions.filter((action) => action.status === "planned").length,
    alreadySatisfiedCount: actions.filter((action) => action.status === "already-satisfied").length,
    capabilities: uniqueCapabilities(actions)
  };
}

function countByPriority(
  actions: readonly EvolvePlanAction[],
  priority: EvolvePlanPriority
): number {
  return actions.filter((action) => action.priority === priority).length;
}

function uniqueCapabilities(
  actions: readonly EvolvePlanAction[]
): readonly EvolveCapability[] {
  return [...new Set(actions.map((action) => action.capability))].sort();
}
