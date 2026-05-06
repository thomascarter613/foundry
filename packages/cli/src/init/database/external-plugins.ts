import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertValidInitDatabaseProviderPlugin,
  type InitDatabaseProviderPlugin
} from "./plugin.js";

export interface ExternalInitDatabaseProviderPluginConfig {
  readonly plugins?: readonly ExternalInitDatabaseProviderPluginEntry[];
}

export interface ExternalInitDatabaseProviderPluginEntry {
  readonly id?: string;
  readonly module: string;
  readonly exportName?: string;
}

export interface LoadExternalInitDatabaseProviderPluginsInput {
  readonly workspaceRoot: string;
  readonly configPath?: string;
}

export interface LoadedExternalInitDatabaseProviderPlugin {
  readonly source: ExternalInitDatabaseProviderPluginEntry;
  readonly plugin: InitDatabaseProviderPlugin;
}

export interface ExternalInitDatabaseProviderPluginLoadFailure {
  readonly source: ExternalInitDatabaseProviderPluginEntry;
  readonly message: string;
}

export interface LoadExternalInitDatabaseProviderPluginsResult {
  readonly configPath: string;
  readonly plugins: readonly LoadedExternalInitDatabaseProviderPlugin[];
  readonly failures: readonly ExternalInitDatabaseProviderPluginLoadFailure[];
}

const defaultConfigRelativePath =
  "config/foundry/database-provider-plugins.json";

export async function loadExternalInitDatabaseProviderPlugins(
  input: LoadExternalInitDatabaseProviderPluginsInput
): Promise<LoadExternalInitDatabaseProviderPluginsResult> {
  const configPath = resolvePluginConfigPath(input);
  const configExists = await pathExists(configPath);

  if (!configExists) {
    return {
      configPath,
      plugins: [],
      failures: []
    };
  }

  const config = await readExternalPluginConfig(configPath);
  const pluginEntries = config.plugins ?? [];
  const loadedPlugins: LoadedExternalInitDatabaseProviderPlugin[] = [];
  const failures: ExternalInitDatabaseProviderPluginLoadFailure[] = [];

  for (const entry of pluginEntries) {
    try {
      const plugin = await loadExternalPluginEntry({
        configPath,
        entry
      });

      assertValidInitDatabaseProviderPlugin(plugin);

      if (entry.id && entry.id !== plugin.metadata.id) {
        throw new Error(
          `Configured plugin id "${entry.id}" does not match loaded plugin metadata id "${plugin.metadata.id}".`
        );
      }

      loadedPlugins.push({
        source: entry,
        plugin
      });
    } catch (error) {
      failures.push({
        source: entry,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return {
    configPath,
    plugins: loadedPlugins,
    failures
  };
}

export function getDefaultExternalPluginConfigPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, defaultConfigRelativePath);
}

async function readExternalPluginConfig(
  configPath: string
): Promise<ExternalInitDatabaseProviderPluginConfig> {
  const raw = await readFile(configPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  return normalizeExternalPluginConfig(parsed, configPath);
}

function normalizeExternalPluginConfig(
  value: unknown,
  configPath: string
): ExternalInitDatabaseProviderPluginConfig {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`External provider plugin config must be an object: ${configPath}`);
  }

  const record = value as Record<string, unknown>;
  const plugins = record.plugins;

  if (plugins === undefined) {
    return {
      plugins: []
    };
  }

  if (!Array.isArray(plugins)) {
    throw new Error(
      `External provider plugin config "plugins" field must be an array: ${configPath}`
    );
  }

  return {
    plugins: plugins.map((entry, index) => {
      return normalizeExternalPluginEntry(entry, configPath, index);
    })
  };
}

function normalizeExternalPluginEntry(
  value: unknown,
  configPath: string,
  index: number
): ExternalInitDatabaseProviderPluginEntry {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(
      `External provider plugin entry at index ${index} must be an object: ${configPath}`
    );
  }

  const record = value as Record<string, unknown>;
  const moduleSpecifier = normalizeString(record.module);

  if (!moduleSpecifier) {
    throw new Error(
      `External provider plugin entry at index ${index} must include a non-empty module field: ${configPath}`
    );
  }

  const entry: ExternalInitDatabaseProviderPluginEntry = {
    module: moduleSpecifier
  };

  const id = normalizeString(record.id);
  const exportName = normalizeString(record.exportName);

  if (id) {
    return exportName
      ? { ...entry, id, exportName }
      : { ...entry, id };
  }

  return exportName ? { ...entry, exportName } : entry;
}

async function loadExternalPluginEntry(input: {
  readonly configPath: string;
  readonly entry: ExternalInitDatabaseProviderPluginEntry;
}): Promise<InitDatabaseProviderPlugin> {
  const moduleUrl = resolveModuleSpecifier({
    configPath: input.configPath,
    moduleSpecifier: input.entry.module
  });

  const loadedModule = (await import(moduleUrl)) as Record<string, unknown>;
  const exportValue = selectPluginExport({
    loadedModule,
    exportName: input.entry.exportName,
    moduleSpecifier: input.entry.module
  });

  return normalizePluginExport(exportValue, input.entry.module);
}

function selectPluginExport(input: {
  readonly loadedModule: Record<string, unknown>;
  readonly exportName: string | undefined;
  readonly moduleSpecifier: string;
}): unknown {
  if (input.exportName) {
    if (!(input.exportName in input.loadedModule)) {
      throw new Error(
        `Module "${input.moduleSpecifier}" does not export "${input.exportName}".`
      );
    }

    return input.loadedModule[input.exportName];
  }

  if ("default" in input.loadedModule) {
    return input.loadedModule.default;
  }

  if ("plugin" in input.loadedModule) {
    return input.loadedModule.plugin;
  }

  if ("providerPlugin" in input.loadedModule) {
    return input.loadedModule.providerPlugin;
  }

  throw new Error(
    `Module "${input.moduleSpecifier}" must export a default provider plugin, "plugin", "providerPlugin", or configure exportName.`
  );
}

function normalizePluginExport(
  value: unknown,
  moduleSpecifier: string
): InitDatabaseProviderPlugin {
  if (typeof value === "function") {
    const maybePlugin = (value as () => unknown)();

    return normalizePluginExport(maybePlugin, moduleSpecifier);
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(
      `External provider plugin export from "${moduleSpecifier}" must be an object or a function returning an object.`
    );
  }

  return value as InitDatabaseProviderPlugin;
}

function resolvePluginConfigPath(
  input: LoadExternalInitDatabaseProviderPluginsInput
): string {
  if (input.configPath) {
    return path.isAbsolute(input.configPath)
      ? input.configPath
      : path.resolve(input.workspaceRoot, input.configPath);
  }

  return getDefaultExternalPluginConfigPath(input.workspaceRoot);
}

function resolveModuleSpecifier(input: {
  readonly configPath: string;
  readonly moduleSpecifier: string;
}): string {
  if (input.moduleSpecifier.startsWith("file:")) {
    return input.moduleSpecifier;
  }

  if (isPathLikeSpecifier(input.moduleSpecifier)) {
    const configDirectory = path.dirname(input.configPath);
    const modulePath = path.isAbsolute(input.moduleSpecifier)
      ? input.moduleSpecifier
      : path.resolve(configDirectory, input.moduleSpecifier);

    return pathToFileURL(modulePath).href;
  }

  return input.moduleSpecifier;
}

function isPathLikeSpecifier(value: string): boolean {
  return (
    value.startsWith(".") ||
    value.startsWith("/") ||
    value.includes("\\")
  );
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}