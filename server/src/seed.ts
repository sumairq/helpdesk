import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "./db.js";
import { auth } from "./auth.js";
import { Role } from "./generated/prisma/enums.js";

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;

if (!email || !password) {
  console.error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set");
  process.exit(1);
}

const existing = await prisma.user.findUnique({ where: { email } });

if (existing) {
  console.log(`Admin ${email} already exists (id=${existing.id}, role=${existing.role})`);
} else {
  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash(password);
  const userId = randomUUID();

  await prisma.user.create({
    data: {
      id: userId,
      email,
      name: "Admin",
      emailVerified: true,
      role: Role.ADMIN,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: passwordHash,
        },
      },
    },
  });
  console.log(`Created admin ${email}`);
}

await prisma.$disconnect();
