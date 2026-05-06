---
title: External Provider Plugin Loading
description: Defines the initial post-v1 external provider plugin loading contract for foundry init.
status: draft
version: 0.1.0
created: 2026-05-06
updated: 2026-05-06
---

# External Provider Plugin Loading

`foundry init` supports a post-v1 provider plugin interface.

This document defines the first external provider plugin loading contract.

## Status

This is the first loader implementation.

It introduces the config format and loader module but does not yet make external providers selectable in the primary `foundry init --database-provider` path.

That integration belongs after loader tests.

## Default config path

The default config path is:

```text
config/foundry/database-provider-plugins.json
Config shape
JSON
￼
{
  "plugins": [
    {
      "id": "example:plugin",
      "module": "./providers/example-provider-plugin.js"
    }
  ]
}
Fields
Field	Required	Description
id	No	Optional expected provider ID. If provided, it must match the loaded plugin metadata ID.
module	Yes	Node/Bun import specifier or path to the provider plugin module.
exportName	No	Named export to load from the module.
￼
Export resolution
If exportName is omitted, the loader checks for exports in this order:

default

plugin

providerPlugin

The selected export may be:

a provider plugin object;

a function returning a provider plugin object.

Relative module paths
Relative module paths are resolved relative to the config file directory.

Example:

JSON
￼
{
  "plugins": [
    {
      "id": "custom:plugin",
      "module": "./custom-provider.js"
    }
  ]
}
For:

￼
config/foundry/database-provider-plugins.json
the module resolves as:

￼
config/foundry/custom-provider.js
Validation
Every loaded plugin is validated with the provider plugin contract.

The loader validates:

metadata fields;

dependency records;

environment variable definitions;

command definitions;

generated file definitions;

optional configured ID match.

Failure behavior
The loader returns both successfully loaded plugins and failures.

This makes it possible for future commands to choose between:

strict mode, where any failure blocks initialization;

diagnostic mode, where failures are reported but built-in providers remain available.

Security policy
External provider plugins execute local code.

Only load provider plugins from trusted project dependencies or trusted local files.

Do not load provider plugins from unreviewed sources.

Do not allow provider plugins to generate secrets.

## Related documentation

See also:

- `provider-plugin-interface.md` — provider plugin contract.
- `provider-plugin-packages.md` — provider package authoring and loading guide.

