/**
 * Generative "ridgeline" art for card headers: stacked wavy lines with soft
 * peaks, like a sound wave seen in 3D. Seeded, so each project always gets
 * the same picture.
 */

export type Ridge = {
  /** The visible line. */
  line: string;
  /** The line closed down to the bottom edge, filled to hide the lines behind. */
  area: string;
};

type Options = { width: number; height: number; lines?: number; points?: number };

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small, fast seeded random generator (mulberry32). */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lines from back (top) to front (bottom); draw in order so front ones overlap. */
export function ridgeline(seed: string, { width, height, lines = 9, points = 64 }: Options): Ridge[] {
  const rand = seeded(hash(seed));
  const top = height * 0.3;
  const bottom = height * 0.92;
  const gap = (bottom - top) / Math.max(1, lines - 1);
  const ridges: Ridge[] = [];

  for (let i = 0; i < lines; i++) {
    const base = top + i * gap;
    // Middle lines get the tallest peaks, like the classic pulsar plot.
    const envelope = Math.sin((Math.PI * (i + 1)) / (lines + 1));
    const bumps = Array.from({ length: 1 + Math.floor(rand() * 2) }, () => ({
      centre: 0.22 + rand() * 0.56,
      spread: 0.04 + rand() * 0.07,
      lift: (0.15 + rand() * 0.85) * height * 0.3 * envelope,
    }));

    const coords: string[] = [];
    for (let k = 0; k <= points; k++) {
      const t = k / points;
      let lift = 0;
      for (const b of bumps) lift += b.lift * Math.exp(-(((t - b.centre) / b.spread) ** 2));
      const y = Math.min(height, Math.max(0, base - lift));
      coords.push(`${(t * width).toFixed(1)} ${y.toFixed(1)}`);
    }

    const line = `M ${coords.join(" L ")}`;
    ridges.push({ line, area: `${line} L ${width} ${height} L 0 ${height} Z` });
  }

  return ridges;
}
