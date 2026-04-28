/**
 * Auth helpers + fixtures.
 *
 * Helpers (use in any spec):
 *   - login(page, email, password) — UI sign-in, asserts redirect to /
 *   - loginAsAdmin(page)           — sign in as the seeded admin
 *   - loginAsAgent(page)           — seed (idempotent) + sign in as the AGENT
 *   - signOut(page)                — click "Sign out" in the nav
 *   - fillLoginForm(page, ...)     — fill the form without submitting
 *
 * Fixtures (extend the base test):
 *   - adminPage — a Page already authenticated as the seeded admin
 *   - agentPage — a Page already authenticated as the seeded AGENT
 */
import { test as base, expect, type Page } from "@playwright/test";
import { seedAgentUser, AGENT_EMAIL, AGENT_PASSWORD } from "../helpers/seed-agent.js";

const SEED_ADMIN_EMAIL = process.env["SEED_ADMIN_EMAIL"]!;
const SEED_ADMIN_PASSWORD = process.env["SEED_ADMIN_PASSWORD"]!;

export { AGENT_EMAIL, AGENT_PASSWORD, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD };

export async function fillLoginForm(
  page: Page,
  email: string,
  password: string,
) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await fillLoginForm(page, email, password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
}

export async function loginAsAdmin(page: Page) {
  await login(page, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);
}

export async function loginAsAgent(page: Page) {
  await seedAgentUser();
  await login(page, AGENT_EMAIL, AGENT_PASSWORD);
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

type AuthFixtures = {
  adminPage: Page;
  agentPage: Page;
};

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAsAdmin(page);
    await use(page);
    await context.close();
  },

  agentPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAsAgent(page);
    await use(page);
    await context.close();
  },
});

export { expect };
