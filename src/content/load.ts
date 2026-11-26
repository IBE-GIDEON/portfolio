/**
 * Server-side check of the content. The root layout calls this while the
 * site is built, so a broken site.json fails the build instead of going live.
 * (Kept apart from site.ts so the schema library never ships to browsers.)
 */
import { validateContent, type SiteContent } from "./schema";
import data from "./site.json";

export function loadContent(input: unknown = data): SiteContent {
  const result = validateContent(input);
  if (result.ok) return result.content;
  const lines = result.errors.map((e) => `  ${e.path || "(root)"}: ${e.message}`);
  throw new Error(`src/content/site.json is invalid:\n${lines.join("\n")}`);
}
