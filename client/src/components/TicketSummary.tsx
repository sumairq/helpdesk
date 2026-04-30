import { useState } from "react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  ticketId: number;
}

async function fetchSummary(ticketId: number): Promise<string> {
  const res = await axios.post<{ summary: string }>(
    `/api/tickets/${ticketId}/summarize`,
    {},
    { withCredentials: true },
  );
  return res.data.summary;
}

export function TicketSummary({ ticketId }: Props) {
  const [summary, setSummary] = useState<string | null>(null);

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => fetchSummary(ticketId),
    onSuccess: (text) => setSummary(text),
  });

  const errorMessage = error
    ? axios.isAxiosError(error)
      ? (error.response?.data?.error ?? error.message)
      : "Failed to generate summary"
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="section-label">Summary</h2>
        <Button size="sm" variant="outline" onClick={() => mutate()} disabled={isPending}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          {isPending ? "Summarizing…" : summary ? "Re-generate" : "Summarize"}
        </Button>
      </div>

      <ErrorMessage message={errorMessage} />

      {isPending && (
        <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      )}

      {!isPending && summary && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
          {summary}
        </div>
      )}
    </div>
  );
}
