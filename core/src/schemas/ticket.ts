import { z } from "zod";
import { TicketCategory, TicketStatus } from "../enums.js";

export const ticketFilterSchema = z.object({
  search:   z.string().optional(),
  status:   z.nativeEnum(TicketStatus).optional(),
  category: z.union([z.nativeEnum(TicketCategory), z.literal("uncategorised")]).optional(),
});

export type TicketFilterValues = z.infer<typeof ticketFilterSchema>;

export const ticketSortableColumns = ["id", "subject", "status", "category", "createdAt"] as const;
export type TicketSortableColumn = (typeof ticketSortableColumns)[number];

export const ticketSortSchema = z.object({
  sortBy:    z.enum(ticketSortableColumns).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type TicketSortValues = z.infer<typeof ticketSortSchema>;

export const PAGE_SIZE = 10;

export const ticketPaginationSchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(PAGE_SIZE),
});

export type TicketPaginationValues = z.infer<typeof ticketPaginationSchema>;

export const inboundEmailSchema = z.object({
  subject:     z.string().trim().min(1, "Subject is required").transform((s) => s.replace(/^(re|fwd|fw):\s*/gi, "").trim()),
  body:        z.string().trim().min(1, "Body is required"),
  bodyHtml:    z.string().optional(),
  senderEmail: z.string().min(1, "Email is required").check(z.email()),
  senderName:  z.string().trim().min(1, "Name is required"),
});

export type InboundEmailValues = z.infer<typeof inboundEmailSchema>;

export const createTicketSchema = z.object({
  subject:      z.string().trim().min(1, "Subject is required"),
  body:         z.string().trim().min(1, "Body is required"),
  bodyHtml:     z.string().optional(),
  senderEmail:  z.string().min(1, "Email is required").check(z.email()),
  senderName:   z.string().trim().min(1, "Name is required"),
  category:     z.nativeEnum(TicketCategory).optional(),
  assignedToId: z.string().optional(),
});

export type CreateTicketValues = z.infer<typeof createTicketSchema>;
