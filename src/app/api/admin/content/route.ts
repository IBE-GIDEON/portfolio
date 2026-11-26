import { createHash } from "node:crypto";
import { validateContent, type SiteContent } from "@/content/schema";
import { isAdminRequest, unauthorized } from "@/lib/admin/auth";
import { buildCommit, checkHeldImages, CONTENT_PATH, MANIFEST_PATH, missingImages, toJson, type Manifest } from "@/lib/admin/commit";
import { ConflictError, GitHubAuthError, GitHubError, type RepoClient } from "@/lib/admin/github";
import { getRepoClient } from "@/lib/admin/repo";

const noStore = { "cache-control": "no-store" };
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: noStore });

/** The sha GitHub gives a file with this text (git's blob hash). */
function gitBlobSha(text: string): string {
  const bytes = Buffer.from(text, "utf8");
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}

/** Turns a GitHub failure into an answer the admin screen can explain. */
function githubFailure(error: unknown): Response {
  if (error instanceof ConflictError) return reply({ error: "conflict" }, 409);
  if (error instanceof GitHubAuthError) return reply({ error: "github-auth" }, 502);
  const message = error instanceof GitHubError ? error.message : "Couldn't reach GitHub. Check your connection and try again.";
  console.error("[admin] GitHub request failed:", error);
  return reply({ error: "github", message }, 502);
}

async function readManifest(repo: RepoClient): Promise<Manifest> {
  try {
    return JSON.parse((await repo.readFile(MANIFEST_PATH)).text) as Manifest;
  } catch (error) {
    if (error instanceof GitHubError && error.status === 404) return {};
    throw error;
  }
}

/** The latest content straight from GitHub (never the deployed copy, which may be older). */
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const repo = getRepoClient();
    const [file, manifest] = await Promise.all([repo.readFile(CONTENT_PATH), readManifest(repo)]);
    return reply({ content: JSON.parse(file.text), sha: file.sha, manifest });
  } catch (error) {
    return githubFailure(error);
  }
}

/** Publish: validate, then commit content and images to GitHub in one commit. */
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  let body: { content?: unknown; images?: unknown; baseSha?: unknown };
  try {
    body = await request.json();
  } catch {
    return reply({ error: "bad-request" }, 400);
  }
  if (typeof body?.baseSha !== "string") return reply({ error: "bad-request" }, 400);
  const baseSha = body.baseSha;

  const checked = validateContent(body.content);
  if (!checked.ok) return reply({ errors: checked.errors }, 422);
  const held = checkHeldImages(body.images);
  if (!held.ok) return reply({ errors: [{ path: "images", message: held.message }] }, 422);

  try {
    const repo = getRepoClient();
    // Read what's on GitHub now, never the browser's copy of it.
    const [file, manifest] = await Promise.all([repo.readFile(CONTENT_PATH), readManifest(repo)]);
    if (file.sha !== baseSha) return reply({ error: "conflict" }, 409);

    const current = JSON.parse(file.text) as SiteContent;
    if (missingImages(current, checked.content, held.images).length) {
      const message = "A picture didn't finish uploading. Choose it again, then publish.";
      return reply({ errors: [{ path: "images", message }] }, 422);
    }

    const built = buildCommit({
      current: { content: current, manifest },
      next: checked.content,
      images: held.images,
    });
    const siteText = toJson(checked.content);
    if (built.files.length === 1 && built.deletes.length === 0 && siteText === file.text.replace(/\r\n/g, "\n")) {
      return reply({ unchanged: true, sha: file.sha });
    }

    const { htmlUrl } = await repo.commit({ ...built, expect: { path: CONTENT_PATH, sha: baseSha } });
    return reply({ commitUrl: htmlUrl, sha: gitBlobSha(siteText), content: checked.content });
  } catch (error) {
    return githubFailure(error);
  }
}
