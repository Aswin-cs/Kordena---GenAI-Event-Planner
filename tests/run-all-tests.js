/**
 * Unified Test Runner for Event Planner
 * Runs all unit and integration test suites using Node.js native test runner and jiti.
 */

const path = require("node:path");
const fs = require("node:fs");

// Initialize jiti TypeScript/ESM runtime
const jiti = require("jiti")(process.cwd(), {
  cache: false,
  debug: false,
});

const testFiles = [
  "./tests/calendar-utils.test.ts",
  "./tests/chat-schema.test.ts",
  "./tests/gemini-config.test.ts",
  "./tests/auth-provider.test.ts",
  "./tests/tasks-toggle-api.test.ts",
];

console.log("=================================================");
console.log("🚀 Running Event Planner Test Suites");
console.log("=================================================");

for (const file of testFiles) {
  const fullPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`\n📦 Loading Suite: ${file}`);
    try {
      jiti(fullPath);
    } catch (err) {
      console.error(`❌ Failed to run test file: ${file}`, err);
      process.exit(1);
    }
  } else {
    console.warn(`⚠️ Warning: Test file not found: ${file}`);
  }
}

