import { TicketStatus, TicketCategory } from "@helpdesk/core";
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
  [TicketStatus.open]: "bg-green-100 text-green-800",
  [TicketStatus.resolved]: "bg-blue-100 text-blue-800",
  [TicketStatus.closed]: "bg-muted text-muted-foreground",
};

const categoryLabels: Record<TicketCategory, string> = {
  [TicketCategory.general_question]: "General",
  [TicketCategory.technical]: "Technical",
  [TicketCategory.refund]: "Refund",
};

interface TicketsTableProps {
  tickets: Ticket[];
  isPending: boolean;
}

export function TicketsTable({ tickets, isPending }: TicketsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>ID</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>From</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              </TableRow>
            ))
          ) : tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                No tickets yet.
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="text-muted-foreground font-mono">#{ticket.id}</TableCell>
                <TableCell className="font-medium">{ticket.subject}</TableCell>
                <TableCell>
                  <div>{ticket.senderName}</div>
                  <div className="text-xs text-muted-foreground">{ticket.senderEmail}</div>
                </TableCell>
                <TableCell>
                  {ticket.category ? (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                      {categoryLabels[ticket.category]}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
