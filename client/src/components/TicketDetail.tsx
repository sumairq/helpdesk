import DOMPurify from "dompurify";
import { TicketStatus, statusLabels, categoryLabels, type Ticket } from "@helpdesk/core";

const statusStyles: Record<TicketStatus, string> = {
  [TicketStatus.new]:        "bg-yellow-100 text-yellow-800",
  [TicketStatus.open]:       "bg-green-100 text-green-800",
  [TicketStatus.processing]: "bg-purple-100 text-purple-800",
  [TicketStatus.resolved]:   "bg-blue-100 text-blue-800",
  [TicketStatus.closed]:     "bg-muted text-muted-foreground",
};

interface Props {
  ticket: Ticket;
}

export function TicketDetail({ ticket }: Props) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">#{ticket.id}</span>
          <span
            data-testid="status-badge"
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[ticket.status]}`}
          >
            {statusLabels[ticket.status]}
          </span>
          {ticket.category && (
            <span
              data-testid="category-badge"
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground"
            >
              {categoryLabels[ticket.category]}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-semibold leading-tight">{ticket.subject}</h1>
      </div>

      <hr className="border-border" />

      {/* Sender + timestamps */}
      <dl className="space-y-3 text-sm">
        <div className="flex gap-4">
          <dt className="w-20 shrink-0 text-muted-foreground">From</dt>
          <dd className="font-medium">
            {ticket.senderName}{" "}
            <span className="font-normal text-muted-foreground">&lt;{ticket.senderEmail}&gt;</span>
          </dd>
        </div>
        <div className="flex gap-4">
          <dt className="w-20 shrink-0 text-muted-foreground">Created</dt>
          <dd>{new Date(ticket.createdAt).toLocaleString()}</dd>
        </div>
        <div className="flex gap-4">
          <dt className="w-20 shrink-0 text-muted-foreground">Updated</dt>
          <dd>{new Date(ticket.updatedAt).toLocaleString()}</dd>
        </div>
      </dl>

      <hr className="border-border" />

      {/* Message body */}
      <div className="space-y-3">
        <h2 className="section-label">Message</h2>
        <div className="rounded-lg border bg-muted/30 p-5">
          {ticket.bodyHtml ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ticket.bodyHtml) }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{ticket.body}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
