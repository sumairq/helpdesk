/**
 * Seeds an AGENT user in the test database by running the server-side seed
 * script via execSync. This approach avoids a dependency on the Better Auth
 * admin plugin (which is not enabled in auth.ts) and keeps all Prisma/auth
 * code in the server workspace where it belongs.
 *
 * The credentials here MUST match those in server/src/seed-agent.ts.
 * The seed script is idempotent — safe to call multiple times per test run.
 */
import { execSync } from "node:child_process";

export const AGENT_EMAIL = "agent@helpdesk.test";
export const AGENT_PASSWORD = "agentpassword123!";
export const AGENT_NAME = "Agent User";

let seeded = false;

export async function seedAgentUser(): Promise<void> {
  if (seeded) return;

  execSync("npm run seed-agent:test --workspace server", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });

  seeded = true;
}
