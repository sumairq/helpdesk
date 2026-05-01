import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  functionalUpdate,
  type SortingState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { ChevronUpIcon, ChevronDownIcon, ChevronsUpDownIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { TicketStatus, TicketCategory, type TicketSortableColumn } from "@helpdesk/core";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Ticket {
  id: number;
  subject: string;
  senderName: string;
  senderEmail: string;
  status: TicketStatus;
  category: TicketCategory | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusStyles: Record<TicketStatus, string> = {
  [TicketStatus.new]:        "bg-yellow-100 text-yellow-800",
  [TicketStatus.open]:       "bg-green-100 text-green-800",
  [TicketStatus.processing]: "bg-purple-100 text-purple-800",
  [TicketStatus.resolved]:   "bg-blue-100 text-blue-800",
  [TicketStatus.closed]:     "bg-muted text-muted-foreground",
};

const categoryLabels: Record<TicketCategory, string> = {
  [TicketCategory.general_question]: "General",
  [TicketCategory.technical]: "Technical",
  [TicketCategory.refund]: "Refund",
};

const SORTABLE_COLUMNS = new Set<TicketSortableColumn>(["id", "subject", "status", "category", "createdAt"]);

interface TicketsTableProps {
  tickets: Ticket[];
  isPending: boolean;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
}

const col = createColumnHelper<Ticket>();

const columns = [
  col.accessor("id", {
    header: "ID",
    cell: (info) => <span className="font-mono text-muted-foreground">#{info.getValue()}</span>,
  }),
  col.accessor("subject", {
    header: "Subject",
    cell: (info) => (
      <Link
        to={`/tickets/${info.row.original.id}`}
        className="font-medium"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  col.display({
    id: "from",
    header: "From",
    cell: ({ row }) => (
      <div>
        <div>{row.original.senderName}</div>
        <div className="text-xs text-muted-foreground">{row.original.senderEmail}</div>
      </div>
    ),
  }),
  col.accessor("category", {
    header: "Category",
    cell: (info) => {
      const cat = info.getValue();
      return cat ? (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
          {categoryLabels[cat]}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  }),
  col.accessor("status", {
    header: "Status",
    cell: (info) => (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[info.getValue()]}`}>
        {info.getValue()}
      </span>
    ),
  }),
  col.accessor("createdAt", {
    header: "Received",
    cell: (info) => (
      <span className="text-muted-foreground">
        {new Date(info.getValue()).toLocaleDateString()}
      </span>
    ),
  }),
];

function SortIcon({ isSorted }: { isSorted: false | "asc" | "desc" }) {
  if (isSorted === "asc") return <ChevronUpIcon className="ml-1 inline h-3.5 w-3.5" />;
  if (isSorted === "desc") return <ChevronDownIcon className="ml-1 inline h-3.5 w-3.5" />;
  return <ChevronsUpDownIcon className="ml-1 inline h-3.5 w-3.5 opacity-40" />;
}

export function TicketsTable({ tickets, isPending, sorting, onSortingChange }: TicketsTableProps) {
  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50">
              {headerGroup.headers.map((header) => {
                const isSortable = SORTABLE_COLUMNS.has(header.column.id as TicketSortableColumn);
                return (
                  <TableHead
                    key={header.id}
                    className={isSortable ? "cursor-pointer select-none" : ""}
                    onClick={isSortable ? () => {
                      const current = sorting[0];
                      const isActive = current?.id === header.column.id;
                      const next: SortingState = [{
                        id: header.column.id,
                        desc: isActive ? !current.desc : false,
                      }];
                      onSortingChange(functionalUpdate(next, sorting));
                    } : undefined}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {isSortable && <SortIcon isSorted={header.column.getIsSorted()} />}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isPending ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-6 text-center text-muted-foreground">
                No tickets yet.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
