import { randomUUID } from "node:crypto";
import process from "node:process";

import type { GeneratorEngine, GeneratorPlan, OverwritePolicy, PlanOperationAction } from "./types.js";

export type AuditEventSchemaVersion = "foundry.audit-event.v1";

export type AuditEventType =
  | "generator.plan.created"
  | "generator.execution.blocked"
  | "generator.execution.succeeded"
  | "generator.execution.failed";

export type AuditEventResult = "planned" | "blocked" | "failed" | "succeeded";

export type AuditActorKind = "cli";

export interface AuditActor {
  readonly kind: AuditActorKind;
  readonly name: string;
  readonly command: string;
}

export interface AuditGeneratorRef {
  readonly id: string;
  readonly name: string;
  readonly engine: GeneratorEngine;
}

export interface AuditOperation {
  readonly action: PlanOperationAction;
  readonly path: string;
  readonly overwritePolicy: OverwritePolicy;
  readonly description: string;
}

export interface AuditIssue {
  readonly level: "info" | "warning" | "error";
  readonly message: string;
}

export interface AuditPreflightIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface AuditPreflight {
  readonly ok: boolean;
  readonly checkedPaths: readonly string[];
  readonly issues: readonly AuditPreflightIssue[];
}

export interface AuditBackendExecution {
  readonly kind: "scaffdog" | "plop" | "copier" | "orval";
  readonly command: string;
  readonly exitCode: number;
  readonly stdoutPreview?: string;
  readonly stderrPreview?: string;
  readonly documentName?: string;
  readonly generatorName?: string;
}

export interface AuditRuntimeMetadata {
  readonly nodeVersion: string;
  readonly platform: NodeJS.Platform;
  readonly arch: NodeJS.Architecture;
  readonly pid: number;
}

export interface GeneratorAuditEvent {
  readonly schemaVersion: AuditEventSchemaVersion;
  readonly eventId: string;
  readonly eventType: AuditEventType;
  readonly occurredAt: string;
  readonly actor: AuditActor;
  readonly generator: AuditGeneratorRef;
  readonly dryRun: boolean;
  readonly result: AuditEventResult;
  readonly summary: string;
  readonly inputs: Record<string, string | boolean | number>;
  readonly operations: readonly AuditOperation[];
  readonly validationCommands: readonly string[];
  readonly issues: readonly AuditIssue[];
  readonly preflight?: AuditPreflight;
  readonly backend?: AuditBackendExecution;
  readonly metadata: AuditRuntimeMetadata;
}

export interface CreateGeneratorAuditEventOptions {
  readonly plan: GeneratorPlan;
  readonly command: string;
  readonly occurredAt?: Date;
  readonly eventId?: string;
  readonly result?: AuditEventResult;
  readonly eventType?: AuditEventType;
  readonly preflight?: AuditPreflight;
  readonly backend?: AuditBackendExecution;
}

export function createGeneratorAuditEvent(options: CreateGeneratorAuditEventOptions): GeneratorAuditEvent {
  const occurredAt = options.occurredAt ?? new Date();
  const result = options.result ?? determineAuditResult(options.plan);
  const eventType = options.eventType ?? eventTypeForResult(result);

  return {
    schemaVersion: "foundry.audit-event.v1",
    eventId: options.eventId ?? randomUUID(),
    eventType,
    occurredAt: occurredAt.toISOString(),
    actor: {
      kind: "cli",
      name: "foundry",
      command: options.command
    },
    generator: {
      id: options.plan.generatorId,
      name: options.plan.generatorName,
      engine: options.plan.engine
    },
    dryRun: result === "planned",
    result,
    summary: options.plan.summary,
    inputs: redactSensitiveInputs(options.plan.resolvedInputs),
    operations: options.plan.operations.map((operation) => ({
      action: operation.action,
      path: operation.path,
      overwritePolicy: operation.overwritePolicy,
      description: operation.description
    })),
    validationCommands: options.plan.validationCommands,
    issues: options.plan.issues.map((issue) => ({
      level: issue.level,
      message: issue.message
    })),
    ...(options.preflight ? { preflight: options.preflight } : {}),
    ...(options.backend ? { backend: sanitizeBackendExecution(options.backend) } : {}),
    metadata: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid
    }
  };
}

export function formatAuditEventAsJson(event: GeneratorAuditEvent): string {
  return JSON.stringify(event, null, 2);
}

function determineAuditResult(plan: GeneratorPlan): AuditEventResult {
  const hasError = plan.issues.some((issue) => issue.level === "error");

  if (hasError) {
    return "blocked";
  }

  return "planned";
}

function eventTypeForResult(result: AuditEventResult): AuditEventType {
  switch (result) {
    case "blocked":
      return "generator.execution.blocked";

    case "failed":
      return "generator.execution.failed";

    case "succeeded":
      return "generator.execution.succeeded";

    case "planned":
      return "generator.plan.created";
  }
}

function sanitizeBackendExecution(backend: AuditBackendExecution): AuditBackendExecution {
  return {
    kind: backend.kind,
    command: backend.command,
    exitCode: backend.exitCode,
    ...(backend.stdoutPreview ? { stdoutPreview: truncateAuditText(backend.stdoutPreview) } : {}),
    ...(backend.stderrPreview ? { stderrPreview: truncateAuditText(backend.stderrPreview) } : {}),
    ...(backend.documentName ? { documentName: backend.documentName } : {}),
    ...(backend.generatorName ? { generatorName: backend.generatorName } : {})
  };
}

function truncateAuditText(value: string): string {
  const maxLength = 2_000;
  const normalized = value.trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}…[truncated]`;
}

function redactSensitiveInputs(
  inputs: Record<string, string | boolean | number>
): Record<string, string | boolean | number> {
  const redacted: Record<string, string | boolean | number> = {};

  for (const [key, value] of Object.entries(inputs)) {
    if (isSensitiveKey(key)) {
      redacted[key] = "[REDACTED]";
      continue;
    }

    redacted[key] = value;
  }

  return redacted;
}

function isSensitiveKey(key: string): boolean {
  const normalizedKey = key.toLowerCase();

  return (
    normalizedKey.includes("secret") ||
    normalizedKey.includes("password") ||
    normalizedKey.includes("token") ||
    normalizedKey.includes("credential") ||
    normalizedKey.includes("private_key") ||
    normalizedKey.includes("apikey") ||
    normalizedKey.includes("api_key")
  );
}
