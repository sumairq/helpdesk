/**
 * User management — CRUD happy paths
 *
 * Covers: list, create, edit, and soft-delete agent users.
 * All operations are performed as the seeded admin user.
 * Each test provisions its own user with a unique email so tests can run
 * in parallel without hitting unique-constraint conflicts.
 */
import { test, expect } from "./fixtures/auth.js";

test.describe("User management", () => {
  test("list: /users shows the heading, New User button, and admin row", async ({
    adminPage,
  }) => {
    await adminPage.goto("/users");

    await expect(
      adminPage.getByRole("heading", { name: "Users" }),
    ).toBeVisible();
    await expect(
      adminPage.getByRole("button", { name: "New User" }),
    ).toBeVisible();
    // The seeded admin row is always present and has no delete button
    await expect(adminPage.getByRole("cell", { name: "Admin", exact: true })).toBeVisible();
    await expect(
      adminPage.getByRole("button", { name: "Delete Admin" }),
    ).not.toBeVisible();
  });

  test("create: new agent appears in the table after submitting the form", async ({
    adminPage,
  }) => {
    await adminPage.goto("/users");

    await adminPage.getByRole("button", { name: "New User" }).click();
    await adminPage.getByLabel("Name").fill("Create Test Agent");
    await adminPage.getByLabel("Email").fill("create-agent@helpdesk.test");
    await adminPage.getByLabel("Password").fill("testpassword123");
    await adminPage.getByRole("button", { name: "Create User" }).click();

    await expect(adminPage.getByRole("cell", { name: "Create Test Agent", exact: true })).toBeVisible();
    await expect(
      adminPage.getByRole("cell", { name: "create-agent@helpdesk.test", exact: true }),
    ).toBeVisible();
  });

  test("edit: updated name is reflected in the table", async ({
    adminPage,
  }) => {
    await adminPage.goto("/users");

    // Create a user to edit
    await adminPage.getByRole("button", { name: "New User" }).click();
    await adminPage.getByLabel("Name").fill("Edit Test Agent");
    await adminPage.getByLabel("Email").fill("edit-agent@helpdesk.test");
    await adminPage.getByLabel("Password").fill("testpassword123");
    await adminPage.getByRole("button", { name: "Create User" }).click();
    await expect(adminPage.getByRole("cell", { name: "Edit Test Agent", exact: true })).toBeVisible();

    // Open the edit dialog and update the name
    await adminPage
      .getByRole("button", { name: "Edit Edit Test Agent" })
      .click();
    await adminPage.getByLabel("Name").fill("Renamed Agent");
    await adminPage.getByRole("button", { name: "Save changes" }).click();

    await expect(adminPage.getByRole("cell", { name: "Renamed Agent", exact: true })).toBeVisible();
    await expect(adminPage.getByRole("cell", { name: "Edit Test Agent", exact: true })).not.toBeVisible();
  });

  test("delete: user is removed from the table after confirming deletion", async ({
    adminPage,
  }) => {
    await adminPage.goto("/users");

    // Create a user to delete
    await adminPage.getByRole("button", { name: "New User" }).click();
    await adminPage.getByLabel("Name").fill("Delete Test Agent");
    await adminPage.getByLabel("Email").fill("delete-agent@helpdesk.test");
    await adminPage.getByLabel("Password").fill("testpassword123");
    await adminPage.getByRole("button", { name: "Create User" }).click();
    await expect(adminPage.getByRole("cell", { name: "Delete Test Agent", exact: true })).toBeVisible();

    // Open the confirmation dialog and confirm
    await adminPage
      .getByRole("button", { name: "Delete Delete Test Agent" })
      .click();
    await adminPage.getByRole("button", { name: "Delete" }).click();

    await expect(adminPage.getByRole("cell", { name: "Delete Test Agent", exact: true })).not.toBeVisible();
  });
});
