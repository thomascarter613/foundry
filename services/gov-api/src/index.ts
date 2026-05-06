import { Hono } from "hono";

export interface ServiceDescriptor {
  readonly name: string;
  readonly packageName: string;
  readonly status: "ok";
}

export function createServiceDescriptor(): ServiceDescriptor {
  return {
    name: "gov-api",
    packageName: "@repo/gov-api",
    status: "ok"
  };
}

export function createApp(): Hono {
  const app = new Hono();

  app.get("/", (context) => {
    return context.json(createServiceDescriptor());
  });

  app.get("/healthz", (context) => {
    return context.json({
      status: "ok",
      service: "gov-api"
    });
  });

  return app;
}

const app = createApp();

export default app;

if (import.meta.main) {
  const port = Number(Bun.env.PORT ?? "3000");

  Bun.serve({
    port,
    fetch: app.fetch
  });

  console.log(`gov-api listening on http://localhost:${port}`);
}
