import { defineConfig } from "@playwright/test";
import { E2E, serverEnv } from "./e2e/env.js";

/**
 * End-to-end tests against REAL server processes.
 *
 * This is deliberately different from the Jest integration suite, which mounts
 * the Express app in-process with supertest and a memory token store. Here:
 *
 *   • two independent Node processes, started for real
 *   • real HTTP over the network stack
 *   • real MongoDB and real Valkey (refresh tokens, Socket.IO adapter)
 *
 * Two servers is the point: it is the only way to prove that a message sent to
 * server A reaches a user connected to server B — the reason Valkey exists in
 * this architecture.
 */
const server = (port) => ({
  command: "node src/server.js",
  port,
  reuseExistingServer: false,
  timeout: 60_000,
  stdout: "pipe",
  stderr: "pipe",
  env: serverEnv(port),
});

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.js",
  globalTeardown: "./e2e/global-teardown.js",

  fullyParallel: false, // the two servers share one database
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: E2E.SERVER_A,
    extraHTTPHeaders: { Origin: E2E.CLIENT_ORIGIN },
  },

  // Both point at the same MONGO_URI and VALKEY_URL.
  webServer: [server(E2E.PORT_A), server(E2E.PORT_B)],
});