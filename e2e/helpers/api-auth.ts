/**
 * Authenticates a user against the Better Auth API directly (no browser UI)
 * and returns the raw Set-Cookie header values so we can build storageState.
 *
 * Better Auth's sign-in endpoint: POST /api/auth/sign-in/email
 * It returns session cookies via Set-Cookie headers.
 */
const BETTER_AUTH_URL = process.env["BETTER_AUTH_URL"] ?? "http://localhost:3002";

export interface AuthCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
}

export async function fetchSessionCookies(
  email: string,
  password: string
): Promise<AuthCookie[]> {
  const url = `${BETTER_AUTH_URL}/api/auth/sign-in/email`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:5173",
    },
    body: JSON.stringify({ email, password }),
    redirect: "follow",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "(no body)");
    throw new Error(
      `Auth sign-in failed with ${response.status}: ${body}`
    );
  }

  // Parse all Set-Cookie headers (fetch collapses them — use raw headers)
  const rawHeaders = response.headers;
  const cookies: AuthCookie[] = [];

  // In Node 18+ fetch, headers.getSetCookie() returns each Set-Cookie separately.
  const setCookieValues: string[] =
    typeof (rawHeaders as { getSetCookie?: () => string[] }).getSetCookie ===
    "function"
      ? (rawHeaders as { getSetCookie: () => string[] }).getSetCookie()
      : [rawHeaders.get("set-cookie") ?? ""].filter(Boolean);

  for (const raw of setCookieValues) {
    if (!raw) continue;
    const parts = raw.split(";").map((p) => p.trim());
    const [nameValue, ...attrs] = parts;
    const eqIdx = (nameValue ?? "").indexOf("=");
    if (eqIdx === -1) continue;
    const name = (nameValue ?? "").slice(0, eqIdx);
    const value = (nameValue ?? "").slice(eqIdx + 1);

    const attrsLower = attrs.map((a) => a.toLowerCase());
    const pathAttr = attrs.find((a) => a.toLowerCase().startsWith("path="));
    const sameSiteAttr = attrs.find((a) =>
      a.toLowerCase().startsWith("samesite=")
    );
    const sameSiteRaw = sameSiteAttr?.split("=")[1]?.trim() ?? "Lax";
    const sameSite: "Strict" | "Lax" | "None" =
      sameSiteRaw === "Strict"
        ? "Strict"
        : sameSiteRaw === "None"
          ? "None"
          : "Lax";

    const expiresAttr = attrs.find((a) => a.toLowerCase().startsWith("expires="));
    const maxAgeAttr = attrs.find((a) => a.toLowerCase().startsWith("max-age="));
    let expires = -1;
    if (maxAgeAttr) {
      const seconds = Number(maxAgeAttr.split("=")[1]);
      if (Number.isFinite(seconds)) {
        expires = Math.floor(Date.now() / 1000) + seconds;
      }
    } else if (expiresAttr) {
      const ts = Date.parse(expiresAttr.split("=").slice(1).join("="));
      if (Number.isFinite(ts)) {
        expires = Math.floor(ts / 1000);
      }
    }

    cookies.push({
      name,
      value,
      domain: "localhost",
      path: pathAttr ? (pathAttr.split("=")[1] ?? "/") : "/",
      expires,
      httpOnly: attrsLower.includes("httponly"),
      secure: attrsLower.includes("secure"),
      sameSite,
    });
  }

  return cookies;
}

export function buildStorageState(cookies: AuthCookie[]): {
  cookies: AuthCookie[];
  origins: never[];
} {
  return { cookies, origins: [] };
}
