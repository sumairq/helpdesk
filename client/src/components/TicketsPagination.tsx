import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TicketsPaginationProps {
  page: number;
  pageCount: number;
  total: number;
  isPending: boolean;
  onPageChange: (page: number) => void;
}

export function TicketsPagination({ page, pageCount, total, isPending, onPageChange }: TicketsPaginationProps) {
  if (total === 0 && !isPending) return null;

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
      <span>
        {isPending ? "Loading…" : `${total} ticket${total === 1 ? "" : "s"}`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isPending}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <span className="tabular-nums">
          Page {page} of {pageCount || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount || isPending}
          aria-label="Next page"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
