import { describe, expect, test } from "bun:test";

import { createExampleUtilsDescriptor } from "./index.js";

describe("createExampleUtilsDescriptor", () => {
  test("returns the package descriptor", () => {
    expect(createExampleUtilsDescriptor()).toEqual({
      name: "example-utils",
      packageName: "@repo/example-utils"
    });
  });
});
