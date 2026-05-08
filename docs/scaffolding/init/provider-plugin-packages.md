---
title: "Provider Plugin Packages"
status: "Draft"
owner: "Platform"
lastUpdated: "2026-05-08"
governanceLevel: "Required"
documentType: "Platform"
upstream: []
downstream: []
governanceLinks: []
adrLinks: []
glossaryTerms: []
---

# Provider Plugin Packages

`foundry init` supports a post-v1 provider plugin contract for database providers.

Provider plugins make it possible to add new database families, hosted database targets, ORM combinations, generated files, environment variable hints, and helper commands without hard-coding every provider into the main initializer.

## Current status

External provider plugin loading exists as a loader contract and verification path.

External providers are not yet fully selectable through the primary `foundry init --database-provider` path. That integration belongs to a later post-v1 slice after the loader, package format, and security expectations are documented and tested.

## Package goals

A provider plugin package should define:

1. provider identity;
2. provider metadata;
3. package dependencies;
4. development dependencies;
5. required or optional environment variables;
6. helper commands;
7. generated files;
8. capabilities;
9. safety expectations.

## Provider plugin interface

A provider plugin exports an object that satisfies the `InitDatabaseProviderPlugin` interface.

Conceptually:

```ts
export interface InitDatabaseProviderPlugin {
  readonly metadata: InitDatabaseProviderPluginMetadata;

  getPackageAdditions(): InitDatabaseProviderPackageAdditions;

  getEnvironmentVariables(): readonly InitDatabaseProviderEnvironmentVariable[];

  getCommands(): readonly InitDatabaseProviderCommand[];

  buildFiles(
    context: InitDatabaseProviderTemplateContext
  ): readonly DatabaseTemplateFile[];
}
Minimal package layout
A simple local provider plugin can use this shape:

￼
config/
  foundry/
    database-provider-plugins.json
    providers/
      example-provider.mjs
The config file points to the plugin module:

JSON
￼
{
  "plugins": [
    {
      "id": "example:plugin",
      "module": "./providers/example-provider.mjs"
    }
  ]
}
Relative module paths are resolved relative to the config file directory.

For the example above, the module resolves to:

￼
config/foundry/providers/example-provider.mjs
Package-based layout
A future published package may look like this:

￼
@foundry-provider/neon-drizzle
  package.json
  dist/
    index.js
  README.md
The workspace config may then reference the package import:

JSON
￼
{
  "plugins": [
    {
      "id": "neon:drizzle",
      "module": "@foundry-provider/neon-drizzle"
    }
  ]
}
Export resolution
The external provider loader can load:

a default export;

a plugin named export;

a providerPlugin named export;

an explicitly configured named export.

Example using default export:

JavaScript
￼
export default {
  metadata: {
    id: "example:plugin",
    family: "example",
    adapter: "plugin",
    label: "Example Provider",
    description: "Example external provider plugin.",
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
        name: "EXAMPLE_PROVIDER_URL",
        description: "Example provider URL.",
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
        description: "Validate example provider configuration."
      }
    ];
  },

  buildFiles() {
    return [
      {
        relativePath: "db/provider.json",
        description: "Example provider metadata.",
        contents: JSON.stringify({ id: "example:plugin" }, null, 2) + "\\n"
      }
    ];
  }
};
Example using a named function export:

JavaScript
￼
export function providerPlugin() {
  return {
    metadata: {
      id: "example:named",
      family: "example",
      adapter: "named",
      label: "Example Named Provider",
      description: "Example named provider plugin.",
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
      return [];
    },

    getCommands() {
      return [];
    },

    buildFiles() {
      return [
        {
          relativePath: "db/provider.json",
          description: "Example named provider metadata.",
          contents: JSON.stringify({ id: "example:named" }, null, 2) + "\\n"
        }
      ];
    }
  };
}
The config for the named export is:

JSON
￼
{
  "plugins": [
    {
      "id": "example:named",
      "module": "./providers/example-named-provider.mjs",
      "exportName": "providerPlugin"
    }
  ]
}
Metadata fields
Provider metadata includes:

Field	Description
id	Provider ID, such as neon:drizzle or custom:plugin.
family	Database family or platform family.
adapter	ORM, SDK, protocol, or integration style.
label	Human-readable provider name.
description	Human-readable provider description.
tier	external, custom, experimental, or a numeric first-party tier.
status	available, planned, experimental, or deprecated.
firstClassSupabase	Whether this provider is part of the Supabase family.
capabilities	Explicit provider capabilities.
￼
Capabilities
Supported capability values include:

￼
local-service
sql
document
orm
client
migrations
supabase
docker-compose
file-database
cloud-managed
Capabilities are used for validation, planning, documentation, and future UI or wizard behavior.

Dependencies
Plugins return package additions through:

TypeScript
￼
getPackageAdditions()
Example:

JavaScript
￼
getPackageAdditions() {
  return {
    dependencies: {
      "@neondatabase/serverless": "^0.10.4",
      "drizzle-orm": "^0.38.3"
    },
    devDependencies: {
      "drizzle-kit": "^0.30.1"
    }
  };
}
Provider plugins should only declare dependencies required by generated workspace code.

Environment variables
Environment variable definitions must include:

￼
name
description
required
example
secret
Rules:

secret: true marks values that must not be committed.

Examples must be placeholders, not real secrets.

Plugins must not generate .env files with real values.

Plugins may generate .env.example.

Generated files
Plugins generate files using buildFiles(context).

Each file must include:

￼
relativePath
description
contents
Optional:

￼
executable
Rules:

relativePath must be workspace-relative.

contents must be deterministic.

generated files must not contain secrets.

generated files should be documented.

provider metadata should include db/provider.json.

Commands
Provider commands describe generated package scripts or helper scripts.

Common database commands are:

￼
db:validate
db:start
db:stop
db:migrate
db:generate
A provider should only expose commands that its generated files actually support.

Safety rules
External provider plugins execute local code.

Only load plugins from trusted packages or reviewed local files.

Do not load plugins from untrusted sources.

Do not let provider plugins generate secrets.

Do not let provider plugins write outside the generated workspace.

Do not make provider plugin tests depend on external networks.

Verification
Provider plugin contract verification:

Bash
￼
bun run verify:init-provider-plugins
External provider plugin loader verification:

Bash
￼
bun run verify:init-external-provider-plugins
Full fast verification without the init matrix:

Bash
￼
FOUNDRY_SKIP_INIT_VERIFY=1 bun run verify
Full verification:

Bash
￼
bun run verify
Recommended package authoring checklist
Before publishing or using a provider plugin package:

￼ The plugin exports a valid InitDatabaseProviderPlugin.

￼ The provider ID is unique.

￼ Generated files are deterministic.

￼ Generated files do not contain secrets.

￼ Environment variables are documented.

￼ Secret environment variables are marked secret: true.

￼ Dependencies are minimal.

￼ Commands match generated files.

￼ The plugin has local tests.

￼ The plugin can be loaded through database-provider-plugins.json.
