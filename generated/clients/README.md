---
title: "Generated API Clients"
status: "accepted"
version: "0.1.0"
created: "2026-05-06"
updated: "2026-05-06"
owner: "Project Maintainer"
classification: "internal"
---

# Generated API Clients

This directory contains generated API clients.

## Current Generator

The initial client generator is:

```text
generator: contract-artifact:openapi-typescript-client
engine: orval
```

Expected Layout
Each generated client should use this shape:

￼
generated/clients/<client-name>/
├── index.ts
└── model/
Source Contract Rule
Every generated client must be traceable to a canonical contract.

Example:

￼
generated/clients/gov-api-client
source: contracts/openapi/gov-api.yaml
Manual Edit Rule
Do not manually edit generated client code.

Instead:

update the source contract;

regenerate the client;

review the diff;

run verification;

commit the contract and generated output together.

Verification
Run:

Bash
￼
bun run verify
