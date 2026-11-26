import { useId } from "react";
import type { ExternalLink, SectionId } from "@/content/site";

/*
 * Original app icons for this site (not Apple's): a squircle with a soft
 * vertical gradient, a faint top highlight and a white glyph, drawn in a
 * 100×100 box so they scale cleanly from the dock to the phone grid.
 */

type Palette = { from: string; to: string };

const APP_PALETTE: Record<SectionId, Palette> = {
  overview: { from: "#EE9A78", to: "#C4603E" },
  about: { from: "#4A453F", to: "#1C1915" },
  projects: { from: "#F7CB72", to: "#E09B2D" },
  services: { from: "#72CF83", to: "#2E9E4F" },
  contact: { from: "#62B6F7", to: "#1E78DC" },
};

const glyph = { stroke: "white", strokeWidth: 7, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;

const APP_GLYPHS: Record<SectionId, React.ReactNode> = {
  overview: (
    <>
      <circle cx="50" cy="39" r="13" {...glyph} />
      <path d="M25 77c4-13 13-20 25-20s21 7 25 20" {...glyph} />
    </>
  ),
  about: (
    <>
      <circle cx="50" cy="30" r="6" fill="white" />
      <path d="M50 46v28" {...glyph} strokeWidth={9} />
    </>
  ),
  projects: (
    <path
      d="M22 35a4 4 0 0 1 4-4h16l7 7h25a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z"
      fill="white"
      fillOpacity={0.95}
    />
  ),
  services: (
    <>
      <path d="M40 38v-5a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v5" {...glyph} strokeWidth={6} />
      <rect x="22" y="38" width="56" height="36" rx="7" fill="white" fillOpacity={0.95} />
      <path d="M22 54h56" stroke="#2E9E4F" strokeWidth={4} strokeOpacity={0.5} />
    </>
  ),
  contact: (
    <>
      <rect x="22" y="31" width="56" height="40" rx="6" {...glyph} strokeWidth={6} />
      <path d="M25 35l25 19 25-19" {...glyph} strokeWidth={6} />
    </>
  ),
};

function Squircle({ size, palette, children }: { size: number | "100%"; palette: Palette; children: React.ReactNode }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden className="block">
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.from} />
          <stop offset="1" stopColor={palette.to} />
        </linearGradient>
        <linearGradient id={`hi${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity={0.28} />
          <stop offset="0.5" stopColor="white" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill={`url(#bg${id})`} />
      <rect width="100" height="100" rx="22" fill={`url(#hi${id})`} />
      <rect x="0.5" y="0.5" width="99" height="99" rx="21.5" fill="none" stroke="white" strokeOpacity={0.12} />
      {children}
    </svg>
  );
}

export function AppIcon({ id, size }: { id: SectionId; size: number | "100%" }) {
  return (
    <Squircle size={size} palette={APP_PALETTE[id]}>
      {APP_GLYPHS[id]}
    </Squircle>
  );
}

/**
 * The real brand marks in their own colours (dark-background versions):
 * GitHub and X in white, LinkedIn's blue "in", Facebook's blue "f",
 * Instagram's gradient camera, WhatsApp's green bubble.
 */
export function LinkIcon({ id, size }: { id: ExternalLink["id"]; size: number | "100%" }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const box = { width: size, height: size, "aria-hidden": true, className: "block" } as const;

  if (id === "facebook") {
    return (
      <svg {...box} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11.6" fill="#FFFFFF" />
        <path
          fill="#0866FF"
          d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
        />
      </svg>
    );
  }

  if (id === "instagram") {
    return (
      <svg {...box} viewBox="0 0 24 24">
        <defs>
          <radialGradient id={`ig${uid}`} cx="0.3" cy="1.07" r="1.3">
            <stop offset="0" stopColor="#FFDD55" />
            <stop offset="0.1" stopColor="#FFDD55" />
            <stop offset="0.5" stopColor="#FF543E" />
            <stop offset="1" stopColor="#C837AB" />
          </radialGradient>
          <radialGradient id={`ig2${uid}`} cx="-0.17" cy="0.07" r="0.6">
            <stop offset="0" stopColor="#3771C8" />
            <stop offset="0.13" stopColor="#3771C8" />
            <stop offset="1" stopColor="#6600FF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="24" height="24" rx="6.5" fill={`url(#ig${uid})`} />
        <rect width="24" height="24" rx="6.5" fill={`url(#ig2${uid})`} />
        <rect x="5" y="5" width="14" height="14" rx="4.2" fill="none" stroke="#FFFFFF" strokeWidth="1.9" />
        <circle cx="12" cy="12" r="3.3" fill="none" stroke="#FFFFFF" strokeWidth="1.9" />
        <circle cx="16.3" cy="7.7" r="1.05" fill="#FFFFFF" />
      </svg>
    );
  }


  if (id === "whatsapp") {
    return (
      <svg {...box} viewBox="0 0 24 24">
        <path
          fill="#25D366"
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"
        />
      </svg>
    );
  }

  if (id === "github") {
    return (
      <svg {...box} viewBox="0 0 16 16" fill="#FFFFFF">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
      </svg>
    );
  }

  if (id === "linkedin") {
    return (
      <svg {...box} viewBox="0 0 24 24">
        <rect width="24" height="24" rx="4" fill="#0A66C2" />
        <path
          fill="#FFFFFF"
          d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zM7.119 20.452H3.555V9h3.564v11.452z"
        />
      </svg>
    );
  }

  return (
    <svg {...box} viewBox="0 0 24 24" fill="#FFFFFF">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** The paper plane, as a small single-colour glyph for the menu bar. */
export function PlaneGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size * (18 / 28)} viewBox="0 0 28 18" aria-hidden className="block">
      <path d="M24 2 L2 7.5 L7.5 9.1 Z" fill="currentColor" />
      <path d="M24 2 L7.5 9.1 L7.9 14.6 L10.9 11.4 Z" fill="currentColor" fillOpacity={0.55} />
      <path d="M24 2 L10.9 11.4 L15.7 14.3 Z" fill="currentColor" fillOpacity={0.85} />
    </svg>
  );
}

export function SpeakerIcon({ on, size = 14 }: { on: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden className="block">
      <path d="M2.5 6h2.2L8 3.2v9.6L4.7 10H2.5z" fill="currentColor" />
      {on ? (
        <path
          d="M10.5 5.5a3.5 3.5 0 0 1 0 5M12.3 3.8a6 6 0 0 1 0 8.4"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      ) : (
        <path d="M10.5 6l4 4M14.5 6l-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      )}
    </svg>
  );
}
