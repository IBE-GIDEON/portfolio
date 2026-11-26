import type { ContentError, SiteContent } from "@/content/schema";
import type { HeldImage } from "@/lib/admin/commit";
import type { Draft } from "../useDraft";

export type UploadOutcome = { ok: true; image: HeldImage } | { ok: false; message: string };

/** What every section form gets from the editor. */
export type FormProps = {
  draft: SiteContent;
  setDraft: Draft["setDraft"];
  /** Field errors to show (empty until the first Publish attempt). */
  errors: ContentError[];
  /** Processes a picture and holds it until Publish. */
  upload: (file: File, kind: "project" | "photo", projectId?: string) => Promise<UploadOutcome>;
  /** Where to show a picture from: an unsaved upload's data, or the live site. */
  preview: (path: string | null | undefined) => string | null;
  /** True for a project that hasn't been published yet (its id still follows its name). */
  isNewProject: (id: string) => boolean;
};
