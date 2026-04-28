import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { prisma } from "./db.js";
import { auth } from "./auth.js";
import { requireAdmin, requireAuth } from "./middleware/auth.js";
import { usersRouter } from "./routes/users.js";
import { ticketsRouter } from "./routes/tickets.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { requireWebhookSecret } from "./middleware/webhookSecret.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json());

app.use("/api/users", requireAdmin, usersRouter);
app.use("/api/tickets", requireAuth, ticketsRouter);
app.use("/api/webhooks", requireWebhookSecret, webhooksRouter);
if (!process.env.WEBHOOK_SECRET) {
  console.warn("Warning: WEBHOOK_SECRET is not set — webhook endpoint will reject all requests");
}

app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "ok", uptime: process.uptime() });
  } catch (err) {
    console.error("DB health check failed:", err);
    res.status(500).json({ status: "error", db: "error" });
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = err instanceof Error && "status" in err ? (err as { status: number }).status : 500;
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
