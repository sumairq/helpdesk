import DOMPurify from "dompurify";
import { Skeleton } from "@/components/ui/skeleton";

export interface TicketReply {
  id: number;
  senderType: "agent" | "customer";
  author: { id: string; name: string } | null;
  body: string;
  bodyHtml: string | null;
  createdAt: string;
}

interface Props {
  replies: TicketReply[];
  isLoading: boolean;
}

export function ReplyThread({ replies, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-32" />
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (replies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No replies yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {replies.map((reply) => {
        const isAgent = reply.senderType === "agent";
        return (
          <div
            key={reply.id}
            className={`flex ${isAgent ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg border px-4 py-3 text-sm ${
                isAgent
                  ? "bg-primary/5 border-primary/20"
                  : "bg-muted/30 border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-medium">
                  {isAgent ? (reply.author?.name ?? "Agent") : "Customer"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(reply.createdAt).toLocaleString()}
                </span>
              </div>
              {reply.bodyHtml ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.bodyHtml) }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                  {reply.body}
                </pre>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
