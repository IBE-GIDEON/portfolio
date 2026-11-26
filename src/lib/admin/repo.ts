import { adminConfig } from "./config";
import { createRepoClient, type RepoClient } from "./github";

let testClient: RepoClient | null = null;

/** Tests swap in a pretend repo so they never touch the real one. */
export function setRepoClientForTests(client: RepoClient | null): void {
  testClient = client;
}

export function getRepoClient(): RepoClient {
  if (testClient) return testClient;
  const config = adminConfig();
  if (!config) throw new Error("The admin isn't set up (missing environment variables).");
  return createRepoClient(config);
}
