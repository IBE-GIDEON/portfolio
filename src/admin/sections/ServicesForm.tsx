"use client";

import { errorAt, FormPage, hasErrorsUnder, ListEditor, TextAreaRow, TextRow } from "../fields";
import type { FormProps } from "./types";

export function ServicesForm({ draft, setDraft, errors }: FormProps) {
  const err = (path: string) => errorAt(errors, path);
  return (
    <FormPage title="Services" description="What you offer and what it costs.">
      <ListEditor
        expandable
        items={draft.services}
        onChange={(services) => setDraft((d) => void (d.services = services))}
        newItem={() => ({ title: "New service", description: "", price: "" })}
        itemLabel={(s) => s.title}
        itemMeta={(s) => s.price}
        invalidAt={(i) => hasErrorsUnder(errors, `services.${i}`)}
        addLabel="Add a service"
        render={(s, update, i) => (
          <div className="divide-y divide-white/[0.06]">
            <TextRow label="Title" value={s.title} onChange={(v) => update((x) => void (x.title = v))} error={err(`services.${i}.title`)} />
            <TextAreaRow label="Description" rows={3} value={s.description} onChange={(v) => update((x) => void (x.description = v))} error={err(`services.${i}.description`)} />
            <TextRow label="Price" value={s.price} placeholder="e.g. From $800 / project" onChange={(v) => update((x) => void (x.price = v))} error={err(`services.${i}.price`)} />
          </div>
        )}
      />
    </FormPage>
  );
}
