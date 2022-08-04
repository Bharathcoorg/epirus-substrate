/** @type {import("ts-jest/dist/types").InitialOptionsTsJest} */
/**
 * Jest test suite config
 * 
 * We ignore the following files and folders in the test coverage:
 * src/_mocks/ - folder for test mocks
 * src/initialise.ts - side-effect only, uses `module-alias` library to dynamically map `@chain` modules
 * src/processor.ts - main file to run a Subsquid batch processor. The processor and its methods are managed by Subsquid
 * src/model/ - folder for ORM data models generated by `npx sqd codegen` CLI command
 * src/chains/rococo
 * src/chains/shibuya - folders for decoding events and calls based on chain metadata.
 *                    - for development and testing `@chain` path is mapped to src/chains/local only
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/.jest/setEnv.js"],
  moduleNameMapper: {
    "^@chain/(.*)$": "<rootDir>/src/chains/local/$1",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$",
  coveragePathIgnorePatterns: [
    "<rootDir>/src/_mocks/",
    "<rootDir>/src/initialise.ts",
    "<rootDir>/src/processor.ts",
    "<rootDir>/src/model/",
    "<rootDir>/src/chains/rococo/",
    "<rootDir>/src/chains/shibuya/",
  ],
};