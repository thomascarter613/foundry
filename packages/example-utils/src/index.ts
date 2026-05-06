export interface ExampleUtilsDescriptor {
  readonly name: string;
  readonly packageName: string;
}

export function createExampleUtilsDescriptor(): ExampleUtilsDescriptor {
  return {
    name: "example-utils",
    packageName: "@repo/example-utils"
  };
}
