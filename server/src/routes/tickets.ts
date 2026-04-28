import { Router, type Request, type Response } from "express";
import { createTicketSchema } from "@helpdesk/core";
import { prisma } from "../db.js";
import { validate } from "../lib/validate.js";

export const ticketsRouter = Router();

ticketsRouter.get("/", async (_req: Request, res: Response) => {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ tickets });
});

ticketsRouter.post("/", async (req: Request, res: Response) => {
  const data = validate(createTicketSchema, req.body, res);
  if (!data) return;
  const ticket = await prisma.ticket.create({ data });
  res.status(201).json({ ticket });
});
