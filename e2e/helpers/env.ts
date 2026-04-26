/**
 * Reads test credentials from server/.env.test so no credentials are
 * hardcoded in any spec file. Uses Node's built-in fs to parse the
 * dotenv format without requiring the dotenv package at the e2e layer.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseEnvFile(filePath: string): Record<string, string> {
  const content = readFileSync(filePath, "utf-8");
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

const envPath = resolve(process.cwd(), "server/.env.test");

const env = parseEnvFile(envPath);

export const SEED_ADMIN_EMAIL = env["SEED_ADMIN_EMAIL"] ?? "";
export const SEED_ADMIN_PASSWORD = env["SEED_ADMIN_PASSWORD"] ?? "";
export const BETTER_AUTH_URL = env["BETTER_AUTH_URL"] ?? "http://localhost:3001";

if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
  throw new Error(
    "server/.env.test must define SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD"
  );
}
