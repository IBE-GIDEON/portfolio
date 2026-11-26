/**
 * The shape and rules of the site's content (src/content/site.json).
 * The site, the tests and the admin all check content against this one schema.
 */
import { z } from "zod";

export const SECTION_IDS = ["overview", "projects", "services", "about", "contact"] as const;
export const LINK_IDS = ["github", "linkedin", "x", "facebook", "instagram", "whatsapp"] as const;

/** Length limits: names, one-line text, and paragraphs. */
export const LIMITS = { name: 80, line: 160, paragraph: 1200 } as const;

const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "This can't be empty")
    .max(max, `Keep this under ${max} characters`);

const name = text(LIMITS.name);
const line = text(LIMITS.line);
const paragraph = text(LIMITS.paragraph);

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.includes(".");
  } catch {
    return false;
  }
}

const HTTPS_MESSAGE = "Use a full link that starts with https://";

const httpsUrl = z.string().trim().max(500).refine(isHttpsUrl, HTTPS_MESSAGE);

/** A file served from /public, e.g. "/projects/three-ai.webp". */
const publicPath = z
  .string()
  .trim()
  .regex(/^\/(?!.*\.\.)[\w./-]+$/, "Must be a path to a file on the site, like /projects/name.webp");

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Reports a duplicate `id` in a list on the list itself. */
function uniqueIds(label: string) {
  return (items: { id: string }[], ctx: z.RefinementCtx) => {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.id)) {
        ctx.addIssue({ code: "custom", message: `Two ${label} share the id "${item.id}"` });
        return;
      }
      seen.add(item.id);
    }
  };
}

const projectSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only")
    .max(LIMITS.name),
  name,
  group: z.enum(["products", "client"]),
  category: line,
  image: publicPath.optional(),
  status: z.enum(["building", "shipped"]),
  description: paragraph,
  stack: z.array(line).max(30),
  action: z.discriminatedUnion("label", [
    z.object({ label: z.literal("View"), href: httpsUrl }),
    z.object({ label: z.literal("Inquire"), opens: z.enum(SECTION_IDS) }),
  ]),
});

const serviceSchema = z.object({
  title: name,
  description: paragraph,
  price: line,
});

const linkSchema = z.object({
  id: z.enum(LINK_IDS),
  label: name,
  href: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || isHttpsUrl(v), HTTPS_MESSAGE),
});

export const contentSchema = z.object({
  name,
  alias: name,
  photo: publicPath.nullable(),
  role: line,
  shortRole: line,
  pitch: paragraph,
  location: line,
  timeZone: z.string().trim().refine(isTimeZone, "Not a known time zone, e.g. Africa/Lagos"),
  availability: line,
  seo: z.object({ title: line, description: paragraph }),
  stats: z.array(z.object({ value: name, label: line })).max(12),
  about: z.object({
    facts: z.array(z.object({ label: name, value: line })).max(20),
    headline: line,
    paragraphs: z.array(paragraph).max(12),
  }),
  stack: z.array(z.object({ group: name, items: z.array(line).max(40) })).max(12),
  projects: z.array(projectSchema).max(100).superRefine(uniqueIds("projects")),
  services: z.array(serviceSchema).max(20),
  contact: z.object({
    headline: line,
    body: paragraph,
    responseTime: line,
    email: z.string().trim().pipe(z.email("Enter a valid email address")),
  }),
  links: z.array(linkSchema).max(LINK_IDS.length).superRefine(uniqueIds("links")),
});

export type SiteContent = z.infer<typeof contentSchema>;
export type Project = SiteContent["projects"][number];
export type Service = SiteContent["services"][number];
export type ExternalLink = SiteContent["links"][number];
export type SectionId = (typeof SECTION_IDS)[number];
export type ProjectStatus = Project["status"];
export type ProjectGroupId = Project["group"];

export type ContentError = { path: string; message: string };

export type ValidationResult =
  | { ok: true; content: SiteContent }
  | { ok: false; errors: ContentError[] };

/** Checks content against the schema; errors carry dotted paths like "projects.2.action.href". */
export function validateContent(input: unknown): ValidationResult {
  const result = contentSchema.safeParse(input);
  if (result.success) return { ok: true, content: result.data };
  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    })),
  };
}
