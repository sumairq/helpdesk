import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import { Role } from "../generated/prisma/enums.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session || session.user.deletedAt) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.locals.session = session;
  next();
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (session.user.role !== Role.ADMIN) {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.locals.session = session;
  next();
}
