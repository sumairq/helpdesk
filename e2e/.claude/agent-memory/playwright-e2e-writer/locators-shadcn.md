---
name: Stable locators for shadcn base-nova UI in Helpdesk
description: Which locators work for the custom shadcn/Base UI components used in this app
type: project
---

**shadcn preset:** `base-nova` — wraps `@base-ui/react`. Spreading RHF `register()` does NOT work on these components; `Controller` is required.

**Login form (`/login`):**
- Email field: `page.getByLabel("Email")` — Label has `htmlFor="email"`, Input has `id="email"` ✓
- Password field: `page.getByLabel("Password")` — Label has `htmlFor="password"`, Input has `id="password"` ✓
- Submit button: `page.getByRole("button", { name: "Sign in" })` ✓
- CardTitle "Sign in" — rendered as a `<div>`, NOT a heading. Cannot use `getByRole("heading")` for it.
- Validation errors: plain `<p>` tags — use `page.getByText("Email is required")` etc. ✓
- Server error Alert: `page.locator('[role="alert"]')` — shadcn Alert renders with `role="alert"` ✓

**Layout nav:**
- Users link: `page.getByRole("link", { name: "Users" })` ✓
- Sign out button: `page.getByRole("button", { name: "Sign out" })` ✓
- User name display: `page.getByText("Admin", { exact: true })` (for seeded admin whose name is "Admin") ✓

**Page headings (real `<h1>` elements):**
- Home page: `page.getByRole("heading", { name: "Home" })` ✓
- Users page: `page.getByRole("heading", { name: "Users" })` ✓

**Why:** shadcn base-nova wraps Base UI which differs from standard HTML — locator assumptions from training data may be wrong here.
**How to apply:** Always use the patterns above for LoginPage and Layout. Test new components before assuming role/label availability.
