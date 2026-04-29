import { useState } from "react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import type { TicketReply } from "./ReplyThread";

interface Props {
  ticketId: number;
  onSuccess: (reply: TicketReply) => void;
}

async function postReply(ticketId: number, body: string): Promise<TicketReply> {
  const res = await axios.post<{ reply: TicketReply }>(
    `/api/tickets/${ticketId}/replies`,
    { body },
    { withCredentials: true },
  );
  return res.data.reply;
}

export function ReplyForm({ ticketId, onSuccess }: Props) {
  const [body, setBody] = useState("");

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => postReply(ticketId, body),
    onSuccess: (reply) => {
      setBody("");
      onSuccess(reply);
    },
  });

  const errorMessage = error
    ? axios.isAxiosError(error)
      ? (error.response?.data?.error ?? error.message)
      : "Failed to send reply"
    : null;

  return (
    <div className="space-y-3">
      <h2 className="section-label">Reply</h2>
      <textarea
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none"
        rows={4}
        placeholder="Write a reply…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        disabled={isPending}
      />
      <ErrorMessage message={errorMessage} />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => mutate()}
          disabled={isPending || body.trim().length === 0}
        >
          {isPending ? "Sending…" : "Send reply"}
        </Button>
      </div>
    </div>
  );
}
