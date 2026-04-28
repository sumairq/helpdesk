import { useState, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { type SortingState } from "@tanstack/react-table";
import { type TicketFilterValues, PAGE_SIZE } from "@helpdesk/core";
import { TicketsFilters } from "@/components/TicketsFilters";
import { TicketsTable, type Ticket } from "@/components/TicketsTable";
import { TicketsPagination } from "@/components/TicketsPagination";

interface TicketsResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchTickets(
  sortBy: string,
  sortOrder: string,
  filters: TicketFilterValues,
  page: number,
): Promise<TicketsResponse> {
  const res = await axios.get<TicketsResponse>("/api/tickets", {
    params: { sortBy, sortOrder, ...filters, page, pageSize: PAGE_SIZE },
    withCredentials: true,
  });
  return res.data;
}

export function TicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<TicketFilterValues>({});

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  const setPage = (next: number) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("page", String(next));
      return p;
    }, { replace: true });
  };

  // Debounce the search filter update; page reset happens in handleSearchChange
  useEffect(() => {
    const id = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput || undefined }));
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleFiltersChange = (next: TicketFilterValues) => {
    setFilters(next);
    setPage(1);
  };

  const sortBy    = sorting[0]?.id ?? "createdAt";
  const sortOrder = sorting[0]?.desc === false ? "asc" : "desc";

  const { data, isPending, error } = useQuery({
    queryKey: ["tickets", sortBy, sortOrder, filters, page],
    queryFn: () => fetchTickets(sortBy, sortOrder, filters, page),
  });

  const tickets   = data?.tickets ?? [];
  const total     = data?.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Tickets</h1>
      </div>

      <TicketsFilters
        searchInput={searchInput}
        filters={filters}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
      />

      {error && (
        <p className="text-destructive">
          {axios.isAxiosError(error) ? (error.response?.data?.error ?? error.message) : "Failed to load tickets"}
        </p>
      )}

      {!error && (
        <>
          <TicketsTable
            tickets={tickets}
            isPending={isPending}
            sorting={sorting}
            onSortingChange={setSorting}
          />
          <TicketsPagination
            page={page}
            pageCount={pageCount}
            total={total}
            isPending={isPending}
            onPageChange={setPage}
          />
        </>
      )}
    </main>
  );
}
