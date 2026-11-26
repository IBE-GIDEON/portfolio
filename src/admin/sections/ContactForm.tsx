"use client";

import { errorAt, FormPage, Group, TextAreaRow, TextRow } from "../fields";
import type { FormProps } from "./types";

export function ContactForm({ draft, setDraft, errors }: FormProps) {
  const err = (path: string) => errorAt(errors, `contact.${path}`);
  return (
    <FormPage title="Contact" description="The Contact page, where people write to you.">
      <Group>
        <TextRow label="Headline" value={draft.contact.headline} onChange={(v) => setDraft((d) => void (d.contact.headline = v))} error={err("headline")} />
        <TextAreaRow label="Text" rows={3} value={draft.contact.body} onChange={(v) => setDraft((d) => void (d.contact.body = v))} error={err("body")} />
        <TextRow
          label="Response time"
          value={draft.contact.responseTime}
          onChange={(v) => setDraft((d) => void (d.contact.responseTime = v))}
          error={err("responseTime")}
          hint="e.g. Response within 24 hours"
        />
        <TextRow
          label="Email"
          type="email"
          value={draft.contact.email}
          onChange={(v) => setDraft((d) => void (d.contact.email = v))}
          error={err("email")}
          hint="Messages from the Contact page go here."
        />
      </Group>
    </FormPage>
  );
}
