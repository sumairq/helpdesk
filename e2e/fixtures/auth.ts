/**
 * Custom Playwright fixtures that provide pre-authenticated pages.
 *
 * - `adminPage`  — a Page already authenticated as the seeded admin
 * - `agentPage`  — a Page already authenticated as a seeded AGENT user
 *
 * Authentication is done via direct API call (no UI login per test) so that
 * test suites that need a logged-in context start immediately at the target
 * page rather than repeating the login flow.
 *
 * The storageState is built per-fixture invocation (not cached globally) so
 * each test gets fresh cookies and tests remain fully independent.
 */
import { test as base, expect, type Page } from "@playwright/test";
import { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } from "../helpers/env.js";
import { seedAgentUser, AGENT_EMAIL, AGENT_PASSWORD } from "../helpers/seed-agent.js";

export { AGENT_EMAIL, AGENT_PASSWORD };

async function uiSignIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
}

type AuthFixtures = {
  adminPage: Page;
  agentPage: Page;
};

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await uiSignIn(page, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);
    await use(page);
    await context.close();
  },

  agentPage: async ({ browser }, use) => {
    await seedAgentUser();
    const context = await browser.newContext();
    const page = await context.newPage();
    await uiSignIn(page, AGENT_EMAIL, AGENT_PASSWORD);
    await use(page);
    await context.close();
  },
});

export { expect };
