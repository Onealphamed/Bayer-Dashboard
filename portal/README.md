# Master Dashboard

A password-protected hub that puts every dashboard you run behind one login: a card
per dashboard with its links, live up/down status, and its saved sign-in details
(login ID and password, revealed or copied on demand).

- **Zero dependencies.** Plain HTML/CSS/JS front-end, Vercel Functions for the API,
  Vercel Routing Middleware (Node.js runtime) for the login gate. No build step.
  Verified with `vercel build` and `vercel dev` from Vercel CLI 63.
- **Credentials stay server-side.** No password is ever in a static file, in git,
  in the list API, or in a URL. Each one is fetched on demand from `/api/reveal`,
  logged, held in the browser for 30 seconds, then dropped. With storage connected
  they are encrypted at rest with AES-256-GCM.
- **Add dashboards later from the UI** (with storage connected), or by pasting a
  generated value into Vercel (without storage).

---

## Deploy to Vercel (about 5 minutes)

### 1. Import the project
1. Go to **vercel.com/new** and import the GitHub repository that contains this folder.
2. **Root Directory:** `portal`
3. **Framework Preset:** Other. Leave Build and Output settings at their defaults
   (`vercel.json` already sets `outputDirectory: public`, no build command).
4. **Before clicking Deploy**, open *Environment Variables* and add the ones in step 2.

> If this folder is not on the repository's default branch, either merge it, or after
> the first import set **Settings → Git → Production Branch** to the branch that has it.

### 2. Environment variables

| Name | Required | Value |
|---|---|---|
| `PORTAL_USERNAME` | yes | Your login ID for the hub |
| `PORTAL_PASSWORD` | yes | A strong password |
| `SESSION_SECRET` | recommended | Long random string — signs session cookies |
| `VAULT_KEY` | recommended | Long random string — encrypts saved passwords. **Keep it**: changing it makes saved passwords unreadable |
| `DASHBOARDS` | optional | Initial dashboard list, JSON (format below) |
| `PORTAL_TITLE` | optional | Heading shown in the UI (default `Master Dashboard`) |
| `PORTAL_USERS` | optional | Extra users, e.g. `[{"username":"teammate","password":"…","role":"viewer"}]` |
| `SESSION_TTL_HOURS` | optional | Session lifetime, 1–720 (default 12) |

Generate strong values locally with `node scripts/generate-secrets.mjs <login-id>`.

### 3. Connect storage (recommended — enables "Add dashboard" in the UI)
1. In the Vercel project, open **Storage → Create Database → Upstash for Redis** (free tier is plenty)
   and connect it to this project. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
2. **Redeploy.** On first load the `DASHBOARDS` list is imported into storage; from then on the hub
   is the source of truth and `DASHBOARDS` is ignored.

Without storage the hub still works, read-only: the list comes from `DASHBOARDS`, and
"Add dashboard" produces the updated `DASHBOARDS` value for you to paste into Vercel.

If `DASHBOARDS` is not valid JSON when storage is first connected, nothing is imported
and changes are disabled until it is fixed — the hub never locks in an empty list. Any
individual entry that cannot be imported is listed in a notice for the admin.

---

## Adding more dashboards later

**With storage connected:** sign in → **+ Add dashboard** → fill in name, URL, any extra links
(admin panel, login page…), login ID and password → **Add dashboard**. Saved instantly.
Edit, reorder (⋯ → Move earlier / later) and delete from each card's ⋯ menu.

**Without storage:** same form; instead of saving, it shows the complete new `DASHBOARDS`
value. Paste it into **Settings → Environment Variables → DASHBOARDS** and redeploy.
You can make several changes before redeploying: each new value includes the earlier ones
(a banner counts them and **Show value** reopens the latest), so you only paste the last
value. Reloading the page before pasting discards those changes, and the browser asks first.

An extra link typed as a path, such as `/admin`, is treated as a page on the main URL.

### `DASHBOARDS` format
```json
[
  {
    "name": "SEO Tracker",
    "url": "https://seo-tracker.example.com",
    "category": "SEO",
    "color": "blue",
    "description": "What this dashboard is for",
    "links": [{ "label": "Admin panel", "url": "https://seo-tracker.example.com/admin" }],
    "username": "",
    "password": "the-admin-password",
    "notes": "How to change the password, who owns it, etc."
  }
]
```
Only `name` and `url` are required. A bare host such as `my-app.vercel.app` is read as
`https://my-app.vercel.app`. `color` is one of `indigo blue teal green amber orange rose violet slate`.
An optional `id` keeps a dashboard's identity stable; exported values include it.

---

## Roles
- **admin** — `PORTAL_USERNAME` and any `PORTAL_USERS` entry with `"role":"admin"`:
  add / edit / delete / reorder, activity log, backups.
- **viewer** — open dashboards and reveal/copy their credentials; no changes.
- A `PORTAL_USERS` entry with a missing or misspelled role is a **viewer**, never an
  admin, and the admin sees a warning.

## Security notes
- Sessions are HMAC-signed, `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS, and expire
  (12 h default). Changing a user's password in Vercel signs that user out everywhere.
- With storage connected, **Sign out** revokes the session on the server (a copied cookie
  stops working), and **Sign out of all devices** ends every session for your login.
  Without storage, signing out clears the browser cookie only; change the password to
  force everyone out.
- Authenticated API calls refuse cross-site requests, including plain link navigations.
- Sign-in is rate limited (10 failures per IP and 20 per login ID per 15 minutes).
- State-changing requests require a same-origin JSON request (CSRF protection).
- Strict Content-Security-Policy, `X-Frame-Options: DENY`, `noindex` on every page.
- With storage connected, the activity log records sign-ins, failed sign-ins, edits and
  every password reveal or export (account menu → Activity log).
- The hub cannot sign you in to the other dashboards automatically — each keeps its own
  login. It stores and hands you the credentials, then opens the dashboard in a new tab.

## Local development
```bash
cp .env.example .env.local     # then edit
npm run dev                    # http://127.0.0.1:3000 — emulates Vercel locally
npm test                       # node:test suite (redis-mode tests need redis-server installed)
```
