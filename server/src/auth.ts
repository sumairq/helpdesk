import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Role } from "@helpdesk/core";
import { prisma } from "./db.js";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32) {
  throw new Error(
    "BETTER_AUTH_SECRET must be set to a string of at least 32 characters",
  );
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
  },
  user: {
    additionalFields: {
      role: {
        type: [Role.ADMIN, Role.AGENT],
        required: true,
        defaultValue: Role.AGENT,
        input: false,
      },
      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null,
        input: false,
      },
    },
  },
  trustedOrigins: (process.env.TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  rateLimit: {
    enabled: process.env.NODE_ENV !== "test",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { deletedAt: true },
          });
          if (user?.deletedAt) return false;
        },
      },
    },
  },
  secret,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
});
