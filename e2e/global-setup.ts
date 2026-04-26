import { execSync } from "node:child_process";

export default async function globalSetup() {
  const opts = { stdio: "inherit", env: process.env } as const;

  console.log("[e2e setup] Resetting test database and applying migrations…");
  execSync("npm run db:reset:test --workspace server", opts);

  console.log("[e2e setup] Seeding admin…");
  execSync("npm run seed:test --workspace server", opts);
}
