import "dotenv/config";
import { prisma } from "./db.js";
import { Role } from "./generated/prisma/enums.js";
import { AI_AGENT_ID } from "@helpdesk/core";

export const AI_AGENT_EMAIL = "ai@helpdesk.local";

// Migrate any legacy AI agent that was created with a random UUID
const legacy = await prisma.user.findFirst({
  where: { email: AI_AGENT_EMAIL, id: { not: AI_AGENT_ID } },
});
if (legacy) {
  await prisma.ticket.updateMany({ where: { assignedToId: legacy.id }, data: { assignedToId: null } });
  await prisma.user.delete({ where: { id: legacy.id } });
  console.log(`Removed legacy AI agent (id=${legacy.id})`);
}

const existing = await prisma.user.findUnique({ where: { id: AI_AGENT_ID } });

if (existing) {
  console.log(`AI agent already exists (id=${AI_AGENT_ID})`);
} else {
  await prisma.user.create({
    data: {
      id: AI_AGENT_ID,
      name: "AI",
      email: AI_AGENT_EMAIL,
      emailVerified: false,
      role: Role.AGENT,
    },
  });
  console.log(`Created AI agent (id=${AI_AGENT_ID})`);
}

await prisma.$disconnect();
