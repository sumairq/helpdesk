import { TicketStatus, TicketCategory, type TicketFilterValues } from "@helpdesk/core";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketsFiltersProps {
  searchInput: string;
  filters: TicketFilterValues;
  onSearchChange: (value: string) => void;
  onFiltersChange: (filters: TicketFilterValues) => void;
}

export function TicketsFilters({ searchInput, filters, onSearchChange, onFiltersChange }: TicketsFiltersProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <Input
        placeholder="Search subject, name or email…"
        value={searchInput}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-xs"
      />
      <Select
        value={filters.status ?? "all"}
        onValueChange={(v) =>
          onFiltersChange({ ...filters, status: v === "all" ? undefined : (v as TicketStatus) })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue>
            {{ all: "All Statuses", open: "Open", resolved: "Resolved", closed: "Closed" }[filters.status ?? "all"]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value={TicketStatus.open}>Open</SelectItem>
          <SelectItem value={TicketStatus.resolved}>Resolved</SelectItem>
          <SelectItem value={TicketStatus.closed}>Closed</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.category ?? "all"}
        onValueChange={(v) =>
          onFiltersChange({ ...filters, category: v === "all" ? undefined : (v as TicketFilterValues["category"]) })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue>
            {{ all: "All Categories", general_question: "General", technical: "Technical", refund: "Refund", uncategorised: "Uncategorised" }[filters.category ?? "all"]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value={TicketCategory.general_question}>General</SelectItem>
          <SelectItem value={TicketCategory.technical}>Technical</SelectItem>
          <SelectItem value={TicketCategory.refund}>Refund</SelectItem>
          <SelectItem value="uncategorised">Uncategorised</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
