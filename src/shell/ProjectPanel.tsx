"use client";

import { useEffect, useEffectEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site, type SectionId } from "@/content/site";
import { buttonStyles, feedback, StatusDot, Tag } from "@/ui/controls";
import { CloseIcon, ExternalIcon } from "@/ui/lineIcons";
import { ProjectVisual, STATUS_LABEL } from "@/ui/ProjectCard";

type Props = {
  projectId: string | null;
  onClose: () => void;
  go: (id: SectionId) => void;
};

/** Slide-over detail for one project, like an inspector panel. */
export function ProjectPanel({ projectId, onClose, go }: Props) {
  const project = site.projects.find((p) => p.id === projectId) ?? null;
  const close = useEffectEvent(onClose);

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project]);

  return (
    <AnimatePresence>
      {project && (
        <div className="fixed inset-0 z-40" key="panel">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={project.name}
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 48, opacity: 0, transition: { duration: 0.16 } }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className="absolute inset-y-3 right-3 flex w-[min(460px,calc(100%-24px))] flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] ring-1 ring-white/[0.08]"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-2 text-[12px] text-muted">
                <StatusDot tone={project.status === "shipped" ? "white" : "ash"} />
                {STATUS_LABEL[project.status]}
              </span>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 transition-colors hover:bg-white/[0.06] hover:text-ink"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
              <div className="group overflow-hidden rounded-xl ring-1 ring-white/[0.08]">
                <ProjectVisual project={project} sizes="460px" />
              </div>
              <h2 className="mt-5 text-[24px] font-semibold tracking-[-0.025em] text-ink">{project.name}</h2>
              <p className="mt-0.5 text-[13.5px] text-muted">{project.category}</p>
              <p className="mt-4 text-[14.5px] leading-[1.65] text-ink/75">{project.description}</p>

              <h3 className="mt-6 text-[12px] font-medium text-muted">Built with</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {project.stack.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
            </div>

            <div className="flex gap-2 border-t border-white/[0.07] px-5 py-4">
              {"href" in project.action ? (
                <a href={project.action.href} target="_blank" rel="noopener noreferrer" className={buttonStyles.primary} onClick={feedback}>
                  Open live preview <ExternalIcon />
                </a>
              ) : (
                <button
                  type="button"
                  className={buttonStyles.primary}
                  onClick={() => {
                    const target = "opens" in project.action ? project.action.opens : "contact";
                    onClose();
                    go(target);
                  }}
                >
                  Inquire about this
                </button>
              )}
              <button
                type="button"
                className={buttonStyles.secondary}
                onClick={() => {
                  onClose();
                  go("contact");
                }}
              >
                Hire me
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
