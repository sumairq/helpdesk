import { Router, type Request, type Response } from "express";
import { createTicketSchema, ticketSortSchema, ticketFilterSchema } from "@helpdesk/core";
import { type Prisma } from "../generated/prisma/client.js";
import { prisma } from "../db.js";
import { validate } from "../lib/validate.js";

export const ticketsRouter = Router();

ticketsRouter.get("/", async (req: Request, res: Response) => {
  const sort = validate(ticketSortSchema, req.query, res);
  if (!sort) return;
  const filter = validate(ticketFilterSchema, req.query, res);
  if (!filter) return;

  const where: Prisma.TicketWhereInput = {};

  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.category === "uncategorised") {
    where.category = null;
  } else if (filter.category) {
    where.category = filter.category;
  }
  if (filter.search) {
    where.OR = [
      { subject:     { contains: filter.search, mode: "insensitive" } },
      { senderName:  { contains: filter.search, mode: "insensitive" } },
      { senderEmail: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { [sort.sortBy]: sort.sortOrder },
  });
  res.json({ tickets });
});

ticketsRouter.post("/", async (req: Request, res: Response) => {
  const data = validate(createTicketSchema, req.body, res);
  if (!data) return;
  const ticket = await prisma.ticket.create({ data });
  res.status(201).json({ ticket });
});
