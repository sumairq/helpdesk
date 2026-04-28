import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { type SortingState } from "@tanstack/react-table";
import { TicketsTable, type Ticket } from "@/components/TicketsTable";

async function fetchTickets(sortBy: string, sortOrder: string): Promise<Ticket[]> {
  const res = await axios.get<{ tickets: Ticket[] }>("/api/tickets", {
    params: { sortBy, sortOrder },
    withCredentials: true,
  });
  return res.data.tickets;
}

export function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const sortBy = sorting[0]?.id ?? "createdAt";
  const sortOrder = sorting[0]?.desc === false ? "asc" : "desc";

  const { data: tickets = [], isPending, error } = useQuery({
    queryKey: ["tickets", sortBy, sortOrder],
    queryFn: () => fetchTickets(sortBy, sortOrder),
  });

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
        <TicketsTable
          tickets={tickets}
          isPending={isPending}
          sorting={sorting}
          onSortingChange={setSorting}
        />
      )}
    </main>
  );
}
