import { type Request, type Response, type NextFunction } from "express";

export function requireWebhookSecret(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    res.status(503).json({ error: "Webhook endpoint is not configured" });
    return;
  }
  const token = req.query["token"] ?? req.query["secret"] ?? req.headers["x-webhook-secret"];
  if (!token) {
    res.status(401).json({ error: "Missing token — provide via ?token= or ?secret= query parameter, or X-Webhook-Secret header" });
    return;
  }
  if (token !== secret) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  next();
}
