import { notConfigured, sessionCookie, sessionKey } from "@/lib/admin/auth";
import { adminConfig } from "@/lib/admin/config";
import { passwordMatches, SESSION_MAX_AGE, signSession } from "@/lib/admin/session";

/** Failed attempts wait this long, to slow down guessing. */
const FAILURE_DELAY_MS = 1000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  let password = "";
  try {
    const body = await request.json();
    if (typeof body?.password === "string") password = body.password;
  } catch {
    // A malformed body is treated as a wrong password.
  }

  const config = adminConfig();
  if (!config) return notConfigured();

  if (!password || !passwordMatches(password, config.password)) {
    await wait(FAILURE_DELAY_MS);
    return Response.json({ error: "wrong-password" }, { status: 401 });
  }

  const token = signSession(Date.now() + SESSION_MAX_AGE * 1000, sessionKey(config));
  return Response.json({ ok: true }, { headers: { "set-cookie": sessionCookie(token) } });
}
