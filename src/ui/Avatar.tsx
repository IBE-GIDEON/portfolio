import Image from "next/image";
import { site } from "@/content/site";

/** Feathers a dark photo's edge into the black page instead of a hard circle. */
const BLEND_MASK = "radial-gradient(circle at 50% 46%, #000 56%, rgb(0 0 0 / 0.55) 64%, transparent 71%)";

/**
 * Your picture, round like a macOS account photo. Uses `site.photo` when set,
 * otherwise white initials. `blend` fades the photo's edge into the black page
 * (used for the big portraits); small ones stay crisp circles.
 */
export function Avatar({
  size = 32,
  online = false,
  blend = false,
}: {
  size?: number;
  online?: boolean;
  blend?: boolean;
}) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }} aria-hidden>
      {site.photo ? (
        <span
          className={`relative block h-full w-full overflow-hidden rounded-full ${
            blend ? "" : "shadow-[0_2px_10px_rgb(0_0_0/0.6)] ring-1 ring-white/[0.12]"
          }`}
          style={blend ? { WebkitMaskImage: BLEND_MASK, maskImage: BLEND_MASK } : undefined}
        >
          <Image
            src={site.photo}
            alt=""
            fill
            sizes={`${size}px`}
            unoptimized
            preload={size > 64}
            className="object-cover object-[50%_30%]"
          />
        </span>
      ) : (
        <span
          className="grid h-full w-full place-items-center rounded-full bg-gradient-to-b from-[#FFFFFF] to-[#C7C7CC] font-semibold tracking-[-0.02em] text-[#0A0A0A] shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_2px_8px_rgb(0_0_0/0.5)]"
          style={{ fontSize: size * 0.36 }}
        >
          GI
        </span>
      )}
      {online && (
        <span
          className="absolute rounded-full bg-white ring-[3px] ring-black"
          style={{
            width: Math.max(8, size * 0.16),
            height: Math.max(8, size * 0.16),
            right: size * (blend && site.photo ? 0.16 : 0.06),
            bottom: size * (blend && site.photo ? 0.16 : 0.06),
          }}
        />
      )}
    </span>
  );
}
