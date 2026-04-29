import type { TicketStatus, TicketCategory } from "../enums.js";

export interface Ticket {
  id: number;
  subject: string;
  body: string;
  bodyHtml: string | null;
  senderName: string;
  senderEmail: string;
  status: TicketStatus;
  category: TicketCategory | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
}
