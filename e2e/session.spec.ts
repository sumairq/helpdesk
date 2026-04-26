/**
 * Session lifecycle tests
 *
 * Covers:
 * - Sign-out via nav button → redirected to /login; subsequent / visit redirects to /login
 * - Session persistence: reload after login → still authenticated
 * - Session persistence: new page in same browser context → still authenticated
 */
import { test, expect, loginAsAdmin, signOut } from "./fixtures/auth.js";

test.describe("Sign-out", () => {
  test("clicking Sign out in nav redirects to /login and clears the session", async ({
    adminPage,
  }) => {
    await adminPage.goto("/");
    await expect(adminPage).toHaveURL("/");

    await signOut(adminPage);
    await expect(adminPage.getByLabel("Email")).toBeVisible();

    await adminPage.goto("/");
    await expect(adminPage).toHaveURL(/\/login$/);
  });
});

test.describe("Session persistence", () => {
  test("reloading the page after login keeps the user authenticated", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.reload();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Admin", { exact: true })).toBeVisible();
  });

  test("opening a new page in the same browser context after login remains authenticated", async ({
    page,
    context,
  }) => {
    await loginAsAdmin(page);

    const page2 = await context.newPage();
    await page2.goto("/");
    await expect(page2).toHaveURL("/");
    await expect(page2.getByText("Admin", { exact: true })).toBeVisible();
    await page2.close();
  });
});
