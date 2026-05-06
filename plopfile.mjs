/**
 * Foundry monorepo generators.
 *
 * Plop is used here as the small, local file generator for repeatable package,
 * module, tool, and configuration scaffolds.
 */

/**
 * @param {import("plop").NodePlopAPI} plop
 */
export default function foundryPlopfile(plop) {
  plop.setGenerator("package-typescript-library", {
    description: "Create a reusable internal TypeScript package.",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Package name without the workspace scope:"
      }
    ],
    actions: [
      {
        type: "add",
        path: "packages/{{dashCase name}}/package.json",
        templateFile: "templates/plop/package/typescript-library/package.json.hbs",
        abortOnFail: true
      },
      {
        type: "add",
        path: "packages/{{dashCase name}}/tsconfig.json",
        templateFile: "templates/plop/package/typescript-library/tsconfig.json.hbs",
        abortOnFail: true
      },
      {
        type: "add",
        path: "packages/{{dashCase name}}/README.md",
        templateFile: "templates/plop/package/typescript-library/README.md.hbs",
        abortOnFail: true
      },
      {
        type: "add",
        path: "packages/{{dashCase name}}/src/index.ts",
        templateFile: "templates/plop/package/typescript-library/src/index.ts.hbs",
        abortOnFail: true
      },
      {
        type: "add",
        path: "packages/{{dashCase name}}/src/index.test.ts",
        templateFile: "templates/plop/package/typescript-library/src/index.test.ts.hbs",
        abortOnFail: true
      }
    ]
  });
}
