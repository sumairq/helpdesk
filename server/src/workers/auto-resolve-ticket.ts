import type { Job } from "pg-boss/dist/types.js";
import { TicketStatus, SenderType } from "@helpdesk/core";
import { prisma } from "../db.js";
import { tryAutoResolve } from "../services/ai.js";
import { boss } from "../queue.js";

export const AUTO_RESOLVE_TICKET = "auto-resolve-ticket";

export interface AutoResolveTicketJob {
  ticketId: number;
  subject: string;
  body: string;
  senderName: string;
}

export async function registerAutoResolveTicketWorker(): Promise<void> {
  await boss.createQueue(AUTO_RESOLVE_TICKET);
  await boss.work<AutoResolveTicketJob>(AUTO_RESOLVE_TICKET, async (jobs: Job<AutoResolveTicketJob>[]) => {
    for (const job of jobs) {
      const { ticketId, subject, body, senderName } = job.data;

      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.processing },
      });

      let resolved = false;
      let reply: string | null = null;
      try {
        ({ resolved, reply } = await tryAutoResolve({ subject, body, senderName }));
      } catch (err) {
        console.error(`Auto-resolve failed for ticket ${ticketId}:`, err);
      }

      if (resolved && reply) {
        await prisma.$transaction([
          prisma.ticketReply.create({
            data: { ticketId, senderType: SenderType.agent, authorId: null, body: reply },
          }),
          prisma.ticket.update({
            where: { id: ticketId },
            data: { status: TicketStatus.resolved },
          }),
        ]);
      } else {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.open },
        });
      }
    }
  });
}
