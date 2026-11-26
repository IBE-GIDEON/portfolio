/**
 * The site's content. The words live in site.json (edited from /admin) and
 * the rules in schema.ts; the root layout checks the file at build time
 * (see load.ts), so here it's only typed for the components.
 */
import type { SiteContent } from "./schema";
import data from "./site.json";

export type {
  ExternalLink,
  Project,
  ProjectGroupId,
  ProjectStatus,
  SectionId,
  Service,
  SiteContent,
} from "./schema";

export const site = data as SiteContent;

/** Socials that have a link — the ones the site actually shows. */
export const activeLinks = site.links.filter((l) => l.href !== "");
