import type { ComponentType } from "react";
import type { AdminSection } from "@/lib/admin/sections";
import { FormPage } from "../fields";
import type { FormProps } from "./types";

/** Placeholder until each section's form exists. */
function Pending({ title }: { title: string }) {
  return <FormPage title={title} description="This section's form is coming next." />;
}

export const SECTION_FORMS: Record<AdminSection, ComponentType<FormProps>> = {
  profile: () => <Pending title="Profile" />,
  about: () => <Pending title="About" />,
  skills: () => <Pending title="Skills" />,
  projects: () => <Pending title="Projects" />,
  services: () => <Pending title="Services" />,
  contact: () => <Pending title="Contact" />,
  socials: () => <Pending title="Socials" />,
};
