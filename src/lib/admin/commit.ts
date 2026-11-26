/**
 * Turns a Publish into the files of one commit: the new site.json, any new
 * images, the updated image manifest, and the old images to delete.
 */
import type { SiteContent } from "@/content/schema";
import { changedSections } from "./sections";

/** An uploaded image, processed but not yet published. `path` is where the site serves it. */
export type HeldImage = {
  path: string;
  webpBase64: string;
  blur?: string;
  /** Set for a project screenshot; absent for the profile photo. */
  projectId?: string;
};

export type Manifest = Record<string, { src: string; blur: string }>;

export type CommitFile = { path: string; content: string | Buffer };

export const CONTENT_PATH = "src/content/site.json";
export const MANIFEST_PATH = "src/content/projectImages.json";

/** Only screenshots and profile photos are ever deleted by the admin. */
const DELETABLE = /^\/(projects\/[\w.-]+|me(\.[\w-]+)?)\.webp$/;

/** How uploads are named: "/projects/<id>.<hash6>.webp" or "/me.<hash6>.webp". */
const HELD_PATH = /^\/(projects\/[a-z0-9-]+|me)\.[a-f0-9]{6}\.webp$/;
const BLUR = /^data:image\/webp;base64,[A-Za-z0-9+/=]{1,4000}$/;
const MAX_HELD_IMAGES = 40;
const MAX_IMAGE_BYTES = 1_500_000;

const isWebp = (bytes: Buffer) =>
  bytes.length > 12 && bytes.toString("latin1", 0, 4) === "RIFF" && bytes.toString("latin1", 8, 12) === "WEBP";

/** Checks the uploads the browser sends back with a publish: names, sizes, and that each is really WebP. */
export function checkHeldImages(input: unknown): { ok: true; images: HeldImage[] } | { ok: false; message: string } {
  if (input === undefined) return { ok: true, images: [] };
  if (!Array.isArray(input) || input.length > MAX_HELD_IMAGES) return { ok: false, message: "Too many images" };
  const images: HeldImage[] = [];
  for (const item of input) {
    const { path, webpBase64, blur, projectId } = (item ?? {}) as Record<string, unknown>;
    if (typeof path !== "string" || !HELD_PATH.test(path)) return { ok: false, message: "An image has an unexpected name" };
    if (typeof webpBase64 !== "string") return { ok: false, message: `${path} has no data` };
    const bytes = Buffer.from(webpBase64, "base64");
    if (bytes.length > MAX_IMAGE_BYTES || !isWebp(bytes)) return { ok: false, message: `${path} isn't a WebP image` };
    if (blur !== undefined && (typeof blur !== "string" || !BLUR.test(blur)))
      return { ok: false, message: `${path} has a bad preview` };
    if (projectId !== undefined && (typeof projectId !== "string" || !/^[a-z0-9-]+$/.test(projectId)))
      return { ok: false, message: `${path} has a bad project id` };
    images.push({ path, webpBase64, ...(blur ? { blur } : {}), ...(projectId ? { projectId } : {}) });
  }
  return { ok: true, images };
}

export const toJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const repoPath = (sitePath: string) => `public${sitePath}`;

function imagesUsed(content: SiteContent): Set<string> {
  const used = new Set<string>();
  for (const p of content.projects) if (p.image) used.add(p.image);
  if (content.photo) used.add(content.photo);
  return used;
}

/**
 * One entry per project with a screenshot, keyed by project id. Existing
 * entries keep their place and new ones go last, so a publish never
 * reshuffles the file.
 */
function nextManifest(current: Manifest, next: SiteContent, held: Map<string, HeldImage>): Manifest {
  const bySrc = new Map(Object.values(current).map((entry) => [entry.src, entry]));
  const wanted = new Map<string, { src: string; blur: string }>();
  for (const p of next.projects) {
    if (!p.image) continue;
    const upload = held.get(p.image);
    const blur = upload?.blur ?? (current[p.id]?.src === p.image ? current[p.id].blur : bySrc.get(p.image)?.blur);
    if (blur) wanted.set(p.id, { src: p.image, blur });
  }
  const order = [...Object.keys(current).filter((id) => wanted.has(id)), ...[...wanted.keys()].filter((id) => !(id in current))];
  return Object.fromEntries(order.map((id) => [id, wanted.get(id)!]));
}

export function buildCommit(args: {
  current: { content: SiteContent; manifest: Manifest };
  next: SiteContent;
  images: HeldImage[];
}): { files: CommitFile[]; deletes: string[]; message: string } {
  const { current, next, images } = args;
  const usedNext = imagesUsed(next);
  const usedNow = imagesUsed(current.content);
  // Only uploads the new content actually uses are published.
  const held = new Map(images.filter((i) => usedNext.has(i.path)).map((i) => [i.path, i]));

  const files: CommitFile[] = [{ path: CONTENT_PATH, content: toJson(next) }];
  for (const image of held.values()) {
    files.push({ path: repoPath(image.path), content: Buffer.from(image.webpBase64, "base64") });
  }

  const manifest = nextManifest(current.manifest, next, held);
  if (toJson(manifest) !== toJson(current.manifest)) files.push({ path: MANIFEST_PATH, content: toJson(manifest) });

  const deletes = [...usedNow]
    .filter((path) => !usedNext.has(path) && DELETABLE.test(path))
    .map(repoPath);

  const sections = changedSections(current.content, next, [...held.values()]);
  const message = `Admin: update ${sections.length ? sections.join(", ") : "content"}`;
  return { files, deletes, message };
}
