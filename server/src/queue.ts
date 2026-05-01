import { PgBoss } from "pg-boss";
import { registerClassifyTicketWorker } from "./workers/classify-ticket.js";
import { registerAutoResolveTicketWorker } from "./workers/auto-resolve-ticket.js";

const DATABASE_URL = process.env.DATABASE_URL!;

export const boss = new PgBoss(DATABASE_URL);

export { CLASSIFY_TICKET, type ClassifyTicketJob } from "./workers/classify-ticket.js";
export { AUTO_RESOLVE_TICKET, type AutoResolveTicketJob } from "./workers/auto-resolve-ticket.js";

export async function startQueue(): Promise<void> {
  await boss.start();
  await registerClassifyTicketWorker();
  await registerAutoResolveTicketWorker();
}
