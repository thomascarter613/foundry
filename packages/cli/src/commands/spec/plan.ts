import { Args, Command, Flags } from "@oclif/core";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import {
  parseFoundrySpecFile,
  validateFoundrySpec,
  type ParsedFoundrySpec,
  type SpecValidationIssue,
} from "../../spec/index.js";

interface RequirementSummary {
  readonly id: string;
  readonly title: string;
}

interface ClarificationSummary {
  readonly found: boolean;
  readonly path: string;
  readonly blockingQuestions: number | null;
  readonly nonBlockingQuestions: number | null;
  readonly validationIssues: number | null;
}

interface PlanResult {
  readonly ok: boolean;
  readonly specPath: string;
  readonly outputPath: string;
  readonly specId: string;
  readonly title: string;
  readonly requirementCount: number;
  readonly validationIssueCount: number;
  readonly clarificationFound: boolean;
  readonly blockingClarificationQuestions: number | null;
}

export default class SpecPlan extends Command {
  static override description =
    "Generate a deterministic implementation plan for a Foundry native specification.";

  static override examples = [
    "$ foundry spec plan specs/features/0001-add-authentication/spec.md",
    "$ foundry spec plan specs/features/0001-add-authentication/spec.md --force",
    "$ foundry spec plan specs/features/0001-add-authentication/spec.md --output .artifacts/implementation-plan.md",
    "$ foundry spec plan specs/features/0001-add-authentication/spec.md --allow-blocking-clarifications",
    "$ foundry spec plan specs/features/0001-add-authentication/spec.md --json",
  ];

  static override args = {
    specPath: Args.string({
      description: "Path to the Foundry native specification file to plan.",
      required: true,
    }),
  };

  static override flags = {
    output: Flags.string({
      description:
        "Path where the implementation plan should be written. Defaults to implementation-plan.md beside the spec.",
      required: false,
    }),
    clarifications: Flags.string({
      description:
        "Path to the clarification report. Defaults to clarifications.md beside the spec when present.",
      required: false,
    }),
    force: Flags.boolean({
      description: "Overwrite an existing implementation plan.",
      default: false,
    }),
    json: Flags.boolean({
      description: "Print planning result as JSON.",
      default: false,
    }),
    "allow-blocking-clarifications": Flags.boolean({
      description:
        "Allow plan generation even when the clarification report contains blocking questions.",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SpecPlan);

    const workspaceRoot = getWorkspaceRoot();
    const resolvedSpecPath = resolveWorkspacePath(args.specPath);
    const outputPath = flags.output
      ? resolveWorkspacePath(flags.output)
      : join(dirname(resolvedSpecPath), "implementation-plan.md");

    const clarificationPath = flags.clarifications
      ? resolveWorkspacePath(flags.clarifications)
      : join(dirname(resolvedSpecPath), "clarifications.md");

    if ((await pathExists(outputPath)) && !flags.force) {
      this.error(
        `Implementation plan already exists: ${relativeToWorkspace(
          workspaceRoot,
          outputPath,
        )}. Pass --force to overwrite it.`,
      );
    }

    const spec = await parseFoundrySpecFile(resolvedSpecPath);
    const displaySpec = {
      ...spec,
      filePath: args.specPath,
    };

    const validation = validateFoundrySpec(displaySpec);
    const validationErrors = validation.issues.filter(
      (issue) => issue.severity === "error",
    );

    if (validationErrors.length > 0) {
      this.error(
        [
          "Cannot generate implementation plan because the spec is invalid.",
          "",
          ...validationErrors.map(formatValidationIssue),
          "",
          `Run: foundry spec validate ${args.specPath}`,
        ].join("\n"),
      );
    }

    const clarificationSummary = await readClarificationSummary(
      clarificationPath,
      workspaceRoot,
    );

    if (
      clarificationSummary.blockingQuestions !== null &&
      clarificationSummary.blockingQuestions > 0 &&
      !flags["allow-blocking-clarifications"]
    ) {
      this.error(
        [
          "Cannot generate implementation plan because blocking clarification questions remain.",
          "",
          `Clarification report: ${clarificationSummary.path}`,
          `Blocking questions: ${clarificationSummary.blockingQuestions}`,
          "",
          "Resolve the blocking questions, regenerate clarifications with --force, or pass --allow-blocking-clarifications.",
        ].join("\n"),
      );
    }

    const requirements = extractRequirements(spec.body);
    const plan = renderImplementationPlan({
      spec: displaySpec,
      validationIssues: validation.issues,
      clarificationSummary,
      requirements,
      outputPath: relativeToWorkspace(workspaceRoot, outputPath),
    });

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, plan, "utf8");

    const result: PlanResult = {
      ok: true,
      specPath: args.specPath,
      outputPath: relativeToWorkspace(workspaceRoot, outputPath),
      specId: readString(spec.frontmatter.id, "UNKNOWN-SPEC"),
      title: readString(spec.frontmatter.title, "Untitled specification"),
      requirementCount: requirements.length,
      validationIssueCount: validation.issues.length,
      clarificationFound: clarificationSummary.found,
      blockingClarificationQuestions: clarificationSummary.blockingQuestions,
    };

    if (flags.json) {
      this.log(JSON.stringify(result, null, 2));
      return;
    }

    this.log("Foundry implementation plan created.");
    this.log(`Spec: ${result.specPath}`);
    this.log(`Plan: ${result.outputPath}`);
    this.log(`Requirements: ${result.requirementCount}`);
    this.log(
      `Clarification report: ${
        result.clarificationFound ? clarificationSummary.path : "not found"
      }`,
    );

    if (result.blockingClarificationQuestions !== null) {
      this.log(
        `Blocking clarification questions: ${result.blockingClarificationQuestions}`,
      );
    }

    this.log("");
    this.log("Next:");
    this.log(`  foundry spec tasks ${result.outputPath}`);
  }
}

interface RenderImplementationPlanInput {
  readonly spec: ParsedFoundrySpec;
  readonly validationIssues: SpecValidationIssue[];
  readonly clarificationSummary: ClarificationSummary;
  readonly requirements: RequirementSummary[];
  readonly outputPath: string;
}

function renderImplementationPlan(input: RenderImplementationPlanInput): string {
  const specId = readString(input.spec.frontmatter.id, "UNKNOWN-SPEC");
  const title = readString(input.spec.frontmatter.title, "Untitled specification");
  const kind = readString(input.spec.frontmatter.kind, "unknown");
  const specStatus = readString(input.spec.frontmatter.specStatus, "unknown");
  const riskLevel = readString(input.spec.frontmatter.risk_level, "unknown");
  const owner = readString(input.spec.frontmatter.owner, "unknown");
  const summary = extractSection(input.spec.body, "Summary") ?? "No summary provided.";
  const problem = extractSection(input.spec.body, "Problem") ?? "No problem statement provided.";
  const verification =
    extractSection(input.spec.body, "Verification") ??
    "No explicit verification section was provided in the source spec.";

  const requirements = input.requirements.length > 0
    ? input.requirements
        .map((requirement) => `- ${requirement.id}: ${requirement.title}`)
        .join("\n")
    : "- No numbered requirements were found.";

  return `# Implementation Plan: ${specId}

## Summary

- Spec: ${input.spec.filePath}
- Title: ${title}
- Kind: ${kind}
- Spec status: ${specStatus}
- Risk level: ${riskLevel}
- Owner: ${owner}
- Plan: ${input.outputPath}

${summary}

## Problem Statement

${problem}

## Planning Gate Status

- Native spec validation errors: ${input.validationIssues.filter((issue) => issue.severity === "error").length}
- Native spec validation warnings: ${input.validationIssues.filter((issue) => issue.severity === "warning").length}
- Clarification report found: ${input.clarificationSummary.found ? "yes" : "no"}
- Clarification report path: ${input.clarificationSummary.path}
- Blocking clarification questions: ${formatNullableCount(input.clarificationSummary.blockingQuestions)}
- Non-blocking clarification questions: ${formatNullableCount(input.clarificationSummary.nonBlockingQuestions)}

## Requirements Covered

${requirements}

## Implementation Strategy

1. Review the source specification and any clarification report.
2. Identify affected packages, commands, scripts, generated artifacts, and documentation.
3. Implement the smallest vertical slice that satisfies the requirements.
4. Preserve deterministic behavior and avoid hidden AI/runtime dependencies.
5. Add or update verification coverage before considering the slice complete.
6. Run the full repository verification chain.

## Governance Impact

${renderGovernanceImpact(input.spec)}

## Affected Surfaces

${renderAffectedSurfaces(input.spec)}

## Verification Plan

Source spec verification guidance:

${verification}

Required Foundry verification commands:

\`\`\`bash
bun run typecheck
bun run build
bun run verify:specs
bun run verify
\`\`\`

## Work Breakdown Seed

${renderWorkBreakdown(input.requirements)}

## Risks and Mitigations

${renderRisks(input.spec)}

## Open Planning Notes

- Confirm whether this plan should become a work packet.
- Confirm whether this plan requires an ADR update.
- Confirm whether generated files, fixtures, or repo-contract checks need to be updated.
- Confirm whether the change requires user approval before execution.

## Next Actions

1. Review this implementation plan.
2. Resolve any remaining blocking clarification questions.
3. Generate tasks from this plan.
4. Convert approved tasks into a Foundry work packet.
5. Execute the work packet through the supervised repo-evolution flow.

## Determinism Note

This implementation plan was generated deterministically by Foundry. It does not require an AI provider, remote service, or subscription.
`;
}

function renderGovernanceImpact(spec: ParsedFoundrySpec): string {
  const lines = [
    `- Requires AI: ${formatBoolean(spec.frontmatter.requires_ai)}`,
    `- Requires database change: ${formatBoolean(spec.frontmatter.requires_database_change)}`,
    `- Requires API change: ${formatBoolean(spec.frontmatter.requires_api_change)}`,
    `- Requires security review: ${formatBoolean(spec.frontmatter.requires_security_review)}`,
    `- Requires migration: ${formatBoolean(spec.frontmatter.requires_migration)}`,
  ];

  if (spec.frontmatter.requires_security_review === true) {
    lines.push("- Security review must be completed before implementation is considered verified.");
  }

  if (spec.frontmatter.requires_database_change === true) {
    lines.push("- Database provider compatibility and rollback behavior must be addressed.");
  }

  if (spec.frontmatter.requires_api_change === true) {
    lines.push("- API contract changes must include contract verification.");
  }

  if (spec.frontmatter.requires_migration === true) {
    lines.push("- Migration and rollback steps must be explicitly documented.");
  }

  return lines.join("\n");
}

function renderAffectedSurfaces(spec: ParsedFoundrySpec): string {
  const surfaces: string[] = [];

  if (spec.frontmatter.requires_database_change === true) {
    surfaces.push("- Data model / migrations");
  }

  if (spec.frontmatter.requires_api_change === true) {
    surfaces.push("- API contracts / generated clients");
  }

  if (spec.frontmatter.requires_security_review === true) {
    surfaces.push("- Security policy / threat model / secret handling");
  }

  if (spec.frontmatter.requires_migration === true) {
    surfaces.push("- Migration, rollback, and operational runbooks");
  }

  surfaces.push("- CLI behavior");
  surfaces.push("- Verification scripts");
  surfaces.push("- Documentation and generated artifacts");

  return Array.from(new Set(surfaces)).join("\n");
}

function renderWorkBreakdown(requirements: RequirementSummary[]): string {
  if (requirements.length === 0) {
    return [
      "1. Add missing numbered requirements to the source specification.",
      "2. Re-run `foundry spec plan --force`.",
      "3. Generate tasks only after requirements are traceable.",
    ].join("\n");
  }

  return requirements
    .map(
      (requirement, index) =>
        `${index + 1}. Implement ${requirement.id}: ${requirement.title}\n   - Add code changes.\n   - Add verification coverage.\n   - Update documentation or fixtures when required.`,
    )
    .join("\n");
}

function renderRisks(spec: ParsedFoundrySpec): string {
  const riskLevel = readString(spec.frontmatter.risk_level, "unknown");

  const risks = [
    `- Current risk level: ${riskLevel}`,
    "- Risk of spec drift if implementation proceeds without updating the source specification.",
    "- Risk of unverified behavior if task generation does not include deterministic checks.",
  ];

  if (riskLevel === "high" || riskLevel === "critical") {
    risks.push(
      "- High-risk specs require explicit mitigation, rollback, and approval gates before implementation.",
    );
  }

  return risks.join("\n");
}

function extractRequirements(body: string): RequirementSummary[] {
  const requirements: RequirementSummary[] = [];
  const pattern = /^###\s+(REQ-\d{4,})\s*:?\s*(.*)$/gm;

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(body)) !== null) {
    const id = match[1] ?? "REQ-UNKNOWN";
    const title = (match[2] ?? "").trim();

    requirements.push({
      id,
      title: title.length > 0 ? title : "Untitled requirement",
    });
  }

  return requirements;
}

async function readClarificationSummary(
  clarificationPath: string,
  workspaceRoot: string,
): Promise<ClarificationSummary> {
  const relativePath = relativeToWorkspace(workspaceRoot, clarificationPath);

  if (!(await pathExists(clarificationPath))) {
    return {
      found: false,
      path: relativePath,
      blockingQuestions: null,
      nonBlockingQuestions: null,
      validationIssues: null,
    };
  }

  const content = await readFile(clarificationPath, "utf8");

  return {
    found: true,
    path: relativePath,
    blockingQuestions: extractSummaryCount(content, "Blocking questions"),
    nonBlockingQuestions: extractSummaryCount(content, "Non-blocking questions"),
    validationIssues: extractSummaryCount(content, "Validation issues"),
  };
}

function extractSummaryCount(content: string, label: string): number | null {
  const pattern = new RegExp(`-\\s+${escapeRegExp(label)}:\\s+(\\d+)`, "i");
  const match = content.match(pattern);

  if (!match?.[1]) {
    return null;
  }

  return Number.parseInt(match[1], 10);
}

function extractSection(body: string, section: string): string | null {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const sectionHeadingPattern = new RegExp(
    `^##\\s+${escapeRegExp(section)}\\s*$`,
  );

  let startIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (sectionHeadingPattern.test(lines[index]?.trim() ?? "")) {
      startIndex = index + 1;
      break;
    }
  }

  if (startIndex === -1) {
    return null;
  }

  const collected: string[] = [];

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index] ?? "";

    if (/^##\s+/.test(line.trim())) {
      break;
    }

    collected.push(line);
  }

  return collected.join("\n").trim();
}

function formatValidationIssue(issue: SpecValidationIssue): string {
  const target = issue.field ?? issue.section ?? "spec";

  return `- ${issue.severity}: ${issue.code} [${target}] — ${issue.message}`;
}

function formatNullableCount(value: number | null): string {
  return value === null ? "unknown" : String(value);
}

function formatBoolean(value: unknown): string {
  return value === true ? "yes" : "no";
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function getWorkspaceRoot(): string {
  return process.env.FOUNDRY_WORKSPACE_CWD ?? process.env.INIT_CWD ?? process.cwd();
}

function resolveWorkspacePath(inputPath: string): string {
  if (isAbsolute(inputPath)) {
    return inputPath;
  }

  return resolve(getWorkspaceRoot(), inputPath);
}

function relativeToWorkspace(workspaceRoot: string, absolutePath: string): string {
  const normalizedWorkspace = workspaceRoot.replace(/\/+$/g, "");
  const normalizedPath = absolutePath.replace(/\/+$/g, "");

  if (normalizedPath === normalizedWorkspace) {
    return ".";
  }

  if (normalizedPath.startsWith(`${normalizedWorkspace}/`)) {
    return normalizedPath.slice(normalizedWorkspace.length + 1);
  }

  return absolutePath;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}