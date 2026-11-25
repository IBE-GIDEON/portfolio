"use client";

import { motion, useReducedMotion } from "motion/react";
import { site } from "@/content/site";
import { localTimeIn } from "@/lib/time";
import { useNow } from "@/lib/useNow";
import { Avatar } from "@/ui/Avatar";
import { Group, Row, type TileSpec } from "@/ui/SettingsList";

const ICONS: Record<string, TileSpec> = {
  status: { color: "#30D158", glyph: <path d="M6 12.5l4 4 8-9" /> },
  location: {
    color: "#0A84FF",
    glyph: (
      <>
        <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" />
        <circle cx="12" cy="11" r="2" />
      </>
    ),
  },
  time: {
    color: "#FF9F0A",
    glyph: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4.5l3 2" />
      </>
    ),
  },
  experience: { color: "#BF5AF2", glyph: <path d="M9 7.5L4.5 12 9 16.5M15 7.5l4.5 4.5-4.5 4.5" /> },
  age: {
    color: "#FF375F",
    glyph: (
      <>
        <rect x="5" y="12" width="14" height="7.5" rx="1.5" />
        <path d="M12 12V9M12 5.5v.5" />
      </>
    ),
  },
};

/** Your profile, laid out like the account page in macOS System Settings. */
export function Overview() {
  const now = useNow(30_000);
  const reduce = useReducedMotion();
  const years = site.stats.find((s) => s.label.includes("self-taught"))?.value;
  const age = site.stats.find((s) => s.label.includes("years old"))?.value;

  return (
    <div className="flex min-h-full flex-col items-center px-4 pt-12 pb-16 md:pt-16">
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.92, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        whileHover={reduce ? undefined : { scale: 1.03 }}
      >
        <Avatar size={176} online blend />
      </motion.div>

      <h1 className="mt-5 text-center text-[28px] font-semibold tracking-[-0.025em] text-ink">{site.name}</h1>
      <p className="mt-1 text-center text-[14px] text-muted">{site.role}</p>
      <span className="mt-3 rounded-full bg-white/[0.06] px-3 py-1 text-[12px] font-medium text-muted">
        aka {site.alias}
      </span>

      <p className="mt-6 max-w-[48ch] text-center text-[15px] leading-[1.6] text-ink/75">{site.pitch}</p>

      <Group className="mt-8 max-w-[540px]">
        <Row tile={ICONS.status} label="Status">
          {site.availability}
        </Row>
        <Row tile={ICONS.location} label="Based in">
          {site.location}
        </Row>
        <Row tile={ICONS.time} label="Local time">
          <span className="tabular-nums">{now ? localTimeIn(now, site.timeZone) : "--:--"}</span>
        </Row>
        {years && (
          <Row tile={ICONS.experience} label="Experience">
            {years} years, self-taught
          </Row>
        )}
        {age && (
          <Row tile={ICONS.age} label="Age">
            {age}
          </Row>
        )}
      </Group>
    </div>
  );
}
