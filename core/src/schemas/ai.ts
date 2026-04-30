import { z } from "zod";

export const polishReplySchema = z.object({
  body: z.string().trim().min(1, "Reply body is required").max(100_000),
});

export type PolishReplyValues = z.infer<typeof polishReplySchema>;
