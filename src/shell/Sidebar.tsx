"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { firstName } from "@/content/derived";
import { activeLinks, site, type SectionId } from "@/content/site";
import { feedback } from "@/ui/controls";
import { LinkIcon } from "@/ui/icons";
import { BriefcaseIcon, FolderIcon, MailIcon, OverviewIcon, SidebarIcon, UserIcon } from "@/ui/lineIcons";
import { ProfileChip } from "./ProfileChip";
import { SECTION_ORDER, SECTION_TITLES } from "./nav";

const ICONS: Record<SectionId, ReactNode> = {
  overview: <OverviewIcon />,
  projects: <FolderIcon />,
  services: <BriefcaseIcon />,
  about: <UserIcon />,
  contact: <MailIcon />,
};

type SidebarProps = {
  section: SectionId;
  onGo: (id: SectionId) => void;
  /** Desktop only: icon-only mode. */
  compact?: boolean;
  onToggleCompact?: () => void;
};

function IconButton({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        feedback();
        onClick?.();
      }}
      className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mt-6 mb-1 px-2.5 text-[12px] font-medium text-muted">{children}</p>;
}

export function Sidebar({ section, onGo, compact = false, onToggleCompact }: SidebarProps) {
  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-white/[0.07] pt-3 pb-3 transition-[width] duration-300 ${
        compact ? "w-[68px] px-2.5" : "w-[236px] px-3"
      }`}
      style={{ background: "#000000" }}
    >
      {/* Name + collapse */}
      <div className={`flex h-8 items-center ${compact ? "justify-center" : "justify-between pl-2.5"}`}>
        {!compact && <span className="text-[16px] font-semibold tracking-[-0.02em] text-ink">{firstName(site.name)}</span>}
        {onToggleCompact && (
          <IconButton label={compact ? "Expand sidebar" : "Collapse sidebar"} onClick={onToggleCompact}>
            <SidebarIcon />
          </IconButton>
        )}
      </div>

      {/* Pages */}
      <nav aria-label="Pages" className="mt-5 space-y-0.5">
        {SECTION_ORDER.map((id) => {
          const active = id === section;
          return (
            <button
              key={id}
              type="button"
              aria-current={active ? "page" : undefined}
              aria-label={compact ? SECTION_TITLES[id] : undefined}
              title={compact ? SECTION_TITLES[id] : undefined}
              onClick={() => {
                if (!active) feedback();
                onGo(id);
              }}
              className={`relative flex h-9 w-full items-center gap-3 rounded-[10px] text-[14px] font-medium transition-colors ${
                compact ? "justify-center" : "px-2.5"
              } ${active ? "text-white" : "text-muted hover:bg-white/[0.06] hover:text-white"}`}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  aria-hidden
                  className="absolute inset-0 rounded-[10px]"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                >
                  {/* soft rainbow glow behind */}
                  <span className="rainbow absolute -inset-[2px] rounded-[12px] opacity-55 blur-[7px]" />
                  {/* crisp rainbow edge */}
                  <span className="rainbow edge-only absolute inset-0 rounded-[10px] opacity-90" />
                  {/* frosted glass body */}
                  <span className="absolute inset-px rounded-[9px] bg-[rgb(18_18_18/0.72)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] backdrop-blur-xl" />
                </motion.span>
              )}
              <span className={`relative ${active ? "text-white" : "text-muted"}`}>{ICONS[id]}</span>
              {!compact && <span className="relative">{SECTION_TITLES[id]}</span>}
              {!compact && id === "projects" && (
                <span
                  aria-label={`${site.projects.length} projects`}
                  className={`relative ml-auto pr-0.5 text-[12px] font-normal tabular-nums ${active ? "text-white/60" : "text-muted/70"}`}
                >
                  {site.projects.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Socials */}
      {!compact && activeLinks.length > 0 && <Label>Socials</Label>}
      <ul className={`space-y-0.5 ${compact ? "mt-5 border-t border-white/[0.07] pt-4" : ""}`}>
        {activeLinks.map((l) => {
          const row = `flex h-8 items-center gap-2.5 rounded-lg text-[13px] text-muted ${compact ? "justify-center" : "px-2.5"}`;
          const inner = (
            <>
              <span className="h-[18px] w-[18px] shrink-0">
                <LinkIcon id={l.id} size="100%" />
              </span>
              {!compact && l.label}
            </>
          );
          return (
            <li key={l.id}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={compact ? l.label : undefined}
                title={compact ? l.label : undefined}
                onClick={feedback}
                className={`${row} transition-colors hover:bg-white/[0.06] hover:text-white`}
              >
                {inner}
              </a>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-4">
        <ProfileChip compact={compact} />
      </div>
    </aside>
  );
}
