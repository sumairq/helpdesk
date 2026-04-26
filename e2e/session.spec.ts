/**
 * Session lifecycle tests
 *
 * Covers:
 * - Sign-out via nav button → redirected to /login; subsequent / visit redirects to /login
 * - Session persistence: reload after login → still authenticated
 * - Session persistence: new page in same browser context → still authenticated
 */
import { test, expect } from "./fixtures/auth.js";
import { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } from "./helpers/env.js";

test.describe("Sign-out", () => {
  test("clicking Sign out in nav redirects to /login and clears the session", async ({
    adminPage,
  }) => {
    await adminPage.goto("/");

    await test.step("verify we start authenticated", async () => {
      await expect(adminPage).toHaveURL("/");
    });

    await test.step("click Sign out", async () => {
      await adminPage.getByRole("button", { name: "Sign out" }).click();
    });

    await test.step("redirected to /login after sign-out", async () => {
      await expect(adminPage).toHaveURL(/\/login$/);
      // The sign-in form should be visible
      await expect(adminPage.getByLabel("Email")).toBeVisible();
    });

    await test.step("navigating to / now redirects back to /login", async () => {
      await adminPage.goto("/");
      await expect(adminPage).toHaveURL(/\/login$/);
    });
  });
});

test.describe("Session persistence", () => {
  /**
   * We perform the actual UI login here (not via the storageState fixture) so
   * we can test that the session cookie truly persists across page reloads and
   * new tab navigations within the same browser context.
   */
  test("reloading the page after login keeps the user authenticated", async ({
    page,
  }) => {
    await test.step("sign in via UI", async () => {
      await page.goto("/login");
      await page.getByLabel("Email").fill(SEED_ADMIN_EMAIL);
      await page.getByLabel("Password").fill(SEED_ADMIN_PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL("/");
    });

    await test.step("reload and assert still authenticated", async () => {
      await page.reload();
      await expect(page).toHaveURL("/");
      await expect(page.getByText("Admin", { exact: true })).toBeVisible();
    });
  });

  test("opening a new page in the same browser context after login remains authenticated", async ({
    page,
    context,
  }) => {
    await test.step("sign in via UI", async () => {
      await page.goto("/login");
      await page.getByLabel("Email").fill(SEED_ADMIN_EMAIL);
      await page.getByLabel("Password").fill(SEED_ADMIN_PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL("/");
    });

    await test.step("new page in same context is also authenticated", async () => {
      const page2 = await context.newPage();
      await page2.goto("/");
      await expect(page2).toHaveURL("/");
      await expect(page2.getByText("Admin", { exact: true })).toBeVisible();
      await page2.close();
    });
  });
});
