"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { tap } from "@/lib/haptics";
import { playTick } from "@/lib/sound";

/** Every press gets the same soft click + Android tap. */
export function feedback() {
  playTick();
  tap();
}

/* ---------- plain buttons ---------- */

const base =
  "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-4 text-[13px] font-medium transition-[background-color,box-shadow,transform] duration-100 active:scale-[0.97] select-none";

export const buttonStyles = {
  primary: `${base} bg-ink text-[#0A0A0A] shadow-[0_1px_2px_rgb(0_0_0/0.4)] hover:bg-white`,
  secondary: `${base} bg-surface text-ink ring-1 ring-white/[0.09] hover:bg-surface-2 hover:ring-white/[0.14]`,
  ghost: `${base} px-2.5 text-ink/70 hover:bg-white/[0.06] hover:text-ink`,
} as const;

/* ---------- switch ---------- */

export function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative inline-flex h-[18px] w-[30px] shrink-0 items-center rounded-full transition-colors duration-200 ${
        on ? "bg-white" : "bg-white/[0.2]"
      }`}
    >
      <motion.span
        className={`absolute h-[14px] w-[14px] rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.3)] ${on ? "bg-[#0A0A0A]" : "bg-white"}`}
        animate={{ x: on ? 14 : 2 }}
        transition={{ type: "spring", stiffness: 600, damping: 34 }}
      />
    </span>
  );
}

/* ---------- small bits ---------- */

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-white/[0.07] bg-white/[0.05] px-2 py-[4px] font-mono text-[11px] leading-none text-muted">
      {children}
    </span>
  );
}

export function StatusDot({ tone = "white" }: { tone?: "white" | "ash" }) {
  const color = tone === "white" ? "bg-white shadow-[0_0_0_2px_rgb(255_255_255/0.14)]" : "bg-muted shadow-[0_0_0_2px_rgb(142_142_147/0.18)]";
  return <span aria-hidden className={`inline-block h-[7px] w-[7px] shrink-0 rounded-full ${color}`} />;
}

/** "I build things that actually work." → white lead + ash accent, Apple-headline style. */
export function Accent({ text, accent }: { text: string; accent: string }) {
  const at = text.lastIndexOf(accent);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="text-muted">{accent}</span>
    </>
  );
}
