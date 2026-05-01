export enum Role {
  ADMIN = "ADMIN",
  AGENT = "AGENT",
}

export enum TicketStatus {
  new        = "new",
  open       = "open",
  processing = "processing",
  resolved   = "resolved",
  closed     = "closed",
}

export enum TicketCategory {
  general_question = "general_question",
  technical = "technical",
  refund = "refund",
}

export enum SenderType {
  agent    = "agent",
  customer = "customer",
}
