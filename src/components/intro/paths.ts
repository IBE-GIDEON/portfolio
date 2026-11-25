/**
 * Flight paths for the intro's paper plane, in viewport pixels.
 *
 * The plane cursor points up-and-right along the direction (2, -1). Paths
 * start/end with that same tangent so the flying plane leaves from, and
 * lands back as, the real cursor without a visible jump.
 */

export type Point = { x: number; y: number };

const NOSE = { x: 2, y: -1 }; // cursor's nose direction
const OFFSCREEN = 160;

/** From the click point into a loop-the-loop, then off the top-right edge. */
export function takeoffPath(start: Point, w: number, h: number) {
  const r = Math.min(w, h) * 0.13; // loop radius
  const b = { x: w * 0.5, y: h * 0.62 }; // bottom of the loop
  const k = 55;

  return [
    `M ${start.x} ${start.y}`,
    `C ${start.x + NOSE.x * k} ${start.y + NOSE.y * k}, ${b.x - 2.2 * r} ${b.y}, ${b.x} ${b.y}`,
    // full circle, going up the right side first (two half-arcs)
    `A ${r} ${r} 0 0 0 ${b.x} ${b.y - 2 * r}`,
    `A ${r} ${r} 0 0 0 ${b.x} ${b.y}`,
    `C ${b.x + 2 * r} ${b.y}, ${w * 0.85} ${h * 0.3}, ${w + OFFSCREEN} ${-OFFSCREEN}`,
  ].join(" ");
}

/**
 * In from the left, a swoop beneath the name, then onto the pointer.
 * With no pointer (touch, keyboard start) it flies off the top-right instead.
 */
export function landingPath(target: Point | null, w: number, h: number) {
  const y = h * 0.72;
  const k = 70;
  const swoop = [
    `M ${-OFFSCREEN} ${h * 0.3}`,
    `C ${w * 0.15} ${h * 0.3}, ${w * 0.2} ${y}, ${w * 0.45} ${y}`,
  ];

  const end = target
    ? `C ${w * 0.7} ${y}, ${target.x - NOSE.x * k} ${target.y - NOSE.y * k}, ${target.x} ${target.y}`
    : `C ${w * 0.75} ${y}, ${w * 0.85} ${h * 0.3}, ${w + OFFSCREEN} ${-OFFSCREEN}`;

  return [...swoop, end].join(" ");
}
