import { adminConfig } from "./config";
import { SESSION_COOKIE, SESSION_MAX_AGE, verifySession } from "./session";

/** The cookie only travels to the admin's own API. */
const COOKIE_PATH = "/api/admin";

/** Reads one cookie from a request's Cookie header. */
export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq !== -1 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return undefined;
}

/** True when the request carries a valid admin login cookie. */
export function isAdminRequest(request: Request): boolean {
  // Read the request first: it keeps GET handlers dynamic (never prerendered at build).
  const token = readCookie(request, SESSION_COOKIE);
  const config = adminConfig();
  return config !== null && verifySession(token, config.secret);
}

const secure = () => (process.env.NODE_ENV === "production" ? "; Secure" : "");

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=${COOKIE_PATH}; Max-Age=${SESSION_MAX_AGE}; HttpOnly; SameSite=Strict${secure()}`;
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=${COOKIE_PATH}; Max-Age=0; HttpOnly; SameSite=Strict${secure()}`;
}

/** The answer every protected admin route gives a signed-out request. */
export function unauthorized(): Response {
  return Response.json({ error: "signed-out" }, { status: 401 });
}

export function notConfigured(): Response {
  return Response.json({ error: "not-configured" }, { status: 503 });
}
