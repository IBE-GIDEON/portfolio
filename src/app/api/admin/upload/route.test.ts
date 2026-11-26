import sharp from "sharp";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { sessionKey } from "@/lib/admin/auth";
import { adminConfig } from "@/lib/admin/config";
import { SESSION_COOKIE, signSession } from "@/lib/admin/session";
import { POST } from "./route";

const SECRET = "k".repeat(48);

const png = () => sharp({ create: { width: 800, height: 500, channels: 3, background: "#222" } }).png().toBuffer();

async function upload(fields: { file?: Blob; kind?: string; projectId?: string }, signedIn = true) {
  const form = new FormData();
  if (fields.file) form.set("file", fields.file, "shot.png");
  if (fields.kind) form.set("kind", fields.kind);
  if (fields.projectId) form.set("projectId", fields.projectId);
  const headers: Record<string, string> = signedIn
    ? { cookie: `${SESSION_COOKIE}=${signSession(Date.now() + 60_000, sessionKey(adminConfig()!))}` }
    : {};
  return POST(new Request("http://localhost/api/admin/upload", { method: "POST", headers, body: form }));
}

beforeEach(() => {
  vi.stubEnv("ADMIN_PASSWORD", "correct horse battery staple");
  vi.stubEnv("ADMIN_SESSION_SECRET", SECRET);
  vi.stubEnv("GITHUB_TOKEN", "github_pat_test");
});

afterEach(() => vi.unstubAllEnvs());

test("signed out uploads are refused", async () => {
  const file = new Blob([new Uint8Array(await png())], { type: "image/png" });
  expect((await upload({ file, kind: "photo" }, false)).status).toBe(401);
});

test("a screenshot upload comes back processed, not committed", async () => {
  const file = new Blob([new Uint8Array(await png())], { type: "image/png" });
  const res = await upload({ file, kind: "project", projectId: "three-ai" });
  expect(res.status).toBe(200);
  const held = await res.json();
  expect(held.path).toMatch(/^\/projects\/three-ai\.[0-9a-f]{6}\.webp$/);
  expect(held.blur).toMatch(/^data:image\/webp;base64,/);
});

test("files over 4 MB are refused", async () => {
  const file = new Blob([new Uint8Array(4 * 1024 * 1024 + 1)], { type: "image/png" });
  expect((await upload({ file, kind: "photo" })).status).toBe(413);
});

test("only JPG, PNG and WebP are accepted", async () => {
  const file = new Blob(["<svg/>"], { type: "image/svg+xml" });
  expect((await upload({ file, kind: "photo" })).status).toBe(415);
});

test("a corrupt picture, a missing project id or a missing file is refused", async () => {
  const corrupt = new Blob(["not really a png"], { type: "image/png" });
  expect((await upload({ file: corrupt, kind: "photo" })).status).toBe(422);
  const good = new Blob([new Uint8Array(await png())], { type: "image/png" });
  expect((await upload({ file: good, kind: "project" })).status).toBe(422);
  expect((await upload({ file: good, kind: "project", projectId: "../x" })).status).toBe(422);
  expect((await upload({ kind: "photo" })).status).toBe(422);
});
