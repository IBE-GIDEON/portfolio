import manifest from "./projectImages.json";
import { site, type Project } from "./site";

/** A pre-built screenshot (see `npm run images`) and its tiny blurred preview. */
export type ProjectImage = { src: string; blur: string };

const images = manifest as Record<string, ProjectImage>;

export function projectImage(project: Pick<Project, "id" | "image">): ProjectImage | null {
  if (!project.image) return null;
  return images[project.id] ?? { src: project.image, blur: "" };
}

/** Every screenshot the Projects page will show, for preloading. */
export const allProjectImageSrcs: string[] = site.projects.flatMap((p) => (p.image ? [p.image] : []));
