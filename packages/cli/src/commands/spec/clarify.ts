import { Args, Command, Flags } from "@oclif/core";
import { access, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import {
  parseFoundrySpecFile,
  validateFoundrySpec,
  type ParsedFoundrySpec,
  type SpecValidationIssue,
} from "../../spec/index.js";

type ClarificationSeverity = "blocking" | "non-blocking";

interface ClarificationQuestion {
  readonly severity: ClarificationSeverity;
  readonly code: string;
  readonly question: string;
  readonly rationale: string;
  readonly recommendation: string;
}

interface ClarificationReport {
  readonly ok: boolean;
  readonly specPath: string;
  readonly outputPath: string;
  readonly specId: string;
  readonly title: string;
  readonly blockingQuestions: ClarificationQuestion[];
  readonly nonBlockingQuestions: ClarificationQuestion[];
  readonly validationIssues: SpecValidationIssue[];
}

export default class SpecClarify extends Command {
  static override description =
    "Analyze a Foundry native specification and generate a clarification report.";

  static override examples = [
    "$ foundry spec clarify specs/features/0001-add-authentication/spec.md",
    "$ foundry spec clarify specs/features/0001-add-authentication/spec.md --force",
    "$ foundry spec clarify specs/features/0001-add-authentication/spec.md --output .artifacts/spec-clarification.md",
    "$ foundry spec clarify specs/features/0001-add-authentication/spec.md --json",
    "$ foundry spec clarify specs/features/0001-add-authentication/spec.md --fail-on-blocking",
  ];

  static override args = {
    specPath: Args.string({
      description: "Path to the Foundry native specification file to clarify.",
      required: true,
    }),
  };

  static override flags = {
    output: Flags.string({
      description:
        "Path where the clarification report should be written. Defaults to clarifications.md beside the spec.",
      required: false,
    }),
    force: Flags.boolean({
      description: "Overwrite an existing clarification report.",
      default: false,
    }),
    json: Flags.boolean({
      description: "Print clarification result as JSON.",
      default: false,
    }),
    "fail-on-blocking": Flags.boolean({
      description:
        "Exit with code 1 when blocking clarification questions are found.",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SpecClarify);

    const workspaceRoot = getWorkspaceRoot();
    const resolvedSpecPath = resolveWorkspacePath(args.specPath);
    const outputPath = flags.output
      ? resolveWorkspacePath(flags.output)
      : join(dirname(resolvedSpecPath), "clarifications.md");

    if ((await pathExists(outputPath)) && !flags.force) {
      this.error(
        `Clarification report already exists: ${relativeToWorkspace(
          workspaceRoot,
          outputPath,
        )}. Pass --force to overwrite it.`,
      );
    }

    const spec = await parseFoundrySpecFile(resolvedSpecPath);
    const validation = validateFoundrySpec({
      ...spec,
      filePath: args.specPath,
    });

    const report = buildClarificationReport({
      spec: {
        ...spec,
        filePath: args.specPath,
      },
      outputPath: relativeToWorkspace(workspaceRoot, outputPath),
      validationIssues: validation.issues,
    });

    await writeFile(outputPath, renderClarificationReport(report), "utf8");

    const failed =
      flags["fail-on-blocking"] && report.blockingQuestions.length > 0;

    if (flags.json) {
      this.log(
        JSON.stringify(
          {
            ...report,
            ok: !failed,
            failOnBlocking: flags["fail-on-blocking"],
          },
          null,
          2,
        ),
      );

      if (failed) {
        this.exit(1);
      }

      return;
    }

    this.log("Foundry spec clarification report created.");
    this.log(`Spec: ${args.specPath}`);
    this.log(`Report: ${relativeToWorkspace(workspaceRoot, outputPath)}`);
    this.log(`Blocking questions: ${report.blockingQuestions.length}`);
    this.log(`Non-blocking questions: ${report.nonBlockingQuestions.length}`);
    this.log(`Validation issues: ${report.validationIssues.length}`);

    if (failed) {
      this.exit(1);
    }
  }
}

interface BuildClarificationReportInput {
  readonly spec: ParsedFoundrySpec;
  readonly outputPath: string;
  readonly validationIssues: SpecValidationIssue[];
}

function buildClarificationReport(
  input: BuildClarificationReportInput,
): ClarificationReport {
  const { spec } = input;
  const questions: ClarificationQuestion[] = [];

  questions.push(...questionsFromValidationIssues(input.validationIssues));
  questions.push(...questionsFromOpenQuestions(spec));
  questions.push(...questionsFromPlaceholders(spec));
  questions.push(...questionsFromRequirements(spec));
  questions.push(...questionsFromRecommendedSections(spec));
  questions.push(...questionsFromGovernanceFlags(spec));

  const blockingQuestions = questions.filter(
    (question) => question.severity === "blocking",
  );
  const nonBlockingQuestions = questions.filter(
    (question) => question.severity === "non-blocking",
  );

  return {
    ok: blockingQuestions.length === 0,
    specPath: spec.filePath,
    outputPath: input.outputPath,
    specId:
      typeof spec.frontmatter.id === "string"
        ? spec.frontmatter.id
        : "UNKNOWN-SPEC",
    title:
      typeof spec.frontmatter.title === "string"
        ? spec.frontmatter.title
        : "Untitled specification",
    blockingQuestions,
    nonBlockingQuestions,
    validationIssues: input.validationIssues,
  };
}

function questionsFromValidationIssues(
  issues: SpecValidationIssue[],
): ClarificationQuestion[] {
  return issues.map((issue) => ({
    severity: issue.severity === "error" ? "blocking" : "non-blocking",
    code: `validation-${issue.code}`,
    question: `How should the validation issue "${issue.code}" be resolved?`,
    rationale: issue.message,
    recommendation:
      issue.field !== undefined
        ? `Update the frontmatter field \`${issue.field}\`.`
        : issue.section !== undefined
          ? `Update or add the \`${issue.section}\` section.`
          : "Update the specification so it satisfies native Foundry validation.",
  }));
}

function questionsFromOpenQuestions(
  spec: ParsedFoundrySpec,
): ClarificationQuestion[] {
  const section = extractSection(spec.body, "Open Questions");

  if (!section) {
    return [
      {
        severity: "non-blocking",
        code: "missing-open-questions-section",
        question: "Are there any unresolved questions for this specification?",
        rationale:
          "The specification does not include an Open Questions section.",
        recommendation:
          "Add an Open Questions section, even if the answer is `None at this time.`",
      },
    ];
  }

  const meaningfulLines = section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^none\b/i.test(line))
    .filter((line) => !/^n\/a\b/i.test(line));

  if (meaningfulLines.length === 0) {
    return [];
  }

  return meaningfulLines.map((line, index) => ({
    severity: "blocking",
    code: "open-question",
    question: normalizeQuestionLine(line),
    rationale:
      "The spec explicitly contains unresolved open questions. Foundry should not advance it to planned/tasked status until the question is answered or intentionally deferred.",
    recommendation: `Resolve or explicitly defer Open Question ${index + 1}.`,
  }));
}

function questionsFromPlaceholders(
  spec: ParsedFoundrySpec,
): ClarificationQuestion[] {
  const placeholderPatterns = [
    /\bdescribe\b/i,
    /\bdefine\b/i,
    /\blist\b/i,
    /\bidentify\b/i,
    /\bcapture\b/i,
    /\bto be determined\b/i,
    /\btbd\b/i,
    /\btodo\b/i,
    /\bplaceholder\b/i,
  ];

  const lines = spec.body.split("\n");
  const questions: ClarificationQuestion[] = [];

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      continue;
    }

    if (placeholderPatterns.some((pattern) => pattern.test(trimmed))) {
      questions.push({
        severity: "non-blocking",
        code: "placeholder-content",
        question: `Should this placeholder-style content be replaced before planning?`,
        rationale: `Line ${index + 1} appears to contain placeholder text: ${trimmed}`,
        recommendation:
          "Replace placeholder prose with project-specific requirements, constraints, or decisions.",
      });
    }
  }

  return questions;
}

function questionsFromRequirements(
  spec: ParsedFoundrySpec,
): ClarificationQuestion[] {
  const requirementsSection = extractSection(spec.body, "Requirements");
  const questions: ClarificationQuestion[] = [];

  if (!requirementsSection) {
    return questions;
  }

  if (!/^###\s+REQ-\d{4,}/m.test(requirementsSection)) {
    questions.push({
      severity: "blocking",
      code: "missing-numbered-requirements",
      question: "What are the numbered requirements for this specification?",
      rationale:
        "The Requirements section exists, but it does not contain numbered REQ identifiers.",
      recommendation:
        "Add requirements using headings such as `### REQ-0001: Requirement title`.",
    });
  }

  if (!/acceptance criteria\s*:/i.test(requirementsSection)) {
    questions.push({
      severity: "blocking",
      code: "missing-acceptance-criteria",
      question: "What acceptance criteria prove that each requirement is done?",
      rationale:
        "The Requirements section should include acceptance criteria so Foundry can convert the spec into tasks and verification gates.",
      recommendation:
        "Add `Acceptance criteria:` under each requirement with concrete, testable bullets.",
    });
  }

  return questions;
}

function questionsFromRecommendedSections(
  spec: ParsedFoundrySpec,
): ClarificationQuestion[] {
  const recommendedSections = [
    "Non-Goals",
    "Users",
    "Implementation Notes",
    "Verification",
  ];

  return recommendedSections
    .filter((section) => !hasSection(spec.body, section))
    .map((section) => ({
      severity: "non-blocking",
      code: "missing-recommended-section",
      question: `Should the spec include a ${section} section?`,
      rationale:
        "Foundry can produce better plans, tasks, work packets, and verification gates when common planning sections are present.",
      recommendation: `Add a \`## ${section}\` section or document why it is intentionally omitted.`,
    }));
}

function questionsFromGovernanceFlags(
  spec: ParsedFoundrySpec,
): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];

  if (
    spec.frontmatter.requires_security_review === true &&
    !hasSection(spec.body, "Security")
  ) {
    questions.push({
      severity: "blocking",
      code: "security-review-needs-security-section",
      question:
        "What security concerns, threat model notes, or review requirements apply?",
      rationale:
        "`requires_security_review` is true, but the spec has no Security section.",
      recommendation:
        "Add `## Security` with risks, mitigations, review owners, and verification expectations.",
    });
  }

  if (
    spec.frontmatter.requires_database_change === true &&
    !hasSection(spec.body, "Data Model")
  ) {
    questions.push({
      severity: "blocking",
      code: "database-change-needs-data-model-section",
      question: "What data model changes are required?",
      rationale:
        "`requires_database_change` is true, but the spec has no Data Model section.",
      recommendation:
        "Add `## Data Model` describing schema changes, migrations, rollback concerns, and affected providers.",
    });
  }

  if (
    spec.frontmatter.requires_api_change === true &&
    !hasSection(spec.body, "API Contract")
  ) {
    questions.push({
      severity: "blocking",
      code: "api-change-needs-api-contract-section",
      question: "What API contract changes are required?",
      rationale:
        "`requires_api_change` is true, but the spec has no API Contract section.",
      recommendation:
        "Add `## API Contract` describing endpoints, schemas, compatibility, and contract tests.",
    });
  }

  if (
    spec.frontmatter.requires_migration === true &&
    !hasSection(spec.body, "Migration Plan")
  ) {
    questions.push({
      severity: "blocking",
      code: "migration-needs-migration-plan-section",
      question: "What migration plan is required?",
      rationale:
        "`requires_migration` is true, but the spec has no Migration Plan section.",
      recommendation:
        "Add `## Migration Plan` describing migration steps, rollback, validation, and operational safety.",
    });
  }

  if (
    (spec.frontmatter.risk_level === "high" ||
      spec.frontmatter.risk_level === "critical") &&
    !hasSection(spec.body, "Risk")
  ) {
    questions.push({
      severity: "blocking",
      code: "high-risk-spec-needs-risk-section",
      question: "What risks and mitigations govern this high-risk specification?",
      rationale:
        "High-risk and critical specs should explicitly document risk, mitigation, verification, and rollback expectations.",
      recommendation:
        "Add `## Risk` with failure modes, mitigations, test strategy, rollback strategy, and required approvals.",
    });
  }

  return questions;
}

function renderClarificationReport(report: ClarificationReport): string {
  const blocking = renderQuestionList(report.blockingQuestions);
  const nonBlocking = renderQuestionList(report.nonBlockingQuestions);
  const validation = renderValidationIssues(report.validationIssues);

  return `# Clarification Report: ${report.specId}

## Summary

- Spec: ${report.specPath}
- Title: ${report.title}
- Report: ${report.outputPath}
- Blocking questions: ${report.blockingQuestions.length}
- Non-blocking questions: ${report.nonBlockingQuestions.length}
- Validation issues: ${report.validationIssues.length}
- Result: ${report.ok ? "ready for planning review" : "clarification required"}

## Blocking Questions

${blocking}

## Non-Blocking Questions

${nonBlocking}

## Validation Issues

${validation}

## Recommended Next Actions

${renderNextActions(report)}

## Notes

This report was generated deterministically by Foundry. It does not require an AI provider, remote service, or subscription.
`;
}

function renderQuestionList(questions: ClarificationQuestion[]): string {
  if (questions.length === 0) {
    return "None.";
  }

  return questions
    .map(
      (question, index) => `### ${index + 1}. ${question.question}

- Severity: ${question.severity}
- Code: ${question.code}
- Rationale: ${question.rationale}
- Recommendation: ${question.recommendation}`,
    )
    .join("\n\n");
}

function renderValidationIssues(issues: SpecValidationIssue[]): string {
  if (issues.length === 0) {
    return "None.";
  }

  return issues
    .map((issue) => {
      const target = issue.field ?? issue.section ?? "spec";

      return `- ${issue.severity}: ${issue.code} [${target}] — ${issue.message}`;
    })
    .join("\n");
}

function renderNextActions(report: ClarificationReport): string {
  if (report.blockingQuestions.length > 0) {
    return [
      "1. Resolve each blocking question in the source specification.",
      "2. Re-run `foundry spec validate`.",
      "3. Re-run `foundry spec clarify --force`.",
      "4. Move the spec to planning only after the blocking question count reaches zero or remaining blockers are formally deferred.",
    ].join("\n");
  }

  if (report.nonBlockingQuestions.length > 0) {
    return [
      "1. Review the non-blocking questions.",
      "2. Decide whether each question should be answered now, deferred, or converted into implementation notes.",
      "3. Proceed to `foundry spec plan` after review.",
    ].join("\n");
  }

  return "1. Proceed to `foundry spec plan`.";
}

function hasSection(body: string, section: string): boolean {
  const sectionPattern = new RegExp(`^##\\s+${escapeRegExp(section)}\\s*$`, "m");

  return sectionPattern.test(body);
}

function extractSection(body: string, section: string): string | null {
  const escaped = escapeRegExp(section);
  const pattern = new RegExp(
    `^##\\s+${escaped}\\s*$([\\s\\S]*?)(?=^##\\s+|$)`,
    "m",
  );

  const match = body.match(pattern);

  return match?.[1]?.trim() ?? null;
}

function normalizeQuestionLine(line: string): string {
  return line
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .trim();
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
