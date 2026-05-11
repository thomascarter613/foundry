import { Args, Command, Flags } from "@oclif/core";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";

interface RequirementSummary {
  readonly id: string;
  readonly title: string;
}

interface GeneratedTask {
  readonly id: string;
  readonly title: string;
  readonly source: string;
  readonly category: "implementation" | "governance" | "verification" | "review";
  readonly steps: string[];
  readonly verification: string[];
}

interface PlanMetadata {
  readonly specId: string;
  readonly title: string;
  readonly specPath: string;
  readonly riskLevel: string;
  readonly owner: string;
  readonly blockingClarificationQuestions: number | null;
  readonly nonBlockingClarificationQuestions: number | null;
  readonly requiresAi: boolean;
  readonly requiresDatabaseChange: boolean;
  readonly requiresApiChange: boolean;
  readonly requiresSecurityReview: boolean;
  readonly requiresMigration: boolean;
}

interface TaskGenerationResult {
  readonly ok: boolean;
  readonly planPath: string;
  readonly outputPath: string;
  readonly specId: string;
  readonly title: string;
  readonly taskCount: number;
  readonly requirementCount: number;
  readonly blockingClarificationQuestions: number | null;
}

export default class SpecTasks extends Command {
  static override description =
    "Generate deterministic implementation tasks from a Foundry implementation plan.";

  static override examples = [
    "$ foundry spec tasks specs/features/0001-add-authentication/implementation-plan.md",
    "$ foundry spec tasks specs/features/0001-add-authentication/implementation-plan.md --force",
    "$ foundry spec tasks specs/features/0001-add-authentication/implementation-plan.md --output .artifacts/tasks.md",
    "$ foundry spec tasks specs/features/0001-add-authentication/implementation-plan.md --allow-blocking-clarifications",
    "$ foundry spec tasks specs/features/0001-add-authentication/implementation-plan.md --json",
  ];

  static override args = {
    planPath: Args.string({
      description: "Path to the Foundry implementation plan.",
      required: true,
    }),
  };

  static override flags = {
    output: Flags.string({
      description:
        "Path where the task document should be written. Defaults to tasks.md beside the implementation plan.",
      required: false,
    }),
    force: Flags.boolean({
      description: "Overwrite an existing task document.",
      default: false,
    }),
    json: Flags.boolean({
      description: "Print task generation result as JSON.",
      default: false,
    }),
    "allow-blocking-clarifications": Flags.boolean({
      description:
        "Allow task generation even when the implementation plan records blocking clarification questions.",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SpecTasks);

    const workspaceRoot = getWorkspaceRoot();
    const resolvedPlanPath = resolveWorkspacePath(args.planPath);
    const outputPath = flags.output
      ? resolveWorkspacePath(flags.output)
      : join(dirname(resolvedPlanPath), "tasks.md");

    if ((await pathExists(outputPath)) && !flags.force) {
      this.error(
        `Task document already exists: ${relativeToWorkspace(
          workspaceRoot,
          outputPath,
        )}. Pass --force to overwrite it.`,
      );
    }

    const planContent = await readFile(resolvedPlanPath, "utf8");
    validateImplementationPlan(planContent, args.planPath);

    const metadata = extractPlanMetadata(planContent);
    const requirements = extractRequirements(planContent);

    if (
      metadata.blockingClarificationQuestions !== null &&
      metadata.blockingClarificationQuestions > 0 &&
      !flags["allow-blocking-clarifications"]
    ) {
      this.error(
        [
          "Cannot generate tasks because the implementation plan records blocking clarification questions.",
          "",
          `Plan: ${args.planPath}`,
          `Blocking questions: ${metadata.blockingClarificationQuestions}`,
          "",
          "Resolve the blocking questions, regenerate the implementation plan, or pass --allow-blocking-clarifications.",
        ].join("\n"),
      );
    }

    const tasks = buildTasks({
      metadata,
      requirements,
    });

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      renderTasksDocument({
        metadata,
        planPath: args.planPath,
        outputPath: relativeToWorkspace(workspaceRoot, outputPath),
        requirements,
        tasks,
      }),
      "utf8",
    );

    const result: TaskGenerationResult = {
      ok: true,
      planPath: args.planPath,
      outputPath: relativeToWorkspace(workspaceRoot, outputPath),
      specId: metadata.specId,
      title: metadata.title,
      taskCount: tasks.length,
      requirementCount: requirements.length,
      blockingClarificationQuestions: metadata.blockingClarificationQuestions,
    };

    if (flags.json) {
      this.log(JSON.stringify(result, null, 2));
      return;
    }

    this.log("Foundry task document created.");
    this.log(`Plan: ${result.planPath}`);
    this.log(`Tasks: ${result.outputPath}`);
    this.log(`Spec: ${result.specId}`);
    this.log(`Generated tasks: ${result.taskCount}`);
    this.log(`Requirements covered: ${result.requirementCount}`);

    if (result.blockingClarificationQuestions !== null) {
      this.log(`Blocking clarification questions: ${result.blockingClarificationQuestions}`);
    }

    this.log("");
    this.log("Next:");
    this.log(`  foundry work-packet from-tasks ${result.outputPath}`);
  }
}

interface BuildTasksInput {
  readonly metadata: PlanMetadata;
  readonly requirements: RequirementSummary[];
}

interface RenderTasksDocumentInput {
  readonly metadata: PlanMetadata;
  readonly planPath: string;
  readonly outputPath: string;
  readonly requirements: RequirementSummary[];
  readonly tasks: GeneratedTask[];
}

function validateImplementationPlan(content: string, planPath: string): void {
  const requiredMarkers = [
    "# Implementation Plan:",
    "## Planning Gate Status",
    "## Requirements Covered",
    "## Work Breakdown Seed",
    "## Verification Plan",
  ];

  const missingMarkers = requiredMarkers.filter((marker) => !content.includes(marker));

  if (missingMarkers.length > 0) {
    throw new Error(
      [
        `Invalid Foundry implementation plan: ${planPath}`,
        "",
        "Missing required marker(s):",
        ...missingMarkers.map((marker) => `- ${marker}`),
      ].join("\n"),
    );
  }
}

function extractPlanMetadata(content: string): PlanMetadata {
  return {
    specId: extractRequired(/^# Implementation Plan:\s+(.+)$/m, content, "spec id"),
    title: extractScalarListValue(content, "Title", "Untitled specification"),
    specPath: extractScalarListValue(content, "Spec", "unknown"),
    riskLevel: extractScalarListValue(content, "Risk level", "unknown"),
    owner: extractScalarListValue(content, "Owner", "unknown"),
    blockingClarificationQuestions: extractNullableCount(
      extractScalarListValue(content, "Blocking clarification questions", "unknown"),
    ),
    nonBlockingClarificationQuestions: extractNullableCount(
      extractScalarListValue(content, "Non-blocking clarification questions", "unknown"),
    ),
    requiresAi: extractYesNo(content, "Requires AI"),
    requiresDatabaseChange: extractYesNo(content, "Requires database change"),
    requiresApiChange: extractYesNo(content, "Requires API change"),
    requiresSecurityReview: extractYesNo(content, "Requires security review"),
    requiresMigration: extractYesNo(content, "Requires migration"),
  };
}

function extractRequirements(content: string): RequirementSummary[] {
  const section = extractSection(content, "Requirements Covered");

  if (!section) {
    return [];
  }

  const requirements: RequirementSummary[] = [];
  const pattern = /^-\s+(REQ-\d{4,})\s*:?\s*(.+)$/gm;

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(section)) !== null) {
    requirements.push({
      id: match[1] ?? "REQ-UNKNOWN",
      title: (match[2] ?? "Untitled requirement").trim(),
    });
  }

  return requirements;
}

function buildTasks(input: BuildTasksInput): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];

  for (const requirement of input.requirements) {
    tasks.push({
      id: nextTaskId(tasks.length),
      title: `Implement ${requirement.id}: ${requirement.title}`,
      source: requirement.id,
      category: "implementation",
      steps: [
        "Review the source requirement and implementation plan.",
        "Identify the smallest vertical slice that satisfies the requirement.",
        "Implement the required code, configuration, fixture, or documentation changes.",
        "Keep the change deterministic and avoid hidden runtime dependencies.",
        "Update or add verification coverage for the requirement.",
      ],
      verification: [
        "Run the targeted verification for the changed surface.",
        "Run `bun run typecheck`.",
        "Run `bun run build`.",
      ],
    });
  }

  if (input.metadata.requiresSecurityReview) {
    tasks.push({
      id: nextTaskId(tasks.length),
      title: "Complete security review tasks",
      source: "governance",
      category: "governance",
      steps: [
        "Review the spec and implementation plan for security-sensitive behavior.",
        "Document threat model notes, risks, mitigations, and review owner expectations.",
        "Confirm secret handling, credential boundaries, and unsafe input paths.",
      ],
      verification: [
        "Confirm security review notes are present.",
        "Confirm implementation verification covers security-sensitive behavior.",
      ],
    });
  }

  if (input.metadata.requiresDatabaseChange) {
    tasks.push({
      id: nextTaskId(tasks.length),
      title: "Plan and verify database changes",
      source: "governance",
      category: "governance",
      steps: [
        "Identify affected database providers and schema surfaces.",
        "Document migration, rollback, and seed-data implications.",
        "Confirm generated project/provider compatibility is preserved.",
      ],
      verification: [
        "Run database/provider verification commands when available.",
        "Confirm rollback expectations are documented.",
      ],
    });
  }

  if (input.metadata.requiresApiChange) {
    tasks.push({
      id: nextTaskId(tasks.length),
      title: "Plan and verify API contract changes",
      source: "governance",
      category: "governance",
      steps: [
        "Identify affected API contracts, clients, schemas, and generated outputs.",
        "Update contract documentation and generated client expectations.",
        "Confirm backwards compatibility or migration expectations.",
      ],
      verification: [
        "Run API contract verification when available.",
        "Confirm generated clients or contract artifacts are updated when required.",
      ],
    });
  }

  if (input.metadata.requiresMigration) {
    tasks.push({
      id: nextTaskId(tasks.length),
      title: "Document migration and rollback path",
      source: "governance",
      category: "governance",
      steps: [
        "Write migration steps.",
        "Write rollback steps.",
        "Define validation checks before and after migration.",
      ],
      verification: [
        "Confirm migration plan is documented.",
        "Confirm rollback plan is documented.",
      ],
    });
  }

  tasks.push({
    id: nextTaskId(tasks.length),
    title: "Update verification coverage",
    source: "verification",
    category: "verification",
    steps: [
      "Add or update targeted verification for this lifecycle slice.",
      "Ensure failure cases are covered where practical.",
      "Keep verification deterministic and runnable without external services unless explicitly required.",
    ],
    verification: [
      "Run `bun run verify:specs`.",
      "Confirm generated artifacts remain untracked.",
    ],
  });

  tasks.push({
    id: nextTaskId(tasks.length),
    title: "Run full repository verification",
    source: "verification",
    category: "verification",
    steps: [
      "Run the complete repository verification chain.",
      "Inspect any generated artifacts or validation reports.",
      "Fix regressions before committing.",
    ],
    verification: [
      "Run `bun run verify`.",
      "Confirm the working tree only contains intentional source changes.",
    ],
  });

  tasks.push({
    id: nextTaskId(tasks.length),
    title: "Prepare atomic commit",
    source: "review",
    category: "review",
    steps: [
      "Review the final diff.",
      "Confirm the implementation remains aligned with the source spec and implementation plan.",
      "Commit the change using an atomic Conventional Commit message.",
    ],
    verification: [
      "Run `git diff --check`.",
      "Run `git status --short`.",
    ],
  });

  return tasks;
}

function renderTasksDocument(input: RenderTasksDocumentInput): string {
  const requirementSummary =
    input.requirements.length > 0
      ? input.requirements
          .map((requirement) => `- ${requirement.id}: ${requirement.title}`)
          .join("\n")
      : "- No numbered requirements were extracted from the implementation plan.";

  const tasks = input.tasks.map(renderTask).join("\n\n");

  return `# Tasks: ${input.metadata.specId}

## Summary

- Spec: ${input.metadata.specPath}
- Title: ${input.metadata.title}
- Source plan: ${input.planPath}
- Task document: ${input.outputPath}
- Risk level: ${input.metadata.riskLevel}
- Owner: ${input.metadata.owner}
- Total tasks: ${input.tasks.length}
- Requirements covered: ${input.requirements.length}
- Blocking clarification questions: ${formatNullableCount(input.metadata.blockingClarificationQuestions)}
- Non-blocking clarification questions: ${formatNullableCount(input.metadata.nonBlockingClarificationQuestions)}

## Execution Policy

- Tasks are deterministic planning artifacts.
- Tasks do not authorize autonomous repository mutation.
- Implementation still requires supervised execution and explicit review.
- AI assistance may be used, but no hosted AI provider is required.
- Each implementation slice should remain atomic and verifiable.

## Requirements Traceability

${requirementSummary}

## Task List

${tasks}

## Required Verification Commands

\`\`\`bash
bun run typecheck
bun run build
bun run verify:specs
bun run verify
\`\`\`

## Commit Recommendation

\`\`\`bash
git commit -m "feat(spec): implement ${input.metadata.specId.toLowerCase()} tasks"
\`\`\`

## Determinism Note

This task document was generated deterministically by Foundry. It does not require an AI provider, remote service, or subscription.
`;
}

function renderTask(task: GeneratedTask): string {
  const steps = task.steps
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n");

  const verification = task.verification
    .map((item) => `- ${item}`)
    .join("\n");

  return `### ${task.id}: ${task.title}

- Source: ${task.source}
- Category: ${task.category}
- Status: pending

#### Steps

${steps}

#### Verification

${verification}`;
}

function nextTaskId(currentTaskCount: number): string {
  return `TASK-${String(currentTaskCount + 1).padStart(4, "0")}`;
}

function extractRequired(pattern: RegExp, content: string, label: string): string {
  const match = content.match(pattern);
  const value = match?.[1]?.trim();

  if (!value) {
    throw new Error(`Unable to extract ${label} from implementation plan.`);
  }

  return value;
}

function extractScalarListValue(content: string, label: string, fallback: string): string {
  const pattern = new RegExp(`^-\\s+${escapeRegExp(label)}:\\s+(.+)$`, "mi");
  const match = content.match(pattern);
  const value = match?.[1]?.trim();

  return value && value.length > 0 ? value : fallback;
}

function extractNullableCount(value: string): number | null {
  if (value.toLowerCase() === "unknown") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function extractYesNo(content: string, label: string): boolean {
  const value = extractScalarListValue(content, label, "no").toLowerCase();

  return value === "yes" || value === "true";
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

function formatNullableCount(value: number | null): string {
  return value === null ? "unknown" : String(value);
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