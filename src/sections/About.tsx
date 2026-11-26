"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/content/site";
import type { SectionProps } from "@/shell/nav";
import { Avatar } from "@/ui/Avatar";
import { feedback } from "@/ui/controls";
import { ProjectVisual, STATUS_LABEL } from "@/ui/ProjectCard";
import { Group, Row, type TileSpec } from "@/ui/SettingsList";
import { Page } from "./Page";

type Tab = "overview" | "story" | "skills" | "now";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "story", label: "Story" },
  { id: "skills", label: "Skills" },
  { id: "now", label: "Now" },
];

/** A grey macOS push button ("System Report…" style). */
const macButton =
  "inline-flex h-[26px] items-center rounded-[6px] bg-white/[0.12] px-3 text-[13px] text-white shadow-[inset_0_0.5px_0_rgb(255_255_255/0.2),0_0.5px_1px_rgb(0_0_0/0.6)] transition-colors hover:bg-white/[0.18] active:bg-white/[0.24]";

const SKILL_TILES: Record<string, TileSpec> = {
  Backend: {
    color: "#0A84FF",
    glyph: (
      <>
        <rect x="4.5" y="4.5" width="15" height="6" rx="1.5" />
        <rect x="4.5" y="13.5" width="15" height="6" rx="1.5" />
        <path d="M8 7.5h.01M8 16.5h.01" />
      </>
    ),
  },
  Frontend: {
    color: "#BF5AF2",
    glyph: (
      <>
        <rect x="3.5" y="5" width="17" height="14" rx="2" />
        <path d="M3.5 9h17" />
      </>
    ),
  },
  "AI & LLMs": {
    color: "#FF9F0A",
    glyph: <path d="M12 4l1.8 4.7L18.5 10.5l-4.7 1.8L12 17l-1.8-4.7L5.5 10.5l4.7-1.8z" />,
  },
  "Product & Design": {
    color: "#30D158",
    glyph: <path d="M5 19l3.5-1 9-9a1.8 1.8 0 0 0-2.5-2.5l-9 9z" />,
  },
};

function OverviewTab({ go }: SectionProps) {
  const github = site.links.find((l) => l.id === "github");
  const [first, ...rest] = site.name.split(" ");

  return (
    <div className="flex flex-col items-center gap-8 px-6 py-8 md:flex-row md:items-start md:px-10 md:py-10">
      <div className="shrink-0">
        <Avatar size={176} blend />
      </div>
      <div className="min-w-0 flex-1 text-center md:text-left">
        <h2 className="text-[34px] leading-none tracking-[-0.02em] text-white">
          <span className="font-semibold">{first}</span> <span className="font-light">{rest.join(" ")}</span>
        </h2>
        <p className="mt-2 text-[13px] text-muted">{site.role}</p>

        <dl className="mx-auto mt-6 grid w-fit grid-cols-[auto_1fr] gap-x-4 gap-y-[7px] text-left text-[13px] md:mx-0">
          {site.about.facts.map((f) => (
            <FactRow key={f.label} label={f.label}>
              {f.value}
            </FactRow>
          ))}
        </dl>

        <div className="mt-7 flex justify-center gap-2 md:justify-start">
          <button
            type="button"
            className={macButton}
            onClick={() => {
              feedback();
              go("contact");
            }}
          >
            Hire Me…
          </button>
          {github && (
            <a href={github.href} target="_blank" rel="noopener noreferrer" className={macButton} onClick={feedback}>
              GitHub…
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function FactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="font-semibold text-white">{label}</dt>
      <dd className="text-white/75">{children}</dd>
    </>
  );
}

function StoryTab() {
  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <h2 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.025em] text-white">{site.about.headline}</h2>
      <div className="mt-4 max-w-[62ch] space-y-3.5 text-[14.5px] leading-[1.7] text-white/75">
        {site.about.paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
    </div>
  );
}

/** For skill groups added from the admin that have no icon of their own. */
const OTHER_SKILLS: TileSpec = { color: "#8E8E93", glyph: <path d="M12 4.5l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 9.8l5-.7z" /> };

function SkillsTab() {
  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <Group>
        {site.stack.map((g) => (
          <Row key={g.group} tile={SKILL_TILES[g.group] ?? OTHER_SKILLS} label={g.group}>
            <span className="text-white/70">{g.items.join(", ")}</span>
          </Row>
        ))}
      </Group>
    </div>
  );
}

function NowTab({ openProject }: SectionProps) {
  const current = site.projects.filter((p) => p.status === "building");
  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <p className="mb-3 px-1 text-[13px] text-muted">Currently building</p>
      <Group>
        {current.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => openProject(p.id)}
            className="flex w-full items-center gap-3.5 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.04]"
          >
            <span className="w-[88px] shrink-0 overflow-hidden rounded-md ring-1 ring-white/[0.1]">
              <ProjectVisual project={p} sizes="88px" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-white">{p.name}</span>
              <span className="block text-[12.5px] text-muted">{p.category}</span>
            </span>
            <span className="text-[12.5px] text-muted">{STATUS_LABEL[p.status]}</span>
          </button>
        ))}
      </Group>
    </div>
  );
}

/** About, as a classic macOS "About This Mac" window with tabs. */
export function About(props: SectionProps) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <Page title="About">
      <section className="mt-4 max-w-[820px] overflow-hidden rounded-xl bg-[#1c1c1e] shadow-[0_30px_70px_-30px_rgb(0_0_0/1)] ring-1 ring-white/[0.1] md:mt-6">
        {/* Toolbar with centred tabs */}
        <div className="flex h-12 items-center justify-center border-b border-black/60 bg-[#2a2a2c] shadow-[inset_0_-0.5px_0_rgb(255_255_255/0.06)]">
          <div role="tablist" aria-label="About sections" className="flex rounded-[7px] bg-black/25 p-[2px] ring-[0.5px] ring-white/[0.08]">
            {TABS.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    if (active) return;
                    feedback();
                    setTab(t.id);
                  }}
                  className={`h-[24px] rounded-[5px] px-3.5 text-[12.5px] transition-colors ${
                    active
                      ? "bg-white/[0.18] font-medium text-white shadow-[0_0.5px_1px_rgb(0_0_0/0.5)]"
                      : "text-white/65 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            role="tabpanel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {tab === "overview" && <OverviewTab {...props} />}
            {tab === "story" && <StoryTab />}
            {tab === "skills" && <SkillsTab />}
            {tab === "now" && <NowTab {...props} />}
          </motion.div>
        </AnimatePresence>

        <p className="border-t border-white/[0.06] py-3 text-center text-[11px] text-muted/80">
          © {new Date().getFullYear()} {site.name}. Built from scratch in {site.location.split(",")[0]}.
        </p>
      </section>
    </Page>
  );
}
