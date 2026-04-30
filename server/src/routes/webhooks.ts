import { Router, type Request, type Response } from "express";
import { inboundEmailSchema, TicketStatus, SenderType } from "@helpdesk/core";
import { prisma } from "../db.js";
import { validate } from "../lib/validate.js";
import { sanitizeHtml } from "../lib/sanitize.js";
import { classifyTicket } from "../services/ai.js";

export const webhooksRouter = Router();

webhooksRouter.post("/email/inbound", async (_req: Request, res: Response) => {
  const data = validate(inboundEmailSchema, _req.body, res);
  if (!data) return;

  const existing = await prisma.ticket.findFirst({
    where: {
      senderEmail: { equals: data.senderEmail, mode: "insensitive" },
      status: TicketStatus.open,
      subject: { equals: data.subject, mode: "insensitive" },
    },
  });

  if (existing) {
    await prisma.ticketReply.create({
      data: {
        ticketId: existing.id,
        senderType: SenderType.customer,
        authorId: null,
        body: data.body,
        ...(data.bodyHtml != null && { bodyHtml: sanitizeHtml(data.bodyHtml) }),
      },
    });
    res.status(200).json({ ticket: existing });
    return;
  }

  const ticket = await prisma.ticket.create({
    data: {
      ...data,
      ...(data.bodyHtml != null && { bodyHtml: sanitizeHtml(data.bodyHtml) }),
      status: TicketStatus.open,
    },
  });
  res.status(201).json({ ticket });

  classifyTicket(ticket)
    .then((category) => prisma.ticket.update({ where: { id: ticket.id }, data: { category } }))
    .catch(() => {});
});
