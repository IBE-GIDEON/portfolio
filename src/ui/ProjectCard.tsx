"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { projectImage } from "@/content/images";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import type { Project, ProjectGroupId } from "@/content/site";
import { StatusDot } from "./controls";
import { ridgeline } from "./ridgeline";

/** Monochrome per group: white lines for products, ash for client work. */
export const TONES: Record<ProjectGroupId, { bg: string; line: string; square: string }> = {
  products: { bg: "#151515", line: "#FFFFFF", square: "#FFFFFF" },
  client: { bg: "#151515", line: "#A1A1A6", square: "#8E8E93" },
};

export const STATUS_LABEL = { building: "In development", shipped: "Shipped" } as const;

const ART_WIDTH = 480;

/**
 * A screenshot that sits on its own blurred preview and fades in once ready.
 * Served as-is (already optimised by `npm run images`) and never lazy-loaded,
 * so with the background preload it appears instantly.
 */
function Shot({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  const [ready, setReady] = useState(false);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized
      loading="eager"
      decoding="async"
      // Already in the cache? Show it straight away (onLoad may have fired before hydration).
      ref={(el) => {
        if (el?.complete && el.naturalWidth > 0) setReady(true);
      }}
      onLoad={() => setReady(true)}
      className={`object-cover object-top transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.035] ${
        ready ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

/**
 * The picture at the top of a card or the detail panel: the product's
 * homepage screenshot (16:10), or generated line art when there isn't one.
 */
export function ProjectVisual({ project, sizes }: { project: Project; sizes: string }) {
  const image = projectImage(project);
  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden bg-[#0d0d0d] bg-cover bg-top"
      style={image?.blur ? { backgroundImage: `url(${image.blur})` } : undefined}
    >
      {image ? (
        <Shot src={image.src} alt={`${project.name} homepage`} sizes={sizes} />
      ) : (
        <ProjectArt project={project} height={300} fill />
      )}
    </div>
  );
}

/** Wavy-line art drawn at the height it's shown, so taller art gets more lines, not stretched ones. */
export function ProjectArt({ project, height = 200, fill = false }: { project: Project; height?: number; fill?: boolean }) {
  const tone = TONES[project.group];
  const ridges = useMemo(
    () =>
      ridgeline(project.id, {
        width: ART_WIDTH,
        height,
        lines: Math.min(14, Math.max(9, Math.round(height / 14))),
      }),
    [project.id, height],
  );

  return (
    <svg
      viewBox={`0 0 ${ART_WIDTH} ${height}`}
      preserveAspectRatio="none"
      className="block w-full"
      style={{ height: fill ? "100%" : height }}
      aria-hidden
    >
      <rect width={ART_WIDTH} height={height} fill={tone.bg} />
      <g className="origin-bottom transition-transform duration-700 ease-out group-hover:scale-y-[1.08]">
        {ridges.map((r, i) => (
          <g key={i}>
            <path d={r.area} fill={tone.bg} />
            <path
              d={r.line}
              fill="none"
              stroke={tone.line}
              strokeOpacity={0.3 + (0.55 * i) / ridges.length}
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

function LiveBadge() {
  return (
    <span className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-ink/90">
      <StatusDot />
      Live preview
    </span>
  );
}

/**
 * Apple Card-style project card: a frosted glass slab with a lit top edge,
 * a sheen that slides across it and a glare that follows the pointer. It
 * tilts in 3D, and its layers (art, text, badge) sit at different depths so
 * they shift against each other as it moves.
 */
export function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const reduce = useReducedMotion();
  // Pointer position over the card, 0..1 (centre at rest).
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 20, mass: 0.6 };
  const rotateY = useSpring(useTransform(px, [0, 1], [-10, 10]), spring);
  const rotateX = useSpring(useTransform(py, [0, 1], [8, -8]), spring);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const sheenX = useTransform(px, (v) => `${(1 - v) * 100}% 50%`);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgb(255 255 255 / 0.22), rgb(255 255 255 / 0.06) 35%, transparent 60%)`;
  const live = "href" in project.action;

  const lean = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };

  const rest = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      onPointerMove={lean}
      onPointerLeave={rest}
      whileHover={reduce ? undefined : { y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 1000, transformStyle: "preserve-3d" }}
      className="group relative block w-full rounded-[22px] p-2.5 text-left outline-none transition-shadow duration-300 focus-visible:ring-2 focus-visible:ring-white
        bg-[linear-gradient(150deg,rgb(255_255_255/0.10),rgb(255_255_255/0.03)_45%,rgb(255_255_255/0.015))]
        shadow-[inset_0_1px_0_rgb(255_255_255/0.18),inset_0_0_0_1px_rgb(255_255_255/0.08),0_20px_40px_-24px_rgb(0_0_0/1)]
        backdrop-blur-xl hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.25),inset_0_0_0_1px_rgb(255_255_255/0.14),0_40px_70px_-30px_rgb(0_0_0/1)]"
    >
      {/* Sheen: a soft diagonal band of light that slides as the card tilts. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[22px] opacity-60 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(115deg, transparent 30%, rgb(255 255 255 / 0.06) 44%, rgb(255 255 255 / 0.14) 50%, rgb(255 255 255 / 0.05) 56%, transparent 70%)",
          backgroundSize: "250% 100%",
          backgroundPosition: sheenX,
          mixBlendMode: "screen",
        }}
      />

      <div className="relative overflow-hidden rounded-[15px] ring-1 ring-white/[0.08]" style={{ transform: "translateZ(18px)" }}>
        <ProjectVisual project={project} sizes="(max-width: 768px) 100vw, 480px" />
      </div>

      {live && (
        <span className="absolute right-5 top-5" style={{ transform: "translateZ(48px)" }}>
          <LiveBadge />
        </span>
      )}

      <div className="relative px-3 pt-4 pb-3" style={{ transform: "translateZ(30px)" }}>
        <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">{project.name}</h3>
        <p className="mt-1 text-[14px] text-muted">{project.category}</p>
        <span className="mt-4 flex items-center gap-2 text-[13px] text-muted">
          <StatusDot tone={project.status === "shipped" ? "white" : "ash"} />
          {STATUS_LABEL[project.status]}
        </span>
      </div>

      {/* Glare that follows the pointer, like light catching a card. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundImage: glare, mixBlendMode: "screen", transform: "translateZ(60px)" }}
      />
    </motion.button>
  );
}
