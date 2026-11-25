import type { ReactNode } from "react";

/** Page frame: title, optional toolbar row, then content. */
export function Page({ title, toolbar, children }: { title: string; toolbar?: ReactNode; children: ReactNode }) {
  return (
    <div className="px-4 pt-5 pb-12 md:px-8 md:pt-6">
      <h1 className="hidden text-[17px] font-semibold tracking-[-0.01em] text-ink md:block">{title}</h1>
      {toolbar && <div className="mt-1 flex flex-wrap items-center gap-2 md:mt-5">{toolbar}</div>}
      {children}
    </div>
  );
}

/** Raised dark panel used across pages. */
export const panel = "rounded-2xl bg-surface ring-1 ring-white/[0.08] shadow-[0_1px_2px_rgb(0_0_0/0.04)]";
