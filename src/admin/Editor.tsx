"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ContentError, SiteContent } from "@/content/schema";
import { ADMIN_SECTIONS, type AdminSection } from "@/lib/admin/sections";
import { useIsPhone } from "@/lib/useIsPhone";
import { Tile } from "@/ui/SettingsList";
import { ArrowLeft, ChevronRight, ExternalIcon } from "@/ui/lineIcons";
import { GITHUB_AUTH_MESSAGE, uploadImage, type Loaded } from "./api";
import { LoginScreen } from "./LoginScreen";
import { SECTION_FORMS } from "./sections";
import type { FormProps } from "./sections/types";
import { useDraft } from "./useDraft";

const SECTIONS: Record<AdminSection, { label: string; color: string; glyph: ReactNode }> = {
  profile: {
    label: "Profile",
    color: "#0A84FF",
    glyph: (
      <>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5.5 19.5c1.2-3.3 3.6-5 6.5-5s5.3 1.7 6.5 5" />
      </>
    ),
  },
  about: { label: "About", color: "#8E8E93", glyph: <path d="M12 8h.01M11 12h1v5h1" /> },
  skills: { label: "Skills", color: "#BF5AF2", glyph: <path d="M9 7.5L4.5 12 9 16.5M15 7.5l4.5 4.5-4.5 4.5" /> },
  projects: { label: "Projects", color: "#FF9F0A", glyph: <path d="M4 7.5h6l1.5 2H20v8.5H4z" /> },
  services: {
    label: "Services",
    color: "#30D158",
    glyph: (
      <>
        <rect x="4" y="8" width="16" height="11" rx="2" />
        <path d="M9 8V6h6v2" />
      </>
    ),
  },
  contact: {
    label: "Contact",
    color: "#64D2FF",
    glyph: (
      <>
        <rect x="4" y="6.5" width="16" height="11" rx="2" />
        <path d="M4.5 7.5l7.5 6 7.5-6" />
      </>
    ),
  },
  socials: {
    label: "Socials",
    color: "#FF375F",
    glyph: <path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />,
  },
};

/** Which section edits the field an error points at. */
export function sectionOf(path: string): AdminSection {
  const head = path.split(".")[0];
  if (head === "about") return "about";
  if (head === "stack") return "skills";
  if (head === "projects" || head === "images") return "projects";
  if (head === "services") return "services";
  if (head === "contact") return "contact";
  if (head === "links") return "socials";
  return "profile";
}

/** "Projects › Three AI: Use a full link…" */
function describe(draft: SiteContent, error: ContentError): string {
  const [head, index] = error.path.split(".");
  const i = Number(index);
  const item =
    head === "projects" ? draft.projects[i]?.name : head === "services" ? draft.services[i]?.title : head === "links" ? draft.links[i]?.label : null;
  return `${SECTIONS[sectionOf(error.path)].label}${item ? ` › ${item}` : ""}: ${error.message}`;
}

type Toast = {
  tone: "ok" | "error";
  title: string;
  body?: string;
  errors?: ContentError[];
  link?: { href: string; label: string };
  action?: { label: string; onClick: () => void };
};

export function Editor({ loaded, onLogOut, onReload }: { loaded: Loaded; onLogOut: () => void; onReload: () => void }) {
  const d = useDraft(loaded);
  const { addImage } = d;
  const isPhone = useIsPhone();
  const [picked, setPicked] = useState<AdminSection | null>(null);
  const section: AdminSection | null = picked ?? (isPhone ? null : "profile");
  const [publishing, setPublishing] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirty = d.changed.length > 0;
  const errors = showErrors ? d.errors : [];

  // Leaving with unpublished edits asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (toast?.tone !== "ok") return;
    const timer = setTimeout(() => setToast(null), 9000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!confirmDiscard) return;
    const timer = setTimeout(() => setConfirmDiscard(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmDiscard]);

  const upload: FormProps["upload"] = useCallback(
    async (file, kind, projectId) => {
      const result = await uploadImage(file, kind, projectId);
      if (result.ok) {
        addImage(result.image);
        setPreviews((p) => ({ ...p, [result.image.path]: `data:image/webp;base64,${result.image.webpBase64}` }));
        return { ok: true, image: result.image };
      }
      if (result.signedOut) setSessionEnded(true);
      return { ok: false, message: result.signedOut ? "Sign in again, then choose the picture once more." : result.message };
    },
    [addImage],
  );

  const baseIds = useMemo(() => new Set(d.base.content.projects.map((p) => p.id)), [d.base.content]);

  const formProps: FormProps = {
    draft: d.draft,
    setDraft: d.setDraft,
    errors,
    upload,
    preview: (path) => (path ? (previews[path] ?? path) : null),
    isNewProject: (id) => !baseIds.has(id),
  };

  async function publish() {
    if (publishing) return;
    setPublishing(true);
    setToast(null);
    const outcome = await d.publish();
    setPublishing(false);
    switch (outcome.kind) {
      case "ok":
        setShowErrors(false);
        setToast(
          outcome.commitUrl
            ? { tone: "ok", title: "Published. Live in about a minute.", link: { href: outcome.commitUrl, label: "View change on GitHub" } }
            : { tone: "ok", title: "Nothing new to publish." },
        );
        break;
      case "invalid":
        setShowErrors(true);
        setToast({ tone: "error", title: "Fix these before publishing:", errors: outcome.errors });
        if (outcome.errors[0]) setPicked(sectionOf(outcome.errors[0].path));
        break;
      case "conflict":
        setToast({
          tone: "error",
          title: "The site changed since you opened it.",
          body: "Reload to get the latest. Reloading drops the edits on this screen, so copy anything you want to keep first.",
          action: { label: "Reload", onClick: onReload },
        });
        break;
      case "signed-out":
        setSessionEnded(true);
        setToast({ tone: "error", title: "Your session ended.", body: "Sign in again, then press Publish. Your edits are still here." });
        break;
      case "github-auth":
        setToast({ tone: "error", title: GITHUB_AUTH_MESSAGE, body: "Nothing was published. Your edits are still here." });
        break;
      case "error":
        setToast({ tone: "error", title: "Couldn't publish.", body: `${outcome.message} Your edits are still here.` });
        break;
    }
  }

  function logOut() {
    if (dirty && !confirm("You have edits that aren't published. Log out and lose them?")) return;
    onLogOut();
  }

  const Form = section ? SECTION_FORMS[section] : null;
  const badSections = new Set(errors.map((e) => sectionOf(e.path)));

  const actions = (
    <div className="flex items-center gap-2">
      {dirty && !isPhone && (
        <button
          type="button"
          onClick={() => (confirmDiscard ? (d.discard(), setConfirmDiscard(false), setShowErrors(false)) : setConfirmDiscard(true))}
          className={`h-8 rounded-[8px] px-3 text-[13px] font-medium transition-colors ${
            confirmDiscard ? "bg-[#FF453A] text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          {confirmDiscard ? "Discard all edits?" : "Discard changes"}
        </button>
      )}
      <button
        type="button"
        onClick={publish}
        disabled={!dirty || publishing}
        className="inline-flex h-8 items-center gap-2 rounded-[8px] bg-white px-3.5 text-[13px] font-semibold text-[#0A0A0A] shadow-[0_1px_2px_rgb(0_0_0/0.4)] transition-opacity disabled:opacity-35"
      >
        {publishing ? "Publishing…" : "Publish"}
        {dirty && !publishing && (
          <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#0A0A0A] px-1 text-[11px] font-bold text-white">
            {d.changed.length}
          </span>
        )}
      </button>
    </div>
  );

  const nav = (
    <nav aria-label="Sections" className="space-y-0.5">
      {ADMIN_SECTIONS.map((id) => {
        const meta = SECTIONS[id];
        const active = section === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setPicked(id)}
            aria-current={active ? "page" : undefined}
            className={`flex w-full items-center gap-2.5 rounded-[8px] px-2 py-[7px] text-left text-[13.5px] transition-colors ${
              active ? "bg-white/[0.12] text-white" : "text-white/80 hover:bg-white/[0.05]"
            } ${isPhone ? "py-2.5" : ""}`}
          >
            <Tile color={meta.color}>{meta.glyph}</Tile>
            <span className="flex-1 font-medium">{meta.label}</span>
            {badSections.has(id) ? (
              <span className="h-2 w-2 rounded-full bg-[#FF453A]" aria-label="has errors" />
            ) : d.changed.includes(id) ? (
              <span className="h-2 w-2 rounded-full bg-white" aria-label="edited" />
            ) : null}
            {isPhone && (
              <span className="text-muted">
                <ChevronRight size={13} />
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="space-y-0.5 text-[13px]">
      <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-white/70 hover:bg-white/[0.05] hover:text-white">
        View site <ExternalIcon size={12} />
      </a>
      <button type="button" onClick={logOut} className="w-full rounded-[8px] px-2 py-1.5 text-left text-white/70 hover:bg-white/[0.05] hover:text-white">
        Log out
      </button>
    </div>
  );

  return (
    <div className="flex h-dvh bg-black text-white">
      {!isPhone && (
        <aside className="flex w-[232px] shrink-0 flex-col border-r border-white/[0.07] px-3 pt-5 pb-4">
          <div className="mb-4 px-2">
            <p className="text-[16px] font-semibold tracking-[-0.02em]">Admin</p>
            <p className="text-[12px] text-muted">{d.draft.name}</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{nav}</div>
          {footer}
        </aside>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-4 sm:px-5">
          {isPhone && section ? (
            <button type="button" onClick={() => setPicked(null)} className="-ml-1 flex items-center gap-1 text-[14px] text-white/80">
              <ArrowLeft size={16} /> Admin
            </button>
          ) : (
            <h1 className="text-[15px] font-semibold">{section ? SECTIONS[section].label : "Admin"}</h1>
          )}
          <div className="ml-auto">{actions}</div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {Form ? (
            <Form {...formProps} />
          ) : (
            <div className="px-4 pt-5 pb-10">
              <p className="mb-3 px-2 text-[13px] text-muted">Edit any section, then press Publish. The live site updates about a minute later.</p>
              <div className="rounded-xl bg-surface p-1.5 ring-1 ring-white/[0.08]">{nav}</div>
              {dirty && (
                <button type="button" onClick={() => confirm("Discard all edits?") && d.discard()} className="mt-4 px-2 text-[13px] text-white/60">
                  Discard changes
                </button>
              )}
              <div className="mt-6">{footer}</div>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            role={toast.tone === "error" ? "alert" : "status"}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="fixed right-4 bottom-4 left-4 z-40 max-h-[60vh] overflow-y-auto rounded-2xl bg-[#1c1c1e]/95 p-4 shadow-[0_20px_60px_rgb(0_0_0/0.6)] ring-1 ring-white/[0.1] backdrop-blur-xl sm:left-auto sm:w-[380px]"
          >
            <div className="flex items-start gap-3">
              <span className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${toast.tone === "ok" ? "bg-[#30D158]" : "bg-[#FF453A]"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-white">{toast.title}</p>
                {toast.body && <p className="mt-1 text-[12.5px] leading-relaxed text-white/70">{toast.body}</p>}
                {toast.errors && (
                  <ul className="mt-2 space-y-1">
                    {toast.errors.slice(0, 8).map((e) => (
                      <li key={e.path}>
                        <button
                          type="button"
                          onClick={() => setPicked(sectionOf(e.path))}
                          className="text-left text-[12.5px] leading-snug text-white/75 underline-offset-2 hover:text-white hover:underline"
                        >
                          {describe(d.draft, e)}
                        </button>
                      </li>
                    ))}
                    {toast.errors.length > 8 && <li className="text-[12px] text-muted">…and {toast.errors.length - 8} more</li>}
                  </ul>
                )}
                {(toast.link || toast.action) && (
                  <div className="mt-2.5 flex gap-3">
                    {toast.link && (
                      <a href={toast.link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-white underline underline-offset-2">
                        {toast.link.label} <ExternalIcon size={11} />
                      </a>
                    )}
                    {toast.action && (
                      <button type="button" onClick={toast.action.onClick} className="h-7 rounded-[7px] bg-white px-3 text-[12.5px] font-semibold text-[#0A0A0A]">
                        {toast.action.label}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setToast(null)} aria-label="Close" className="-mt-1 -mr-1 grid h-6 w-6 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white">
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {sessionEnded && (
        <LoginScreen
          sheet
          onSignedIn={() => setSessionEnded(false)}
          onNotConfigured={() => setSessionEnded(false)}
        />
      )}
    </div>
  );
}

export type SectionForms = Record<AdminSection, ComponentType<FormProps>>;
