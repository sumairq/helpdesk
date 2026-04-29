import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { TicketStatus, TicketCategory, type UpdateTicketValues, statusLabels, categoryLabels } from "@helpdesk/core";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketDetail {
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

interface Agent {
  id: string;
  name: string;
  email: string;
}

const statusStyles: Record<TicketStatus, string> = {
  [TicketStatus.open]: "bg-green-100 text-green-800",
  [TicketStatus.resolved]: "bg-blue-100 text-blue-800",
  [TicketStatus.closed]: "bg-muted text-muted-foreground",
};



async function fetchTicket(id: number): Promise<TicketDetail> {
  const res = await axios.get<{ ticket: TicketDetail }>(`/api/tickets/${id}`, {
    withCredentials: true,
  });
  return res.data.ticket;
}

async function fetchAgents(): Promise<Agent[]> {
  const res = await axios.get<{ agents: Agent[] }>("/api/tickets/agents", {
    withCredentials: true,
  });
  return res.data.agents;
}

async function updateTicket(ticketId: number, data: UpdateTicketValues): Promise<TicketDetail> {
  const res = await axios.patch<{ ticket: TicketDetail }>(
    `/api/tickets/${ticketId}`,
    data,
    { withCredentials: true },
  );
  return res.data.ticket;
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

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: (data: UpdateTicketValues) => updateTicket(ticketId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["ticket", ticketId], updated);
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 w-full">
      <Link
        to="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        Back to tickets
      </Link>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {axios.isAxiosError(error)
            ? (error.response?.data?.error ?? error.message)
            : "Failed to load ticket"}
        </div>
      )}

      {isPending && (
        <div className="flex gap-12">
          <div className="flex-1 min-w-0 space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-3/4" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-24 shrink-0" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
          <div className="w-52 shrink-0 space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-7 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {ticket && (
        <div className="flex gap-12">
          {/* Left column — main content */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">#{ticket.id}</span>
                <span data-testid="status-badge" className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[ticket.status]}`}>
                  {statusLabels[ticket.status]}
                </span>
                {ticket.category && (
                  <span data-testid="category-badge" className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
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
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</h2>
              <div className="rounded-lg border bg-muted/30 p-5">
                {ticket.bodyHtml ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: ticket.bodyHtml }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{ticket.body}</pre>
                )}
              </div>
            </div>
          </div>

          {/* Right column — action sidebar */}
          <div className="w-52 shrink-0">
            <dl className="space-y-5">
              <div className="space-y-1.5">
                <dt className="text-xs font-medium text-muted-foreground">Assigned to</dt>
                <dd>
                  <Select
                    value={ticket.assignedToId ?? ""}
                    onValueChange={(val) => update({ assignedToId: val === "" ? null : val })}
                    disabled={isUpdating}
                  >
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue>
                        {ticket.assignedToId
                          ? (agents.find((a) => a.id === ticket.assignedToId)?.name ?? "Unknown agent")
                          : "Unassigned"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </dd>
              </div>

              <div className="space-y-1.5">
                <dt className="text-xs font-medium text-muted-foreground">Status</dt>
                <dd>
                  <Select
                    value={ticket.status}
                    onValueChange={(val) => update({ status: val as TicketStatus })}
                    disabled={isUpdating}
                  >
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue>{statusLabels[ticket.status]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TicketStatus).map((s) => (
                        <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </dd>
              </div>

              <div className="space-y-1.5">
                <dt className="text-xs font-medium text-muted-foreground">Category</dt>
                <dd>
                  <Select
                    value={ticket.category ?? ""}
                    onValueChange={(val) => update({ category: val === "" ? null : val as TicketCategory })}
                    disabled={isUpdating}
                  >
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue>
                        {ticket.category ? categoryLabels[ticket.category] : "Uncategorised"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Uncategorised</SelectItem>
                      {Object.values(TicketCategory).map((c) => (
                        <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </main>
  );
}
