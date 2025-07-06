const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/test/integration/**/*.test.ts"],
  collectCoverageFrom: [
    "src/services/**/*.ts",
  ],
};