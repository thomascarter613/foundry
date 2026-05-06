import { validateGeneratorInputs } from "./validation.js";
import type {
  GeneratorDefinition,
  GeneratorInputDefinition,
  GeneratorInputValues,
  GeneratorPlan,
  PlanOperation
} from "./types.js";

export interface CreateGeneratorPlanOptions {
  readonly generator: GeneratorDefinition;
  readonly values: GeneratorInputValues;
}

export function createGeneratorPlan(options: CreateGeneratorPlanOptions): GeneratorPlan {
  const resolvedInputs = resolveInputs(options.generator.inputSchema, options.values);
  const issues = validateGeneratorInputs({
    generator: options.generator,
    values: options.values,
    resolvedInputs
  });
  const operations = options.generator.outputPaths.map((outputPath) =>
    createPlanOperation(options.generator, outputPath, resolvedInputs)
  );

  return {
    generatorId: options.generator.id,
    generatorName: options.generator.name,
    engine: options.generator.engine,
    dryRun: true,
    summary: `Preview ${operations.length} operation(s) for ${options.generator.id}.`,
    resolvedInputs,
    operations,
    validationCommands: options.generator.validationCommands,
    issues
  };
}

function resolveInputs(
  inputSchema: readonly GeneratorInputDefinition[],
  values: GeneratorInputValues
): Record<string, string | boolean | number> {
  const resolved: Record<string, string | boolean | number> = {};

  for (const input of inputSchema) {
    const providedValue = values[input.name];

    if (providedValue !== undefined && providedValue !== "") {
      resolved[input.name] = providedValue;
      continue;
    }

    if (input.defaultValue !== undefined) {
      resolved[input.name] = input.defaultValue;
      continue;
    }

    if (input.example !== undefined) {
      resolved[input.name] = input.example;
      continue;
    }

    if (input.type === "boolean") {
      resolved[input.name] = false;
      continue;
    }

    if (input.type === "number") {
      resolved[input.name] = 0;
      continue;
    }

    resolved[input.name] = `example-${input.name}`;
  }

  const name = String(resolved["name"] ?? "example");
  resolved["slug"] = slugify(name);

  if (!resolved["identifier"]) {
    resolved["identifier"] = "GEN-0000";
  }

  if (!resolved["commandPath"]) {
    resolved["commandPath"] = commandPathFromName(name);
  }

  return resolved;
}

function createPlanOperation(
  generator: GeneratorDefinition,
  outputPathTemplate: string,
  resolvedInputs: Record<string, string | boolean | number>
): PlanOperation {
  const path = renderPathTemplate(outputPathTemplate, resolvedInputs);

  return {
    action: "create",
    path,
    overwritePolicy: generator.overwritePolicy,
    description: `Create ${path} using ${generator.engine}.`
  };
}

function renderPathTemplate(
  template: string,
  values: Record<string, string | boolean | number>
): string {
  return template.replaceAll(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (_match, key: string) => {
    const value = values[key];

    if (value === undefined) {
      return `missing-${key}`;
    }

    return String(value);
  });
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/['"]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function commandPathFromName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/['"]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "/")
    .replaceAll(/^\/+|\/+$/g, "");
}
