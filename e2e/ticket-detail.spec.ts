/**
 * Ticket detail page — E2E tests
 *
 * Only covers behaviour that cannot be tested with unit tests:
 * real API calls, database persistence, browser navigation, and
 * auth-session identity flowing through to stored/displayed data.
 *
 * Pure rendering (badges, sender, body, empty states, button state) is
 * covered by TicketDetail.test.tsx, ReplyThread.test.tsx, and ReplyForm.test.tsx.
 */
import { test as authTest, expect } from "./fixtures/auth.js";

const WEBHOOK_URL = `${process.env["BETTER_AUTH_URL"]}/api/webhooks/email/inbound`;
const TOKEN = process.env["WEBHOOK_SECRET"]!;

async function createTicket(
  request: import("@playwright/test").APIRequestContext,
  overrides: Partial<{
    subject: string;
    body: string;
    senderName: string;
    senderEmail: string;
    category: string;
  }> = {},
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

authTest.describe("Ticket detail", () => {
  authTest("'Back to tickets' navigates to /tickets", async ({ adminPage, request }) => {
    const ticket = await createTicket(request);
    await adminPage.goto(`/tickets/${ticket.id}`);
    await adminPage.getByRole("link", { name: "Back to tickets" }).click();
    await expect(adminPage).toHaveURL("/tickets");
  });

  authTest("agent can access the ticket detail page", async ({ agentPage, request }) => {
    const ticket = await createTicket(request, { subject: "Agent access test" });
    await agentPage.goto(`/tickets/${ticket.id}`);
    await expect(agentPage.getByRole("heading", { name: "Agent access test" })).toBeVisible();
  });

  authTest("changing Status persists and updates the badge", async ({ adminPage, request }) => {
    const ticket = await createTicket(request);
    await adminPage.goto(`/tickets/${ticket.id}`);
    await adminPage.getByTestId("status-badge").waitFor();

    await adminPage.locator("dt").filter({ hasText: "Status" }).locator("~ dd").getByRole("combobox").click();
    await adminPage.getByRole("option", { name: "Resolved" }).click();

    await expect(adminPage.getByTestId("status-badge")).toHaveText("Resolved");

    // Confirm it persisted by reloading
    await adminPage.reload();
    await expect(adminPage.getByTestId("status-badge")).toHaveText("Resolved");
  });

  authTest("changing Category persists and updates the badge", async ({ adminPage, request }) => {
    const ticket = await createTicket(request);
    await adminPage.goto(`/tickets/${ticket.id}`);
    await adminPage.getByTestId("status-badge").waitFor();

    await adminPage.locator("dt").filter({ hasText: "Category" }).locator("~ dd").getByRole("combobox").click();
    await adminPage.getByRole("option", { name: "Refund" }).click();

    await expect(adminPage.getByTestId("category-badge")).toHaveText("Refund");

    // Confirm it persisted by reloading
    await adminPage.reload();
    await expect(adminPage.getByTestId("category-badge")).toHaveText("Refund");
  });

  authTest("seeded reply appears in the thread", async ({ adminPage, request }) => {
    const ticket = await createTicket(request);
    await adminPage.request.post(`/api/tickets/${ticket.id}/replies`, {
      data: { body: "We are looking into this." },
    });

    await adminPage.goto(`/tickets/${ticket.id}`);
    await expect(adminPage.getByText("We are looking into this.")).toBeVisible();
  });

  authTest("submitting a reply persists it and shows the signed-in user as sender", async ({ adminPage, request }) => {
    const ticket = await createTicket(request);
    await adminPage.goto(`/tickets/${ticket.id}`);

    const replyBody = `E2E reply ${Date.now()}`;
    await adminPage.getByPlaceholder("Write a reply…").fill(replyBody);
    await adminPage.getByRole("button", { name: "Send reply" }).click();

    await expect(adminPage.getByText(replyBody)).toBeVisible();
    // Seeded admin is named "Admin" — confirms the session identity was stored correctly
    await expect(adminPage.getByText("Admin").first()).toBeVisible();

    // Confirm it persisted by reloading
    await adminPage.reload();
    await expect(adminPage.getByText(replyBody)).toBeVisible();
  });
});
