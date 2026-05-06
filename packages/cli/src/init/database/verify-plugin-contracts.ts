import {
  assertBuiltInInitDatabaseProviderPluginsValid,
  listBuiltInInitDatabaseProviderPlugins
} from "./builtin-plugins.js";
import {
  supportedInitDatabaseProviders,
  type InitDatabaseProviderId
} from "./providers.js";

interface PluginInvariantIssue {
  readonly code: string;
  readonly message: string;
}

function main(): void {
  const issues = verifyBuiltInProviderPluginInvariants();

  if (issues.length > 0) {
    console.error("Provider plugin contract verification failed.");
    console.error("");

    for (const issue of issues) {
      console.error(`- ${issue.code}: ${issue.message}`);
    }

    process.exit(1);
  }

  console.log("verify:init-provider-plugins: ok");
}

export function verifyBuiltInProviderPluginInvariants(): readonly PluginInvariantIssue[] {
  const issues: PluginInvariantIssue[] = [];

  try {
    assertBuiltInInitDatabaseProviderPluginsValid();
  } catch (error) {
    issues.push({
      code: "plugin-contract-invalid",
      message: error instanceof Error ? error.message : String(error)
    });
  }

  const plugins = listBuiltInInitDatabaseProviderPlugins();
  const canonicalProviderIds = supportedInitDatabaseProviders();

  issues.push(...verifyProviderIdsMatchCanonicalList(plugins, canonicalProviderIds));
  issues.push(...verifyProviderIdsAreUnique(plugins));
  issues.push(...verifyEveryPluginBuildsFiles(plugins));
  issues.push(...verifySupabaseProvidersAreFirstClass(plugins));
  issues.push(...verifyLocalServiceCapabilityConsistency(plugins));

  return issues;
}

function verifyProviderIdsMatchCanonicalList(
  plugins: ReturnType<typeof listBuiltInInitDatabaseProviderPlugins>,
  canonicalProviderIds: readonly InitDatabaseProviderId[]
): readonly PluginInvariantIssue[] {
  const issues: PluginInvariantIssue[] = [];
  const pluginIds = plugins.map((plugin) => plugin.metadata.id);
  const canonicalSet = new Set<string>(canonicalProviderIds);
  const pluginSet = new Set<string>(pluginIds);

  for (const canonicalProviderId of canonicalProviderIds) {
    if (!pluginSet.has(canonicalProviderId)) {
      issues.push({
        code: "canonical-provider-missing-plugin",
        message: `Canonical provider "${canonicalProviderId}" does not have a built-in plugin.`
      });
    }
  }

  for (const pluginId of pluginIds) {
    if (!canonicalSet.has(pluginId)) {
      issues.push({
        code: "plugin-provider-not-canonical",
        message: `Built-in plugin "${pluginId}" is not listed in the canonical provider ID list.`
      });
    }
  }

  return issues;
}

function verifyProviderIdsAreUnique(
  plugins: ReturnType<typeof listBuiltInInitDatabaseProviderPlugins>
): readonly PluginInvariantIssue[] {
  const issues: PluginInvariantIssue[] = [];
  const seen = new Set<string>();

  for (const plugin of plugins) {
    const providerId = plugin.metadata.id;

    if (seen.has(providerId)) {
      issues.push({
        code: "duplicate-provider-plugin-id",
        message: `Provider plugin ID "${providerId}" is duplicated.`
      });
    }

    seen.add(providerId);
  }

  return issues;
}

function verifyEveryPluginBuildsFiles(
  plugins: ReturnType<typeof listBuiltInInitDatabaseProviderPlugins>
): readonly PluginInvariantIssue[] {
  const issues: PluginInvariantIssue[] = [];

  for (const plugin of plugins) {
    const files = plugin.buildFiles({
      workspaceName: "plugin-invariant-test",
      providerId: plugin.metadata.id
    });

    if (files.length === 0) {
      issues.push({
        code: "plugin-builds-no-files",
        message: `Provider plugin "${plugin.metadata.id}" did not build any files.`
      });
    }

    const providerMetadataFile = files.find((file) => {
      return file.relativePath === "db/provider.json";
    });

    if (!providerMetadataFile) {
      issues.push({
        code: "plugin-missing-provider-metadata-file",
        message: `Provider plugin "${plugin.metadata.id}" does not generate db/provider.json.`
      });
    }

    const duplicatePaths = findDuplicates(files.map((file) => file.relativePath));

    for (const duplicatePath of duplicatePaths) {
      issues.push({
        code: "plugin-duplicate-generated-file",
        message: `Provider plugin "${plugin.metadata.id}" generates duplicate file path "${duplicatePath}".`
      });
    }
  }

  return issues;
}

function verifySupabaseProvidersAreFirstClass(
  plugins: ReturnType<typeof listBuiltInInitDatabaseProviderPlugins>
): readonly PluginInvariantIssue[] {
  const issues: PluginInvariantIssue[] = [];

  for (const plugin of plugins) {
    const isSupabaseProvider = plugin.metadata.id.startsWith("supabase:");

    if (!isSupabaseProvider) {
      continue;
    }

    if (!plugin.metadata.firstClassSupabase) {
      issues.push({
        code: "supabase-provider-not-first-class",
        message: `Supabase plugin "${plugin.metadata.id}" must set firstClassSupabase to true.`
      });
    }

    if (!plugin.metadata.capabilities.includes("supabase")) {
      issues.push({
        code: "supabase-provider-missing-capability",
        message: `Supabase plugin "${plugin.metadata.id}" must include the supabase capability.`
      });
    }

    const files = plugin.buildFiles({
      workspaceName: "plugin-invariant-test",
      providerId: plugin.metadata.id
    });

    const hasSupabaseReadme = files.some((file) => {
      return file.relativePath === "supabase/README.md";
    });

    if (!hasSupabaseReadme) {
      issues.push({
        code: "supabase-provider-missing-supabase-readme",
        message: `Supabase plugin "${plugin.metadata.id}" must generate supabase/README.md.`
      });
    }
  }

  return issues;
}

function verifyLocalServiceCapabilityConsistency(
  plugins: ReturnType<typeof listBuiltInInitDatabaseProviderPlugins>
): readonly PluginInvariantIssue[] {
  const issues: PluginInvariantIssue[] = [];

  for (const plugin of plugins) {
    const hasLocalServiceCapability =
      plugin.metadata.capabilities.includes("local-service");

    const files = plugin.buildFiles({
      workspaceName: "plugin-invariant-test",
      providerId: plugin.metadata.id
    });

    const hasDockerCompose = files.some((file) => {
      return file.relativePath === "docker-compose.yml";
    });

    if (hasLocalServiceCapability && !hasDockerCompose) {
      issues.push({
        code: "local-service-provider-missing-compose-file",
        message: `Provider plugin "${plugin.metadata.id}" has local-service capability but does not generate docker-compose.yml.`
      });
    }

    if (!hasLocalServiceCapability && hasDockerCompose) {
      issues.push({
        code: "non-local-service-provider-has-compose-file",
        message: `Provider plugin "${plugin.metadata.id}" generates docker-compose.yml without local-service capability.`
      });
    }
  }

  return issues;
}

function findDuplicates(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  }

  return [...duplicates].sort();
}

main();