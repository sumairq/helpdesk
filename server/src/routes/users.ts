import { Router, type Request, type Response } from "express";
import { type ZodSchema } from "zod";
import { createUserSchema, editUserSchema } from "@helpdesk/core";
import { hashPassword } from "@better-auth/utils/password";
import { generateId } from "better-auth";
import { prisma } from "../db.js";
import { Role } from "../generated/prisma/enums.js";
export const usersRouter = Router();

function validate<T>(schema: ZodSchema<T>, body: unknown, res: Response): T | null {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return null;
  }
  return parsed.data;
}

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
  const data = validate(createUserSchema, req.body, res);
  if (!data) return;
  const { name, email, password } = data;

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

usersRouter.patch("/:id", async (req: Request<{ id: string }>, res: Response) => {
  const data = validate(editUserSchema, req.body, res);
  if (!data) return;
  const { name, email, password } = data;

  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, email, updatedAt: new Date() },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (password) {
    const hashedPassword = await hashPassword(password);
    await prisma.account.updateMany({
      where: { userId: req.params.id, providerId: "credential" },
      data: { password: hashedPassword },
    });
  }

  res.json({ user });
});
