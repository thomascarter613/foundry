export type DatabaseProviderStatus = "available" | "planned" | "deferred";

export type DatabaseKind =
  | "postgres"
  | "supabase"
  | "sqlite"
  | "mongodb"
  | "mysql"
  | "mariadb"
  | "neon"
  | "turso"
  | "libsql"
  | "cloudflare-d1"
  | "cockroachdb"
  | "sqlserver"
  | "singlestore"
  | "planetscale"
  | "custom";

export type DatabaseToolkit =
  | "drizzle"
  | "prisma"
  | "native"
  | "sql"
  | "supabase-client"
  | "driver"
  | "manual"
  | "plugin";

export type DatabaseRollbackSupport = "native" | "project-controlled" | "manual" | "none";

export type DatabaseConnectionRole =
  | "primary"
  | "document-store"
  | "read-model"
  | "analytics"
  | "event-store"
  | "cache"
  | "local"
  | "test"
  | "client"
  | "custom";

export interface DatabaseEnvVarDefinition {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
  readonly example?: string;
  readonly secret: boolean;
}

export interface DatabaseProviderScript {
  readonly name: string;
  readonly command: string;
  readonly description: string;
}

export interface DatabaseProviderDefinition {
  readonly id: string;
  readonly database: DatabaseKind;
  readonly toolkit: DatabaseToolkit;
  readonly status: DatabaseProviderStatus;
  readonly tier: 1 | 2 | 3;
  readonly displayName: string;
  readonly description: string;
  readonly supportsMigrations: boolean;
  readonly supportsSeeding: boolean;
  readonly supportsRollback: DatabaseRollbackSupport;
  readonly supportsDockerCompose: boolean;
  readonly supportsSupabaseLocalStack: boolean;
  readonly supportsHostedConnection: boolean;
  readonly recommendedForPrimary: boolean;
  readonly requiredDependencies: readonly string[];
  readonly requiredDevDependencies: readonly string[];
  readonly generatedFilePatterns: readonly string[];
  readonly envVars: readonly DatabaseEnvVarDefinition[];
  readonly scripts: readonly DatabaseProviderScript[];
  readonly notes: readonly string[];
}

export interface DatabaseProviderRegistry {
  readonly registryVersion: "foundry.database-provider-registry.v1";
  readonly providers: readonly DatabaseProviderDefinition[];
}

export interface DatabaseProviderLookupResult {
  readonly provider: DatabaseProviderDefinition | undefined;
  readonly status: "available" | "planned" | "deferred" | "unknown";
}
