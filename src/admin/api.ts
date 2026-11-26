/** The admin screen's calls to its own API (see src/app/api/admin). */
import type { SiteContent } from "@/content/schema";
import type { HeldImage, Manifest } from "@/lib/admin/commit";

export type Loaded = { content: SiteContent; sha: string; manifest: Manifest };

const OFFLINE = "Couldn't reach the server. Check your connection and try again.";

async function call(url: string, init?: RequestInit): Promise<{ status: number; body: unknown }> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  } catch {
    return { status: 0, body: { error: "offline", message: OFFLINE } };
  }
}

const message = (body: unknown, fallback: string) =>
  (body as { message?: string; error?: string } | null)?.message ?? fallback;

export async function getSession(): Promise<{ configured: boolean; signedIn: boolean } | { error: string }> {
  const { status, body } = await call("/api/admin/session");
  if (status !== 200) return { error: message(body, OFFLINE) };
  return body as { configured: boolean; signedIn: boolean };
}

export async function signIn(password: string): Promise<"ok" | "wrong" | "not-configured" | "offline"> {
  const { status } = await call("/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (status === 200) return "ok";
  if (status === 503) return "not-configured";
  if (status === 401) return "wrong";
  return "offline";
}

export async function signOut(): Promise<void> {
  await call("/api/admin/logout", { method: "POST" });
}

export async function loadContent(): Promise<
  { ok: true; loaded: Loaded } | { ok: false; signedOut: boolean; message: string }
> {
  const { status, body } = await call("/api/admin/content");
  if (status === 200) return { ok: true, loaded: body as Loaded };
  if (status === 401) return { ok: false, signedOut: true, message: "Signed out" };
  const error = (body as { error?: string } | null)?.error;
  if (error === "github-auth") return { ok: false, signedOut: false, message: GITHUB_AUTH_MESSAGE };
  return { ok: false, signedOut: false, message: message(body, "Couldn't load the content from GitHub.") };
}

export const GITHUB_AUTH_MESSAGE = "GitHub rejected the access key. Check GITHUB_TOKEN in Vercel.";

export type UploadResult = { ok: true; image: HeldImage } | { ok: false; signedOut: boolean; message: string };

/** The upload limit (the hosting refuses anything much bigger before it reaches the admin). */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const TOO_BIG = "That picture is over 4 MB. Try a smaller one (a screenshot or a resized photo).";

export async function uploadImage(file: File, kind: "project" | "photo", projectId?: string): Promise<UploadResult> {
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, signedOut: false, message: TOO_BIG };
  const form = new FormData();
  form.set("file", file);
  form.set("kind", kind);
  if (projectId) form.set("projectId", projectId);
  const { status, body } = await call("/api/admin/upload", { method: "POST", body: form });
  if (status === 200) return { ok: true, image: body as HeldImage };
  if (status === 401) return { ok: false, signedOut: true, message: "Signed out" };
  if (status === 413) return { ok: false, signedOut: false, message: TOO_BIG };
  return { ok: false, signedOut: false, message: message(body, "That upload didn't work. Try another picture.") };
}

export async function publishContent(payload: { content: SiteContent; images: HeldImage[]; baseSha: string }) {
  return call("/api/admin/content", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}
