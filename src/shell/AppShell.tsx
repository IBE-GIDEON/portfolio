"use client";

import { useEffect, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { allProjectImageSrcs } from "@/content/images";
import type { SectionId } from "@/content/site";
import { tap } from "@/lib/haptics";
import { preloadImages } from "@/lib/preloadImages";
import { playClose, playPop } from "@/lib/sound";
import { useIsNarrow, useIsPhone } from "@/lib/useIsPhone";
import { feedback } from "@/ui/controls";
import { MenuIcon } from "@/ui/lineIcons";
import { About } from "@/sections/About";
import { Contact } from "@/sections/Contact";
import { Overview } from "@/sections/Overview";
import { Projects } from "@/sections/Projects";
import { Services } from "@/sections/Services";
import { ProjectPanel } from "./ProjectPanel";
import { SECTION_TITLES, type SectionProps } from "./nav";
import { Sidebar } from "./Sidebar";

const PAGES: Record<SectionId, ComponentType<SectionProps>> = {
  overview: Overview,
  projects: Projects,
  services: Services,
  about: About,
  contact: Contact,
};

/** The whole app: sidebar on the left, the chosen page on the right. */
export function AppShell() {
  const isPhone = useIsPhone();
  const reduce = useReducedMotion();
  const [section, setSection] = useState<SectionId>("overview");

  // Fetch every project screenshot in the background while the intro plays,
  // so the Projects page shows them all at once.
  useEffect(() => {
    const timer = window.setTimeout(() => preloadImages(allProjectImageSrcs), 300);
    return () => window.clearTimeout(timer);
  }, []);
  const [projectId, setProjectId] = useState<string | null>(null);
  const isNarrow = useIsNarrow();
  // Tablets start with the icon-only sidebar; the toggle overrides it either way.
  const [compactChoice, setCompactChoice] = useState<boolean | null>(null);
  const compact = compactChoice ?? isNarrow;
  const [drawer, setDrawer] = useState(false);

  const Page = PAGES[section];

  const go = (id: SectionId) => {
    setDrawer(false);
    setSection(id);
  };

  const openProject = (id: string) => {
    playPop();
    tap();
    setDrawer(false);
    setProjectId(id);
  };

  const closeProject = () => {
    playClose();
    setProjectId(null);
  };

  const sidebar = (
    <Sidebar
      section={section}
      onGo={go}
      compact={!isPhone && compact}
      onToggleCompact={isPhone ? undefined : () => setCompactChoice(!compact)}
    />
  );

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {!isPhone && sidebar}

      {/* Phone: sidebar slides in as a drawer */}
      <AnimatePresence>
        {isPhone && drawer && (
          <div className="fixed inset-0 z-30" key="drawer">
            <motion.div
              className="absolute inset-0 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.div
              className="absolute inset-y-0 left-0 shadow-[0_0_60px_rgb(0_0_0/0.8)]"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
            >
              {sidebar}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="relative min-w-0 flex-1 overflow-y-auto overscroll-contain">
        {isPhone && (
          <div className="glass sticky top-0 z-20 flex h-14 items-center gap-3 px-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => {
                feedback();
                setDrawer(true);
              }}
              className="grid h-10 w-10 place-items-center rounded-xl text-ink/70 hover:bg-white/[0.06]"
            >
              <MenuIcon />
            </button>
            <span className="text-[15px] font-semibold text-ink">{SECTION_TITLES[section]}</span>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={section}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Page go={go} openProject={openProject} />
          </motion.div>
        </AnimatePresence>
      </main>

      <ProjectPanel projectId={projectId} onClose={closeProject} go={go} />
    </div>
  );
}
