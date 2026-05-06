import { readFile } from "node:fs/promises";

import { createDefaultFoundryManifest } from "./defaults.js";
import {
  validateFoundryManifest,
  type FoundryManifestValidationIssue
} from "./validator.js";

interface VerificationIssue {
  readonly code: string;
  readonly message: string;
}

async function main(): Promise<void> {
  const manifestPaths = process.argv.slice(2);
  const issues = await verifyManifestContract(manifestPaths);

  if (issues.length > 0) {
    console.error("verify:manifest: failed");
    console.error("");

    for (const issue of issues) {
      console.error(`- ${issue.code}: ${issue.message}`);
    }

    process.exit(1);
  }

  console.log("verify:manifest: ok");
}

export async function verifyManifestContract(
  manifestPaths: readonly string[]
): Promise<readonly VerificationIssue[]> {
  const issues: VerificationIssue[] = [];

  issues.push(...verifyDefaultManifestExamples());

  for (const manifestPath of manifestPaths) {
    issues.push(...(await verifyManifestFile(manifestPath)));
  }

  return issues;
}

function verifyDefaultManifestExamples(): readonly VerificationIssue[] {
  const issues: VerificationIssue[] = [];

  const noDatabaseManifest = createDefaultFoundryManifest({
    workspaceName: "manifest-no-database-test"
  });

  issues.push(
    ...toVerificationIssues(
      "default-no-database",
      validateFoundryManifest(noDatabaseManifest, "default-no-database")
    )
  );

  const databaseManifest = createDefaultFoundryManifest({
    workspaceName: "manifest-database-test",
    databaseProviderId: "supabase:client"
  });

  issues.push(
    ...toVerificationIssues(
      "default-database",
      validateFoundryManifest(databaseManifest, "default-database")
    )
  );

  const databaseProviderId = databaseManifest.providers?.database?.[0]?.id;

  if (databaseProviderId !== "supabase:client") {
    issues.push({
      code: "default-database-provider-missing",
      message:
        "Default database manifest should include supabase:client provider reference."
    });
  }

  return issues;
}

async function verifyManifestFile(
  manifestPath: string
): Promise<readonly VerificationIssue[]> {
  try {
    const raw = await readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    return toVerificationIssues(
      manifestPath,
      validateFoundryManifest(parsed, manifestPath)
    );
  } catch (error) {
    return [
      {
        code: "manifest-file-read-failed",
        message:
          error instanceof Error
            ? `${manifestPath}: ${error.message}`
            : `${manifestPath}: failed to read or parse manifest.`
      }
    ];
  }
}

function toVerificationIssues(
  source: string,
  issues: readonly FoundryManifestValidationIssue[]
): readonly VerificationIssue[] {
  return issues.map((issue) => {
    return {
      code: issue.code,
      message: `${source}: ${issue.path}: ${issue.message}`
    };
  });
}

await main();
