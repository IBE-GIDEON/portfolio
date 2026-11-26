# Your admin: one-time setup

The admin lives at **/admin** on your site (for example
`https://portfolio-blond-chi-74.vercel.app/admin`). You sign in with a password only you know, edit
anything — profile, photo, about, skills, projects and screenshots, services, contact, socials — and
press **Publish**. Publishing saves the change to your GitHub repo; Vercel rebuilds and the live site
updates about a minute later. There's no database: your content is the file `src/content/site.json`.

Until the three settings below exist, `/admin` says "The admin isn't set up yet". That's expected.

## 1. Make a GitHub key (fine-grained token)

The admin uses this key to save your changes to the repo. It can only touch the portfolio repo.

1. On github.com, click your profile picture → **Settings** → **Developer settings** (bottom of the left
   menu) → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. **Token name:** `Portfolio admin`. **Expiration:** your choice (1 year is fine; see "When the key
   expires" below).
3. **Resource owner:** `IBE-GIDEON`. **Repository access:** *Only select repositories* →
   `IBE-GIDEON/portfolio`.
4. **Permissions → Repository permissions → Contents:** *Read and write*. (Metadata: Read-only is added
   on its own. Leave everything else as "No access".)
5. **Generate token** and copy it (it starts with `github_pat_`). GitHub shows it only once. Don't paste
   it anywhere except Vercel in step 3.

## 2. Make a session secret

This signs your login cookie. In a terminal, run:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

and copy the long line it prints.

## 3. Add the settings in Vercel

vercel.com → project **portfolio** → **Settings** → **Environment Variables**. Add each one for the
**Production** environment (tick **Sensitive** if offered):

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | Your admin password: **16 characters or more**, used nowhere else. (Shorter ones are refused: the admin stays "not set up".) |
| `ADMIN_SESSION_SECRET` | The line from step 2. |
| `GITHUB_TOKEN` | The key from step 1. |

Optional: `GITHUB_REPO` (default `IBE-GIDEON/portfolio`) and `GITHUB_BRANCH` (default `main`).

## 4. Redeploy

Settings only apply to new deployments: **Deployments** → the latest one → **⋯** → **Redeploy**.

## 5. Use it

Open `/admin`, enter your password, edit, press **Publish**. The badge on Publish counts the sections
you changed; **Discard changes** throws your edits away. After publishing you get a link to the change
on GitHub.

- **Pictures:** JPG, PNG or WebP up to 4 MB. Screenshots are cropped to 16:10 from the top; your
  photo is cropped square around your face. They're saved together with your other edits when you
  press Publish (not when you choose them). Bigger phone photos: resize or screenshot them first.
- **If a publish has a mistake** (a missing field, a link without `https://`), nothing is saved and
  the admin shows what to fix.
- **If the build fails** for any reason, Vercel keeps the previous version online.

## Good to know

- **Sign-in lasts 7 days** on that browser. To sign out everywhere, change `ADMIN_SESSION_SECRET` in
  Vercel and redeploy.
- **Change your password:** change `ADMIN_PASSWORD` in Vercel and redeploy. This also signs out every
  browser that was signed in with the old password.
- **Wrong passwords** wait one second each; there's no lockout (no database), which is why the password
  must be long.
- **"The site changed since you opened it"** means someone (another tab, or a code push) changed the
  content after you opened the admin. Copy anything you want to keep, then Reload.
- **When the key expires**, Publish says "GitHub rejected the access key. Check GITHUB_TOKEN in
  Vercel." Make a new key (step 1), replace `GITHUB_TOKEN` in Vercel, and redeploy.
- **Undo a publish:** the simplest way is to change it back in the admin and publish again. Every
  publish is a commit named `Admin: update …` in the repo's history, so a developer can also revert it
  with `git revert <commit>`.
- **Screenshots from the old pipeline** (`assets/projects/*.jpg` → `npm run images`) still work. The
  script skips any project whose screenshot you replaced in the admin.

## Testing locally (optional)

Create `.env.local` in the project folder (it's git-ignored, never committed) with the same three
settings, then `npm run dev` and open `http://localhost:3000/admin`. Publishing from your computer
commits to the real repo too; to experiment safely, add `GITHUB_BRANCH=admin-test` and create that
branch on GitHub first.
