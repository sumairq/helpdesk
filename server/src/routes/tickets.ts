import { Router, type Request, type Response } from "express";
import { createTicketSchema, updateTicketSchema, createReplySchema, ticketSortSchema, ticketFilterSchema, ticketPaginationSchema, Role, SenderType } from "@helpdesk/core";
import { type Prisma } from "../generated/prisma/client.js";
import { prisma } from "../db.js";
import { validate, parseIntId } from "../lib/validate.js";

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

  const pagination = validate(ticketPaginationSchema, req.query, res);
  if (!pagination) return;

  const skip = (pagination.page - 1) * pagination.pageSize;

  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      orderBy: { [sort.sortBy]: sort.sortOrder },
      skip,
      take: pagination.pageSize,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ tickets, total, page: pagination.page, pageSize: pagination.pageSize });
});

ticketsRouter.get("/agents", async (_req: Request, res: Response) => {
  const agents = await prisma.user.findMany({
    where: { role: Role.AGENT, deletedAt: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  res.json({ agents });
});

ticketsRouter.get("/:id", async (req: Request, res: Response) => {
  const id = parseIntId(req.params.id, res);
  if (id === null) return;
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }
  res.json({ ticket });
});

ticketsRouter.patch("/:id", async (req: Request, res: Response) => {
  const id = parseIntId(req.params.id, res);
  if (id === null) return;
  const data = validate(updateTicketSchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  if (data.assignedToId != null) {
    const agent = await prisma.user.findFirst({
      where: { id: data.assignedToId, role: Role.AGENT, deletedAt: null },
    });
    if (!agent) {
      res.status(400).json({ error: "Agent not found" });
      return;
    }
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      ...("assignedToId" in data && { assignedToId: data.assignedToId }),
      ...("status"       in data && { status:       data.status }),
      ...("category"     in data && { category:     data.category }),
      updatedAt: new Date(),
    },
  });
  res.json({ ticket: updated });
});

ticketsRouter.post("/", async (req: Request, res: Response) => {
  const data = validate(createTicketSchema, req.body, res);
  if (!data) return;
  const ticket = await prisma.ticket.create({ data });
  res.status(201).json({ ticket });
});

ticketsRouter.get("/:id/replies", async (req: Request, res: Response) => {
  const id = parseIntId(req.params.id, res);
  if (id === null) return;
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }
  const replies = await prisma.ticketReply.findMany({
    where: { ticketId: id },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json({ replies });
});

ticketsRouter.post("/:id/replies", async (req: Request, res: Response) => {
  const id = parseIntId(req.params.id, res);
  if (id === null) return;
  const data = validate(createReplySchema, req.body, res);
  if (!data) return;
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }
  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: id,
      senderType: SenderType.agent,
      authorId: res.locals.session.user.id,
      body: data.body,
    },
    include: { author: { select: { id: true, name: true } } },
  });
  res.status(201).json({ reply });
});
