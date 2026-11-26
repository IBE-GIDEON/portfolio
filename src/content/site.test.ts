import { existsSync } from "node:fs";
import { expect, test } from "vitest";
import projectImages from "@/content/projectImages.json";
import { loadContent } from "@/content/load";
import { activeLinks, site } from "@/content/site";

test("every screenshot is a pre-built WebP on disk with a blur preview", () => {
  for (const p of site.projects) {
    if (!p.image) continue;
    expect(p.image, p.id).toMatch(/\.webp$/);
    expect(existsSync(`public${p.image}`), p.image).toBe(true);
    const entry = (projectImages as Record<string, { blur?: string }>)[p.id];
    expect(entry?.blur, p.id).toMatch(/^data:image\/webp;base64,/);
  }
});

test("only socials with a link are shown", () => {
  expect(activeLinks).toEqual(site.links.filter((l) => l.href !== ""));
  for (const l of activeLinks) expect(l.href).toMatch(/^https:\/\//);
});

test("loading the real content returns it", () => {
  expect(loadContent().name).toBe(site.name);
});

test("loading broken content throws with the field's path", () => {
  const bad = JSON.parse(JSON.stringify(site));
  bad.contact.email = "not-an-email";
  expect(() => loadContent(bad)).toThrow(/contact\.email/);
});
