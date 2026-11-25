# Portfolio as a macOS-style desktop: design

Date: 2026-11-25 · Status: approved direction ("Go with A"), details below are the agreed design plus marked builder calls.

## Intent

Gideon's portfolio (full-stack and AI engineer, Port Harcourt, working globally) should feel like using a clean, mature, native Mac app: cream, calm, 3D depth, sound and haptic-style feedback. It replaces a scrolling one-pager. The old site's content (about, stack, projects, services with prices, contact) carries over; its copy lives in git history at commit `961bd73:index.html`.

The audience was never stated. The old site sells freelance services with prices, so this design assumes **prospective clients** are the main visitors, with developers/designers second. *(Builder call; revisit if Gideon says otherwise.)*

## Goals

- After the intro, land on a Mac-like desktop where the work and a way to hire Gideon are one click away.
- Feel native: menu bar, dock with magnification, real window behaviour (focus, drag, close, minimise, zoom), spring motion, soft UI sounds, Android vibration.
- Clean and mature: restraint over decoration. Glass only where macOS uses it.
- No CMS: all copy in one typed data file in the repo.
- Works on phones as an iPhone-style home screen.

## Non-goals

- CMS, blog, accounts, a backend, or a contact form (email link only).
- Dark mode (cream only for now).
- A pixel copy of macOS. No Apple logo, no Apple icon art, no SF Pro font files, no Apple sound recordings.

## Anti-goals (failure even if it "works")

- A gimmick that hides the work: a client can't find projects or "Hire me" within one click of landing.
- Laggy or janky motion, or sound that can't be turned off.
- Glass and effects everywhere, so it reads busy instead of mature.

## Constraints (already decided and built)

- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4, Motion, React Three Fiber + Drei.
- One fixed screen, never scrolls (`html, body { overflow: hidden }`); navigation swaps what's shown.
- Cream background `#FBF8F1`; ink `#1C1915`; muted `#6E675D`; coral accent `#C4603E`.
- Font: system SF stack (real SF Pro on Apple devices), Inter / Geist Mono as fallbacks.
- Paper-plane native CSS cursor (`public/cursors`), coral variant on clickables.
- Intro (`src/components/intro`): click-to-start gate → plane takeoff → "GIDEON DA CRITIC" typed with synthesized key sounds → plane lands as the cursor → fade. Sound helpers in `src/lib/sound.ts`, haptics in `src/lib/haptics.ts`. Browsers block audio until a gesture, which the gate provides.

## Approaches considered

| | Approach | Trade-off |
|---|---|---|
| **A (picked)** | Desktop: menu bar + dock + a Profile window already open | Most Mac-native and gives room for 3D; needs a small window manager and a separate phone layout. |
| B | One app window with a sidebar (like System Settings) | Calmest and most businesslike, simplest to build; less "wow", less room for 3D. |
| C | Widget dashboard of tiles | Everything at a glance, but crowded; works against "clean and mature". |

Gideon picked A.

## Design

### Desktop layout (≥ 768px wide)

```
┌──────────────────────────────────────────────────────────────────┐
│ ✈ Gideon Ibe  About  Projects  Services  Contact   ● Available 🔊 Wed 25 Nov 14:32 │  ← menu bar (glass)
│                                                                  │
│          ┌──────────── Gideon Ibe ────────────┐                  │
│          │ ● ● ●                               │                  │
│          │  (GI)  Gideon Ibe                   │  ← Profile window│
│          │        Full-stack engineer & AI ... │    open on arrival│
│          │  ● Available for freelance work     │                  │
│          │  [ View work ]  [ Hire me ]         │                  │
│          │  6+ yrs · 2 products · 19 yrs old   │                  │
│          └─────────────────────────────────────┘                  │
│        (3D paper-plane wallpaper, milestone 2)                   │
│             ┌──────────────────────────────────┐                 │
│             │ 👤  ℹ  📁  💼  ✉  │  GH  in  X   │  ← dock (glass)  │
│             └──────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────────┘
```

**Menu bar** (top, ~28px, glass): paper-plane glyph, bold "Gideon Ibe", then About / Projects / Services / Contact (each opens or focuses its window). Right side: green "Available" dot, sound on/off toggle, visitor's local date and time.

**Dock** (bottom centre, glass): Profile, About, Projects, Services, Contact, a divider, then GitHub, LinkedIn, X (open in a new tab). macOS-style magnification on hover, name tooltip, a small dot under apps whose window is open, a little bounce on click. App icons are original squircle icons drawn for this site, not Apple's.

**Windows**: rounded (~12px), soft layered shadow, title bar with traffic lights (close, minimise, zoom) and centred title. Drag by the title bar, constrained to the area between menu bar and dock. Clicking a window brings it to the front; inactive windows grey their traffic lights. Open springs out from its dock icon; close shrinks away; minimise shrinks into the dock; zoom fills the desktop area and toggles back. Opening an already-open window focuses it. New windows cascade so they don't stack exactly.

**On arrival**: when the intro fades, the Profile window springs open in the centre.

### Window contents (all copy from `src/content/site.ts`)

- **Profile**: avatar (initials "GI" until a photo is supplied), name, "Full-stack engineer & AI builder", one-line pitch, "Available for freelance work" with green dot, "Port Harcourt · local time HH:MM (WAT)", primary **View work** (opens Projects) and secondary **Hire me** (opens Contact), stats row (6+ yrs self-taught, 2 products in market, 19 years old).
- **About**: "I build things that actually work.", the three paragraphs, and the Stack in four groups (Backend, Frontend, AI & LLMs, Product & Design) as tags.
- **Projects** (Finder-like): glass sidebar listing Three AI, HomBox, Custom AI Integrations; detail pane with status badge, name, description, stack tags and a View / Inquire button (Inquire opens Contact).
- **Services**: four cards (Full-Stack Development $800+, AI Integration $500+, MVP Development $1,200+, Technical Consulting $60/hr) and a "Start a project" button that opens Contact.
- **Contact** (Mail-like): "Let's build something.", the availability line, "Response within 24 hours", an email button, and LinkedIn / GitHub / X links.

Email address: the old site *showed* `gideon@gmail.com` but *linked* `shytersnicks@gmail.com`. Use the working link address and flag it to Gideon. *(Builder call.)*

### Phone layout (< 768px)

Slim status bar (time, sound toggle). Home screen: a Profile widget at the top (avatar, name, role, availability, View work / Hire me), a grid of app icons (About, Projects, Services, Contact) and a bottom dock row (GitHub, LinkedIn, X, Mail). Tapping an app slides a full-screen sheet up with a spring; "Done" or a downward swipe closes it. No dragging windows on phones.

### Sound, haptics, motion

- Reuse the synthesized Web Audio engine. Add: soft "pop" on window open, softer close, a tick for menu and dock clicks, a quiet whoosh on minimise.
- Sound toggle in the menu bar / status bar, remembered in `localStorage`, default on.
- `tap()` vibration on presses (Android only; elsewhere sound plus motion carry the feel).
- Motion uses springs (Motion). With `prefers-reduced-motion`: no magnification, no springs, windows appear and disappear with a short fade.

### Glass

Only on the menu bar, dock, Projects sidebar and tooltips: translucent white, `backdrop-filter: blur(~20px) saturate(~180%)`, a light inner hairline and a faint outer border. Window bodies are solid near-white for readability.

### 3D (milestone 2)

A React Three Fiber scene as the wallpaper: a few white paper planes gliding slowly in soft light on cream, with gentle parallax toward the pointer. Loaded lazily after the intro so first paint stays fast; static under reduced motion. Plus small CSS 3D touches: windows open with slight perspective, dock icons tilt toward the pointer.

## Milestones

1. **Desktop shell**: content file, menu bar, dock, window manager, all five windows, sounds/haptics/toggle, phone layout, intro handoff.
2. **3D and polish**: wallpaper scene, perspective touches, final tuning of sounds and springs.

## Left to the builder

Exact spacing, shadow and blur values, spring constants, icon artwork, cascade offsets, and component structure, within the rules above.

## Open with Gideon

- Who the site is mainly for (assumed clients).
- A profile photo, if he wants one instead of initials.
- Confirm the contact email.
