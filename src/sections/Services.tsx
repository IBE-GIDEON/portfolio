"use client";

import { site } from "@/content/site";
import type { SectionProps } from "@/shell/nav";
import { buttonStyles, feedback } from "@/ui/controls";
import { ArrowRight, BriefcaseIcon } from "@/ui/lineIcons";
import { Page, panel } from "./Page";

const enquiry = (title: string) =>
  `mailto:${site.contact.email}?subject=${encodeURIComponent(`Project enquiry: ${title}`)}`;

export function Services({ go }: SectionProps) {
  return (
    <Page
      title="Services"
      toolbar={
        <>
          <span className="flex h-10 items-center gap-2 rounded-xl bg-white/[0.05] px-3.5 text-[13px] font-medium text-ink/70">
            <BriefcaseIcon size={15} />
            {site.services.length} services · prices in USD
          </span>
          <button
            type="button"
            className={`${buttonStyles.primary} h-10 rounded-xl`}
            onClick={() => {
              feedback();
              go("contact");
            }}
          >
            Start a project <ArrowRight size={15} />
          </button>
        </>
      }
    >
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:max-w-[1000px]">
        {site.services.map((s, i) => (
          <article key={s.title} className={`${panel} flex flex-col p-5`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
              <span className="rounded-full bg-white/[0.07] px-2.5 py-1 font-mono text-[12px] font-semibold text-white">
                {s.price}
              </span>
            </div>
            <h2 className="mt-3 text-[16px] font-semibold tracking-[-0.01em] text-ink">{s.title}</h2>
            <p className="mt-1.5 flex-1 text-[13.5px] leading-[1.6] text-muted">{s.description}</p>
            <a href={enquiry(s.title)} onClick={feedback} className={`${buttonStyles.secondary} mt-4 w-fit`}>
              Enquire
            </a>
          </article>
        ))}
      </div>
    </Page>
  );
}
