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

await prisma.verification.deleteMany({});
await prisma.user.deleteMany({});

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

console.log(`Reset complete. Admin ${email} created.`);

await prisma.$disconnect();
