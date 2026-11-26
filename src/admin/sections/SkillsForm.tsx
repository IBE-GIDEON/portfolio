"use client";

import { errorAt, FormPage, ListEditor, TagsRow, TextRow } from "../fields";
import type { FormProps } from "./types";

export function SkillsForm({ draft, setDraft, errors }: FormProps) {
  const err = (path: string) => errorAt(errors, path);
  return (
    <FormPage title="Skills" description="Your stack, in groups. Type a skill and press Enter to add it.">
      <ListEditor
        items={draft.stack}
        onChange={(stack) => setDraft((d) => void (d.stack = stack))}
        newItem={() => ({ group: "", items: [] })}
        itemLabel={(g) => g.group}
        itemMeta={(g) => `${g.items.length} skills`}
        addLabel="Add a group"
        render={(g, update, i) => (
          <div className="divide-y divide-white/[0.06]">
            <TextRow label="Group" value={g.group} onChange={(v) => update((x) => void (x.group = v))} error={err(`stack.${i}.group`)} />
            <TagsRow
              label="Skills"
              items={g.items}
              onChange={(items) => update((x) => void (x.items = items))}
              error={errors.find((e) => e.path.startsWith(`stack.${i}.items`))?.message}
            />
          </div>
        )}
      />
    </FormPage>
  );
}
