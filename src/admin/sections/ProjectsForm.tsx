"use client";

import { useState } from "react";
import { SECTION_IDS, type Project, type SectionId } from "@/content/schema";
import { errorAt, FormPage, hasErrorsUnder, ImageRow, ListEditor, Row, Segmented, SelectRow, TagsRow, TextAreaRow, TextRow } from "../fields";
import { slugify, uniqueId } from "../slugify";
import { setProjectImage } from "../useDraft";
import type { FormProps } from "./types";

const STATUS = [
  { value: "building", label: "In development" },
  { value: "shipped", label: "Shipped" },
] as const;

const KIND = [
  { value: "products", label: "Product" },
  { value: "client", label: "Client work" },
] as const;

const OPENS: { value: SectionId; label: string }[] = SECTION_IDS.map((id) => ({
  value: id,
  label: `${id[0].toUpperCase()}${id.slice(1)} page`,
}));

function Screenshot({ project, upload, preview, setDraft, update, error }: {
  project: Project;
  upload: FormProps["upload"];
  setDraft: FormProps["setDraft"];
  preview: FormProps["preview"];
  update: (fn: (p: Project) => void) => void;
  error?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  return (
    <ImageRow
      label="Screenshot"
      aspect="16/10"
      src={preview(project.image)}
      busy={busy}
      error={uploadError ?? error}
      hint="A full-width shot of the homepage. It's cropped to 16:10 from the top."
      onRemove={() => update((p) => void delete p.image)}
      onPick={async (file) => {
        const projectId = project.id;
        setBusy(true);
        setUploadError(undefined);
        const result = await upload(file, "project", projectId);
        setBusy(false);
        if (!result.ok) return setUploadError(result.message);
        // Apply to the draft as it is now, so edits made during the upload are kept
        // (if the project was removed meanwhile, the picture is simply not used).
        setDraft((d) => void setProjectImage(d, projectId, result.image.path));
      }}
    />
  );
}

export function ProjectsForm({ draft, setDraft, errors, upload, preview, isNewProject }: FormProps) {
  const err = (path: string) => errorAt(errors, path);
  const ids = draft.projects.map((p) => p.id);

  return (
    <FormPage title="Projects" description="Click a project to edit it. The order here is the order on the site.">
      <ListEditor
        expandable
        items={draft.projects}
        onChange={(projects) => setDraft((d) => void (d.projects = projects))}
        newItem={(): Project => ({
          id: uniqueId("new-project", ids),
          name: "New project",
          group: "products",
          category: "",
          status: "building",
          description: "",
          stack: [],
          action: { label: "View", href: "" },
        })}
        itemLabel={(p) => p.name}
        itemMeta={(p) => (p.status === "building" ? "In development" : "Shipped")}
        invalidAt={(i) => hasErrorsUnder(errors, `projects.${i}`)}
        addLabel="Add a project"
        render={(p, update, i) => {
          const at = (field: string) => err(`projects.${i}.${field}`);
          return (
            <div className="divide-y divide-white/[0.06]">
              <TextRow
                label="Name"
                value={p.name}
                error={at("name") ?? at("id")}
                onChange={(v) =>
                  update((x) => {
                    x.name = v;
                    // Until it's published, a project's id (and screenshot file name) follows its name.
                    if (isNewProject(p.id)) x.id = uniqueId(slugify(v), ids.filter((id) => id !== p.id));
                  })
                }
              />
              <TextRow label="Category" value={p.category} onChange={(v) => update((x) => void (x.category = v))} error={at("category")} placeholder="e.g. Fintech" />
              <SelectRow label="Status" value={p.status} options={STATUS} onChange={(v) => update((x) => void (x.status = v))} />
              <SelectRow label="Kind" value={p.group} options={KIND} onChange={(v) => update((x) => void (x.group = v))} />
              <TextAreaRow label="Description" rows={3} value={p.description} onChange={(v) => update((x) => void (x.description = v))} error={at("description")} />
              <TagsRow
                label="Built with"
                items={p.stack}
                onChange={(stack) => update((x) => void (x.stack = stack))}
                error={errors.find((e) => e.path.startsWith(`projects.${i}.stack`))?.message}
              />
              <Row label="Button">
                <Segmented
                  label="What the button does"
                  value={p.action.label}
                  options={[
                    { value: "View", label: "Live link" },
                    { value: "Inquire", label: "Inquire" },
                  ]}
                  onChange={(label) =>
                    update((x) => {
                      x.action = label === "View" ? { label: "View", href: "" } : { label: "Inquire", opens: "contact" };
                    })
                  }
                />
              </Row>
              {p.action.label === "View" ? (
                <TextRow
                  label="Link"
                  type="url"
                  placeholder="https://"
                  value={p.action.href}
                  onChange={(v) => update((x) => void (x.action = { label: "View", href: v }))}
                  error={at("action.href")}
                />
              ) : (
                <SelectRow
                  label="Opens"
                  value={p.action.opens}
                  options={OPENS}
                  onChange={(v) => update((x) => void (x.action = { label: "Inquire", opens: v }))}
                />
              )}
              <Screenshot project={p} upload={upload} preview={preview} setDraft={setDraft} update={update} error={at("image")} />
            </div>
          );
        }}
      />
    </FormPage>
  );
}
