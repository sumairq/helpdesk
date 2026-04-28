import { Router, type Request, type Response } from "express";
import { inboundEmailSchema, TicketStatus } from "@helpdesk/core";
import { prisma } from "../db.js";
import { validate } from "../lib/validate.js";

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
    res.status(200).json({ ticket: existing });
    return;
  }

  const ticket = await prisma.ticket.create({
    data: { ...data, status: TicketStatus.open },
  });
  res.status(201).json({ ticket });
});
