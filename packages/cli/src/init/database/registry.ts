import {
  isInitDatabaseProviderId,
  normalizeInitDatabaseProviderId,
  supportedInitDatabaseProviders,
  type InitDatabaseProviderId
} from "./providers.js";
import type {
  DatabaseProviderDefinition as LegacyDatabaseProviderDefinition
} from "./types.js";

export type DatabaseProviderDefinition = LegacyDatabaseProviderDefinition;

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
  | "client";

export type InitDatabaseProviderStatus = "available" | "planned" | "deferred";

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
  [
    {
      id: "postgres:drizzle",
      family: "postgres",
      adapter: "drizzle",
      label: "PostgreSQL + Drizzle",
      description:
        "Local PostgreSQL service with Drizzle ORM and Drizzle Kit.",
      tier: 1,
      status: "available",
      localService: true,
      firstClassSupabase: false,
      planned: false
    },
    {
      id: "postgres:prisma",
      family: "postgres",
      adapter: "prisma",
      label: "PostgreSQL + Prisma",
      description:
        "Local PostgreSQL service with Prisma Client and Prisma schema.",
      tier: 1,
      status: "available",
      localService: true,
      firstClassSupabase: false,
      planned: false
    },
    {
      id: "sqlite:drizzle",
      family: "sqlite",
      adapter: "drizzle",
      label: "SQLite + Drizzle",
      description: "Local SQLite database with Drizzle ORM and Drizzle Kit.",
      tier: 1,
      status: "available",
      localService: false,
      firstClassSupabase: false,
      planned: false
    },
    {
      id: "sqlite:prisma",
      family: "sqlite",
      adapter: "prisma",
      label: "SQLite + Prisma",
      description: "Local SQLite database with Prisma Client and Prisma schema.",
      tier: 1,
      status: "available",
      localService: false,
      firstClassSupabase: false,
      planned: false
    },
    {
      id: "mongodb:native",
      family: "mongodb",
      adapter: "native",
      label: "MongoDB Native Driver",
      description:
        "Local MongoDB service using the official native MongoDB driver.",
      tier: 1,
      status: "available",
      localService: true,
      firstClassSupabase: false,
      planned: false
    },
    {
      id: "supabase:sql",
      family: "supabase",
      adapter: "sql",
      label: "Supabase SQL",
      description:
        "First-class Supabase provider using SQL migrations and Supabase client configuration.",
      tier: 1,
      status: "available",
      localService: false,
      firstClassSupabase: true,
      planned: false
    },
    {
      id: "supabase:drizzle",
      family: "supabase",
      adapter: "drizzle",
      label: "Supabase + Drizzle",
      description:
        "First-class Supabase provider using Drizzle with Supabase-compatible PostgreSQL.",
      tier: 1,
      status: "available",
      localService: false,
      firstClassSupabase: true,
      planned: false
    },
    {
      id: "supabase:prisma",
      family: "supabase",
      adapter: "prisma",
      label: "Supabase + Prisma",
      description:
        "First-class Supabase provider using Prisma with Supabase-compatible PostgreSQL.",
      tier: 1,
      status: "available",
      localService: false,
      firstClassSupabase: true,
      planned: false
    },
    {
      id: "supabase:client",
      family: "supabase",
      adapter: "client",
      label: "Supabase Client",
      description:
        "First-class Supabase client-only provider for API-first Supabase usage.",
      tier: 1,
      status: "available",
      localService: false,
      firstClassSupabase: true,
      planned: false
    }
  ];

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
  if (!providerId || !isInitDatabaseProviderId(providerId)) {
    return undefined;
  }

  return getInitDatabaseProvider(providerId);
}

/**
 * Legacy compatibility adapter.
 *
 * Slice 14 centralizes provider IDs, but planner/validator still consume the
 * older DatabaseProviderDefinition shape. Slice 15 should migrate those
 * consumers to InitDatabaseProviderDefinition and then remove these aliases.
 */
export function findDatabaseProvider(
  providerId: string | undefined
): LegacyDatabaseProviderDefinition | undefined {
  const normalizedProviderId =
    typeof providerId === "string" ? normalizeProviderId(providerId) : undefined;

  const provider = maybeGetInitDatabaseProvider(normalizedProviderId);

  return provider ? toLegacyProviderDefinition(provider) : undefined;
}

export function lookupDatabaseProvider(
  providerId: string | undefined
): LegacyDatabaseProviderDefinition {
  const found = findDatabaseProvider(providerId);

  if (found) {
    return found;
  }

  return toLegacyUnknownProviderDefinition(providerId);
}

export function normalizeProviderId(value: string): string {
  return value.trim().toLowerCase();
}

export function formatAvailableDatabaseProviderIds(): string {
  return listInitDatabaseProviderIds().join(", ");
}

function toLegacyProviderDefinition(
  provider: InitDatabaseProviderDefinition
): LegacyDatabaseProviderDefinition {
  return {
    ...provider,
    status: "available"
  } as unknown as LegacyDatabaseProviderDefinition;
}

function toLegacyUnknownProviderDefinition(
  providerId: string | undefined
): LegacyDatabaseProviderDefinition {
  const id =
    typeof providerId === "string" && providerId.trim().length > 0
      ? normalizeProviderId(providerId)
      : "unknown";

  return {
    id,
    family: "custom",
    adapter: "plugin",
    label: id,
    description: `Unsupported or unavailable database provider: ${id}`,
    tier: 1,
    status: "deferred",
    localService: false,
    firstClassSupabase: false,
    planned: true
  } as unknown as LegacyDatabaseProviderDefinition;
}