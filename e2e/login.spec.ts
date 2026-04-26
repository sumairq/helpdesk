/**
 * Login page tests
 *
 * Covers:
 * - Happy path: correct credentials → redirect to / + nav shows user name + admin "Users" link
 * - Client-side Zod validation errors (empty fields, invalid email format)
 * - Server-side auth failures (wrong password, unknown email) → Alert shown, URL stays on /login
 */
import { test, expect } from "@playwright/test";
import { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } from "./helpers/env.js";

test.describe("Login page — happy path", () => {
  test("submitting valid admin credentials redirects to / and shows user name and Users link", async ({
    page,
  }) => {
    await page.goto("/login");

    await test.step("fill and submit the sign-in form", async () => {
      await page.getByLabel("Email").fill(SEED_ADMIN_EMAIL);
      await page.getByLabel("Password").fill(SEED_ADMIN_PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();
    });

    await test.step("assert redirect to home", async () => {
      await expect(page).toHaveURL("/");
    });

    await test.step("assert user name appears in the nav", async () => {
      // The seeded admin's name is "Admin" (set by seed.ts)
      await expect(page.getByText("Admin", { exact: true })).toBeVisible();
    });

    await test.step("assert admin-only Users link is visible", async () => {
      await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
    });
  });
});

test.describe("Login page — client-side validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("submitting with empty email shows 'Email is required'", async ({
    page,
  }) => {
    // Leave email blank, fill password so only email error fires
    await page.getByLabel("Password").fill("somepassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Email is required")).toBeVisible();
    // Must stay on /login — no network call should happen
    await expect(page).toHaveURL(/\/login$/);
  });

  test("submitting with invalid email format shows 'Enter a valid email'", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("somepassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("submitting with empty password shows 'Password is required'", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill("user@example.com");
    // Leave password blank
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Password is required")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("submitting empty form shows both field errors without a network call", async ({
    page,
  }) => {
    // Intercept sign-in to confirm no call is made.
    // We also call route.continue() as a safety net so the test doesn't hang
    // if a call is unexpectedly made.
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
    await page.getByLabel("Email").fill(SEED_ADMIN_EMAIL);
    await page.getByLabel("Password").fill("wrongpassword999!");
    await page.getByRole("button", { name: "Sign in" }).click();

    // The Alert rendered by LoginPage on auth error
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("unknown email shows destructive Alert and stays on /login", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill("nobody@helpdesk.test");
    await page.getByLabel("Password").fill("wrongpassword999!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
