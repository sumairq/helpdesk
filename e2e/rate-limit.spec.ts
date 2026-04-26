/**
 * Rate-limit tests for POST /api/auth/sign-in/email
 *
 * Better Auth config: customRules["/sign-in/email"] = { window: 60, max: 5 }
 * The limit is per-IP and stored in-memory (default Better Auth storage).
 *
 * Design decision — why we mock rather than exhaust the real bucket:
 *   The rate-limit window is 60 s and the bucket is per-IP (localhost). All
 *   e2e tests share the same IP, so actually exhausting the budget in one test
 *   would starve every subsequent test that needs to sign in (including the
 *   adminPage fixture which makes real sign-in calls). Instead we use
 *   page.route() to return synthetic 429 responses, which lets us verify UI
 *   behaviour without corrupting shared state.
 *
 *   A separate server-level integration test (outside this suite) would verify
 *   the server truly enforces the limit in an environment where the in-memory
 *   bucket can be reset per test.
 *
 * Mode: serial — route intercepts are per-page and stateful. Serial prevents
 *   a parallel worker from interfering with the mock state.
 */
import { test, expect } from "@playwright/test";
import { SEED_ADMIN_EMAIL } from "./helpers/env.js";

test.describe.configure({ mode: "serial" });

test.describe("Rate limiting on /sign-in/email", () => {
  /**
   * Simulates the scenario where the client has already used up all allowed
   * attempts and the server returns 429 on the next request.
   * Asserts that the UI surfaces the error and does NOT navigate away.
   */
  test(
    "UI shows an error and stays on /login when the server returns 429",
    { tag: "@slow" },
    async ({ page }) => {
      // Intercept every call to the sign-in endpoint and return 429
      await page.route("**/api/auth/sign-in/email", async (route) => {
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Too many requests. Please try again later.",
            code: "RATE_LIMIT_EXCEEDED",
          }),
        });
      });

      await page.goto("/login");
      await page.getByLabel("Email").fill(SEED_ADMIN_EMAIL);
      await page.getByLabel("Password").fill("anypassword123!");
      await page.getByRole("button", { name: "Sign in" }).click();

      // The LoginPage surfaces any auth error in the destructive Alert
      await expect(page.locator('[role="alert"]')).toBeVisible();

      // Must NOT navigate away from /login
      await expect(page).toHaveURL(/\/login$/);
    }
  );

  /**
   * Confirms the user is not silently logged in on a 429 response —
   * their name must NOT appear in the nav bar.
   */
  test(
    "user is not authenticated after a 429 rate-limit response",
    { tag: "@slow" },
    async ({ page }) => {
      await page.route("**/api/auth/sign-in/email", async (route) => {
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Too many requests. Please try again later.",
          }),
        });
      });

      await page.goto("/login");
      await page.getByLabel("Email").fill(SEED_ADMIN_EMAIL);
      await page.getByLabel("Password").fill("anypassword123!");
      await page.getByRole("button", { name: "Sign in" }).click();

      // Error is shown
      await expect(page.locator('[role="alert"]')).toBeVisible();

      // The authenticated user name must NOT appear (session not created)
      await expect(page.getByText("Admin", { exact: true })).not.toBeVisible();

      // Navigating to / redirects back to /login (no session)
      await page.goto("/");
      await expect(page).toHaveURL(/\/login$/);
    }
  );

  /**
   * Verifies that the rate-limit error message from the server is surfaced to
   * the user (not swallowed silently). We inject a specific message in the
   * mock and confirm it appears in the Alert.
   */
  test(
    "rate-limit error message from server is shown in the Alert",
    { tag: "@slow" },
    async ({ page }) => {
      const rateLimitMessage = "Too many requests. Please try again later.";

      await page.route("**/api/auth/sign-in/email", async (route) => {
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({ message: rateLimitMessage }),
        });
      });

      await page.goto("/login");
      await page.getByLabel("Email").fill(SEED_ADMIN_EMAIL);
      await page.getByLabel("Password").fill("anypassword123!");
      await page.getByRole("button", { name: "Sign in" }).click();

      // The exact server message should appear inside the destructive Alert
      await expect(
        page.locator('[role="alert"]').getByText(rateLimitMessage)
      ).toBeVisible();
    }
  );
});
