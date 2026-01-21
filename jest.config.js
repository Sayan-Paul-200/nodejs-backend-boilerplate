/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  moduleNameMapper: {
    "^uuid$": require.resolve("uuid"), 
  },
  
  // 1. FIX TYPO: Change 'matchers' to 'testMatch'
  testMatch: ["**/*.test.ts"],
  
  // 2. FIX ENV VARS: Load .env before tests run
  setupFiles: ["dotenv/config"], 
  
  verbose: true,
  forceExit: true,
};