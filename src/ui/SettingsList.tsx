import type { ReactNode } from "react";

/** macOS System Settings-style icon tile: a coloured rounded square with a white symbol. */
export function Tile({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[7px] shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_1px_2px_rgb(0_0_0/0.5)]"
      style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${color} 80%, white), ${color})` }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  );
}

export type TileSpec = { color: string; glyph: ReactNode };

/** A grouped, inset list like a System Settings pane. */
export function Group({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <dl className={`w-full divide-y divide-white/[0.06] rounded-xl bg-surface ring-1 ring-white/[0.08] ${className}`}>
      {children}
    </dl>
  );
}

/** One row: optional icon tile, label on the left, value on the right. */
export function Row({ tile, label, children }: { tile?: TileSpec; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 text-[13.5px]">
      {tile && <Tile color={tile.color}>{tile.glyph}</Tile>}
      <dt className="shrink-0 font-medium text-white">{label}</dt>
      <dd className="ml-auto min-w-0 text-right text-white">{children}</dd>
    </div>
  );
}
