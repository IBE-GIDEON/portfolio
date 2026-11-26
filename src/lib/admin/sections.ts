/**
 * The admin's sections, and which of them an edit touched. Used for the
 * Publish badge and the commit message. Safe to use in the browser.
 */
import type { SiteContent } from "@/content/schema";
import type { HeldImage } from "./commit";

export type AdminSection = "profile" | "about" | "skills" | "projects" | "services" | "contact" | "socials";

export const ADMIN_SECTIONS: readonly AdminSection[] = [
  "profile",
  "about",
  "skills",
  "projects",
  "services",
  "contact",
  "socials",
];

/** The part of the content each section edits. */
const PICK: Record<AdminSection, (c: SiteContent) => unknown> = {
  profile: (c) => [c.name, c.alias, c.role, c.shortRole, c.pitch, c.location, c.timeZone, c.availability, c.stats, c.photo, c.seo],
  about: (c) => c.about,
  skills: (c) => c.stack,
  projects: (c) => c.projects,
  services: (c) => c.services,
  contact: (c) => c.contact,
  socials: (c) => c.links,
};

export function changedSections(a: SiteContent, b: SiteContent, images: HeldImage[] = []): AdminSection[] {
  return ADMIN_SECTIONS.filter((section) => {
    if (section === "profile" && images.some((i) => !i.projectId)) return true;
    if (section === "projects" && images.some((i) => i.projectId)) return true;
    return JSON.stringify(PICK[section](a)) !== JSON.stringify(PICK[section](b));
  });
}
