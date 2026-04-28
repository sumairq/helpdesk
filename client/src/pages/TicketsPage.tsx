import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { TicketsTable, type Ticket } from "@/components/TicketsTable";

async function fetchTickets(): Promise<Ticket[]> {
  const res = await axios.get<{ tickets: Ticket[] }>("/api/tickets", { withCredentials: true });
  return res.data.tickets;
}

export function TicketsPage() {
  const { data: tickets = [], isPending, error } = useQuery({ queryKey: ["tickets"], queryFn: fetchTickets });

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Tickets</h1>
      </div>

      {error && (
        <p className="text-destructive">
          {axios.isAxiosError(error) ? (error.response?.data?.error ?? error.message) : "Failed to load tickets"}
        </p>
      )}

      {!error && (
        <TicketsTable tickets={tickets} isPending={isPending} />
      )}
    </main>
  );
}
