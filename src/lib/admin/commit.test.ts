import { expect, test } from "vitest";
import manifestData from "@/content/projectImages.json";
import type { SiteContent } from "@/content/schema";
import siteData from "@/content/site.json";
import { buildCommit, type HeldImage } from "./commit";
import { changedSections } from "./sections";

type Manifest = Record<string, { src: string; blur: string }>;

const content = () => JSON.parse(JSON.stringify(siteData)) as SiteContent;
const manifest = () => JSON.parse(JSON.stringify(manifestData)) as Manifest;
const current = () => ({ content: content(), manifest: manifest() });

const BYTES = Buffer.from("fake-webp-bytes");
const screenshot = (projectId: string, hash = "abc123"): HeldImage => ({
  path: `/projects/${projectId}.${hash}.webp`,
  webpBase64: BYTES.toString("base64"),
  blur: "data:image/webp;base64,BLUR",
  projectId,
});

const fileAt = (files: { path: string; content: string | Buffer }[], path: string) =>
  files.find((f) => f.path === path)?.content;

const manifestIn = (files: { path: string; content: string | Buffer }[]) => {
  const text = fileAt(files, "src/content/projectImages.json");
  return text === undefined ? undefined : (JSON.parse(String(text)) as Manifest);
};

test("a text-only change writes only site.json, formatted like the repo", () => {
  const next = content();
  next.pitch = "New pitch.";
  const out = buildCommit({ current: current(), next, images: [] });
  expect(out.files.map((f) => f.path)).toEqual(["src/content/site.json"]);
  expect(out.files[0].content).toBe(`${JSON.stringify(next, null, 2)}\n`);
  expect(out.deletes).toEqual([]);
  expect(out.message).toBe("Admin: update profile");
});

test("changed sections are named by what was edited", () => {
  const a = content();
  expect(changedSections(a, content())).toEqual([]);
  const priced = content();
  priced.services[0].price = "From $900 / project";
  expect(changedSections(a, priced)).toEqual(["services"]);
  const linked = content();
  linked.links[0].href = "";
  linked.about.headline = "Hi.";
  expect(changedSections(a, linked)).toEqual(["about", "socials"]);
  expect(changedSections(a, content(), [screenshot("hombox")])).toEqual(["projects"]);
  expect(changedSections(a, content(), [{ path: "/me.abc123.webp", webpBase64: "" }])).toEqual(["profile"]);
});

test("a new screenshot is written, added to the manifest, and the old one deleted", () => {
  const next = content();
  const hombox = next.projects.find((p) => p.id === "hombox")!;
  hombox.image = "/projects/hombox.abc123.webp";
  const out = buildCommit({ current: current(), next, images: [screenshot("hombox")] });

  expect(fileAt(out.files, "public/projects/hombox.abc123.webp")).toEqual(BYTES);
  expect(manifestIn(out.files)?.hombox).toEqual({
    src: "/projects/hombox.abc123.webp",
    blur: "data:image/webp;base64,BLUR",
  });
  expect(out.deletes).toEqual(["public/projects/hombox.webp"]);
  expect(out.message).toBe("Admin: update projects");
});

test("a removed project loses its image and its manifest entry", () => {
  const next = content();
  next.projects = next.projects.filter((p) => p.id !== "hombox");
  const out = buildCommit({ current: current(), next, images: [] });
  expect(out.deletes).toEqual(["public/projects/hombox.webp"]);
  const m = manifestIn(out.files);
  expect(m).toBeDefined();
  expect(m).not.toHaveProperty("hombox");
  expect(m).toHaveProperty("three-ai");
});

test("an image another project still uses is never deleted", () => {
  const next = content();
  const founder = next.projects.find((p) => p.id === "founder-roast")!;
  founder.image = "/projects/hombox.webp";
  next.projects = next.projects.filter((p) => p.id !== "hombox");
  const out = buildCommit({ current: current(), next, images: [] });
  expect(out.deletes).not.toContain("public/projects/hombox.webp");
  expect(out.deletes).toContain("public/projects/founder-roast.webp");
  expect(manifestIn(out.files)?.["founder-roast"]?.src).toBe("/projects/hombox.webp");
});

test("a new photo is written and the old photo deleted", () => {
  const before = current();
  before.content.photo = "/me.0ld111.webp";
  const next = content();
  next.photo = "/me.abc123.webp";
  const out = buildCommit({ current: before, next, images: [{ path: "/me.abc123.webp", webpBase64: BYTES.toString("base64") }] });
  expect(fileAt(out.files, "public/me.abc123.webp")).toEqual(BYTES);
  expect(out.deletes).toEqual(["public/me.0ld111.webp"]);
  expect(manifestIn(out.files)).toBeUndefined();
});

test("held images nothing uses are not committed", () => {
  const out = buildCommit({ current: current(), next: content(), images: [screenshot("hombox")] });
  expect(out.files.map((f) => f.path)).toEqual(["src/content/site.json"]);
});

test("files outside the screenshot and photo folders are never deleted", () => {
  const before = current();
  before.content.photo = "/icon.png";
  const out = buildCommit({ current: before, next: content(), images: [] });
  expect(out.deletes).toEqual([]);
});
