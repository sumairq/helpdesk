/**
 * Login page tests
 *
 * Covers:
 * - Happy path: correct credentials → redirect to / + nav shows user name + admin "Users" link
 * - Client-side Zod validation errors (empty fields, invalid email format)
 * - Server-side auth failures (wrong password, unknown email) → Alert shown, URL stays on /login
 */
import {
  test,
  expect,
  loginAsAdmin,
  fillLoginForm,
  SEED_ADMIN_EMAIL,
} from "./fixtures/auth.js";

test.describe("Login page — happy path", () => {
  test("submitting valid admin credentials redirects to / and shows user name and Users link", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await expect(page.getByText("Admin", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  });
});

test.describe("Login page — client-side validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("submitting with empty email shows 'Email is required'", async ({
    page,
  }) => {
    await page.getByLabel("Password").fill("somepassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("submitting with invalid email format shows 'Enter a valid email'", async ({
    page,
  }) => {
    await fillLoginForm(page, "not-an-email", "somepassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("submitting with empty password shows 'Password is required'", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill("user@example.com");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Password is required")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("submitting empty form shows both field errors without a network call", async ({
    page,
  }) => {
    let networkCallMade = false;
    await page.route("**/api/auth/sign-in/email", async (route) => {
      networkCallMade = true;
      await route.continue();
    });

    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
    expect(networkCallMade).toBe(false);
  });
});

test.describe("Login page — server-side failures", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("wrong password for known email shows destructive Alert and stays on /login", async ({
    page,
  }) => {
    await fillLoginForm(page, SEED_ADMIN_EMAIL, "wrongpassword999!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("unknown email shows destructive Alert and stays on /login", async ({
    page,
  }) => {
    await fillLoginForm(page, "nobody@helpdesk.test", "wrongpassword999!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
