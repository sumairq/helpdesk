import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
``;
export async function polishReplyText(body: string): Promise<string> {
  const { text } = await generateText({
    model: openai("gpt-5.4-mini"),
    system:
      "You are an expert helpdesk agent assistant. Rewrite the draft reply to be professional, clear, concise, and empathetic. Preserve all factual information and intent. Return only the rewritten reply text — no preamble, no commentary, no greeting, no sign-off.",
    prompt: body,
  });
  return text;
}
