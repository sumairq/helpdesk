import { defineConfig, devices } from "@playwright/test";

const SERVER_PORT = Number(process.env.E2E_SERVER_PORT ?? 3002);
const CLIENT_PORT = Number(process.env.E2E_CLIENT_PORT ?? 5174);

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts$/,
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: `http://localhost:${CLIENT_PORT}`,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      command: "npm run start:test --workspace server",
      url: `http://localhost:${SERVER_PORT}/api/health`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: `npm run dev --workspace client -- --port ${CLIENT_PORT}`,
      url: `http://localhost:${CLIENT_PORT}`,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
      env: { VITE_API_TARGET: `http://localhost:${SERVER_PORT}` },
    },
  ],
});
