import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TicketStatus, TicketCategory, type UpdateTicketValues, type Ticket, statusLabels, categoryLabels } from "@helpdesk/core";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Agent {
  id: string;
  name: string;
  email: string;
}

async function fetchAgents(): Promise<Agent[]> {
  const res = await axios.get<{ agents: Agent[] }>("/api/tickets/agents", {
    withCredentials: true,
  });
  return res.data.agents;
}

async function updateTicket(ticketId: number, data: UpdateTicketValues): Promise<Ticket> {
  const res = await axios.patch<{ ticket: Ticket }>(
    `/api/tickets/${ticketId}`,
    data,
    { withCredentials: true },
  );
  return res.data.ticket;
}

interface Props {
  ticket: Ticket;
  ticketId: number;
}

export function UpdateTicket({ ticket, ticketId }: Props) {
  const queryClient = useQueryClient();

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
  );
}
