import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  getDefaultExternalPluginConfigPath,
  loadExternalInitDatabaseProviderPlugins
} from "./external-plugins.js";

interface VerificationIssue {
  readonly code: string;
  readonly message: string;
}

async function main(): Promise<void> {
  const issues = await verifyExternalPluginLoading();

  if (issues.length > 0) {
    console.error("External provider plugin loading verification failed.");
    console.error("");

    for (const issue of issues) {
      console.error(`- ${issue.code}: ${issue.message}`);
    }

    process.exit(1);
  }

  console.log("verify:init-external-provider-plugins: ok");
}

export async function verifyExternalPluginLoading(): Promise<
  readonly VerificationIssue[]
> {
  const issues: VerificationIssue[] = [];
  const fixtureRoot = path.resolve(
    ".artifacts/foundry/tests/external-provider-plugins"
  );

  await rm(fixtureRoot, { recursive: true, force: true });
  await mkdir(fixtureRoot, { recursive: true });

  try {
    issues.push(...(await verifyMissingConfigReturnsEmptyResult(fixtureRoot)));
    issues.push(...(await verifyDefaultConfigLoadsValidPlugins(fixtureRoot)));
    issues.push(...(await verifyCustomConfigPathLoadsNamedExport(fixtureRoot)));
    issues.push(...(await verifyFailuresAreReported(fixtureRoot)));
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }

  return issues;
}

async function verifyMissingConfigReturnsEmptyResult(
  fixtureRoot: string
): Promise<readonly VerificationIssue[]> {
  const issues: VerificationIssue[] = [];
  const workspaceRoot = path.join(fixtureRoot, "missing-config");

  await mkdir(workspaceRoot, { recursive: true });

  const result = await loadExternalInitDatabaseProviderPlugins({
    workspaceRoot
  });

  const expectedConfigPath = getDefaultExternalPluginConfigPath(workspaceRoot);

  if (result.configPath !== expectedConfigPath) {
    issues.push({
      code: "missing-config-path-mismatch",
      message: `Expected config path "${expectedConfigPath}", received "${result.configPath}".`
    });
  }

  if (result.plugins.length !== 0) {
    issues.push({
      code: "missing-config-loaded-plugins",
      message: "Missing external plugin config should load zero plugins."
    });
  }

  if (result.failures.length !== 0) {
    issues.push({
      code: "missing-config-reported-failures",
      message: "Missing external plugin config should report zero failures."
    });
  }

  return issues;
}

async function verifyDefaultConfigLoadsValidPlugins(
  fixtureRoot: string
): Promise<readonly VerificationIssue[]> {
  const issues: VerificationIssue[] = [];
  const workspaceRoot = path.join(fixtureRoot, "default-config");
  const configDirectory = path.join(workspaceRoot, "config/foundry");

  await mkdir(configDirectory, { recursive: true });

  await writeFile(
    path.join(configDirectory, "valid-default.mjs"),
    buildDefaultExportPluginModule({
      id: "external:default",
      family: "external",
      adapter: "default"
    }),
    "utf8"
  );

  await writeFile(
    path.join(configDirectory, "database-provider-plugins.json"),
    JSON.stringify(
      {
        plugins: [
          {
            id: "external:default",
            module: "./valid-default.mjs"
          }
        ]
      },
      null,
      2
    ),
    "utf8"
  );

  const result = await loadExternalInitDatabaseProviderPlugins({
    workspaceRoot
  });

  if (result.failures.length !== 0) {
    issues.push({
      code: "default-config-unexpected-failures",
      message: `Expected zero failures, received ${result.failures.length}: ${result.failures
        .map((failure) => failure.message)
        .join("; ")}`
    });
  }

  if (result.plugins.length !== 1) {
    issues.push({
      code: "default-config-plugin-count",
      message: `Expected one loaded plugin, received ${result.plugins.length}.`
    });

    return issues;
  }

  const [loaded] = result.plugins;

  if (!loaded) {
    issues.push({
      code: "default-config-missing-loaded-plugin",
      message: "Expected loaded plugin to exist."
    });

    return issues;
  }

  if (loaded.plugin.metadata.id !== "external:default") {
    issues.push({
      code: "default-config-plugin-id",
      message: `Expected plugin id external:default, received ${loaded.plugin.metadata.id}.`
    });
  }

  const files = loaded.plugin.buildFiles({
    workspaceName: "external-default-test",
    providerId: loaded.plugin.metadata.id
  });

  if (!files.some((file) => file.relativePath === "db/provider.json")) {
    issues.push({
      code: "default-config-missing-provider-file",
      message: "Loaded default plugin should generate db/provider.json."
    });
  }

  return issues;
}

async function verifyCustomConfigPathLoadsNamedExport(
  fixtureRoot: string
): Promise<readonly VerificationIssue[]> {
  const issues: VerificationIssue[] = [];
  const workspaceRoot = path.join(fixtureRoot, "custom-config");
  const configDirectory = path.join(workspaceRoot, ".foundry-test");

  await mkdir(configDirectory, { recursive: true });

  await writeFile(
    path.join(configDirectory, "named-plugin.mjs"),
    buildNamedFunctionExportPluginModule({
      exportName: "providerPlugin",
      id: "external:named",
      family: "external",
      adapter: "named"
    }),
    "utf8"
  );

  await writeFile(
    path.join(configDirectory, "plugins.json"),
    JSON.stringify(
      {
        plugins: [
          {
            id: "external:named",
            module: "./named-plugin.mjs",
            exportName: "providerPlugin"
          }
        ]
      },
      null,
      2
    ),
    "utf8"
  );

  const result = await loadExternalInitDatabaseProviderPlugins({
    workspaceRoot,
    configPath: ".foundry-test/plugins.json"
  });

  if (result.failures.length !== 0) {
    issues.push({
      code: "custom-config-unexpected-failures",
      message: `Expected zero failures, received ${result.failures.length}: ${result.failures
        .map((failure) => failure.message)
        .join("; ")}`
    });
  }

  if (result.plugins.length !== 1) {
    issues.push({
      code: "custom-config-plugin-count",
      message: `Expected one loaded plugin, received ${result.plugins.length}.`
    });

    return issues;
  }

  const [loaded] = result.plugins;

  if (!loaded) {
    issues.push({
      code: "custom-config-missing-loaded-plugin",
      message: "Expected named-export loaded plugin to exist."
    });

    return issues;
  }

  if (loaded.plugin.metadata.id !== "external:named") {
    issues.push({
      code: "custom-config-plugin-id",
      message: `Expected plugin id external:named, received ${loaded.plugin.metadata.id}.`
    });
  }

  return issues;
}

async function verifyFailuresAreReported(
  fixtureRoot: string
): Promise<readonly VerificationIssue[]> {
  const issues: VerificationIssue[] = [];
  const workspaceRoot = path.join(fixtureRoot, "failures");
  const configDirectory = path.join(workspaceRoot, "config/foundry");

  await mkdir(configDirectory, { recursive: true });

  await writeFile(
    path.join(configDirectory, "id-mismatch.mjs"),
    buildDefaultExportPluginModule({
      id: "external:actual",
      family: "external",
      adapter: "mismatch"
    }),
    "utf8"
  );

  await writeFile(
    path.join(configDirectory, "invalid-plugin.mjs"),
    `export default {
  metadata: {
    id: "",
    family: "external",
    adapter: "invalid",
    label: "Invalid",
    description: "Invalid plugin.",
    tier: "external",
    status: "available",
    firstClassSupabase: false,
    capabilities: []
  },
  getPackageAdditions() {
    return { dependencies: {}, devDependencies: {} };
  },
  getEnvironmentVariables() {
    return [];
  },
  getCommands() {
    return [];
  },
  buildFiles() {
    return [];
  }
};
`,
    "utf8"
  );

  await writeFile(
    path.join(configDirectory, "database-provider-plugins.json"),
    JSON.stringify(
      {
        plugins: [
          {
            id: "external:expected",
            module: "./id-mismatch.mjs"
          },
          {
            id: "external:invalid",
            module: "./invalid-plugin.mjs"
          },
          {
            id: "external:missing",
            module: "./missing-plugin.mjs"
          }
        ]
      },
      null,
      2
    ),
    "utf8"
  );

  const result = await loadExternalInitDatabaseProviderPlugins({
    workspaceRoot
  });

  if (result.plugins.length !== 0) {
    issues.push({
      code: "failure-config-loaded-plugins",
      message: `Expected zero loaded plugins for failure fixture, received ${result.plugins.length}.`
    });
  }

  if (result.failures.length !== 3) {
    issues.push({
      code: "failure-config-failure-count",
      message: `Expected three reported failures, received ${result.failures.length}.`
    });
  }

  const combinedMessages = result.failures
    .map((failure) => failure.message)
    .join("\n");

  if (!combinedMessages.includes("does not match loaded plugin metadata id")) {
    issues.push({
      code: "failure-config-missing-id-mismatch",
      message: "Expected ID mismatch failure message."
    });
  }

  if (!combinedMessages.includes("metadata.id must be a non-empty string")) {
    issues.push({
      code: "failure-config-missing-invalid-plugin",
      message: "Expected invalid plugin contract failure message."
    });
  }

  if (
    !combinedMessages.includes("Cannot find module") &&
    !combinedMessages.includes("No such file") &&
    !combinedMessages.includes("ENOENT")
  ) {
    issues.push({
      code: "failure-config-missing-module-failure",
      message: "Expected missing module failure message."
    });
  }

  return issues;
}

function buildDefaultExportPluginModule(input: {
  readonly id: string;
  readonly family: string;
  readonly adapter: string;
}): string {
  return `export default ${buildPluginObjectLiteral(input)};
`;
}

function buildNamedFunctionExportPluginModule(input: {
  readonly exportName: string;
  readonly id: string;
  readonly family: string;
  readonly adapter: string;
}): string {
  return `export function ${input.exportName}() {
  return ${buildPluginObjectLiteral(input)};
}
`;
}

function buildPluginObjectLiteral(input: {
  readonly id: string;
  readonly family: string;
  readonly adapter: string;
}): string {
  return `{
  metadata: {
    id: "${input.id}",
    family: "${input.family}",
    adapter: "${input.adapter}",
    label: "${input.id}",
    description: "External provider plugin fixture.",
    tier: "external",
    status: "available",
    firstClassSupabase: false,
    capabilities: ["client"]
  },
  getPackageAdditions() {
    return {
      dependencies: {},
      devDependencies: {}
    };
  },
  getEnvironmentVariables() {
    return [
      {
        name: "EXTERNAL_PROVIDER_URL",
        description: "External provider URL.",
        required: false,
        example: "https://example.invalid",
        secret: false
      }
    ];
  },
  getCommands() {
    return [
      {
        name: "db:validate",
        command: "bash tools/scripts/db-validate.sh",
        description: "Validate external provider configuration."
      }
    ];
  },
  buildFiles() {
    return [
      {
        relativePath: "db/provider.json",
        description: "External provider metadata.",
        contents: JSON.stringify({ id: "${input.id}" }, null, 2) + "\\\\n"
      }
    ];
  }
}`;
}

await main();