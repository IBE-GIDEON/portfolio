import { expect, test } from "vitest";
import siteData from "@/content/site.json";
import type { SiteContent } from "@/content/schema";
import type { HeldImage } from "@/lib/admin/commit";
import { holdImage, setProjectImage, unsentImages } from "./useDraft";

const shot = (projectId: string, hash: string): HeldImage => ({ path: `/projects/${projectId}.${hash}.webp`, webpBase64: "", projectId });
const photo = (hash: string): HeldImage => ({ path: `/me.${hash}.webp`, webpBase64: "" });

test("a newer upload for the same project replaces the older one", () => {
  expect(holdImage([shot("a", "111111")], shot("a", "222222"))).toEqual([shot("a", "222222")]);
});

test("a project called 'photo' and the profile photo are held separately", () => {
  const held = holdImage(holdImage([], shot("photo", "111111")), photo("222222"));
  expect(held).toEqual([shot("photo", "111111"), photo("222222")]);
});

test("after publishing, uploads that weren't sent stay held", () => {
  const sent = [shot("a", "111111")];
  const later = shot("b", "222222");
  expect(unsentImages([...sent, later], sent)).toEqual([later]);
});

test("an upload's picture goes onto the current version of its project", () => {
  const draft = JSON.parse(JSON.stringify(siteData)) as SiteContent;
  draft.projects[0].description = "Edited while the picture was uploading.";
  draft.projects.splice(2, 1);
  expect(setProjectImage(draft, "three-ai", "/projects/three-ai.abc123.webp")).toBe(true);
  expect(draft.projects[0].image).toBe("/projects/three-ai.abc123.webp");
  expect(draft.projects[0].description).toBe("Edited while the picture was uploading.");
  expect(setProjectImage(draft, "gone", "/projects/gone.abc123.webp")).toBe(false);
});
