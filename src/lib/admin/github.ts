/**
 * The only code that talks to GitHub. Publishing is one commit made with
 * the Git Data API (blobs → tree → commit → move the branch), so content
 * and images always change together.
 */

/** The file changed on GitHub since the admin loaded it, or the branch kept moving. */
export class ConflictError extends Error {
  constructor(message = "The site changed since you opened it.") {
    super(message);
    this.name = "ConflictError";
  }
}

/** GitHub rejected the token (expired, revoked, or without access to the repo). */
export class GitHubAuthError extends Error {
  constructor(message = "GitHub rejected the access token.") {
    super(message);
    this.name = "GitHubAuthError";
  }
}

/** Any other unexpected answer from GitHub. */
export class GitHubError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export type RepoConfig = { token: string; owner: string; repo: string; branch: string };

export type CommitInput = {
  message: string;
  files: { path: string; content: string | Buffer }[];
  deletes: string[];
  /** Refuse to commit unless this file is still at this blob sha on the branch. */
  expect?: { path: string; sha: string };
};

export type RepoClient = {
  readFile(path: string): Promise<{ text: string; sha: string }>;
  commit(input: CommitInput): Promise<{ commitSha: string; htmlUrl: string }>;
};

type TreeEntry = { path: string; type: string; sha: string };

/** The branch moved between reading it and updating it. */
class BranchMoved extends Error {}

const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

export function createRepoClient(cfg: RepoConfig, fetchImpl: typeof fetch = fetch): RepoClient {
  const base = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`;
  const branch = encodePath(cfg.branch);

  async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetchImpl(`${base}${path}`, {
      method,
      cache: "no-store",
      headers: {
        authorization: `Bearer ${cfg.token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "portfolio-admin",
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401 || res.status === 403) throw new GitHubAuthError();
    if (method === "PATCH" && res.status === 422) throw new BranchMoved();
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      throw new GitHubError(res.status, `GitHub answered ${res.status} for ${method} ${path}: ${detail?.message ?? "no details"}`);
    }
    return (await res.json()) as T;
  }

  async function attempt(input: CommitInput) {
    const head = await api<{ object: { sha: string } }>("GET", `/git/ref/heads/${branch}`);
    const headSha = head.object.sha;
    const { tree } = await api<{ tree: { sha: string } }>("GET", `/git/commits/${headSha}`);

    let existing: Map<string, string> | null = null;
    if (input.expect || input.deletes.length) {
      const listing = await api<{ truncated: boolean; tree: TreeEntry[] }>("GET", `/git/trees/${tree.sha}?recursive=1`);
      if (!listing.truncated) existing = new Map(listing.tree.filter((e) => e.type === "blob").map((e) => [e.path, e.sha]));
    }
    if (input.expect) {
      const sha = existing?.get(input.expect.path);
      if (sha !== input.expect.sha) throw new ConflictError();
    }

    const entries: { path: string; mode: "100644"; type: "blob"; sha: string | null }[] = [];
    for (const file of input.files) {
      const content = typeof file.content === "string" ? Buffer.from(file.content, "utf8") : file.content;
      const blob = await api<{ sha: string }>("POST", "/git/blobs", { content: content.toString("base64"), encoding: "base64" });
      entries.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
    }
    for (const path of input.deletes) {
      // Deleting a path that isn't there makes GitHub reject the whole tree.
      if (existing && !existing.has(path)) continue;
      entries.push({ path, mode: "100644", type: "blob", sha: null });
    }

    const newTree = await api<{ sha: string }>("POST", "/git/trees", { base_tree: tree.sha, tree: entries });
    const commit = await api<{ sha: string; html_url: string }>("POST", "/git/commits", {
      message: input.message,
      tree: newTree.sha,
      parents: [headSha],
    });
    await api("PATCH", `/git/refs/heads/${branch}`, { sha: commit.sha, force: false });
    return { commitSha: commit.sha, htmlUrl: commit.html_url };
  }

  return {
    async readFile(path) {
      const file = await api<{ content: string; sha: string; encoding: string }>(
        "GET",
        `/contents/${encodePath(path)}?ref=${branch}`,
      );
      return { text: Buffer.from(file.content, "base64").toString("utf8"), sha: file.sha };
    },

    async commit(input) {
      for (let tries = 0; tries < 2; tries++) {
        try {
          return await attempt(input);
        } catch (error) {
          if (!(error instanceof BranchMoved)) throw error;
        }
      }
      throw new ConflictError("The site kept changing while publishing. Try again in a moment.");
    },
  };
}
