import { describe, expect, test } from "bun:test";

import { createApp, createServiceDescriptor } from "./index.js";

describe("createServiceDescriptor", () => {
  test("returns service metadata", () => {
    expect(createServiceDescriptor()).toEqual({
      name: "gov-api",
      packageName: "@repo/gov-api",
      status: "ok"
    });
  });
});

describe("createApp", () => {
  test("returns health response", async () => {
    const app = createApp();
    const response = await app.request("/healthz");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "gov-api"
    });
  });
});
