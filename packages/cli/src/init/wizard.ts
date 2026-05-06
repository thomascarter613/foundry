import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";

export type InitWizardDatabaseProviderId =
  | "postgres:drizzle"
  | "postgres:prisma"
  | "sqlite:drizzle"
  | "sqlite:prisma"
  | "mongodb:native"
  | "supabase:sql"
  | "supabase:drizzle"
  | "supabase:prisma"
  | "supabase:client";

export interface InitWizardSeed {
  readonly destination: string | undefined;
  readonly includeDatabase: boolean | undefined;
  readonly databaseProvider: string | undefined;
  readonly installDependencies: boolean | undefined;
}

export interface InitWizardAnswers {
  readonly destination: string;
  readonly includeDatabase: boolean;
  readonly databaseProvider: InitWizardDatabaseProviderId | undefined;
  readonly installDependencies: boolean;
  readonly confirmed: boolean;
}

const databaseProviders: readonly InitWizardDatabaseProviderId[] = [
  "postgres:drizzle",
  "postgres:prisma",
  "sqlite:drizzle",
  "sqlite:prisma",
  "mongodb:native",
  "supabase:sql",
  "supabase:drizzle",
  "supabase:prisma",
  "supabase:client"
];

export async function runInitWizard(
  seed: InitWizardSeed
): Promise<InitWizardAnswers> {
  if (!input.isTTY) {
    throw new Error(
      "Interactive foundry init requires a TTY. Re-run with --yes for non-interactive initialization."
    );
  }

  const rl = createInterface({ input, output });

  try {
    output.write("\nFoundry workspace initializer\n\n");

    const destination = await askString(
      rl,
      "Workspace directory",
      seed.destination ?? "myapp"
    );

    const includeDatabase = await askBoolean(
      rl,
      "Configure a database provider?",
      seed.includeDatabase ?? true
    );

    const databaseProvider = includeDatabase
      ? await askDatabaseProvider(rl, seed.databaseProvider)
      : undefined;

    const installDependencies = await askBoolean(
      rl,
      "Install dependencies after writing files?",
      seed.installDependencies ?? false
    );

    output.write("\nInitialization summary\n");
    output.write(`- Destination: ${destination}\n`);
    output.write(
      `- Database provider: ${databaseProvider ?? "none / no database"}\n`
    );
    output.write(
      `- Install dependencies: ${installDependencies ? "yes" : "no"}\n`
    );

    const confirmed = await askBoolean(rl, "Create this workspace?", true);

    return {
      destination,
      includeDatabase,
      databaseProvider,
      installDependencies,
      confirmed
    };
  } finally {
    rl.close();
  }
}

export function isInitWizardDatabaseProviderId(
  value: string
): value is InitWizardDatabaseProviderId {
  return databaseProviders.includes(value as InitWizardDatabaseProviderId);
}

export function supportedInitWizardDatabaseProviders(): readonly InitWizardDatabaseProviderId[] {
  return databaseProviders;
}

async function askString(
  rl: ReturnType<typeof createInterface>,
  prompt: string,
  defaultValue: string
): Promise<string> {
  const answer = await rl.question(`${prompt} [${defaultValue}]: `);
  const value = answer.trim();

  return value.length > 0 ? value : defaultValue;
}

async function askBoolean(
  rl: ReturnType<typeof createInterface>,
  prompt: string,
  defaultValue: boolean
): Promise<boolean> {
  const suffix = defaultValue ? "Y/n" : "y/N";

  while (true) {
    const answer = (await rl.question(`${prompt} [${suffix}]: `))
      .trim()
      .toLowerCase();

    if (answer.length === 0) {
      return defaultValue;
    }

    if (["y", "yes", "true", "1"].includes(answer)) {
      return true;
    }

    if (["n", "no", "false", "0"].includes(answer)) {
      return false;
    }

    output.write("Please answer yes or no.\n");
  }
}

async function askDatabaseProvider(
  rl: ReturnType<typeof createInterface>,
  seededProvider: string | undefined
): Promise<InitWizardDatabaseProviderId> {
  const defaultProvider = normalizeSeededProvider(seededProvider);

  output.write("\nDatabase providers\n");

  databaseProviders.forEach((provider, index) => {
    output.write(`${index + 1}. ${provider}\n`);
  });

  while (true) {
    const answer = (
      await rl.question(`Select database provider [${defaultProvider}]: `)
    ).trim();

    if (answer.length === 0) {
      return defaultProvider;
    }

    const byNumber = Number.parseInt(answer, 10);

    if (
      Number.isInteger(byNumber) &&
      byNumber >= 1 &&
      byNumber <= databaseProviders.length
    ) {
      return databaseProviders[byNumber - 1]!;
    }

    if (isInitWizardDatabaseProviderId(answer)) {
      return answer;
    }

    output.write(
      `Unsupported provider. Choose a number from 1-${databaseProviders.length} or one of: ${databaseProviders.join(", ")}\n`
    );
  }
}

function normalizeSeededProvider(
  provider: string | undefined
): InitWizardDatabaseProviderId {
  if (provider && isInitWizardDatabaseProviderId(provider)) {
    return provider;
  }

  return "postgres:drizzle";
}