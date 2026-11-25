# Mac Desktop Shell (Milestone 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After the intro, the visitor lands on a macOS-style desktop (glass menu bar, magnifying glass dock, draggable windows with a Profile window open), with all portfolio content in windows, UI sounds with a toggle, and an iPhone-style home screen on phones.

**Architecture:** One client component (`Experience`) owns a pure window-manager reducer and renders the intro, then either the desktop (≥768px) or the phone home screen. All copy lives in one typed data file. Window geometry, clock formatting, dock magnification and sound preferences are pure functions with Vitest tests; visual behaviour is checked in the browser.

**Tech Stack:** Next.js 16.4 (App Router), React 19.3, TypeScript, Tailwind v4, Motion 14 (`motion/react`), Web Audio (existing `src/lib/sound.ts`), Vitest (new).

**Spec:** `docs/superpowers/specs/2026-11-25-mac-desktop-design.md`

## Global Constraints

- Read the relevant guide in `node_modules/next/dist/docs/` before using a Next.js API (per `AGENTS.md`).
- Page never scrolls; everything fits one screen. Phone layout below `768px` wide.
- Colours: cream `#FBF8F1`, ink `#1C1915` (`text-ink`), muted `#6E675D` (`text-muted`), coral `#C4603E` (`bg-coral`/`text-coral`). Availability green `#28C840`.
- Font: existing system SF stack (`font-sans`, `font-mono`); no font files added.
- No Apple logo, Apple icon art, SF Pro files or Apple sound recordings. Traffic-light colours `#FF5F57`, `#FEBC2E`, `#28C840`; inactive `#D9D6CF`.
- Glass only on: menu bar, dock, Projects sidebar, tooltips.
- Respect `prefers-reduced-motion` (`useReducedMotion()` from `motion/react`): no magnification, no springs, short fades.
- External links: `target="_blank" rel="noopener noreferrer"`.
- Copy is verbatim from `git show 961bd73:index.html` unless this plan says otherwise. Contact email is `shytersnicks@gmail.com`.
- Lint rules from `eslint-config-next` 16 (React Compiler hooks rules): no synchronous `setState`/`dispatch` in effect bodies, no reading `ref.current` during render, no `Math.random` in render.
- Commits only when Gideon asks; commit steps below mark checkpoints.

## Review Focus

1. **Browser resized smaller with windows open** → windows stay reachable (title bar inside the desktop area). Pinned by the `fit` reducer test in Task 3.
2. **Rapid double-click on a dock icon / menu item** → one window, not two; a re-open restores a minimised window. Pinned by "open is idempotent" tests in Task 3.
3. **Window dragged under the menu bar or off-screen** → it stops so its title bar can still be grabbed. Pinned by the `move` clamp tests in Task 3.
4. **Sound turned off, then page reloaded** → stays off, including the intro's key clicks. Pinned by `readSoundPref`/`writeSoundPref` tests in Task 2 plus all `play*` functions checking the enabled flag.
5. **Closing the last window** → nothing focused, menu bar still works, dock dots cleared. Pinned by the close-last test in Task 3.

---

### Task 1: Test runner and content file

**Files:**
- Create: `vitest.config.mts`, `src/content/site.ts`, `src/content/site.test.ts`
- Modify: `package.json` (devDependency `vitest`, script `"test": "vitest run"`)

**Interfaces:**
- Produces: `export const site` (`as const` object, named export) and types `AppId`, `ProjectStatus`, `Project`, `Service`, `ExternalLink` from `src/content/site.ts`:
  - `type AppId = "profile" | "about" | "projects" | "services" | "contact"`
  - `site.name` "Gideon Ibe", `site.alias` "Gideon Da Critic", `site.role` "Full-stack engineer & AI builder", `site.pitch` (old hero sentence after the role), `site.location` "Port Harcourt, Nigeria", `site.timeZone` "Africa/Lagos", `site.availability` "Available for freelance work"
  - `site.stats: {value: string; label: string}[]` (6+, 2, 19)
  - `site.about: {headline: "I build things that actually work."; paragraphs: string[3]}`
  - `site.stack: {group: string; items: string[]}[]` (Backend, Frontend, AI & LLMs, Product & Design)
  - `site.projects: Project[]` where `Project = {id: string; name: string; status: "building" | "shipped"; description: string; stack: string[]; action: {label: "View"; href: string} | {label: "Inquire"; opens: AppId}}`
  - `site.services: Service[]` where `Service = {title: string; description: string; price: string}`
  - `site.contact: {headline: "Let's build something."; body: string; responseTime: "Response within 24 hours"; email: string}`
  - `site.links: ExternalLink[]` where `ExternalLink = {id: "github" | "linkedin" | "x"; label: string; href: string}`

- [ ] **Step 1:** `npm install -D vitest`; add `"test": "vitest run"`; create `vitest.config.mts` with `resolve.alias { "@": "<abs>/src" }` and `test.environment: "node"`.
- [ ] **Step 2: Write the failing test** `src/content/site.test.ts`:

```ts
import { site } from "@/content/site";
test("services keep the published prices", () => {
  expect(site.services.map((s) => s.price)).toEqual([
    "From $800 / project", "From $500 / integration", "From $1,200 / MVP", "$60 / hour",
  ]);
});
test("projects and their actions", () => {
  expect(site.projects.map((p) => p.name)).toEqual(["Three AI", "HomBox", "Custom AI Integrations"]);
  expect(site.projects.map((p) => p.status)).toEqual(["building", "building", "shipped"]);
  expect(site.projects[2].action).toEqual({ label: "Inquire", opens: "contact" });
});
test("contact and links", () => {
  expect(site.contact.email).toBe("shytersnicks@gmail.com");
  expect(site.links.map((l) => l.href)).toEqual([
    "https://github.com/IBE-GIDEON",
    "https://www.linkedin.com/in/gideon-chinemerem-3037a43a3/",
    "https://x.com/Tech_zealot",
  ]);
  for (const p of site.projects) if ("href" in p.action) expect(p.action.href).toMatch(/^https:\/\//);
});
```

- [ ] **Step 3:** `npm test` → FAIL (module not found).
- [ ] **Step 4:** Create `src/content/site.ts` with the interface above, copy verbatim from the old site (Three AI href `https://main-app-sigma-virid.vercel.app`, HomBox `https://hom-box.vercel.app/`).
- [ ] **Step 5:** `npm test` → 3 passed. `npx tsc --noEmit` → no output.
- [ ] **Step 6: Commit** `feat: add content file and vitest`

### Task 2: Clock formatting and sound settings

**Files:**
- Create: `src/lib/time.ts`, `src/lib/time.test.ts`, `src/lib/soundPrefs.ts`, `src/lib/soundPrefs.test.ts`
- Modify: `src/lib/sound.ts`

**Interfaces:**
- Produces:
  - `formatMenuClock(date: Date, opts?: {locale?: string; timeZone?: string}): string` → `"<weekday> <day> <month> <HH>:<mm>"` built from `Intl.DateTimeFormat#formatToParts` (24-hour, short weekday/month).
  - `localTimeIn(date: Date, timeZone: string, locale?: string): string` → `"HH:mm"` 24-hour.
  - `readSoundPref(storage: Pick<Storage, "getItem"> | null): boolean` (default `true`), `writeSoundPref(storage: Pick<Storage, "setItem"> | null, on: boolean): void`, key `"gideon:sound"`, values `"on"`/`"off"`.
  - In `sound.ts`: `setSoundEnabled(on: boolean): void`, `getSoundEnabled(): boolean`, `subscribeSound(cb: () => void): () => void`, `useSoundEnabled(): boolean` (via `useSyncExternalStore`, server snapshot `true`), and new effects `playPop()`, `playClose()`, `playTick()`, `playMinimize()`. On first import in the browser, initialise the flag from `readSoundPref(localStorage)`. Every `play*` (including existing `playKey`, `playWhoosh`) returns early when disabled. `setSoundEnabled` writes the pref and notifies subscribers.

- [ ] **Step 1: Write the failing tests**

```ts
// time.test.ts
const d = new Date("2026-11-25T13:32:00Z");
test("menu clock", () =>
  expect(formatMenuClock(d, { locale: "en-GB", timeZone: "Africa/Lagos" })).toBe("Wed 25 Nov 14:32"));
test("Port Harcourt time", () => expect(localTimeIn(d, "Africa/Lagos", "en-GB")).toBe("14:32"));

// soundPrefs.test.ts
const mem = (v: string | null) => ({ getItem: () => v, setItem: vi.fn() });
test("defaults on", () => { expect(readSoundPref(null)).toBe(true); expect(readSoundPref(mem(null))).toBe(true); });
test("reads off", () => expect(readSoundPref(mem("off"))).toBe(false));
test("writes", () => { const s = mem(null); writeSoundPref(s, false); expect(s.setItem).toHaveBeenCalledWith("gideon:sound", "off"); });
```

- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement `time.ts` and `soundPrefs.ts` as specified; extend `sound.ts`. Effects: pop = short sine blip ~880→1320 Hz, 80 ms, gain 0.12; close = ~660→440 Hz, 70 ms, gain 0.08; tick = noise tick ~4 kHz, 15 ms, gain 0.18 (reuse `tick()`); minimize = `playWhoosh(0.35)` at half gain.
- [ ] **Step 4:** `npm test` → all pass; `npx tsc --noEmit` clean.
- [ ] **Step 5: Commit** `feat: clock formatting and persistent sound toggle`

### Task 3: Window manager reducer and geometry

**Files:**
- Create: `src/desktop/windows.ts`, `src/desktop/windows.test.ts`

**Interfaces:**
- Consumes: `AppId` from Task 1.
- Produces:
  - `type Rect = {x: number; y: number; w: number; h: number}`
  - `MENU_BAR_H = 28`, `DOCK_RESERVE = 88`, `TITLE_BAR_H = 28`, `CASCADE = 28`, `ZOOM_INSET = 8`, `GRAB_MIN = 80`
  - `APP_SIZES: Record<AppId, {w: number; h: number}>` = profile 520×400, about 640×540, projects 780×520, services 740×540, contact 520×440
  - `desktopArea(vw: number, vh: number): Rect` = `{x: 0, y: 28, w: vw, h: vh - 28 - 88}`
  - `placeWindow(size, area: Rect, cascadeIndex: number): Rect` — centred in area, offset `+28·(i % 6)` on x and y, size shrunk to `area - 16` if larger.
  - `clampWindow(rect: Rect, area: Rect): Rect` — `y ∈ [area.y, area.y + area.h - 28]`, `x ∈ [area.x - w + 80, area.x + area.w - 80]`.
  - `type WinState = {id: AppId; rect: Rect; z: number; minimized: boolean; zoomed: boolean; restoreRect: Rect | null}`
  - `type DesktopState = {windows: WinState[]; focused: AppId | null; topZ: number; opened: number}`; `initialDesktop: DesktopState` (empty, topZ 0, opened 0)
  - `type DesktopAction = {type:"open"; id; area} | {type:"close"; id} | {type:"focus"; id} | {type:"minimize"; id} | {type:"toggleZoom"; id; area} | {type:"move"; id; x; y; area} | {type:"fit"; area}`
  - `desktopReducer(state: DesktopState, action: DesktopAction): DesktopState`
  - Focus rule after close/minimise: highest-`z` window that is not minimised, else `null`.

- [ ] **Step 1: Write the failing tests** (area `A = desktopArea(1440, 900)` = `{x:0,y:28,w:1440,h:784}`):
  - `open profile` → 1 window, `focused === "profile"`, `z === 1`, rect `= placeWindow(APP_SIZES.profile, A, 0)` = `{x:460, y:220, w:520, h:400}`.
  - **open is idempotent:** open profile twice → still 1 window, `z === 2`, `opened === 1`.
  - open about after profile → about `z` > profile `z`, about rect = `placeWindow(APP_SIZES.about, A, 1)` (offset by 28).
  - minimise focused profile with about open → profile `minimized`, `focused === "about"`; then `open profile` → `minimized === false`, focused profile.
  - **close last:** open profile, close profile → `windows.length === 0`, `focused === null`.
  - toggleZoom → rect `{x:8, y:36, w:1424, h:768}`, `zoomed`; toggleZoom again → original rect, `zoomed === false`.
  - **move clamp:** move profile to `(-5000, -500)` → `{x: -440, y: 28}`; to `(9999, 9999)` → `{x: 1360, y: 784}`.
  - **fit:** after opening profile and about, `fit` with `desktopArea(700, 500)` → every rect satisfies `clampWindow(rect, area)` equality; a zoomed window becomes `area` inset by 8.
  - focus on a closed id → returns the same state object.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement `windows.ts` (pure, no React imports).
- [ ] **Step 4:** `npm test` → all pass.
- [ ] **Step 5: Commit** `feat: window manager reducer`

### Task 4: Glass utility, app icons and menu bar

**Files:**
- Modify: `src/app/globals.css` (add `@utility glass` and `@utility window-shadow`)
- Create: `src/desktop/icons.tsx`, `src/desktop/MenuBar.tsx`, `src/lib/useNow.ts`

**Interfaces:**
- Consumes: `site`, `AppId`, `formatMenuClock`, `useSoundEnabled`, `setSoundEnabled`, `playTick`, `tap`.
- Produces:
  - `glass` utility: `background: rgb(255 255 255 / 0.55); backdrop-filter: blur(20px) saturate(180%)` (+ `-webkit-` prefix), `box-shadow: inset 0 0 0 0.5px rgb(255 255 255 / 0.7), 0 0 0 0.5px rgb(0 0 0 / 0.08)`.
  - `window-shadow` utility: `box-shadow: 0 22px 70px 4px rgb(0 0 0 / 0.16), 0 0 0 0.5px rgb(0 0 0 / 0.12)`.
  - `AppIcon({id, size}: {id: AppId; size: number})`, `LinkIcon({id, size}: {id: ExternalLink["id"]; size: number})`, `PlaneGlyph({size}: {size: number})` — original squircle icons (corner radius 22% of size, soft vertical gradient, white glyph); artwork is the builder's call within the palette.
  - `useNow(intervalMs: number): Date | null` — `null` on the server and first render (avoids hydration mismatch), then ticks.
  - `MenuBar({onOpen}: {onOpen: (id: AppId) => void})` — fixed top, height `MENU_BAR_H`, `glass`, 13px text: plane glyph, bold `site.name`, buttons About / Projects / Services / Contact; right: green dot + "Available", sound toggle (`aria-pressed`, speaker icon on/off), clock from `formatMenuClock(now)`.

- [ ] **Step 1:** Implement the utilities, icons, `useNow`, `MenuBar`.
- [ ] **Step 2:** `npx tsc --noEmit && npm run lint` → clean.
- [ ] **Step 3:** Visual check happens in Task 7 (MenuBar is mounted there).
- [ ] **Step 4: Commit** `feat: glass styles, icons and menu bar`

### Task 5: Dock with magnification

**Files:**
- Create: `src/desktop/dockMath.ts`, `src/desktop/dockMath.test.ts`, `src/desktop/Dock.tsx`

**Interfaces:**
- Consumes: `AppIcon`, `LinkIcon`, `site.links`, `playTick`, `tap`.
- Produces:
  - `magnify(distance: number, opts?: {max?: number; radius?: number}): number` — `1 + (max - 1)·cos²(min(|d|/radius, 1)·π/2)`, defaults `max 1.6`, `radius 140`.
  - `DOCK_ORDER: AppId[] = ["profile","about","projects","services","contact"]`, `DOCK_ICON = 48`.
  - `Dock({openIds, onOpen, registerIcon}: {openIds: AppId[]; onOpen: (id: AppId) => void; registerIcon: (id: AppId, el: HTMLElement | null) => void})` — `glass`, rounded 18px, fixed bottom 8px centred; apps, a 1px divider, then external links. Each icon's size follows `DOCK_ICON · magnify(pointerX - iconCentreX)` via Motion springs (stiffness 400, damping 30); reduced motion → fixed size. Tooltip (glass) with the label above the hovered icon. 4px dot under ids in `openIds`. Click: `playTick()`, `tap()`, short bounce (y −10 → 0), then `onOpen(id)`.

- [ ] **Step 1: Write the failing test:** `magnify(0) === 1.6`, `magnify(140) === 1`, `magnify(500) === 1`, `magnify(70)` ≈ `1.3` (`toBeCloseTo(1.3, 5)`), `magnify(-70)` ≈ `1.3`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement `dockMath.ts` and `Dock.tsx`.
- [ ] **Step 4:** `npm test` → pass; `npx tsc --noEmit && npm run lint` clean.
- [ ] **Step 5: Commit** `feat: magnifying dock`

### Task 6: Window chrome

**Files:**
- Create: `src/desktop/Window.tsx`

**Interfaces:**
- Consumes: `WinState`, `Rect`, `TITLE_BAR_H`, `playPop`, `playClose`, `playMinimize`, `tap`.
- Produces: `Window({win, title, focused, origin, onFocus, onClose, onMinimize, onZoom, onMove, children}: {win: WinState; title: string; focused: boolean; origin: {x: number; y: number} | null; onFocus(): void; onClose(): void; onMinimize(): void; onZoom(): void; onMove(x: number, y: number): void; children: ReactNode})`
  - `motion.div`, `position: absolute`, left/top/width/height from `win.rect`, `zIndex: win.z`, `rounded-xl overflow-hidden window-shadow bg-white`, `role="dialog"`, `aria-label={title}`.
  - Title bar `h-[28px]` `bg-[#F7F5F0]` bottom hairline, centred 13px semibold title, traffic lights (12px circles, 8px gap, `aria-label` "Close"/"Minimise"/"Zoom", glyphs ×/−/+ shown on group hover); inactive → `#D9D6CF`.
  - Drag: pointer events on the title bar with `setPointerCapture`, calls `onMove(startRect.x + dx, startRect.y + dy)`; double-click title bar → `onZoom`.
  - `onPointerDown` anywhere → `onFocus` (if not focused).
  - Animation: `transformOrigin` = `origin` relative to the window (dock icon centre), open from `{scale: 0.2, opacity: 0}` with spring (stiffness 380, damping 32), `playPop()` on mount; minimised → animate to `{scale: 0.2, opacity: 0}` + `pointer-events: none`; exit (close) → `{scale: 0.94, opacity: 0}` 150 ms. Reduced motion → opacity-only 120 ms.
  - Body scrolls internally (`overflow-y-auto`) if content is taller than the window (the page itself never scrolls).

- [ ] **Step 1:** Implement `Window.tsx`.
- [ ] **Step 2:** `npx tsc --noEmit && npm run lint` clean. Visual check in Task 7.
- [ ] **Step 3: Commit** `feat: window chrome`

### Task 7: Desktop root, app registry and intro handoff

**Files:**
- Create: `src/desktop/apps.tsx`, `src/desktop/Desktop.tsx`, `src/Experience.tsx`, `src/lib/useIsPhone.ts`
- Modify: `src/app/page.tsx`, `src/components/intro/Intro.tsx`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `type AppContentProps = {openApp: (id: AppId) => void}`
  - `APPS: Record<AppId, {title: string; Content: ComponentType<AppContentProps>}>` (titles: "Gideon Ibe", "About", "Projects", "Services", "Contact"); Content components come from Task 8 — until then, a placeholder `<p>` per app.
  - `useIsPhone(): boolean` — `useSyncExternalStore` on `matchMedia("(max-width: 767px)")`, server snapshot `false`.
  - `Desktop({state, dispatch}: {state: DesktopState; dispatch: Dispatch<DesktopAction>})` — renders `MenuBar`, the windows layer (`AnimatePresence` over `state.windows`), and `Dock`; keeps dock icon elements in a ref map for window `origin`; on window `resize` event dispatches `{type:"fit", area: desktopArea(innerWidth, innerHeight)}`. `openApp(id)` = dispatch open with the current area.
  - `Intro` gains optional prop `onLeave?: () => void`, called once when the intro starts fading (normal end, Esc skip, or reduced-motion path — route all three through `leave()`).
  - `Experience()` — `"use client"`, owns `useReducer(desktopReducer, initialDesktop)`; renders `<Intro onLeave=…/>` and `isPhone ? <HomeScreen/> : <Desktop …/>`; `onLeave` dispatches `open profile` (desktop only).
  - `page.tsx` renders `<Experience />`.

- [ ] **Step 1:** Implement the files; `npx tsc --noEmit && npm run lint && npm test` clean.
- [ ] **Step 2: Browser check** at 1440×900 via the preview: finish the intro → Profile window springs open centred; menu bar and dock visible with glass; clicking About in the menu and Projects in the dock opens cascaded windows with dots under their icons; drag a window by its title bar and try to drag it under the menu bar (it stops at y=28); minimise animates into the dock and re-opens from it; zoom fills the area; close removes the dot; resize the viewport to 700×500 → windows stay grabbable. Check the console has no errors.
- [ ] **Step 3: Commit** `feat: desktop with menu bar, dock and windows`

### Task 8: Window contents

**Files:**
- Create: `src/windows/ProfileWindow.tsx`, `src/windows/AboutWindow.tsx`, `src/windows/ProjectsWindow.tsx`, `src/windows/ServicesWindow.tsx`, `src/windows/ContactWindow.tsx`, `src/windows/Tag.tsx`
- Modify: `src/desktop/apps.tsx` (swap placeholders)

**Interfaces:**
- Consumes: `site`, `AppContentProps`, `localTimeIn`, `useNow`.
- Produces: each `XWindow(props: AppContentProps)`; `Tag({children})` (mono 11px pill, hairline border).
  - **Profile:** 72px initials avatar "GI" (coral gradient), name (22px semibold), role, pitch, availability row (green dot), "Port Harcourt · HH:mm" via `localTimeIn(now, site.timeZone)`, buttons **View work** (filled ink → `openApp("projects")`) and **Hire me** (outline → `openApp("contact")`), stats row of three.
  - **About:** headline with "actually work." in coral, three paragraphs (15px, muted, 1.6 leading), Stack as four labelled `Tag` groups.
  - **Projects:** two columns — `glass` sidebar (200px) listing projects with status dot; selected project (default first) in the detail pane: status badge ("In development" coral / "Shipped" green), name, description, `Tag` stack, action button (href → new tab; `opens` → `openApp`).
  - **Services:** 2×2 cards (title, description, price in coral), footer button **Start a project** → `openApp("contact")`.
  - **Contact:** headline, body, response time, primary email button (`mailto:`), row of link buttons with `LinkIcon`.
- [ ] **Step 1:** Implement; `npx tsc --noEmit && npm run lint && npm test` clean.
- [ ] **Step 2: Browser check:** every window shows its content without clipping at its default size on a 1440×900 and a 1024×700 viewport; View work / Hire me / Inquire / Start a project open the right windows; external links open new tabs.
- [ ] **Step 3: Commit** `feat: window contents`

### Task 9: Phone home screen

**Files:**
- Create: `src/mobile/HomeScreen.tsx`, `src/mobile/Sheet.tsx`

**Interfaces:**
- Consumes: `APPS`, `AppIcon`, `LinkIcon`, `site`, `useNow`, `useSoundEnabled`, `setSoundEnabled`, `playPop`, `playClose`, `tap`.
- Produces:
  - `HomeScreen()` — status bar (time left, sound toggle right, 44px tall); Profile widget card (`glass`, avatar, name, role, availability, View work / Hire me); 4-column grid of app icons (About, Projects, Services, Contact) with labels; bottom `glass` dock row with GitHub, LinkedIn, X and Mail (`mailto:`). Holds `sheet: AppId | null`.
  - `Sheet({title, onClose, children})` — full-screen `motion.div` sliding up (spring stiffness 380, damping 36), header with title and **Done**; `drag="y"`, `dragConstraints={{top: 0, bottom: 0}}`, `dragElastic={{top: 0, bottom: 0.6}}`, closes when `offset.y > 120` or `velocity.y > 600`; body scrolls internally. Plays `playPop()` on open, `playClose()` on close.
- [ ] **Step 1:** Implement; `npx tsc --noEmit && npm run lint && npm test` clean.
- [ ] **Step 2: Browser check** with the `mobile` preset (375×812): intro → home screen; each icon opens its sheet; Done and swipe-down close it; View work / Hire me open sheets; nothing overflows horizontally. Reset to `desktop` preset after.
- [ ] **Step 3: Commit** `feat: phone home screen`

### Task 10: Final verification

- [ ] **Step 1:** `npm test && npx tsc --noEmit && npm run lint && npm run build` → all succeed.
- [ ] **Step 2:** Browser pass at 1440×900 with reduced motion emulated off and on: intro → desktop, sound toggle persists across reload (reload with sound off → intro keys silent), no console errors.
- [ ] **Step 3:** Update the spec's "Open with Gideon" list with anything new found during the build.
- [ ] **Step 4: Commit** `chore: milestone 1 verification`
