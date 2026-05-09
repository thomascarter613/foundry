import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { createDefaultFoundryManifest } from "./defaults.js";
import {
  getDefaultFoundryManifestPath,
  readFoundryManifest,
  readFoundryManifestOrThrow
} from "./reader.js";

interface VerificationIssue {
  readonly code: string;
  readonly message: string;
}

async function main(): Promise<void> {
  const issues = await verifyManifestReader();

  if (issues.length > 0) {
    console.error("verify:manifest-reader: failed");
    console.error("");

    for (const issue of issues) {
      console.error(`- ${issue.code}: ${issue.message}`);
    }

    process.exit(1);
  }

  console.log("verify:manifest-reader: ok");
}

export async function verifyManifestReader(): Promise<
  readonly VerificationIssue[]
> {
  const fixtureRoot = path.resolve(".artifacts/foundry/tests/manifest-reader");
  const issues: VerificationIssue[] = [];

  await rm(fixtureRoot, { recursive: true, force: true });
  await mkdir(fixtureRoot, { recursive: true });

  try {
    issues.push(...(await verifyMissingManifest(fixtureRoot)));
    issues.push(...(await verifyInvalidJsonManifest(fixtureRoot)));
    issues.push(...(await verifyInvalidManifestShape(fixtureRoot)));
    issues.push(...(await verifyValidManifest(fixtureRoot)));
    issues.push(...(await verifyCustomManifestPath(fixtureRoot)));
    issues.push(...(await verifyOrThrow(fixtureRoot)));
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }

  return issues;
}

async function verifyMissingManifest(
  fixtureRoot: string
): Promise<readonly VerificationIssue[]> {
  const workspaceRoot = path.join(fixtureRoot, "missing-manifest");
  const issues: VerificationIssue[] = [];

  await mkdir(workspaceRoot, { recursive: true });

  const result = await readFoundryManifest({ workspaceRoot });

  if (result.ok) {
    issues.push({
      code: "missing-manifest-ok",
      message: "Missing manifest should not return ok."
    });
    return issues;
  }

  if (result.status !== "missing") {
    issues.push({
      code: "missing-manifest-status",
      message: `Expected missing status, received ${result.status}.`
    });
  }

  if (result.manifestPath !== getDefaultFoundryManifestPath(workspaceRoot)) {
    issues.push({
      code: "missing-manifest-default-path",
      message: "Reader did not resolve the default manifest path correctly."
    });
  }

  return issues;
}

async function verifyInvalidJsonManifest(
  fixtureRoot: string
): Promise<readonly VerificationIssue[]> {
  const workspaceRoot = path.join(fixtureRoot, "invalid-json");
  const manifestPath = getDefaultFoundryManifestPath(workspaceRoot);
  const issues: VerificationIssue[] = [];

  await writeTextFile(manifestPath, "{ not valid json");

  const result = await readFoundryManifest({ workspaceRoot });

  if (result.ok) {
    issues.push({
      code: "invalid-json-ok",
      message: "Invalid JSON manifest should not return ok."
    });
    return issues;
  }

  if (result.status !== "invalid-json") {
    issues.push({
      code: "invalid-json-status",
      message: `Expected invalid-json status, received ${result.status}.`
    });
  }

  return issues;
}

async function verifyInvalidManifestShape(
  fixtureRoot: string
): Promise<readonly VerificationIssue[]> {
  const workspaceRoot = path.join(fixtureRoot, "invalid-shape");
  const manifestPath = getDefaultFoundryManifestPath(workspaceRoot);
  const issues: VerificationIssue[] = [];

  await writeJsonFile(manifestPath, {
    schemaVersion: 1
  });

  const result = await readFoundryManifest({ workspaceRoot });

  if (result.ok) {
    issues.push({
      code: "invalid-shape-ok",
      message: "Invalid manifest shape should not return ok."
    });
    return issues;
  }

  if (result.status !== "invalid-manifest") {
    issues.push({
      code: "invalid-shape-status",
      message: `Expected invalid-manifest status, received ${result.status}.`
    });
  }

  if (result.issues.length === 0) {
    issues.push({
      code: "invalid-shape-no-issues",
      message: "Invalid manifest shape should return validation issues."
    });
  }

  return issues;
}

async function verifyValidManifest(
  fixtureRoot: string
): Promise<readonly VerificationIssue[]> {
  const workspaceRoot = path.join(fixtureRoot, "valid-manifest");
  const manifestPath = getDefaultFoundryManifestPath(workspaceRoot);
  const issues: VerificationIssue[] = [];

  await writeJsonFile(
    manifestPath,
    createDefaultFoundryManifest({
      workspaceName: "valid-manifest"
    })
  );

  const result = await readFoundryManifest({ workspaceRoot });

  if (!result.ok) {
    issues.push({
      code: "valid-manifest-not-ok",
      message: `Valid manifest should return ok. Received ${result.status}: ${result.errorMessage}`
    });
    return issues;
  }

  if (result.manifest.workspace.name !== "valid-manifest") {
    issues.push({
      code: "valid-manifest-workspace-name",
      message: `Expected workspace name valid-manifest, received ${result.manifest.workspace.name}.`
    });
  }

  return issues;
}

async function verifyCustomManifestPath(
  fixtureRoot: string
): Promise<readonly VerificationIssue[]> {
  const workspaceRoot = path.join(fixtureRoot, "custom-path");
  const customManifestPath = "config/foundry/custom-manifest.json";
  const issues: VerificationIssue[] = [];

  await writeJsonFile(
    path.join(workspaceRoot, customManifestPath),
    createDefaultFoundryManifest({
      workspaceName: "custom-path"
    })
  );

  const result = await readFoundryManifest({
    workspaceRoot,
    manifestPath: customManifestPath
  });

  if (!result.ok) {
    issues.push({
      code: "custom-path-not-ok",
      message: `Custom path manifest should return ok. Received ${result.status}: ${result.errorMessage}`
    });
    return issues;
  }

  if (!result.manifestPath.endsWith(customManifestPath)) {
    issues.push({
      code: "custom-path-resolution",
      message: `Expected manifest path to end with ${customManifestPath}, received ${result.manifestPath}.`
    });
  }

  return issues;
}

async function verifyOrThrow(
  fixtureRoot: string
): Promise<readonly VerificationIssue[]> {
  const workspaceRoot = path.join(fixtureRoot, "or-throw");
  const manifestPath = getDefaultFoundryManifestPath(workspaceRoot);
  const issues: VerificationIssue[] = [];

  await writeJsonFile(
    manifestPath,
    createDefaultFoundryManifest({
      workspaceName: "or-throw"
    })
  );

  try {
    const result = await readFoundryManifestOrThrow({ workspaceRoot });

    if (result.manifest.workspace.name !== "or-throw") {
      issues.push({
        code: "or-throw-workspace-name",
        message: "readFoundryManifestOrThrow returned the wrong manifest."
      });
    }
  } catch (error) {
    issues.push({
      code: "or-throw-unexpected-error",
      message:
        error instanceof Error
          ? error.message
          : "readFoundryManifestOrThrow unexpectedly failed."
    });
  }

  const missingWorkspaceRoot = path.join(fixtureRoot, "or-throw-missing");

  try {
    await readFoundryManifestOrThrow({ workspaceRoot: missingWorkspaceRoot });

    issues.push({
      code: "or-throw-missing-did-not-throw",
      message: "readFoundryManifestOrThrow should throw for missing manifests."
    });
  } catch {
    // Expected.
  }

  return issues;
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await writeTextFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeTextFile(filePath: string, contents: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

await main();
