import { useParams } from "react-router-dom";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BackLink } from "@/components/BackLink";
import { TicketDetailSkeleton } from "@/components/TicketDetailSkeleton";
import { ReplyThread, type TicketReply } from "@/components/ReplyThread";
import { ReplyForm } from "@/components/ReplyForm";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { type Ticket } from "@helpdesk/core";
import { TicketDetail } from "@/components/TicketDetail";
import { UpdateTicket } from "@/components/UpdateTicket";
import { TicketSummary } from "@/components/TicketSummary";

async function fetchTicket(id: number): Promise<Ticket> {
  const res = await axios.get<{ ticket: Ticket }>(`/api/tickets/${id}`, {
    withCredentials: true,
  });
  return res.data.ticket;
}

async function fetchReplies(ticketId: number): Promise<TicketReply[]> {
  const res = await axios.get<{ replies: TicketReply[] }>(
    `/api/tickets/${ticketId}/replies`,
    { withCredentials: true },
  );
  return res.data.replies;
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const queryClient = useQueryClient();

  const { data: ticket, isPending, error } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => fetchTicket(ticketId),
    enabled: Number.isInteger(ticketId) && ticketId > 0,
  });

  const { data: replies = [], isPending: repliesLoading } = useQuery({
    queryKey: ["replies", ticketId],
    queryFn: () => fetchReplies(ticketId),
    enabled: Number.isInteger(ticketId) && ticketId > 0,
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 w-full">
      <BackLink to="/tickets" label="Back to tickets" />

      <ErrorMessage
        variant="block"
        message={error ? (axios.isAxiosError(error) ? (error.response?.data?.error ?? error.message) : "Failed to load ticket") : null}
      />

      {isPending && <TicketDetailSkeleton />}

      {ticket && (
        <div className="flex gap-12">
          {/* Left column — main content */}
          <div className="flex-1 min-w-0 space-y-8">
            <TicketDetail ticket={ticket} />

            <hr className="border-border" />

            <TicketSummary ticketId={ticketId} />

            <hr className="border-border" />

            {/* Reply thread */}
            <div className="space-y-3">
              <h2 className="section-label">Replies</h2>
              <ReplyThread replies={replies} isLoading={repliesLoading} />
            </div>

            <hr className="border-border" />

            {/* Reply form */}
            <ReplyForm
              ticketId={ticketId}
              onSuccess={(reply) => {
                queryClient.setQueryData<TicketReply[]>(
                  ["replies", ticketId],
                  (prev) => [...(prev ?? []), reply],
                );
              }}
            />
          </div>

          {/* Right column — action sidebar */}
          <div className="w-52 shrink-0">
            <UpdateTicket ticket={ticket} ticketId={ticketId} />
          </div>
        </div>
      )}
    </main>
  );
}
