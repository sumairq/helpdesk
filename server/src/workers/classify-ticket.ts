import type { Job } from "pg-boss/dist/types.js";
import { prisma } from "../db.js";
import { classifyTicket } from "../services/ai.js";
import { boss } from "../queue.js";

export const CLASSIFY_TICKET = "classify-ticket";

export interface ClassifyTicketJob {
  ticketId: number;
  subject: string;
  body: string;
}

export async function registerClassifyTicketWorker(): Promise<void> {
  await boss.createQueue(CLASSIFY_TICKET);
  await boss.work<ClassifyTicketJob>(CLASSIFY_TICKET, async (jobs: Job<ClassifyTicketJob>[]) => {
    for (const job of jobs) {
      const { ticketId, subject, body } = job.data;
      const category = await classifyTicket({ subject, body });
      await prisma.ticket.update({ where: { id: ticketId }, data: { category } });
    }
  });
}
