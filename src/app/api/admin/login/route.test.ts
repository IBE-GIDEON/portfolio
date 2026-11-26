import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { GET as session } from "../session/route";
import { POST as logout } from "../logout/route";
import { POST as login } from "./route";

const PASSWORD = "correct horse battery staple";

function configure() {
  vi.stubEnv("ADMIN_PASSWORD", PASSWORD);
  vi.stubEnv("ADMIN_SESSION_SECRET", "k".repeat(48));
  vi.stubEnv("GITHUB_TOKEN", "github_pat_test");
}

const post = (body: unknown) =>
  new Request("http://localhost/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

/** Runs a handler while fast-forwarding its failure delay. */
async function settle(promise: Promise<Response>): Promise<Response> {
  await vi.advanceTimersByTimeAsync(1000);
  return promise;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.unstubAllEnvs();
  vi.stubEnv("ADMIN_PASSWORD", "");
  vi.stubEnv("ADMIN_SESSION_SECRET", "");
  vi.stubEnv("GITHUB_TOKEN", "");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

test("without setup, login answers 503 and the session says not configured", async () => {
  const res = await settle(login(post({ password: PASSWORD })));
  expect(res.status).toBe(503);
  expect(await res.json()).toEqual({ error: "not-configured" });
  const s = await session(new Request("http://localhost/api/admin/session"));
  expect(await s.json()).toEqual({ configured: false, signedIn: false });
});

test("a short session secret counts as not configured", async () => {
  configure();
  vi.stubEnv("ADMIN_SESSION_SECRET", "too-short");
  const res = await settle(login(post({ password: PASSWORD })));
  expect(res.status).toBe(503);
});

test("a password under 16 characters counts as not configured", async () => {
  configure();
  vi.stubEnv("ADMIN_PASSWORD", "short-password1");
  const res = await settle(login(post({ password: "short-password1" })));
  expect(res.status).toBe(503);
});

test("changing the password signs out every existing session", async () => {
  configure();
  const res = await login(post({ password: PASSWORD }));
  const token = (res.headers.get("set-cookie") ?? "").split(";")[0];
  vi.stubEnv("ADMIN_PASSWORD", "a brand new long password");
  const s = await session(new Request("http://localhost/api/admin/session", { headers: { cookie: token } }));
  expect(await s.json()).toEqual({ configured: true, signedIn: false });
});

test("the right password signs in with a locked-down cookie", async () => {
  configure();
  const res = await login(post({ password: PASSWORD }));
  expect(res.status).toBe(200);
  const cookie = res.headers.get("set-cookie") ?? "";
  expect(cookie).toContain("gi_admin=");
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("SameSite=Strict");
  expect(cookie).toContain("Max-Age=604800");

  const token = cookie.split(";")[0];
  const s = await session(new Request("http://localhost/api/admin/session", { headers: { cookie: token } }));
  expect(await s.json()).toEqual({ configured: true, signedIn: true });
});

test("a wrong password waits a second, then answers 401", async () => {
  configure();
  let done = false;
  const pending = login(post({ password: "nope" })).then((r) => {
    done = true;
    return r;
  });
  await vi.advanceTimersByTimeAsync(900);
  expect(done).toBe(false);
  const res = await settle(pending);
  expect(res.status).toBe(401);
  expect(res.headers.get("set-cookie")).toBeNull();
});

test("a malformed body is a wrong password, not a crash", async () => {
  configure();
  const bad = new Request("http://localhost/api/admin/login", { method: "POST", body: "{not json" });
  expect((await settle(login(bad))).status).toBe(401);
});

test("signed out: the session says configured but not signed in", async () => {
  configure();
  const s = await session(new Request("http://localhost/api/admin/session", { headers: { cookie: "gi_admin=1.forged" } }));
  expect(await s.json()).toEqual({ configured: true, signedIn: false });
});

test("logout clears the cookie", async () => {
  const res = await logout();
  expect(res.status).toBe(200);
  const cookie = res.headers.get("set-cookie") ?? "";
  expect(cookie).toContain("gi_admin=;");
  expect(cookie).toContain("Max-Age=0");
});
