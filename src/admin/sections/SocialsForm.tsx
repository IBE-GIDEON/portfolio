"use client";

import { useId } from "react";
import { errorAt, FormPage, Group, Row } from "../fields";
import { LinkIcon } from "@/ui/icons";
import type { FormProps } from "./types";

export function SocialsForm({ draft, setDraft, errors }: FormProps) {
  const base = useId();
  return (
    <FormPage title="Socials" description="Your profile links. Leave one empty to hide it from the site.">
      <Group footer="Links must start with https://. For WhatsApp use https://wa.me/ followed by your number with the country code, e.g. https://wa.me/2349078390089.">
        {draft.links.map((link, i) => {
          const error = errorAt(errors, `links.${i}.href`);
          return (
            <Row key={link.id} label={link.label} htmlFor={`${base}-${link.id}`} error={error}>
              <div className="flex items-center gap-2.5">
                <span className="h-5 w-5 shrink-0">
                  <LinkIcon id={link.id} size={20} />
                </span>
                <input
                  id={`${base}-${link.id}`}
                  type="url"
                  value={link.href}
                  placeholder="Hidden"
                  onChange={(e) => setDraft((d) => void (d.links[i].href = e.target.value))}
                  className={`w-full rounded-[7px] bg-white/[0.06] px-2.5 py-[7px] text-[13.5px] text-white ring-1 outline-none placeholder:text-white/25 focus:ring-2 ${
                    error ? "ring-[#FF6961]/70" : "ring-white/[0.09] focus:ring-white/35"
                  }`}
                />
              </div>
            </Row>
          );
        })}
      </Group>
    </FormPage>
  );
}
