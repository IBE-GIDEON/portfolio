import { expect, test } from "vitest";
import { ConflictError, createRepoClient, GitHubAuthError } from "./github";

type Call = { method: string; path: string; body?: Record<string, unknown> };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** A pretend GitHub that records every request. */
function fakeGitHub(options: { patchStatuses?: number[]; status?: number } = {}) {
  const calls: Call[] = [];
  const patchStatuses = [...(options.patchStatuses ?? [200])];
  let blobs = 0;
  const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path: url.pathname + url.search, body });
    if (options.status) return json(options.status, { message: "Bad credentials" });

    const p = url.pathname.replace("/repos/o/r", "");
    if (method === "GET" && p === "/contents/src/content/site.json")
      return json(200, { sha: "site1", encoding: "base64", content: Buffer.from('{"a":1}\n').toString("base64") });
    if (method === "GET" && p === "/git/ref/heads/main") return json(200, { object: { sha: "head1" } });
    if (method === "GET" && p === "/git/commits/head1") return json(200, { tree: { sha: "tree1" } });
    if (method === "GET" && p === "/git/trees/tree1")
      return json(200, {
        truncated: false,
        tree: [
          { path: "src/content/site.json", type: "blob", sha: "site1" },
          { path: "public/projects/old.webp", type: "blob", sha: "img1" },
        ],
      });
    if (method === "POST" && p === "/git/blobs") return json(201, { sha: `blob${++blobs}` });
    if (method === "POST" && p === "/git/trees") return json(201, { sha: "tree2" });
    if (method === "POST" && p === "/git/commits")
      return json(201, { sha: "commit2", html_url: "https://github.com/o/r/commit/commit2" });
    if (method === "PATCH" && p === "/git/refs/heads/main") return json(patchStatuses.shift() ?? 200, {});
    return json(404, { message: "Not Found" });
  };
  const client = createRepoClient({ token: "t", owner: "o", repo: "r", branch: "main" }, fetchImpl as typeof fetch);
  const writes = () => calls.filter((c) => c.method !== "GET");
  return { client, calls, writes };
}

const input = () => ({
  message: "Admin: update profile",
  files: [
    { path: "src/content/site.json", content: "{}\n" },
    { path: "public/projects/new.webp", content: Buffer.from("img") },
  ],
  deletes: ["public/projects/old.webp", "public/projects/never-existed.webp"],
  expect: { path: "src/content/site.json", sha: "site1" },
});

test("reads a file from the branch with its sha", async () => {
  const { client, calls } = fakeGitHub();
  expect(await client.readFile("src/content/site.json")).toEqual({ text: '{"a":1}\n', sha: "site1" });
  expect(calls[0].path).toBe("/repos/o/r/contents/src/content/site.json?ref=main");
});

test("a commit goes ref → blobs → tree → commit → move the branch", async () => {
  const { client, calls, writes } = fakeGitHub();
  expect(await client.commit(input())).toEqual({
    commitSha: "commit2",
    htmlUrl: "https://github.com/o/r/commit/commit2",
  });
  expect(calls[0].path).toBe("/repos/o/r/git/ref/heads/main");
  expect(writes().map((c) => `${c.method} ${c.path.replace("/repos/o/r", "")}`)).toEqual([
    "POST /git/blobs",
    "POST /git/blobs",
    "POST /git/trees",
    "POST /git/commits",
    "PATCH /git/refs/heads/main",
  ]);
  const [blob1] = writes();
  expect(blob1.body).toEqual({ content: Buffer.from("{}\n").toString("base64"), encoding: "base64" });

  const tree = writes()[2].body!;
  expect(tree.base_tree).toBe("tree1");
  expect(tree.tree).toEqual([
    { path: "src/content/site.json", mode: "100644", type: "blob", sha: "blob1" },
    { path: "public/projects/new.webp", mode: "100644", type: "blob", sha: "blob2" },
    // Only files that exist are deleted; GitHub rejects deleting a missing path.
    { path: "public/projects/old.webp", mode: "100644", type: "blob", sha: null },
  ]);
  expect(writes()[3].body).toEqual({ message: "Admin: update profile", tree: "tree2", parents: ["head1"] });
  expect(writes()[4].body).toEqual({ sha: "commit2", force: false });
});

test("if site.json changed since it was loaded, nothing is written", async () => {
  const { client, writes } = fakeGitHub();
  await expect(client.commit({ ...input(), expect: { path: "src/content/site.json", sha: "older" } })).rejects.toBeInstanceOf(
    ConflictError,
  );
  expect(writes()).toEqual([]);
});

test("a branch that moved during the commit is retried once", async () => {
  const { client, writes } = fakeGitHub({ patchStatuses: [422, 200] });
  expect((await client.commit(input())).commitSha).toBe("commit2");
  expect(writes().filter((c) => c.method === "PATCH")).toHaveLength(2);
});

test("a branch that keeps moving is a conflict", async () => {
  const { client, writes } = fakeGitHub({ patchStatuses: [422, 422] });
  await expect(client.commit(input())).rejects.toBeInstanceOf(ConflictError);
  expect(writes().filter((c) => c.method === "PATCH")).toHaveLength(2);
});

test("a rejected token is an auth error", async () => {
  await expect(fakeGitHub({ status: 401 }).client.readFile("src/content/site.json")).rejects.toBeInstanceOf(
    GitHubAuthError,
  );
  await expect(fakeGitHub({ status: 403 }).client.commit(input())).rejects.toBeInstanceOf(GitHubAuthError);
});
