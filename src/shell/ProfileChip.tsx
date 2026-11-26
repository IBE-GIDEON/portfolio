"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/content/site";
import { setSoundEnabled, unlockAudio, useSoundEnabled } from "@/lib/sound";
import { Avatar } from "@/ui/Avatar";
import { feedback } from "@/ui/controls";
import { CheckIcon, ChevronUpDown } from "@/ui/lineIcons";

/** One macOS menu row: check column, label, optional shortcut, blue highlight on hover. */
function Item({
  children,
  checked,
  shortcut,
  onSelect,
  href,
  role = "menuitem",
}: {
  children: ReactNode;
  checked?: boolean;
  shortcut?: string;
  onSelect?: () => void;
  href?: string;
  role?: "menuitem" | "menuitemcheckbox";
}) {
  const className =
    "group/item flex h-[24px] w-full items-center rounded-[5px] pr-2 text-left text-[13px] text-white/90 hover:bg-[#0A84FF] hover:text-white focus-visible:bg-[#0A84FF] focus-visible:text-white focus-visible:outline-none";
  const inner = (
    <>
      <span className="flex w-6 shrink-0 justify-center">{checked && <CheckIcon size={12} />}</span>
      <span className="flex-1">{children}</span>
      {shortcut && <span className="text-[12px] text-white/40 group-hover/item:text-white/80">{shortcut}</span>}
    </>
  );
  if (href) {
    return (
      <a role={role} href={href} className={className} onClick={onSelect}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" role={role} aria-checked={role === "menuitemcheckbox" ? checked : undefined} className={className} onClick={onSelect}>
      {inner}
    </button>
  );
}

const Separator = () => <div role="separator" className="mx-2.5 my-[5px] h-px bg-white/[0.1]" />;

/** The account row at the bottom of the sidebar, opening a macOS-style menu. */
export function ProfileChip({ compact }: { compact: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const soundOn = useSoundEnabled();
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  /** Where the menu sits on screen; set on first open, kept for the close animation. */
  const [anchor, setAnchor] = useState<{ left: number; bottom: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const t = e.target as Node;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(t) && !menu.current?.contains(t)) {
        setOpen(false);
      }
    };
    const shut = () => setOpen(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    window.addEventListener("resize", shut);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
      window.removeEventListener("resize", shut);
    };
  }, [open]);

  const copyEmail = async () => {
    feedback();
    try {
      await navigator.clipboard.writeText(site.contact.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard blocked; nothing to do.
    }
  };

  return (
    <div ref={root} className="relative">
      {/* Rendered at the top level so the sidebar's scrolling never clips it. */}
      {anchor &&
        createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menu}
            role="menu"
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.09 }}
            className="fixed z-[3000] w-[240px] rounded-[10px] p-[5px] shadow-[0_0_0_0.5px_rgb(0_0_0/0.8),inset_0_0_0_0.5px_rgb(255_255_255/0.16),0_12px_36px_rgb(0_0_0/0.55)]"
            style={{
              left: anchor.left,
              bottom: anchor.bottom,
              background: "rgb(34 34 36 / 0.78)",
              WebkitBackdropFilter: "blur(30px) saturate(180%)",
              backdropFilter: "blur(30px) saturate(180%)",
            }}
          >
            {/* Account header, like the top of a macOS account menu */}
            <div className="flex items-center gap-2.5 px-2.5 pt-1.5 pb-2">
              <Avatar size={30} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-white">{site.name}</p>
                <p className="truncate text-[11.5px] text-white/50">{site.contact.email}</p>
              </div>
            </div>
            <Separator />
            <Item
              role="menuitemcheckbox"
              checked={soundOn}
              onSelect={() => {
                const next = !soundOn;
                setSoundEnabled(next);
                if (next) unlockAudio();
                feedback();
              }}
            >
              Sound Effects
            </Item>
            <Separator />
            <Item href={`mailto:${site.contact.email}`} onSelect={feedback}>
              Email Me…
            </Item>
            <Item onSelect={copyEmail}>{copied ? "Copied" : "Copy Email Address"}</Item>
            <Separator />
            <Item shortcut="⌘R" onSelect={() => window.location.reload()}>
              Replay Intro
            </Item>
          </motion.div>
        )}
      </AnimatePresence>,
          document.body,
        )}

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${site.name}, ${site.availability}`}
        onClick={(e) => {
          feedback();
          const r = e.currentTarget.getBoundingClientRect();
          setAnchor({
            left: Math.max(8, Math.min(r.left, window.innerWidth - 248)),
            bottom: window.innerHeight - r.top + 6,
          });
          setOpen((o) => !o);
        }}
        className={`flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-left transition-colors hover:bg-white/[0.06] ${
          open ? "bg-white/[0.08]" : ""
        } ${compact ? "justify-center" : ""}`}
      >
        <Avatar size={28} online />
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-white">{site.name}</span>
              <span className="block truncate text-[11px] text-muted">{site.shortRole}</span>
            </span>
            <span className="text-muted">
              <ChevronUpDown size={13} />
            </span>
          </>
        )}
      </button>
    </div>
  );
}
