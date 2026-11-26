"use client";

import { useMemo, useState } from "react";
import { errorAt, FormPage, Group, ImageRow, ListEditor, TextAreaRow, TextRow } from "../fields";
import type { FormProps } from "./types";

export function ProfileForm({ draft, setDraft, errors, upload, preview }: FormProps) {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const zones = useMemo(() => (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []), []);
  const err = (path: string) => errorAt(errors, path);

  async function pickPhoto(file: File) {
    setBusy(true);
    setUploadError(undefined);
    const result = await upload(file, "photo");
    setBusy(false);
    if (result.ok) setDraft((d) => void (d.photo = result.image.path));
    else setUploadError(result.message);
  }

  return (
    <FormPage title="Profile" description="Who you are, as it shows across the site.">
      <Group title="Photo">
        <ImageRow
          label="Profile photo"
          aspect="1/1"
          src={preview(draft.photo)}
          busy={busy}
          error={uploadError ?? err("photo")}
          onPick={pickPhoto}
          onRemove={() => setDraft((d) => void (d.photo = null))}
          hint="JPG, PNG or WebP up to 4 MB. It's cropped square around your face. Without one, your initials show."
        />
      </Group>

      <Group title="Name">
        <TextRow label="Name" value={draft.name} onChange={(v) => setDraft((d) => void (d.name = v))} error={err("name")} hint="The first word is the name in the sidebar." />
        <TextRow label="Alias" value={draft.alias} onChange={(v) => setDraft((d) => void (d.alias = v))} error={err("alias")} hint="The intro types this in capitals." />
      </Group>

      <Group title="What you do">
        <TextRow label="Role" value={draft.role} onChange={(v) => setDraft((d) => void (d.role = v))} error={err("role")} />
        <TextRow
          label="Short role"
          value={draft.shortRole}
          onChange={(v) => setDraft((d) => void (d.shortRole = v))}
          error={err("shortRole")}
          hint="Under your name in the sidebar menu."
        />
        <TextAreaRow label="Pitch" rows={3} value={draft.pitch} onChange={(v) => setDraft((d) => void (d.pitch = v))} error={err("pitch")} />
        <TextRow
          label="Availability"
          value={draft.availability}
          onChange={(v) => setDraft((d) => void (d.availability = v))}
          error={err("availability")}
          hint="Shown as your status."
        />
      </Group>

      <Group title="Where you are">
        <TextRow label="Location" value={draft.location} onChange={(v) => setDraft((d) => void (d.location = v))} error={err("location")} />
        <TextRow
          label="Time zone"
          value={draft.timeZone}
          list="admin-time-zones"
          onChange={(v) => setDraft((d) => void (d.timeZone = v))}
          error={err("timeZone")}
          hint="For the local time on your profile, e.g. Africa/Lagos."
        />
        <datalist id="admin-time-zones">
          {zones.map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>
      </Group>

      <section>
        <h3 className="mb-2 px-1 text-[13px] font-semibold text-white/90">Numbers</h3>
        <ListEditor
          items={draft.stats}
          onChange={(stats) => setDraft((d) => void (d.stats = stats))}
          newItem={() => ({ value: "", label: "" })}
          itemLabel={(s) => [s.value, s.label].filter(Boolean).join(" ")}
          addLabel="Add a number"
          render={(s, update, i) => (
            <div className="divide-y divide-white/[0.06]">
              <TextRow label="Number" value={s.value} onChange={(v) => update((x) => void (x.value = v))} error={err(`stats.${i}.value`)} />
              <TextRow label="Label" value={s.label} onChange={(v) => update((x) => void (x.label = v))} error={err(`stats.${i}.label`)} />
            </div>
          )}
        />
        <p className="mt-2 px-1 text-[12px] leading-relaxed text-muted">
          Your profile shows the number whose label contains “self-taught” as Experience, and the one containing “years old” as Age.
        </p>
      </section>

      <Group title="Search and browser tab" footer="What Google and the browser tab show for your site.">
        <TextRow label="Title" value={draft.seo.title} onChange={(v) => setDraft((d) => void (d.seo.title = v))} error={err("seo.title")} />
        <TextAreaRow
          label="Description"
          rows={2}
          value={draft.seo.description}
          onChange={(v) => setDraft((d) => void (d.seo.description = v))}
          error={err("seo.description")}
        />
      </Group>
    </FormPage>
  );
}
