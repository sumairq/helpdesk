/**
 * Ticket list page — happy paths
 *
 * Covers: page structure, empty state, ticket rows after seeding via webhook,
 * newest-first ordering, and access by both admin and agent roles.
 * Tickets are seeded directly via the webhook API before each test that needs them.
 */
import { type APIRequestContext } from "@playwright/test";
import { test as authTest, expect } from "./fixtures/auth.js";

const WEBHOOK_URL = `${process.env["BETTER_AUTH_URL"]}/api/webhooks/email/inbound`;
const TOKEN = process.env["WEBHOOK_SECRET"]!;

async function createTicket(
  request: APIRequestContext,
  overrides: Partial<{
    subject: string;
    body: string;
    senderName: string;
    senderEmail: string;
  }> = {}
) {
  const res = await request.post(`${WEBHOOK_URL}?token=${TOKEN}`, {
    data: {
      subject: "Test ticket subject",
      body: "Test ticket body.",
      senderName: "Test Sender",
      senderEmail: `sender-${Date.now()}-${Math.random().toString(36).slice(2)}@helpdesk.test`,
      ...overrides,
    },
  });
  return (await res.json()).ticket;
}

authTest.describe("Ticket list", () => {
  authTest("page shows the heading and table columns", async ({ adminPage }) => {
    await adminPage.goto("/tickets");

    await expect(adminPage.getByRole("heading", { name: "Tickets" })).toBeVisible();
    await expect(adminPage.getByRole("columnheader", { name: "ID" })).toBeVisible();
    await expect(adminPage.getByRole("columnheader", { name: "Subject" })).toBeVisible();
    await expect(adminPage.getByRole("columnheader", { name: "From" })).toBeVisible();
    await expect(adminPage.getByRole("columnheader", { name: "Category" })).toBeVisible();
    await expect(adminPage.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(adminPage.getByRole("columnheader", { name: "Received" })).toBeVisible();
  });

  authTest("ticket created via webhook appears in the table", async ({ adminPage, request }) => {
    const ticket = await createTicket(request, {
      subject: "Keyboard not working",
      senderName: "Jordan Lee",
      senderEmail: `jordan-${Date.now()}@helpdesk.test`,
    });

    await adminPage.goto("/tickets");

    const row = adminPage.getByRole("row").filter({ hasText: "Keyboard not working" });
    await expect(row.getByRole("cell", { name: `#${ticket.id}` })).toBeVisible();
    await expect(row.getByRole("cell", { name: "Keyboard not working", exact: true })).toBeVisible();
    await expect(row.getByText("Jordan Lee")).toBeVisible();
    await expect(row.getByRole("cell", { name: "open", exact: true })).toBeVisible();
  });

  authTest("tickets are shown newest first", async ({ adminPage, request }) => {
    const first = await createTicket(request, { subject: "Older ticket" });
    await new Promise((r) => setTimeout(r, 50));
    const second = await createTicket(request, { subject: "Newer ticket" });

    await adminPage.goto("/tickets");

    const rows = adminPage.getByRole("row");
    const newerRow = rows.filter({ hasText: "Newer ticket" });
    const olderRow = rows.filter({ hasText: "Older ticket" });

    // Newer ticket should appear before older ticket in the DOM
    const newerIndex = await newerRow.evaluate((el) =>
      Array.from(el.closest("tbody")!.querySelectorAll("tr")).indexOf(el as HTMLTableRowElement)
    );
    const olderIndex = await olderRow.evaluate((el) =>
      Array.from(el.closest("tbody")!.querySelectorAll("tr")).indexOf(el as HTMLTableRowElement)
    );

    expect(newerIndex).toBeLessThan(olderIndex);
    void first;
    void second;
  });

  authTest("agent can access /tickets", async ({ agentPage }) => {
    await agentPage.goto("/tickets");
    await expect(agentPage.getByRole("heading", { name: "Tickets" })).toBeVisible();
  });
});
