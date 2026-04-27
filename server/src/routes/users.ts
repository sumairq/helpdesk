import { Router, type Request, type Response } from "express";
import { createUserSchema } from "@helpdesk/core";
import { hashPassword } from "@better-auth/utils/password";
import { generateId } from "better-auth";
import { prisma } from "../db.js";
import { Role } from "../generated/prisma/enums.js";

export const usersRouter = Router();

usersRouter.get("/", async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  res.json({ users });
});

usersRouter.post("/", async (req: Request, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "A user with this email already exists" });
    return;
  }

  const hashedPassword = await hashPassword(password);
  const userId = generateId(32);
  const now = new Date();

  const user = await prisma.user.create({
    data: {
      id: userId,
      name,
      email,
      emailVerified: false,
      role: Role.AGENT,
      createdAt: now,
      updatedAt: now,
      accounts: {
        create: {
          id: generateId(32),
          accountId: userId,
          providerId: "credential",
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  res.status(201).json({ user });
});
