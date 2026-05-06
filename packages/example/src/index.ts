export interface ExampleDescriptor {
  readonly name: string;
  readonly packageName: string;
}

export function createExampleDescriptor(): ExampleDescriptor {
  return {
    name: "example",
    packageName: "@repo/example"
  };
}
