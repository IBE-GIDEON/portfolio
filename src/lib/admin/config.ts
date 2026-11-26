/**
 * The admin's settings, read from environment variables (set in Vercel →
 * Settings → Environment Variables, or .env.local for local testing).
 * Nothing secret is ever stored in the repo.
 */

export type AdminConfig = {
  password: string;
  secret: string;
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

/** The session secret signs login cookies; shorter values are too easy to guess. */
export const MIN_SECRET_LENGTH = 32;

/** There's no lockout without a database, so the password itself must be long. */
export const MIN_PASSWORD_LENGTH = 16;

/** The admin's settings, or null when it isn't set up yet. */
export function adminConfig(): AdminConfig | null {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  const token = process.env.GITHUB_TOKEN ?? "";
  if (password.length < MIN_PASSWORD_LENGTH || !token || secret.length < MIN_SECRET_LENGTH) return null;

  const [owner, repo] = (process.env.GITHUB_REPO || "IBE-GIDEON/portfolio").split("/");
  if (!owner || !repo) return null;
  return { password, secret, token, owner, repo, branch: process.env.GITHUB_BRANCH || "main" };
}
