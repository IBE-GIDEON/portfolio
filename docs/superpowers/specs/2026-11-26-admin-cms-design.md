# Admin for the portfolio (no database): design

Date: 2026-11-26 · Status: approach picked by Gideon ("Save to GitHub"); design awaiting approval.

## Intent

Gideon wants to update everything on his portfolio himself, from a private page only he can log into, without a database and without touching code. Today every word lives in `src/content/site.ts` and changes need a developer.

## Goals

- A private `/admin` page behind one password that only Gideon knows. Works on phone and desktop.
- Edit everything that is content:
  - **Profile:** name, alias, role, short role (sidebar label), pitch, availability, location, time zone, stats; **photo upload**; **search title and description** (browser tab and Google).
  - **About:** facts (label/value rows), headline, story paragraphs.
  - **Skills:** stack groups and their items.
  - **Projects:** add, edit, remove, reorder; name, kind (product or client work), category, status, description, stack, link (or "Inquire"); **screenshot upload**.
  - **Services:** add, edit, remove; title, description, price.
  - **Contact:** headline, body, response time, email.
  - **Socials:** the six links (empty = hidden).
- **Publish** writes the change to the GitHub repo's `main` branch; Vercel rebuilds; the live site updates in about a minute.
- The admin looks like the rest of the site: black, Mac-style (System Settings layout).

## Non-goals

- No database and no other storage service.
- One user: no accounts, roles or password-reset flow (the password is changed in Vercel settings).
- No drafts, scheduling or live preview before publishing (v1). Plain-text paragraphs, no rich text.
- Not editing the design (colours, layout), the intro animation, or code.

## Anti-goals (failure even if it works)

- Anyone but Gideon can change the site.
- A publish breaks the live site.
- Any secret ends up in the repo, the browser, or this conversation.
- An edit silently overwrites a newer change.

## Constraints

- Next.js 16.4 (Turbopack, Cache Components on). In 16, Middleware is called **Proxy**. Read `node_modules/next/dist/docs/` before using any API.
- Hosted on Vercel: the deployed filesystem is read-only; request bodies max ~4.5 MB; functions are serverless (no shared memory between requests).
- The public site is fully static today (prerendered at build). It must stay static and fast; the admin must not slow it down.
- Screenshots are already a pipeline: `assets/projects/*.jpg` → `npm run images` → `public/projects/<id>.webp` + blur previews in `src/content/projectImages.json`.
- Git: `main` deploys to production (`portfolio-blond-chi-74.vercel.app`, project `portfolio`, repo `IBE-GIDEON/portfolio`).

## Approaches considered

| | Approach | Trade-off |
|---|---|---|
| **A (picked)** | Publish commits the change to GitHub `main`; Vercel rebuilds | Free, no new services, full history/undo, site stays static. Changes take ~1 minute. Needs a GitHub access token in Vercel settings. |
| B | Store content and images in Vercel Blob; site reads them live | Instant updates, but adds a storage service (close to a database), makes every page load fetch content, no built-in history. |
| C | Keep editing `site.ts` by hand | No admin at all; not what Gideon wants. |

## Design

### 1. Content becomes data

- Move all editable values from `src/content/site.ts` into **`content/site.json`**. `site.ts` keeps the TypeScript types and a `validateContent()` function, and exports the typed `site` read from the JSON. One source of truth: the site, the tests and the admin all use the same file and the same validator.
- Text that is hard-coded today comes from the content instead:
  - the intro's typed name ← `alias`, upper-cased;
  - the sidebar name ← first word of `name`; the "GI" initials ← initials of `name`; the chip label ("Full-stack & AI") ← new `shortRole` field;
  - the browser-tab title and search description in `layout.tsx` ← new `seo.title` / `seo.description` fields.
- Tests stop checking exact copy (Gideon will change it) and check the shape and rules instead (via `validateContent`).
- `src/content/projectImages.json` stays the generated image manifest; uploads update it.

### 2. Logging in

- The password lives only in a Vercel environment variable, **`ADMIN_PASSWORD`**, which Gideon sets himself in the Vercel dashboard. It is never in the repo, the browser bundle, or this chat.
- `POST /api/admin/login` compares the submitted password with a constant-time comparison. On success it sets an **HttpOnly, Secure, SameSite=Strict** cookie holding an expiry time signed with HMAC (`ADMIN_SESSION_SECRET`, a long random value). Sessions last 7 days. `POST /api/admin/logout` clears it.
- Failed attempts wait ~1 second before answering. Without a database there's no account lockout, so the password must be long (16+ characters); the setup steps say so.
- Every other `/api/admin/*` route rejects requests without a valid cookie. `/admin` shows the login screen when signed out. Admin pages send `noindex`.

### 3. Publishing

- The admin loads content **from GitHub** (`GET /api/admin/content`), not from the deployed copy, so it always starts from the latest version, together with the file's Git SHA.
- **Publish** sends `{ content, images, baseSha }` to `POST /api/admin/content` (images = the processed uploads held since the last publish). The server runs `validateContent()` (required fields, https URLs, sensible lengths, unique project ids); on failure it returns field-level errors and commits nothing.
- On success it commits `content/site.json` to `main` with the GitHub API using **`GITHUB_TOKEN`** (fine-grained token: Contents read/write on `IBE-GIDEON/portfolio` only). Commit message: `Admin: update <sections>`.
- If `main`'s copy changed since `baseSha`, GitHub rejects the write; the admin says "The site changed since you opened it. Reload to get the latest" and keeps the unsaved edits on screen. No silent overwrite.
- Vercel only goes live when the build succeeds, so a bad publish leaves the previous version online. The admin shows "Published. Live in about a minute" with a link to the commit on GitHub.

### 4. Uploading images (held until Publish)

- `POST /api/admin/upload` (multipart, ≤ 4 MB, JPG/PNG/WebP) for a **project screenshot** or the **profile photo**. The server uses `sharp` to make a 1200×750 WebP plus the 24×15 blur preview (screenshots) or a 512×512 WebP (photo), and **returns them without committing anything**. `sharp` moves from devDependencies to dependencies.
- The admin keeps processed images with the other unsaved edits (they count in the Publish badge and show in the form as previews). **Publish commits everything together in one commit**: `content/site.json`, any new images and the updated `projectImages.json` (GitHub Git Data API: blobs → tree → commit → move `main`, checked against `baseSha`). So a new project and its screenshot can be added and published in one go, and an upload never makes the admin's own copy out of date. Processed WebPs are 10–70 KB, well under the request limit.
- New and replaced images get a short content hash in the filename (e.g. `three-ai.3f9a2c.webp`) so the one-day browser cache never shows an old picture. The old file is deleted in the same commit.
- `npm run images` only processes originals in `assets/projects/` and merges into the manifest; it never removes entries the admin added.

### 5. The admin screen

```
┌──────────────┬──────────────────────────────────────────┐
│ Admin        │ Projects                     [Publish ●2]│
│              │ ┌──────────────────────────────────────┐ │
│ ▸ Profile    │ │ Three AI          In development  ↑ ↓ │ │
│   About      │ │ HomBox            In development  ↑ ↓ │ │
│   Skills     │ │ …                                     │ │
│ ● Projects   │ │ + Add project                         │ │
│   Services   │ └──────────────────────────────────────┘ │
│   Contact    │  Name  [Three AI            ]            │
│   Socials    │  Category [Decision intelligence]       │
│              │  Status  (In development ▾)  Screenshot [Replace…] │
│ Log out      │  Description [                         ]│
└──────────────┴──────────────────────────────────────────┘
```

- System Settings layout: section list on the left, a form on the right built from grouped Mac-style rows with inline fields. Lists (projects, services, facts, skills, stats, paragraphs) get add, remove (with confirm) and move up/down.
- **Publish** (top right) shows how many sections changed. **Discard changes** resets to the loaded version. Leaving with unsaved edits asks first.
- On phones: the section list first, tapping a section opens its form (like iPhone Settings).
- After publishing: a toast "Published. Live in about a minute" + "View change on GitHub".

### 6. Setup Gideon does once (guided, step by step)

1. Create a GitHub **fine-grained token**: only repository `IBE-GIDEON/portfolio`, permission **Contents: Read and write**, expiry of his choice.
2. In Vercel → project `portfolio` → Settings → Environment Variables (Production), add `ADMIN_PASSWORD` (16+ characters), `ADMIN_SESSION_SECRET` (a random string; I'll provide a one-line command to generate it), `GITHUB_TOKEN`.
3. Redeploy. For local testing, the same three go in `.env.local` (already git-ignored).

### 7. Testing

- Unit tests (Vitest): `validateContent` (good file passes; missing fields, bad URLs, duplicate ids fail), session signing (valid, expired, tampered), login password check, the commit-request builder, the image pipeline output sizes.
- GitHub access sits behind a small module that tests replace with a fake, so tests never touch the real repo.
- After setup: one real publish of a harmless text change, confirmed on the live site, then reverted.

## Calls made after review

- Uploads wait for Publish and go out in the same commit (the first draft committed them immediately, which conflicted with the Publish/`baseSha` flow).
- Sidebar name, initials and chip label derive from the profile; search title/description are new fields.
- Project "kind" (products / client work) is editable.

## Left to the builder

Exact form layouts, validation wording, component structure, sharp settings, toast styling, how lists are reordered (buttons vs drag).

## Open with Gideon

None blocking. He sets the password and creates the GitHub token himself.
