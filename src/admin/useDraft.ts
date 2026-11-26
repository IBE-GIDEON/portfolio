"use client";

import { useCallback, useMemo, useState } from "react";
import { validateContent, type ContentError, type SiteContent } from "@/content/schema";
import type { HeldImage, Manifest } from "@/lib/admin/commit";
import { changedSections, type AdminSection } from "@/lib/admin/sections";
import { publishContent, type Loaded } from "./api";

export type PublishOutcome =
  | { kind: "ok"; commitUrl: string | null; sha: string; content?: SiteContent }
  | { kind: "invalid"; errors: ContentError[] }
  | { kind: "conflict" }
  | { kind: "signed-out" }
  | { kind: "github-auth" }
  | { kind: "error"; message: string };

/** Reads the publish route's answer. */
export function publishOutcome(status: number, body: unknown): PublishOutcome {
  const b = (body ?? {}) as {
    commitUrl?: string;
    sha?: string;
    content?: SiteContent;
    errors?: ContentError[];
    error?: string;
    message?: string;
  };
  if (status === 200 && typeof b.sha === "string") {
    return { kind: "ok", commitUrl: b.commitUrl ?? null, sha: b.sha, ...(b.content ? { content: b.content } : {}) };
  }
  if (status === 422) return { kind: "invalid", errors: b.errors ?? [] };
  if (status === 409) return { kind: "conflict" };
  if (status === 401) return { kind: "signed-out" };
  if (b.error === "github-auth") return { kind: "github-auth" };
  return { kind: "error", message: b.message ?? `Something went wrong (error ${status}). Try again.` };
}

/** One held picture per project, plus the profile photo; a newer upload replaces the older one. */
export function holdImage(images: HeldImage[], image: HeldImage): HeldImage[] {
  const slot = (i: HeldImage) => (i.projectId ? `project:${i.projectId}` : "photo");
  return [...images.filter((i) => slot(i) !== slot(image)), image];
}

/** After a publish: keep the uploads that weren't part of it (e.g. one that finished meanwhile). */
export function unsentImages(images: HeldImage[], sent: HeldImage[]): HeldImage[] {
  const paths = new Set(sent.map((i) => i.path));
  return images.filter((i) => !paths.has(i.path));
}

/** Puts an uploaded screenshot on the current version of its project; false if the project is gone. */
export function setProjectImage(draft: SiteContent, projectId: string, path: string): boolean {
  const project = draft.projects.find((p) => p.id === projectId);
  if (project) project.image = path;
  return Boolean(project);
}

/** Which uploads the draft still uses (a replaced or removed picture is dropped). */
function usedImages(draft: SiteContent, images: HeldImage[]): HeldImage[] {
  const used = new Set([draft.photo, ...draft.projects.map((p) => p.image)]);
  return images.filter((image) => used.has(image.path));
}

/**
 * The unsaved edits: the draft content, uploads held until Publish, and
 * which sections changed since the last load or publish.
 */
export function useDraft(loaded: Loaded) {
  const [base, setBase] = useState<{ content: SiteContent; sha: string; manifest: Manifest }>(loaded);
  const [draft, setDraftState] = useState<SiteContent>(loaded.content);
  const [images, setImages] = useState<HeldImage[]>([]);
  /** Edit a copy of the draft: `fn` may change it in place or return a new one. */
  const setDraft = useCallback((fn: (draft: SiteContent) => SiteContent | void) => {
    setDraftState((current) => {
      const copy = structuredClone(current);
      return fn(copy) ?? copy;
    });
  }, []);

  /** Holds an upload; a newer picture for the same project (or the photo) replaces the older one. */
  const addImage = useCallback((image: HeldImage) => {
    setImages((current) => holdImage(current, image));
  }, []);

  const held = useMemo(() => usedImages(draft, images), [draft, images]);
  const changed: AdminSection[] = useMemo(() => changedSections(base.content, draft, held), [base.content, draft, held]);
  const errors = useMemo(() => {
    const result = validateContent(draft);
    return result.ok ? [] : result.errors;
  }, [draft]);

  const discard = useCallback(() => {
    setDraftState(base.content);
    setImages([]);
  }, [base.content]);

  const publish = useCallback(async (): Promise<PublishOutcome> => {
    const sent = draft;
    const checked = validateContent(sent);
    if (!checked.ok) return { kind: "invalid", errors: checked.errors };

    const { status, body } = await publishContent({ content: checked.content, images: held, baseSha: base.sha });
    const outcome = publishOutcome(status, body);
    if (outcome.kind === "ok") {
      const published = outcome.content ?? checked.content;
      setBase((current) => ({ ...current, content: published, sha: outcome.sha }));
      // Keep anything typed while publishing; otherwise take the tidied, published copy.
      setDraftState((current) => (current === sent ? published : current));
      setImages((current) => unsentImages(current, held));
    }
    return outcome;
  }, [base.sha, held, draft]);

  return { draft, setDraft, images: held, addImage, changed, errors, discard, publish, base };
}

export type Draft = ReturnType<typeof useDraft>;
