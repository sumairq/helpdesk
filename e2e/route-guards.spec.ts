/**
 * Route guard tests
 *
 * Covers:
 * - Unauthenticated → /login redirect for / and /users
 * - Catch-all (*) → / (which then → /login for unauthed)
 * - Authenticated admin → /users renders the "Users" heading
 * - Authenticated agent → /users redirects to /
 * - RedirectIfAuthed: signed-in user visiting /login → /
 * - Admin sees "Users" nav link; agent does NOT
 */
import { test, expect } from "./fixtures/auth.js";

// ---------------------------------------------------------------------------
// Unauthenticated redirects (plain { page } — no auth fixture)
// ---------------------------------------------------------------------------
test.describe("Unauthenticated route guards", () => {
  test("visiting / redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("visiting /users redirects to /login", async ({ page }) => {
    await page.goto("/users");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("visiting an unknown path redirects to / which then redirects to /login", async ({
    page,
  }) => {
    await page.goto("/totally-unknown-path");
    // The catch-all sends to /, ProtectedRoute sends unauthed to /login
    await expect(page).toHaveURL(/\/login$/);
  });
});

// ---------------------------------------------------------------------------
// RedirectIfAuthed: authenticated user visiting /login
// ---------------------------------------------------------------------------
test.describe("RedirectIfAuthed guard", () => {
  test("signed-in admin visiting /login is redirected to /", async ({
    adminPage,
  }) => {
    await adminPage.goto("/login");
    await expect(adminPage).toHaveURL("/");
  });
});

// ---------------------------------------------------------------------------
// Admin access
// ---------------------------------------------------------------------------
test.describe("Admin route access", () => {
  test("authenticated admin visiting /users sees the Users heading", async ({
    adminPage,
  }) => {
    await adminPage.goto("/users");
    await expect(adminPage.getByRole("heading", { name: "Users" })).toBeVisible();
    await expect(adminPage).toHaveURL("/users");
  });
});

// ---------------------------------------------------------------------------
// Agent access (requires seeded AGENT user via agentPage fixture)
// ---------------------------------------------------------------------------
test.describe("Agent route restrictions", () => {
  test("authenticated agent visiting /users is redirected to /", async ({
    agentPage,
  }) => {
    await agentPage.goto("/users");
    await expect(agentPage).toHaveURL("/");
    // Should see the home heading, not the users heading
    await expect(agentPage.getByRole("heading", { name: "Home" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Nav link visibility
// ---------------------------------------------------------------------------
test.describe("Admin-only nav link visibility", () => {
  test("admin sees the Users nav link", async ({ adminPage }) => {
    await adminPage.goto("/");
    await expect(adminPage.getByRole("link", { name: "Users" })).toBeVisible();
  });

  test("agent does NOT see the Users nav link", async ({ agentPage }) => {
    await agentPage.goto("/");
    await expect(agentPage.getByRole("link", { name: "Users" })).not.toBeVisible();
  });
});
