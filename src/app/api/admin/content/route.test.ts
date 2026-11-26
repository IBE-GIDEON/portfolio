import { createHash } from "node:crypto";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import manifestData from "@/content/projectImages.json";
import siteData from "@/content/site.json";
import type { CommitInput, RepoClient } from "@/lib/admin/github";
import { ConflictError, GitHubAuthError } from "@/lib/admin/github";
import { setRepoClientForTests } from "@/lib/admin/repo";
import { SESSION_COOKIE, signSession } from "@/lib/admin/session";
import { GET, POST } from "./route";

const SECRET = "k".repeat(48);
const SITE_TEXT = `${JSON.stringify(siteData, null, 2)}\n`;
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBPVP8 fake")]);

/** A pretend repo holding the real content; records commits. */
function fakeRepo(commitError?: Error) {
  const commits: CommitInput[] = [];
  const client: RepoClient = {
    async readFile(path) {
      if (path === "src/content/site.json") return { text: SITE_TEXT, sha: "sha1" };
      if (path === "src/content/projectImages.json") return { text: JSON.stringify(manifestData), sha: "m1" };
      throw new Error(`unexpected read ${path}`);
    },
    async commit(input) {
      if (commitError) throw commitError;
      commits.push(input);
      return { commitSha: "c2", htmlUrl: "https://github.com/o/r/commit/c2" };
    },
  };
  setRepoClientForTests(client);
  return commits;
}

const cookie = () => `${SESSION_COOKIE}=${signSession(Date.now() + 60_000, SECRET)}`;

const request = (method: string, body?: unknown, signedIn = true) =>
  new Request("http://localhost/api/admin/content", {
    method,
    headers: signedIn ? { cookie: cookie() } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const edited = () => {
  const content = JSON.parse(SITE_TEXT);
  content.pitch = "A brand new pitch.";
  return content;
};

beforeEach(() => {
  vi.stubEnv("ADMIN_PASSWORD", "correct horse battery staple");
  vi.stubEnv("ADMIN_SESSION_SECRET", SECRET);
  vi.stubEnv("GITHUB_TOKEN", "github_pat_test");
});

afterEach(() => {
  setRepoClientForTests(null);
  vi.unstubAllEnvs();
});

test("signed out: both reading and publishing are refused", async () => {
  fakeRepo();
  expect((await GET(request("GET", undefined, false))).status).toBe(401);
  expect((await POST(request("POST", { content: edited(), images: [], baseSha: "sha1" }, false))).status).toBe(401);
});

test("loading returns the content, its sha and the image manifest from GitHub", async () => {
  fakeRepo();
  const res = await GET(request("GET"));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.sha).toBe("sha1");
  expect(body.content).toEqual(siteData);
  expect(body.manifest).toEqual(manifestData);
});

test("invalid content is refused with field errors and nothing is committed", async () => {
  const commits = fakeRepo();
  const content = edited();
  content.name = " ";
  const res = await POST(request("POST", { content, images: [], baseSha: "sha1" }));
  expect(res.status).toBe(422);
  const body = await res.json();
  expect(body.errors).toContainEqual(expect.objectContaining({ path: "name" }));
  expect(commits).toEqual([]);
});

test("content loaded before someone else's change is a conflict", async () => {
  const commits = fakeRepo();
  const res = await POST(request("POST", { content: edited(), images: [], baseSha: "old-sha" }));
  expect(res.status).toBe(409);
  expect(await res.json()).toEqual({ error: "conflict" });
  expect(commits).toEqual([]);
});

test("a conflict found while committing is a conflict too", async () => {
  fakeRepo(new ConflictError());
  const res = await POST(request("POST", { content: edited(), images: [], baseSha: "sha1" }));
  expect(res.status).toBe(409);
});

test("a rejected GitHub token is reported as such", async () => {
  fakeRepo(new GitHubAuthError());
  const res = await POST(request("POST", { content: edited(), images: [], baseSha: "sha1" }));
  expect(res.status).toBe(502);
  expect(await res.json()).toEqual({ error: "github-auth" });
});

test("publishing commits site.json and new images, checked against the loaded sha", async () => {
  const commits = fakeRepo();
  const content = edited();
  content.projects[0].image = "/projects/three-ai.abc123.webp";
  const images = [
    {
      path: "/projects/three-ai.abc123.webp",
      webpBase64: WEBP.toString("base64"),
      blur: "data:image/webp;base64,QUJD",
      projectId: "three-ai",
    },
  ];
  const res = await POST(request("POST", { content, images, baseSha: "sha1" }));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.commitUrl).toBe("https://github.com/o/r/commit/c2");

  expect(commits).toHaveLength(1);
  const [commit] = commits;
  expect(commit.expect).toEqual({ path: "src/content/site.json", sha: "sha1" });
  const paths = commit.files.map((f) => f.path);
  expect(paths).toContain("src/content/site.json");
  expect(paths).toContain("public/projects/three-ai.abc123.webp");
  expect(commit.deletes).toContain("public/projects/three-ai.webp");

  // The new sha lets the admin keep editing without reloading.
  const text = String(commit.files.find((f) => f.path === "src/content/site.json")!.content);
  const blob = Buffer.from(text, "utf8");
  const gitSha = createHash("sha1").update(`blob ${blob.length}\0`).update(blob).digest("hex");
  expect(body.sha).toBe(gitSha);
});

test("images with odd paths or that aren't WebP are refused", async () => {
  const commits = fakeRepo();
  const base = { webpBase64: WEBP.toString("base64"), projectId: "three-ai" };
  for (const image of [
    { ...base, path: "/../etc/passwd" },
    { ...base, path: "/projects/three-ai.webp" },
    { ...base, path: "/projects/three-ai.abc123.webp", webpBase64: Buffer.from("<svg/>").toString("base64") },
  ]) {
    const res = await POST(request("POST", { content: edited(), images: [image], baseSha: "sha1" }));
    expect(res.status, image.path).toBe(422);
  }
  expect(commits).toEqual([]);
});

test("publishing with nothing changed makes no commit", async () => {
  const commits = fakeRepo();
  const res = await POST(request("POST", { content: JSON.parse(SITE_TEXT), images: [], baseSha: "sha1" }));
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ unchanged: true, sha: "sha1" });
  expect(commits).toEqual([]);
});

test("a body that isn't JSON is a bad request", async () => {
  fakeRepo();
  const res = await POST(
    new Request("http://localhost/api/admin/content", { method: "POST", headers: { cookie: cookie() }, body: "{oops" }),
  );
  expect(res.status).toBe(400);
});
