import {
  listBuiltInInitDatabaseProviderPlugins
} from "./builtin-plugins.js";
import {
  isInitDatabaseProviderId,
  normalizeInitDatabaseProviderId,
  supportedInitDatabaseProviders,
  type InitDatabaseProviderId
} from "./providers.js";

export type DatabaseProviderDefinition = InitDatabaseProviderDefinition;

export type InitDatabaseProviderFamily =
  | "postgres"
  | "sqlite"
  | "mongodb"
  | "supabase";

export type InitDatabaseProviderAdapter =
  | "drizzle"
  | "prisma"
  | "native"
  | "sql"
  | "client"
  | "supabase-client";

export interface InitDatabaseProviderDefinition {
  readonly id: InitDatabaseProviderId;
  readonly family: InitDatabaseProviderFamily;
  readonly adapter: InitDatabaseProviderAdapter;
  readonly label: string;
  readonly description: string;
  readonly tier: 1;
  readonly status: "available";
  readonly localService: boolean;
  readonly firstClassSupabase: boolean;
  readonly planned: false;
}

export const initDatabaseProviderRegistry: readonly InitDatabaseProviderDefinition[] =
  listBuiltInInitDatabaseProviderPlugins().map((plugin) => {
    const providerId = normalizeInitDatabaseProviderId(plugin.metadata.id);

    return {
      id: providerId,
      family: normalizeFamily(plugin.metadata.family),
      adapter: normalizeAdapter(plugin.metadata.adapter),
      label: plugin.metadata.label,
      description: plugin.metadata.description,
      tier: 1,
      status: "available",
      localService: plugin.metadata.capabilities.includes("local-service"),
      firstClassSupabase: plugin.metadata.firstClassSupabase,
      planned: false
    };
  });

export function listInitDatabaseProviders(): readonly InitDatabaseProviderDefinition[] {
  return initDatabaseProviderRegistry;
}

export function listInitDatabaseProviderIds(): readonly InitDatabaseProviderId[] {
  return supportedInitDatabaseProviders();
}

export function isSupportedInitDatabaseProviderId(
  value: string
): value is InitDatabaseProviderId {
  return isInitDatabaseProviderId(value);
}

export function normalizeInitDatabaseProvider(
  value: string
): InitDatabaseProviderId {
  return normalizeInitDatabaseProviderId(value);
}

export function getInitDatabaseProvider(
  providerId: InitDatabaseProviderId
): InitDatabaseProviderDefinition {
  const provider = initDatabaseProviderRegistry.find(
    (candidate) => candidate.id === providerId
  );

  if (!provider) {
    throw new Error(`Unsupported database provider: ${providerId}`);
  }

  return provider;
}

export function maybeGetInitDatabaseProvider(
  providerId: string | undefined
): InitDatabaseProviderDefinition | undefined {
  if (!providerId) {
    return undefined;
  }

  const normalizedProviderId = providerId.trim().toLowerCase();

  if (!isInitDatabaseProviderId(normalizedProviderId)) {
    return undefined;
  }

  return getInitDatabaseProvider(normalizedProviderId);
}

export function formatAvailableInitDatabaseProviderIds(): string {
  return listInitDatabaseProviderIds().join(", ");
}

export function validateInitDatabaseProviderId(
  providerId: string
): InitDatabaseProviderDefinition | undefined {
  const normalizedProviderId = providerId.trim().toLowerCase();

  if (!isInitDatabaseProviderId(normalizedProviderId)) {
    return undefined;
  }

  return getInitDatabaseProvider(normalizedProviderId);
}

function normalizeFamily(family: string): InitDatabaseProviderFamily {
  switch (family) {
    case "postgres":
    case "sqlite":
    case "mongodb":
    case "supabase":
      return family;

    default:
      throw new Error(`Unsupported built-in database provider family: ${family}`);
  }
}

function normalizeAdapter(adapter: string): InitDatabaseProviderAdapter {
  switch (adapter) {
    case "drizzle":
    case "prisma":
    case "native":
    case "sql":
    case "client":
    case "supabase-client":
      return adapter;

    default:
      throw new Error(`Unsupported built-in database provider adapter: ${adapter}`);
  }
}