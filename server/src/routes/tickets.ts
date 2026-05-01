import { Router, type Request, type Response } from "express";
import { createTicketSchema, updateTicketSchema, createReplySchema, ticketSortSchema, ticketFilterSchema, ticketPaginationSchema, polishReplySchema, Role, SenderType, TicketStatus, AI_AGENT_ID } from "@helpdesk/core";
import { type Prisma } from "../generated/prisma/client.js";
import { prisma } from "../db.js";
import { validate, parseIntId } from "../lib/validate.js";
import { sanitizeHtml } from "../lib/sanitize.js";
import { polishReplyText, summarizeTicket } from "../services/ai.js";

export const ticketsRouter = Router();

ticketsRouter.get("/", async (req: Request, res: Response) => {
  const sort = validate(ticketSortSchema, req.query, res);
  if (!sort) return;
  const filter = validate(ticketFilterSchema, req.query, res);
  if (!filter) return;

  const where: Prisma.TicketWhereInput = {};

  if (filter.status) {
    where.status = filter.status;
  } else {
    where.status = { not: TicketStatus.processing };
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
    where: { role: Role.AGENT, deletedAt: null, id: { not: AI_AGENT_ID } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  res.json({ agents });
});

ticketsRouter.get("/stats", async (_req: Request, res: Response) => {
  type StatsRow = {
    total_tickets: number;
    open_tickets: number;
    ai_resolved: number;
    ai_resolved_pct: number;
    avg_resolution_ms: number | null;
  };

  const [statsRows, dailyTickets] = await Promise.all([
    prisma.$queryRaw<StatsRow[]>`SELECT * FROM get_ticket_stats()`,
    prisma.$queryRaw<{ date: string; count: number }[]>`SELECT * FROM get_daily_ticket_counts()`,
  ]);

  const s = statsRows[0];
  res.json({
    totalTickets: s.total_tickets,
    openTickets: s.open_tickets,
    aiResolvedTickets: s.ai_resolved,
    aiResolvedPercent: s.ai_resolved_pct,
    avgResolutionMs: s.avg_resolution_ms,
    dailyTickets,
  });
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
  const ticket = await prisma.ticket.create({
    data: {
      ...data,
      ...(data.bodyHtml != null && { bodyHtml: sanitizeHtml(data.bodyHtml) }),
    },
  });
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

ticketsRouter.post("/:id/polish", async (req: Request, res: Response) => {
  const id = parseIntId(req.params.id, res);
  if (id === null) return;

  const data = validate(polishReplySchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const agentName = res.locals.session.user.name;
  const customerFirstName = ticket.senderName.split(" ")[0];
  const polished = await polishReplyText(data.body);
  res.json({ polished: `Hello ${customerFirstName},\n\n${polished}\n\nBest regards,\n${agentName}` });
});

ticketsRouter.post("/:id/summarize", async (req: Request, res: Response) => {
  const id = parseIntId(req.params.id, res);
  if (id === null) return;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const replies = await prisma.ticketReply.findMany({
    where: { ticketId: id },
    select: { senderType: true, body: true },
    orderBy: { createdAt: "asc" },
  });

  const summary = await summarizeTicket(ticket.subject, ticket.body, replies);
  res.json({ summary });
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
      ...(data.bodyHtml != null && { bodyHtml: sanitizeHtml(data.bodyHtml) }),
    },
    include: { author: { select: { id: true, name: true } } },
  });
  res.status(201).json({ reply });
});
