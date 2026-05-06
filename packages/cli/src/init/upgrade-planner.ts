import { access, readFile } from "node:fs/promises";
import path from "node:path";

export type InitWorkspaceUpgradePlanStatus =
  | "not-foundry-workspace"
  | "current"
  | "upgrade-available"
  | "invalid-foundry-workspace";

export interface InitWorkspaceUpgradePlan {
  readonly workspaceRoot: string;
  readonly status: InitWorkspaceUpgradePlanStatus;
  readonly detected: InitWorkspaceDetection;
  readonly currentVersion: string | undefined;
  readonly targetVersion: string;
  readonly missingFiles: readonly InitWorkspaceRequiredFile[];
  readonly presentFiles: readonly InitWorkspaceRequiredFile[];
  readonly warnings: readonly InitWorkspaceUpgradeWarning[];
  readonly actions: readonly InitWorkspaceUpgradeAction[];
}

export interface InitWorkspaceDetection {
  readonly hasFoundryDirectory: boolean;
  readonly hasInitProvenance: boolean;
  readonly hasInitAuditLog: boolean;
  readonly hasGeneratorManifest: boolean;
  readonly generatedByFoundryInit: boolean;
}

export interface InitWorkspaceRequiredFile {
  readonly path: string;
  readonly description: string;
}

export interface InitWorkspaceUpgradeWarning {
  readonly code: string;
  readonly message: string;
}

export interface InitWorkspaceUpgradeAction {
  readonly type:
    | "create-file"
    | "review-file"
    | "preserve-file"
    | "manual-review";
  readonly path: string;
  readonly description: string;
}

interface FoundryInitProvenance {
  readonly schemaVersion?: unknown;
  readonly generatedBy?: {
    readonly command?: unknown;
  };
  readonly workspace?: {
    readonly name?: unknown;
  };
}

const targetFoundryInitVersion = "1.0.0";

const requiredV1Files: readonly InitWorkspaceRequiredFile[] = [
  {
    path: "package.json",
    description: "Root package manifest."
  },
  {
    path: "README.md",
    description: "Root workspace README."
  },
  {
    path: "bunfig.toml",
    description: "Bun workspace configuration."
  },
  {
    path: ".gitignore",
    description: "Git ignore rules."
  },
  {
    path: ".gitattributes",
    description: "Git attributes baseline."
  },
  {
    path: ".editorconfig",
    description: "EditorConfig baseline."
  },
  {
    path: "CONTRIBUTING.md",
    description: "Contribution guide."
  },
  {
    path: "SECURITY.md",
    description: "Security policy."
  },
  {
    path: ".github/workflows/ci.yml",
    description: "CI workflow."
  },
  {
    path: ".github/pull_request_template.md",
    description: "Pull request template."
  },
  {
    path: "tools/scripts/foundry.sh",
    description: "Foundry CLI wrapper."
  },
  {
    path: "tools/scripts/verify.sh",
    description: "Generated workspace verification script."
  },
  {
    path: "packages/cli/src/index.ts",
    description: "Embedded minimal Foundry CLI entrypoint."
  },
  {
    path: "config/foundry/generator-manifest.json",
    description: "Generator manifest."
  },
  {
    path: ".scaffdog/config.js",
    description: "Scaffdog configuration."
  },
  {
    path: "docs/ai/BOOTSTRAP_PROMPT.md",
    description: "AI bootstrap prompt."
  },
  {
    path: "docs/ai/CURRENT_STATE.md",
    description: "AI current-state handoff note."
  },
  {
    path: ".foundry/README.md",
    description: "Foundry metadata README."
  },
  {
    path: ".foundry/init/provenance.json",
    description: "Foundry init provenance metadata."
  },
  {
    path: ".foundry/init/audit.ndjson",
    description: "Foundry init audit log."
  }
];

export async function createInitWorkspaceUpgradePlan(
  workspaceRoot: string
): Promise<InitWorkspaceUpgradePlan> {
  const resolvedWorkspaceRoot = path.resolve(workspaceRoot);
  const detected = await detectInitWorkspace(resolvedWorkspaceRoot);
  const warnings: InitWorkspaceUpgradeWarning[] = [];

  if (!detected.hasFoundryDirectory && !detected.hasInitProvenance) {
    return {
      workspaceRoot: resolvedWorkspaceRoot,
      status: "not-foundry-workspace",
      detected,
      currentVersion: undefined,
      targetVersion: targetFoundryInitVersion,
      missingFiles: [],
      presentFiles: [],
      warnings: [
        {
          code: "not-foundry-workspace",
          message:
            "No Foundry init provenance was detected. This workspace is not eligible for generated workspace upgrade planning."
        }
      ],
      actions: []
    };
  }

  const provenance = detected.hasInitProvenance
    ? await readProvenance(resolvedWorkspaceRoot, warnings)
    : undefined;

  const generatedByFoundryInit =
    detected.generatedByFoundryInit ||
    provenance?.generatedBy?.command === "foundry init";

  if (!generatedByFoundryInit) {
    return {
      workspaceRoot: resolvedWorkspaceRoot,
      status: "invalid-foundry-workspace",
      detected,
      currentVersion: undefined,
      targetVersion: targetFoundryInitVersion,
      missingFiles: [],
      presentFiles: [],
      warnings: [
        ...warnings,
        {
          code: "invalid-foundry-provenance",
          message:
            "Foundry metadata exists, but provenance does not indicate the workspace was generated by foundry init."
        }
      ],
      actions: [
        {
          type: "manual-review",
          path: ".foundry/init/provenance.json",
          description:
            "Review provenance before attempting any generated workspace upgrade."
        }
      ]
    };
  }

  const fileState = await inspectRequiredFiles(resolvedWorkspaceRoot);
  const currentVersion = inferCurrentVersion(provenance);
  const actions = createUpgradeActions(fileState.missingFiles);

  return {
    workspaceRoot: resolvedWorkspaceRoot,
    status:
      fileState.missingFiles.length === 0 ? "current" : "upgrade-available",
    detected: {
      ...detected,
      generatedByFoundryInit
    },
    currentVersion,
    targetVersion: targetFoundryInitVersion,
    missingFiles: fileState.missingFiles,
    presentFiles: fileState.presentFiles,
    warnings,
    actions
  };
}

export function listRequiredInitWorkspaceV1Files(): readonly InitWorkspaceRequiredFile[] {
  return requiredV1Files;
}

async function detectInitWorkspace(
  workspaceRoot: string
): Promise<InitWorkspaceDetection> {
  const hasFoundryDirectory = await pathExists(path.join(workspaceRoot, ".foundry"));
  const hasInitProvenance = await pathExists(
    path.join(workspaceRoot, ".foundry/init/provenance.json")
  );
  const hasInitAuditLog = await pathExists(
    path.join(workspaceRoot, ".foundry/init/audit.ndjson")
  );
  const hasGeneratorManifest = await pathExists(
    path.join(workspaceRoot, "config/foundry/generator-manifest.json")
  );

  let generatedByFoundryInit = false;

  if (hasInitProvenance) {
    try {
      const provenance = await readProvenance(workspaceRoot, []);
      generatedByFoundryInit =
        provenance?.generatedBy?.command === "foundry init";
    } catch {
      generatedByFoundryInit = false;
    }
  }

  return {
    hasFoundryDirectory,
    hasInitProvenance,
    hasInitAuditLog,
    hasGeneratorManifest,
    generatedByFoundryInit
  };
}

async function readProvenance(
  workspaceRoot: string,
  warnings: InitWorkspaceUpgradeWarning[]
): Promise<FoundryInitProvenance | undefined> {
  const provenancePath = path.join(
    workspaceRoot,
    ".foundry/init/provenance.json"
  );

  try {
    const raw = await readFile(provenancePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      warnings.push({
        code: "invalid-provenance-shape",
        message: "Foundry init provenance exists but is not a JSON object."
      });

      return undefined;
    }

    return parsed as FoundryInitProvenance;
  } catch (error) {
    warnings.push({
      code: "provenance-read-failed",
      message:
        error instanceof Error
          ? `Failed to read Foundry init provenance: ${error.message}`
          : "Failed to read Foundry init provenance."
    });

    return undefined;
  }
}

async function inspectRequiredFiles(
  workspaceRoot: string
): Promise<{
  readonly missingFiles: readonly InitWorkspaceRequiredFile[];
  readonly presentFiles: readonly InitWorkspaceRequiredFile[];
}> {
  const missingFiles: InitWorkspaceRequiredFile[] = [];
  const presentFiles: InitWorkspaceRequiredFile[] = [];

  for (const requiredFile of requiredV1Files) {
    const absolutePath = path.join(workspaceRoot, requiredFile.path);

    if (await pathExists(absolutePath)) {
      presentFiles.push(requiredFile);
    } else {
      missingFiles.push(requiredFile);
    }
  }

  return {
    missingFiles,
    presentFiles
  };
}

function createUpgradeActions(
  missingFiles: readonly InitWorkspaceRequiredFile[]
): readonly InitWorkspaceUpgradeAction[] {
  return missingFiles.map((file) => {
    return {
      type: "create-file",
      path: file.path,
      description: `Create missing v1 baseline file: ${file.description}`
    };
  });
}

function inferCurrentVersion(
  provenance: FoundryInitProvenance | undefined
): string | undefined {
  const schemaVersion = provenance?.schemaVersion;

  if (typeof schemaVersion === "number") {
    return `schema:${schemaVersion}`;
  }

  if (typeof schemaVersion === "string" && schemaVersion.trim().length > 0) {
    return `schema:${schemaVersion.trim()}`;
  }

  return undefined;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}