/**
 * Two suites, two contracts:
 *
 *   unit        — pure logic. No database, no network, no sockets. Milliseconds.
 *                 Run on every save.
 *   integration — the real Express app via supertest, a real MongoDB, real
 *                 Socket.IO servers. Seconds. Run before you push.
 *
 * Native ESM, no Babel — requires `node --experimental-vm-modules`
 * (see the npm scripts).
 */
const common = {
  testEnvironment: "node",
  transform: {}, // source is already ESM; nothing to compile
  clearMocks: true,
  restoreMocks: true,
};

export default {
  projects: [
    {
      ...common,
      displayName: { name: "unit", color: "cyan" },
      testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
      setupFiles: ["<rootDir>/tests/unit/setup.js"],
      testTimeout: 5_000,
    },
    {
      ...common,
      displayName: { name: "integration", color: "magenta" },
      testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
      testTimeout: 20_000,
    },
  ],

  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js", // bootstrap: exercised by running the app, not by tests
    "!src/config/env.js", // side-effect module
  ],
  coverageThreshold: {
    global: { statements: 80, branches: 70, functions: 80, lines: 80 },
  },
  coverageReporters: ["text-summary", "lcov"],
};
