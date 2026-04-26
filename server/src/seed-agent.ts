/**
 * Seeds a test AGENT user directly via Prisma (no HTTP, no Better Auth admin plugin).
 * Used by the e2e test suite to provision an AGENT-role user for route-guard tests.
 *
 * Idempotent: silently skips creation if the user already exists.
 *
 * Run via: npm run seed-agent:test --workspace server
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "./db.js";
import { auth } from "./auth.js";
import { Role } from "./generated/prisma/enums.js";

const AGENT_EMAIL = "agent@helpdesk.test";
const AGENT_PASSWORD = "agentpassword123!";
const AGENT_NAME = "Agent User";

const existing = await prisma.user.findUnique({ where: { email: AGENT_EMAIL } });

if (existing) {
  console.log(
    `Agent ${AGENT_EMAIL} already exists (id=${existing.id}, role=${existing.role})`
  );
} else {
  const ctx = await auth.$context;
  // Hash the password via Better Auth's hasher so sign-in works correctly.
  // We bypass the minPasswordLength check intentionally (test data only).
  const passwordHash = await ctx.password.hash(AGENT_PASSWORD);
  const userId = randomUUID();

  try {
    await prisma.user.create({
      data: {
        id: userId,
        email: AGENT_EMAIL,
        name: AGENT_NAME,
        emailVerified: true,
        role: Role.AGENT,
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
    console.log(`Created agent ${AGENT_EMAIL}`);
  } catch (err: unknown) {
    // Unique constraint violation — another parallel process already created the user.
    // This is safe to ignore; the user exists and sign-in will work.
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint")) {
      console.log(`Agent ${AGENT_EMAIL} already exists (created by concurrent process)`);
    } else {
      throw err;
    }
  }
}

await prisma.$disconnect();
