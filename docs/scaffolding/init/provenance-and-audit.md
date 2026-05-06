---
title: Foundry Init Provenance and Audit
description: Defines generated workspace provenance and audit metadata for foundry init.
status: draft
version: 0.1.0
created: 2026-05-06
updated: 2026-05-06
---

# Foundry Init Provenance and Audit

`foundry init` writes provenance and audit metadata into every generated workspace.

## Files

Every initialized workspace includes:

```text
.foundry/README.md
.foundry/init/provenance.json
.foundry/init/audit.ndjson
Provenance file
The provenance file records:

schema version;

generating tool;

generating command;

generation timestamp;

workspace name;

selected database provider;

dependency installation setting;

generated file list;

initialization plan.

Path:

￼
.foundry/init/provenance.json
Audit log
The audit log is newline-delimited JSON.

Path:

￼
.foundry/init/audit.ndjson
The first event is:

￼
foundry.init.workspace_created
Future slices may append additional events for dependency installation, generator execution, migrations, or workspace upgrades.

Policy
Initialization metadata is committed with the generated workspace.

This makes generated workspaces easier to inspect, debug, upgrade, and rehydrate in future AI-assisted development sessions.

Do not store secrets in provenance or audit files.

Do not write .env values into provenance or audit output.

Do not remove provenance files from generated workspaces unless a future migration replaces them with a more capable metadata format.
