import { TicketStatus, TicketCategory } from "../enums.js";

export const statusLabels: Record<TicketStatus, string> = {
  [TicketStatus.new]:        "New",
  [TicketStatus.open]:       "Open",
  [TicketStatus.processing]: "Processing",
  [TicketStatus.resolved]:   "Resolved",
  [TicketStatus.closed]:     "Closed",
};

export const categoryLabels: Record<TicketCategory, string> = {
  [TicketCategory.general_question]: "General",
  [TicketCategory.technical]:        "Technical",
  [TicketCategory.refund]:           "Refund",
};
