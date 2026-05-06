export type InitDatabaseProviderId =
  | "postgres:drizzle"
  | "postgres:prisma"
  | "sqlite:drizzle"
  | "sqlite:prisma"
  | "mongodb:native"
  | "supabase:sql"
  | "supabase:drizzle"
  | "supabase:prisma"
  | "supabase:client";

const initDatabaseProviders: readonly InitDatabaseProviderId[] = [
  "postgres:drizzle",
  "postgres:prisma",
  "sqlite:drizzle",
  "sqlite:prisma",
  "mongodb:native",
  "supabase:sql",
  "supabase:drizzle",
  "supabase:prisma",
  "supabase:client"
];

export function supportedInitDatabaseProviders(): readonly InitDatabaseProviderId[] {
  return initDatabaseProviders;
}

export function isInitDatabaseProviderId(
  value: string
): value is InitDatabaseProviderId {
  return initDatabaseProviders.includes(value as InitDatabaseProviderId);
}

export function normalizeInitDatabaseProviderId(
  rawProvider: string
): InitDatabaseProviderId {
  const provider = rawProvider.trim();

  if (isInitDatabaseProviderId(provider)) {
    return provider;
  }

  throw new Error(
    `Unsupported database provider: ${rawProvider}. Supported providers: ${initDatabaseProviders.join(", ")}`
  );
}