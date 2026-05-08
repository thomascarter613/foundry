.
├── apps
├── bun.lock
├── CLAUDE.md
├── config
│   └── foundry
│       └── generator-manifest.json
├── contracts
│   ├── foundry
│   │   └── manifest.schema.json
│   ├── openapi
│   │   └── gov-api.yaml
│   └── proto
├── docs
│   ├── adr
│   │   ├── ADR-0001-monorepo-scaffolding-toolchain.md
│   │   ├── ADR-0002-ai-expected-provider-agnostic-architecture.md
│   │   └── ADR-0003-foundry-lifecycle-manifest-schema.md
│   ├── architecture
│   │   ├── adr
│   │   ├── ai-provider-agnostic-architecture.md
│   │   ├── component-diagram.md
│   │   ├── constraints.md
│   │   ├── container-diagram.md
│   │   ├── data-flow.md
│   │   ├── diagrams
│   │   ├── foundry-lifecycle-engine.md
│   │   ├── foundry-lifecycle-manifest.md
│   │   ├── integration-map.md
│   │   ├── principles.md
│   │   ├── runtime-views.md
│   │   └── system-context.md
│   ├── governance
│   │   ├── authority-map.md
│   │   ├── ci-policy.md
│   │   ├── contribution-model.md
│   │   ├── documentation-ci-rules.md
│   │   ├── documentation-governance.md
│   │   ├── governance-charter.md
│   │   ├── repository-contract.md
│   │   └── versioning-strategy.md
│   ├── index.md
│   ├── lifecycle
│   │   ├── branching-strategy.md
│   │   ├── change-management.md
│   │   ├── development-lifecycle.md
│   │   ├── incident-response.md
│   │   └── release-lifecycle.md
│   ├── onboarding
│   │   ├── glossary-quickreference.md
│   │   ├── how-to-navigate-the-repo.md
│   │   ├── README.md
│   │   └── system-overview.md
│   ├── planning
│   │   ├── adr-directory-structure.md
│   │   ├── adr-impact-analyzer.md
│   │   ├── adrlinks.md
│   │   ├── ads-validation-engine.md
│   │   ├── ai-native-scaffolding-engine.md
│   │   ├── api-overview.md
│   │   ├── api-reference--generator.md
│   │   ├── architecture-diagram-generator.md
│   │   ├── architecture-diagrams-directory.md
│   │   ├── architecture-integration-layer.md
│   │   ├── architecture-overview.md
│   │   ├── authority-map.md
│   │   ├── ci-integration-layer.md
│   │   ├── cli-spec.md
│   │   ├── code-linting-integration-layer.md
│   │   ├── cross-document-link-model.md
│   │   ├── cross-link-consistency-checker.md
│   │   ├── cross-link-graph-validator.md
│   │   ├── directory-structure-validator.md
│   │   ├── docs-agent-execution-engine.md
│   │   ├── docs-agent-governance-interpreter.md
│   │   ├── docs-agent-planning-engine.md
│   │   ├── docs-agent-reaasoning-engine.md
│   │   ├── docs-api.md
│   │   ├── docs-background-daemon.md
│   │   ├── docs-ci-rules.md
│   │   ├── docs-cli.md
│   │   ├── docs-dashboard.md
│   │   ├── docs-drift-detector.md
│   │   ├── docs-engine-canonical-spec.md
│   │   ├── docs-event-system.md
│   │   ├── docs-governance-engine.md
│   │   ├── docs-knowledge-graph-schema.md
│   │   ├── docs-linting-rules.md
│   │   ├── docs-self-validation-pipeline.md
│   │   ├── docs-service.md
│   │   ├── documentation-directory-structure.md
│   │   ├── documentation-system-component-map.md
│   │   ├── document-metadata-schema.md
│   │   ├── domain-map.md
│   │   ├── drift-remedition-engine.md
│   │   ├── exception-process.md
│   │   ├── execution-agent-design.md
│   │   ├── glossary-directory-structure.md
│   │   ├── glossary-impact-analyzer.md
│   │   ├── glossary.md
│   │   ├── glossary-term-linking.md
│   │   ├── glossary-validation-engine.md
│   │   ├── governance-charter.md
│   │   ├── governance-compliance-vaalidator.md
│   │   ├── governance-impact-analyzer.md
│   │   ├── governance-links.md
│   │   ├── governance-rules.md
│   │   ├── governed-document-types-.md
│   │   ├── governed-header-block.md
│   │   ├── idea.md
│   │   ├── implementation-sequencing.md
│   │   ├── lifecycle-integration-layer.md
│   │   ├── multi-agent-architecture.md
│   │   ├── nonfunctional-requirements.md
│   │   ├── onboarding-flow-geneator.md
│   │   ├── overview.md
│   │   ├── pea-design.md
│   │   ├── platform-integration-layer.md
│   │   ├── product-vision.md
│   │   ├── release-plan.md
│   │   ├── repo-as-memory.md
│   │   ├── repo-as-memory-system-design.md
│   │   ├── repository-contract.md
│   │   ├── risks-and-assumptions.md
│   │   ├── saas-business-model.md
│   │   ├── scaffolding-generator.md
│   │   ├── scope.md
│   │   ├── standards-impact-analyzer.md
│   │   ├── standards-integration-layer.md
│   │   ├── universal-governed-header-block.md
│   │   ├── upstream-downstream-denpendencies.md
│   │   ├── versioning-strategy.md
│   │   └── vision.md
│   ├── platform
│   │   ├── ci-cd.md
│   │   ├── observability.md
│   │   ├── overview.md
│   │   └── tooling.md
│   ├── product
│   │   ├── foundry-ai-operating-principles.md
│   │   └── foundry-core-operating-model.md
│   ├── README.md
│   ├── scaffolding
│   │   ├── ci-verification.md
│   │   ├── cli
│   │   ├── contract-verification.md
│   │   ├── generated-artifact-hygiene.md
│   │   ├── generator-manifest.md
│   │   ├── generator-smoke-tests.md
│   │   ├── generator-taxonomy.md
│   │   ├── init
│   │   ├── releases
│   │   └── scaffolding-strategy.md
│   ├── standards
│   │   ├── api-standards.md
│   │   ├── coding-standards.md
│   │   ├── documentation-standards.md
│   │   └── testing-standards.md
│   └── work-packets
│       └── WP-0002-add-foundry-init-workspace-initializer.md
├── generated
│   ├── clients
│   │   ├── gov-api-client
│   │   └── README.md
│   ├── README.md
│   └── sdks
├── index.ts
├── node_modules
│   ├── orval -> .bun/orval@8.9.1+4a8cedb5ac7d4514/node_modules/orval
│   ├── plop -> .bun/plop@4.0.5+1e0cb1bedf0614c6/node_modules/plop
│   ├── @redocly
│   │   └── cli -> ../.bun/@redocly+cli@2.30.3+e0cdb558262228cd/node_modules/@redocly/cli
│   ├── scaffdog -> .bun/scaffdog@4.1.0+1e0cb1bedf0614c6/node_modules/scaffdog
│   ├── @types
│   │   └── bun -> ../.bun/@types+bun@1.3.13/node_modules/@types/bun
│   └── typescript -> .bun/typescript@5.9.3/node_modules/typescript
├── package.json
├── packages
│   ├── cli
│   │   ├── bin
│   │   ├── bun.lock
│   │   ├── dist
│   │   ├── node_modules
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── src
│   │   └── tsconfig.json
│   ├── example
│   │   ├── dist
│   │   ├── node_modules
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── src
│   │   └── tsconfig.json
│   └── example-utils
│       ├── dist
│       ├── node_modules
│       ├── package.json
│       ├── README.md
│       ├── src
│       └── tsconfig.json
├── plopfile.mjs
├── README.md
├── redocly.yaml
├── services
│   └── gov-api
│       ├── dist
│       ├── node_modules
│       ├── package.json
│       ├── README.md
│       ├── src
│       └── tsconfig.json
├── templates
│   ├── copier
│   │   ├── app-solid-start
│   │   ├── cli-oclif
│   │   ├── package-ts
│   │   ├── service-hono
│   │   └── service-hono-api
│   └── plop
│       └── package
├── tools
│   └── scripts
│       ├── copier.sh
│       ├── foundry.sh
│       ├── verify-contracts.sh
│       ├── verify-docs.ts
│       ├── verify-generated.sh
│       ├── verify-generator-manifest.sh
│       ├── verify-generators.sh
│       ├── verify-init-external-provider-plugins.sh
│       ├── verify-init-provider-plugins.sh
│       ├── verify-init.sh
│       ├── verify-init-upgrade.sh
│       ├── verify-manifest.sh
│       └── verify.sh
├── tree-L_3
├── tsconfig.json
└── turbo
    └── generators
        └── templates

71 directories, 170 files
