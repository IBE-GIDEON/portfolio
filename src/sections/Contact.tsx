"use client";

import { useState } from "react";
import { firstName } from "@/content/derived";
import { site } from "@/content/site";
import { playWhoosh, unlockAudio } from "@/lib/sound";
import { buttonStyles, feedback } from "@/ui/controls";
import { LinkIcon, PlaneGlyph } from "@/ui/icons";
import { CheckIcon, CopyIcon } from "@/ui/lineIcons";
import { Page } from "./Page";

const field =
  "w-full bg-transparent text-[14px] text-white caret-white outline-none placeholder:text-muted/70";

/** A Mail-style "New Message" window. Send opens the visitor's own mail app, pre-filled. */
export function Contact() {
  const { headline, body, responseTime, email } = site.contact;
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    feedback();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: the address is on screen to copy by hand.
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    unlockAudio();
    playWhoosh(0.6, 0.12);
    const params = new URLSearchParams({ subject: subject.trim() || "Project enquiry", body: message });
    window.location.href = `mailto:${email}?${params.toString().replace(/\+/g, "%20")}`;
  };

  return (
    <Page title="Contact">
      <h2 className="mt-4 text-[30px] font-semibold tracking-[-0.03em] text-white md:mt-8 md:text-[36px]">{headline}</h2>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-[1.6] text-muted">
        {body} {responseTime.replace("Response", "I usually reply")}.
      </p>

      <form
        onSubmit={send}
        className="mt-7 max-w-[720px] overflow-hidden rounded-xl bg-[#121212] shadow-[0_30px_60px_-30px_rgb(0_0_0/1)] ring-1 ring-white/[0.09]"
      >
        {/* Title bar, like Mail's compose window */}
        <div className="flex h-11 items-center justify-between border-b border-white/[0.07] bg-[#1a1a1a] pl-4 pr-2">
          <span className="text-[13px] font-semibold text-white/90">New Message</span>
          <button type="submit" className={`${buttonStyles.primary} h-8 gap-1.5 rounded-lg px-3`} aria-label="Send">
            <PlaneGlyph size={15} />
            Send
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2.5 text-[14px]">
          <span className="w-16 shrink-0 text-muted">To:</span>
          <span className="min-w-0 flex-1 truncate text-white">
            {site.name} <span className="text-muted">&lt;{email}&gt;</span>
          </span>
          <button
            type="button"
            onClick={copy}
            aria-live="polite"
            className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <label className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2.5 text-[14px]">
          <span className="w-16 shrink-0 text-muted">Subject:</span>
          <input
            className={field}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Project enquiry"
            autoComplete="off"
          />
        </label>

        <textarea
          aria-label="Message"
          className={`${field} block min-h-[220px] resize-none px-4 py-3.5 leading-[1.6]`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Hi ${firstName(site.name)},\n\nI'm working on…`}
        />
      </form>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
        <span>Elsewhere:</span>
        {site.links.map((l) => {
          const inner = (
            <>
              <span className="h-4 w-4">
                <LinkIcon id={l.id} size="100%" />
              </span>
              {l.label}
            </>
          );
          return l.href ? (
            <a
              key={l.id}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={feedback}
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              {inner}
            </a>
          ) : (
            <span key={l.id} title={`${l.label} — link coming soon`} className="flex cursor-default items-center gap-2 opacity-50">
              {inner}
            </span>
          );
        })}
      </div>
    </Page>
  );
}
