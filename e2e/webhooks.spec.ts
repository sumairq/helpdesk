/**
 * Webhook endpoint — inbound email happy paths + auth guard
 *
 * Covers: token auth (query param, secret param, header), ticket creation,
 * subject normalisation (Re:/Fwd: stripping), email threading, and error cases.
 * Pure API tests — no browser needed.
 */
import { test, expect } from "@playwright/test";

const ENDPOINT = `${process.env["BETTER_AUTH_URL"]}/api/webhooks/email/inbound`;
const WEBHOOK_SECRET = process.env["WEBHOOK_SECRET"]!;

function uniqueEmail(label: string) {
  return `webhook-${label}-${Date.now()}@helpdesk.test`;
}

const baseBody = (senderEmail: string) => ({
  subject: "My keyboard stopped working",
  body: "The keys are not responding at all.",
  senderEmail,
  senderName: "Test Student",
});

test.describe("Webhook — POST /api/webhooks/email/inbound", () => {
  test("auth: ?token= creates ticket and returns 201", async ({ request }) => {
    const res = await request.post(`${ENDPOINT}?token=${WEBHOOK_SECRET}`, {
      data: baseBody(uniqueEmail("token")),
    });

    expect(res.status()).toBe(201);
    const { ticket } = await res.json();
    expect(typeof ticket.id).toBe("number");
    expect(ticket.status).toBe("open");
    expect(ticket.subject).toBe("My keyboard stopped working");
  });

  test("auth: ?secret= creates ticket and returns 201", async ({ request }) => {
    const res = await request.post(`${ENDPOINT}?secret=${WEBHOOK_SECRET}`, {
      data: baseBody(uniqueEmail("secret")),
    });

    expect(res.status()).toBe(201);
    const { ticket } = await res.json();
    expect(typeof ticket.id).toBe("number");
  });

  test("auth: X-Webhook-Secret header creates ticket and returns 201", async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      headers: { "X-Webhook-Secret": WEBHOOK_SECRET },
      data: baseBody(uniqueEmail("header")),
    });

    expect(res.status()).toBe(201);
    const { ticket } = await res.json();
    expect(typeof ticket.id).toBe("number");
  });

  test("subject: Re: prefix is stripped before storing", async ({ request }) => {
    const senderEmail = uniqueEmail("prefix");
    const res = await request.post(`${ENDPOINT}?token=${WEBHOOK_SECRET}`, {
      data: { ...baseBody(senderEmail), subject: "Re: My keyboard stopped working" },
    });

    expect(res.status()).toBe(201);
    const { ticket } = await res.json();
    expect(ticket.subject).toBe("My keyboard stopped working");
  });

  test("threading: reply from same sender returns existing open ticket with 200", async ({ request }) => {
    const senderEmail = uniqueEmail("threading");

    const first = await request.post(`${ENDPOINT}?token=${WEBHOOK_SECRET}`, {
      data: baseBody(senderEmail),
    });
    expect(first.status()).toBe(201);
    const { ticket: original } = await first.json();

    const reply = await request.post(`${ENDPOINT}?token=${WEBHOOK_SECRET}`, {
      data: { ...baseBody(senderEmail), subject: "Re: My keyboard stopped working" },
    });
    expect(reply.status()).toBe(200);
    const { ticket: threaded } = await reply.json();
    expect(threaded.id).toBe(original.id);
  });

  test("threading: same subject from different sender creates a new ticket", async ({ request }) => {
    const emailA = uniqueEmail("threading-a");
    const emailB = uniqueEmail("threading-b");

    const first = await request.post(`${ENDPOINT}?token=${WEBHOOK_SECRET}`, {
      data: baseBody(emailA),
    });
    expect(first.status()).toBe(201);
    const { ticket: ticketA } = await first.json();

    const second = await request.post(`${ENDPOINT}?token=${WEBHOOK_SECRET}`, {
      data: baseBody(emailB),
    });
    expect(second.status()).toBe(201);
    const { ticket: ticketB } = await second.json();
    expect(ticketB.id).not.toBe(ticketA.id);
  });

  test("error: no token returns 401 with descriptive message", async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: baseBody(uniqueEmail("notoken")),
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Missing token");
  });

  test("error: wrong token returns 401", async ({ request }) => {
    const res = await request.post(`${ENDPOINT}?token=wrong-secret`, {
      data: baseBody(uniqueEmail("wrongtoken")),
    });

    expect(res.status()).toBe(401);
    const { error } = await res.json();
    expect(error).toBe("Invalid token");
  });

  test("error: missing required field returns 400", async ({ request }) => {
    const res = await request.post(`${ENDPOINT}?token=${WEBHOOK_SECRET}`, {
      data: { subject: "Missing sender", body: "No email provided" },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});
