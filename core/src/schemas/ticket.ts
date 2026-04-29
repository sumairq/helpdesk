import { z } from "zod";
import { TicketCategory, TicketStatus } from "../enums.js";
import { stripSubjectPrefixes } from "../utils/subject.js";

export const ticketFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(TicketStatus).optional(),
  category: z
    .union([z.enum(TicketCategory), z.literal("uncategorised")])
    .optional(),
});

export type TicketFilterValues = z.infer<typeof ticketFilterSchema>;

export const ticketSortableColumns = [
  "id",
  "subject",
  "status",
  "category",
  "createdAt",
] as const;
export type TicketSortableColumn = (typeof ticketSortableColumns)[number];

export const ticketSortSchema = z.object({
  sortBy: z.enum(ticketSortableColumns).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type TicketSortValues = z.infer<typeof ticketSortSchema>;

export const PAGE_SIZE = 10;

export const ticketPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(PAGE_SIZE),
});

export type TicketPaginationValues = z.infer<typeof ticketPaginationSchema>;

export const inboundEmailSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(255)
    .transform(stripSubjectPrefixes),
  body: z.string().trim().min(1, "Body is required").max(2000),
  bodyHtml: z.string().max(2000).optional(),
  senderEmail: z.string().min(1, "Email is required").max(254).check(z.email()),
  senderName: z.string().trim().min(1, "Name is required").max(255),
});

export type InboundEmailValues = z.infer<typeof inboundEmailSchema>;

export const createTicketSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(500),
  body: z.string().trim().min(1, "Body is required").max(100_000),
  bodyHtml: z.string().max(500_000).optional(),
  senderEmail: z.string().min(1, "Email is required").max(254).check(z.email()),
  senderName: z.string().trim().min(1, "Name is required").max(255),
  category: z.enum(TicketCategory).optional(),
  assignedToId: z.string().optional(),
});

export type CreateTicketValues = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = z.object({
  assignedToId: z.string().nullable().optional(),
  status: z.enum(TicketStatus).optional(),
  category: z.enum(TicketCategory).nullable().optional(),
});

export type UpdateTicketValues = z.infer<typeof updateTicketSchema>;

export const createReplySchema = z.object({
  body:     z.string().trim().min(1, "Reply body is required").max(100_000),
  bodyHtml: z.string().max(500_000).optional(),
});

export type CreateReplyValues = z.infer<typeof createReplySchema>;
