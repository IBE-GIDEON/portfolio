import { existsSync } from "node:fs";
import { expect, test } from "vitest";
import projectImages from "@/content/projectImages.json";
import { activeLinks, site } from "@/content/site";

test("services keep the published prices", () => {
  expect(site.services.map((s) => s.price)).toEqual([
    "From $800 / project",
    "From $500 / integration",
    "From $1,200 / MVP",
    "$60 / hour",
  ]);
});

test("projects and their actions", () => {
  expect(site.projects.map((p) => p.id)).toEqual([
    "three-ai", "hombox", "founder-roast", "ibe-pay", "lancer", "ledgerpilot", "preve", "codarc", "neva",
    "trend-stack", "vizstats", "vizstats-mining", "showtiva", "hilton-clinics", "boomtown", "racecraft-sim",
    "leonardo", "braids-at-reens", "afunwa", "blessed-hairs", "elegance-stitches", "artisans-hub", "ai-integrations",
  ]);
  // Every screenshot is a pre-built WebP on disk with a blur preview ready.
  for (const p of site.projects) {
    if (!p.image) continue;
    expect(p.image, p.id).toMatch(/^\/projects\/.+\.webp$/);
    expect(existsSync(`public${p.image}`), p.image).toBe(true);
    expect(projectImages[p.id as keyof typeof projectImages]?.blur, p.id).toMatch(/^data:image\/webp;base64,/);
  }
  expect(site.projects.at(-1)?.action).toEqual({ label: "Inquire", opens: "contact" });
  // Every live project has a homepage screenshot.
  for (const p of site.projects) if ("href" in p.action) expect(p.image).toBeTruthy();
});

test("contact and links", () => {
  expect(site.contact.email).toBe("shytersnicks@gmail.com");
  expect(site.links.map((l) => l.id)).toEqual(["github", "linkedin", "x", "facebook", "instagram", "whatsapp"]);
  // Only socials with a link are shown; the rest wait for Gideon's links.
  expect(activeLinks.map((l) => l.href)).toEqual([
    "https://github.com/IBE-GIDEON",
    "https://www.linkedin.com/in/gideon-chinemerem-3037a43a3/",
    "https://x.com/Tech_zealot",
    "https://www.facebook.com/profile.php?id=61595181771699",
    "https://www.instagram.com/codarc_ceo/",
    "https://wa.me/2349078390089",
  ]);
  for (const l of activeLinks) expect(l.href).toMatch(/^https:\/\//);
  for (const p of site.projects) {
    if ("href" in p.action) expect(p.action.href).toMatch(/^https:\/\//);
  }
});
