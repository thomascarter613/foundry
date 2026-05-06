import type {
  GeneratorDefinition,
  GeneratorInputDefinition,
  GeneratorInputValues,
  GeneratorPlanIssue
} from "./types.js";

export interface ValidateGeneratorInputsOptions {
  readonly generator: GeneratorDefinition;
  readonly values: GeneratorInputValues;
  readonly resolvedInputs: Record<string, string | boolean | number>;
}

const RESERVED_NAMES = new Set([
  ".",
  "..",
  "aux",
  "com1",
  "com2",
  "com3",
  "com4",
  "com5",
  "com6",
  "com7",
  "com8",
  "com9",
  "con",
  "lpt1",
  "lpt2",
  "lpt3",
  "lpt4",
  "lpt5",
  "lpt6",
  "lpt7",
  "lpt8",
  "lpt9",
  "nul",
  "prn"
]);

export function validateGeneratorInputs(
  options: ValidateGeneratorInputsOptions
): GeneratorPlanIssue[] {
  const issues: GeneratorPlanIssue[] = [];

  for (const input of options.generator.inputSchema) {
    issues.push(...validateRequiredInput(input, options.values));
    issues.push(...validateEnumInput(input, options.values));
    issues.push(...validateStringInput(input, options.values));
  }

  issues.push(...validateResolvedSlug(options.resolvedInputs));
  issues.push(...validateGeneratorSpecificInputs(options.generator, options.values, options.resolvedInputs));

  return issues;
}

function validateRequiredInput(
  input: GeneratorInputDefinition,
  values: GeneratorInputValues
): GeneratorPlanIssue[] {
  const value = values[input.name];

  if (!input.required) {
    return [];
  }

  if (value === undefined || value === "") {
    return [
      {
        level: "warning",
        message: `Required input "${input.name}" was not provided. The dry-run plan used a placeholder value.`
      }
    ];
  }

  return [];
}

function validateEnumInput(
  input: GeneratorInputDefinition,
  values: GeneratorInputValues
): GeneratorPlanIssue[] {
  const value = values[input.name];

  if (!input.allowedValues || value === undefined || value === "") {
    return [];
  }

  const normalizedValue = String(value);

  if (input.allowedValues.includes(normalizedValue)) {
    return [];
  }

  return [
    {
      level: "error",
      message: `Input "${input.name}" must be one of: ${input.allowedValues.join(", ")}.`
    }
  ];
}

function validateStringInput(
  input: GeneratorInputDefinition,
  values: GeneratorInputValues
): GeneratorPlanIssue[] {
  const value = values[input.name];

  if (value === undefined || value === "" || input.type !== "string") {
    return [];
  }

  const stringValue = String(value);
  const issues: GeneratorPlanIssue[] = [];

  if (stringValue.length > 120) {
    issues.push({
      level: "error",
      message: `Input "${input.name}" must be 120 characters or fewer.`
    });
  }

  if (/[\u0000-\u001f\u007f]/u.test(stringValue)) {
    issues.push({
      level: "error",
      message: `Input "${input.name}" must not contain control characters.`
    });
  }

  if (stringValue.includes("\\")) {
    issues.push({
      level: "error",
      message: `Input "${input.name}" must not contain backslashes.`
    });
  }

  if (stringValue.includes("../") || stringValue.includes("..\\")) {
    issues.push({
      level: "error",
      message: `Input "${input.name}" must not contain path traversal segments.`
    });
  }

  if (stringValue.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(stringValue)) {
    issues.push({
      level: "error",
      message: `Input "${input.name}" must not be an absolute path.`
    });
  }

  return issues;
}

function validateResolvedSlug(
  resolvedInputs: Record<string, string | boolean | number>
): GeneratorPlanIssue[] {
  const slug = String(resolvedInputs["slug"] ?? "");

  if (slug.length === 0) {
    return [
      {
        level: "error",
        message: "Resolved slug is empty. Provide a name containing at least one letter or number."
      }
    ];
  }

  if (RESERVED_NAMES.has(slug.toLowerCase())) {
    return [
      {
        level: "error",
        message: `Resolved slug "${slug}" is reserved and cannot be used as a generated artifact name.`
      }
    ];
  }

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/u.test(slug)) {
    return [
      {
        level: "error",
        message: `Resolved slug "${slug}" is invalid. Slugs must use lowercase letters, numbers, and hyphens.`
      }
    ];
  }

  return [];
}

function validateGeneratorSpecificInputs(
  generator: GeneratorDefinition,
  values: GeneratorInputValues,
  resolvedInputs: Record<string, string | boolean | number>
): GeneratorPlanIssue[] {
  switch (generator.id) {
    case "governance-artifact:adr":
      return validateAdrInputs(values);

    case "governance-artifact:work-packet":
      return validateWorkPacketInputs(values);

    case "package:typescript-library":
      return validatePackageInputs(values, resolvedInputs);

    case "contract-artifact:openapi-typescript-client":
      return validateOpenApiClientInputs(values, resolvedInputs);

    case "cli-command:oclif-command":
      return validateCliCommandInputs(values, resolvedInputs);

    default:
      return [];
  }
}

function validateAdrInputs(values: GeneratorInputValues): GeneratorPlanIssue[] {
  const identifier = values["identifier"];

  if (identifier === undefined || identifier === "") {
    return [];
  }

  const identifierText = String(identifier);

  if (/^ADR-\d{4}$/u.test(identifierText)) {
    return [];
  }

  return [
    {
      level: "error",
      message: `ADR identifier "${identifierText}" is invalid. Expected format: ADR-0001.`
    }
  ];
}

function validateWorkPacketInputs(values: GeneratorInputValues): GeneratorPlanIssue[] {
  const identifier = values["identifier"];

  if (identifier === undefined || identifier === "") {
    return [];
  }

  const identifierText = String(identifier);

  if (/^WP-\d{4}$/u.test(identifierText)) {
    return [];
  }

  return [
    {
      level: "error",
      message: `Work packet identifier "${identifierText}" is invalid. Expected format: WP-0001.`
    }
  ];
}

function validatePackageInputs(
  values: GeneratorInputValues,
  resolvedInputs: Record<string, string | boolean | number>
): GeneratorPlanIssue[] {
  const rawName = values["name"];

  if (rawName === undefined || rawName === "") {
    return [];
  }

  const name = String(rawName);
  const slug = String(resolvedInputs["slug"] ?? "");
  const issues: GeneratorPlanIssue[] = [];

  if (name.includes("/") || name.includes("\\")) {
    issues.push({
      level: "error",
      message: `Package name "${name}" must not contain path separators. Use an unscoped local package name such as "logger" or "example-utils".`
    });
  }

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/u.test(slug)) {
    issues.push({
      level: "error",
      message: `Package slug "${slug}" is invalid. Use lowercase letters, numbers, and hyphens.`
    });
  }

  return issues;
}

function validateOpenApiClientInputs(
  values: GeneratorInputValues,
  resolvedInputs: Record<string, string | boolean | number>
): GeneratorPlanIssue[] {
  const issues = validatePackageInputs(values, resolvedInputs);
  const contract = values["contract"];

  if (contract === undefined || contract === "") {
    return issues;
  }

  const contractPath = String(contract);

  if (!contractPath.endsWith(".yaml") && !contractPath.endsWith(".yml") && !contractPath.endsWith(".json")) {
    issues.push({
      level: "error",
      message: `OpenAPI contract path "${contractPath}" must end with .yaml, .yml, or .json.`
    });
  }

  return issues;
}

function validateCliCommandInputs(
  values: GeneratorInputValues,
  resolvedInputs: Record<string, string | boolean | number>
): GeneratorPlanIssue[] {
  const name = values["name"];

  if (name === undefined || name === "") {
    return [];
  }

  const commandPath = String(resolvedInputs["commandPath"] ?? "");

  if (commandPath.length === 0) {
    return [
      {
        level: "error",
        message: "Resolved CLI command path is empty."
      }
    ];
  }

  if (!/^[a-z0-9]+(?:\/[a-z0-9]+)*$/u.test(commandPath)) {
    return [
      {
        level: "error",
        message: `Resolved CLI command path "${commandPath}" is invalid. Use command words such as "init app" or "generate adr".`
      }
    ];
  }

  return [];
}
