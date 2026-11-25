import type { SectionId } from "@/content/site";

export const SECTION_TITLES: Record<SectionId, string> = {
  overview: "Overview",
  projects: "Projects",
  services: "Services",
  about: "About",
  contact: "Contact",
};

export const SECTION_ORDER: SectionId[] = ["overview", "projects", "services", "about", "contact"];

/** What every page gets to move around the app. */
export type SectionProps = {
  go: (id: SectionId) => void;
  openProject: (id: string) => void;
};
