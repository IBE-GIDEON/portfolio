"use client";

import { site } from "@/content/site";
import type { SectionProps } from "@/shell/nav";
import { ProjectCard } from "@/ui/ProjectCard";
import { Page } from "./Page";

/** Just the projects: one card each, no filters. */
export function Projects({ openProject }: SectionProps) {
  return (
    <Page title="Projects">
      <div className="mt-2 grid grid-cols-1 gap-5 md:mt-6 md:[grid-template-columns:repeat(auto-fill,minmax(400px,1fr))]">
        {site.projects.map((p) => (
          <ProjectCard key={p.id} project={p} onOpen={() => openProject(p.id)} />
        ))}
      </div>
    </Page>
  );
}
