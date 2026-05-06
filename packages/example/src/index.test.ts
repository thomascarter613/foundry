import { describe, expect, test } from "bun:test";

import { createExampleDescriptor } from "./index.js";

describe("createExampleDescriptor", () => {
  test("returns the package descriptor", () => {
    expect(createExampleDescriptor()).toEqual({
      name: "example",
      packageName: "@repo/example"
    });
  });
});
