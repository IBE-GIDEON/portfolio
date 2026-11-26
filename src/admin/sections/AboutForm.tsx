"use client";

import { errorAt, FormPage, Group, ListEditor, TextAreaRow, TextRow } from "../fields";
import type { FormProps } from "./types";

export function AboutForm({ draft, setDraft, errors }: FormProps) {
  const err = (path: string) => errorAt(errors, path);
  return (
    <FormPage title="About" description="The About window: your facts, and your story.">
      <section>
        <h3 className="mb-2 px-1 text-[13px] font-semibold text-white/90">Facts</h3>
        <ListEditor
          items={draft.about.facts}
          onChange={(facts) => setDraft((d) => void (d.about.facts = facts))}
          newItem={() => ({ label: "", value: "" })}
          itemLabel={(f) => f.label}
          itemMeta={(f) => f.value}
          addLabel="Add a fact"
          render={(f, update, i) => (
            <div className="divide-y divide-white/[0.06]">
              <TextRow label="Label" value={f.label} onChange={(v) => update((x) => void (x.label = v))} error={err(`about.facts.${i}.label`)} />
              <TextRow label="Value" value={f.value} onChange={(v) => update((x) => void (x.value = v))} error={err(`about.facts.${i}.value`)} />
            </div>
          )}
        />
      </section>

      <Group title="Story">
        <TextRow
          label="Headline"
          value={draft.about.headline}
          onChange={(v) => setDraft((d) => void (d.about.headline = v))}
          error={err("about.headline")}
        />
      </Group>

      <section>
        <h3 className="mb-2 px-1 text-[13px] font-semibold text-white/90">Paragraphs</h3>
        <ListEditor
          items={draft.about.paragraphs}
          onChange={(paragraphs) => setDraft((d) => void (d.about.paragraphs = paragraphs))}
          newItem={() => ""}
          itemLabel={(_, i) => `Paragraph ${i + 1}`}
          addLabel="Add a paragraph"
          render={(p, update, i) => (
            <TextAreaRow
              label="Text"
              rows={4}
              value={p}
              onChange={(v) => update(() => v)}
              error={err(`about.paragraphs.${i}`)}
            />
          )}
        />
      </section>
    </FormPage>
  );
}
