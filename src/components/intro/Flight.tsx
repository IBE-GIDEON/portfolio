"use client";

import { useEffect, useEffectEvent, useId } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

/**
 * The paper plane, drawn in the same units as /cursors/plane.svg (28x18,
 * tip at 24,2) but rotated so the nose points along +x. That lets CSS
 * `offset-rotate: auto` steer it along the path nose-first; when the path
 * heads in the cursor's direction (2,-1) it looks exactly like the cursor.
 */
const NOSE_ANGLE = 26.565; // atan(1/2) in degrees
const VIEW = { x: -25, y: -8, w: 28, h: 18 }; // tip sits at (0,0)
const ANCHOR = `${(-VIEW.x / VIEW.w) * 100}% ${(-VIEW.y / VIEW.h) * 100}%`;

function Plane() {
  return (
    <svg
      width={VIEW.w}
      height={VIEW.h}
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      className="block overflow-visible drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.3)]"
      aria-hidden
    >
      <g transform={`rotate(${NOSE_ANGLE}) translate(-24 -2)`} strokeLinejoin="round">
        <path
          d="M24 2 L2 7.5 L7.5 9.1 L7.9 14.6 L10.9 11.4 L15.7 14.3 Z"
          fill="#1C1915"
          stroke="#1C1915"
          strokeWidth={1.6}
        />
        <path d="M24 2 L2 7.5 L7.5 9.1 Z" fill="#FFFFFF" />
        <path d="M24 2 L7.5 9.1 L7.9 14.6 L10.9 11.4 Z" fill="#C9C8C2" />
        <path d="M24 2 L10.9 11.4 L15.7 14.3 Z" fill="#F7F6F2" />
      </g>
    </svg>
  );
}

type FlightProps = {
  /** SVG path in viewport pixels. */
  d: string;
  /** Seconds. */
  duration: number;
  /** Plane scale at progress 0, 0.15, 0.85 and 1. */
  scales: [number, number, number, number];
  onDone: () => void;
};

/** Flies the plane along `d`, drawing a dashed trail that follows behind it. */
export function Flight({ d, duration, scales, onDone }: FlightProps) {
  const maskId = `trail-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const progress = useMotionValue(0);
  const distance = useTransform(progress, (p) => `${p * 100}%`);
  const scale = useTransform(progress, [0, 0.15, 0.85, 1], scales);
  // The trail only shows the last ~40% of the route, like a comet tail,
  // and fades out as the plane arrives.
  const tailStart = useTransform(progress, (p) => Math.max(0, p - 0.4));
  const tailLength = useTransform(progress, (p) => p - Math.max(0, p - 0.4));
  const trailOpacity = useTransform(progress, [0, 0.8, 1], [1, 1, 0]);

  const finish = useEffectEvent(onDone);

  useEffect(() => {
    const controls = animate(progress, 1, {
      duration,
      ease: [0.45, 0, 0.2, 1],
      onComplete: () => finish(),
    });
    return () => controls.stop();
  }, [progress, duration]);

  return (
    <>
      <svg className="pointer-events-none fixed inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">
            <motion.path
              d={d}
              fill="none"
              stroke="white"
              strokeWidth={10}
              strokeLinecap="round"
              style={{ pathLength: tailLength, pathOffset: tailStart }}
            />
          </mask>
        </defs>
        <motion.path
          d={d}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="7 8"
          mask={`url(#${maskId})`}
          style={{ opacity: trailOpacity }}
        />
      </svg>

      <motion.div
        className="pointer-events-none fixed left-0 top-0"
        style={{
          offsetPath: `path("${d}")`,
          offsetDistance: distance,
          offsetRotate: "auto",
          offsetAnchor: ANCHOR,
          transformOrigin: ANCHOR,
          scale,
        }}
      >
        <Plane />
      </motion.div>
    </>
  );
}
