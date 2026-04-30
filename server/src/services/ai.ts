import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function polishReplyText(body: string): Promise<string> {
  const { text } = await generateText({
    model: openai("gpt-5.4-mini"),
    system:
      "You are an expert helpdesk agent assistant. Rewrite the draft reply to be professional, clear, concise, and empathetic. Preserve all factual information and intent. Return only the rewritten reply text — no preamble, no commentary, no greeting, no sign-off.",
    prompt: body,
  });
  return text;
}

interface ReplyForSummary {
  senderType: string;
  body: string;
}

export async function summarizeTicket(
  subject: string,
  body: string,
  replies: ReplyForSummary[],
): Promise<string> {
  const conversation = [
    `Subject: ${subject}`,
    `\nCustomer message:\n${body}`,
    ...replies.map(
      (r, i) =>
        `\n[${i + 1}] ${r.senderType === "agent" ? "Agent" : "Customer"}:\n${r.body}`,
    ),
  ].join("\n");

  const { text } = await generateText({
    model: openai("gpt-5.4-mini"),
    system:
      "You are a helpdesk assistant. Summarize the support ticket and conversation history in 2–4 concise sentences. Cover: the customer's issue, key actions or responses so far, and current status. Be factual and neutral. Return only the summary — no headers, no bullet points.",
    prompt: conversation,
  });
  return text;
}
