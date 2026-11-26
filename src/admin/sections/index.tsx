import type { ComponentType } from "react";
import type { AdminSection } from "@/lib/admin/sections";
import { AboutForm } from "./AboutForm";
import { ContactForm } from "./ContactForm";
import { ProfileForm } from "./ProfileForm";
import { ProjectsForm } from "./ProjectsForm";
import { ServicesForm } from "./ServicesForm";
import { SkillsForm } from "./SkillsForm";
import { SocialsForm } from "./SocialsForm";
import type { FormProps } from "./types";

export const SECTION_FORMS: Record<AdminSection, ComponentType<FormProps>> = {
  profile: ProfileForm,
  about: AboutForm,
  skills: SkillsForm,
  projects: ProjectsForm,
  services: ServicesForm,
  contact: ContactForm,
  socials: SocialsForm,
};
