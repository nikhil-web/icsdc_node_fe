# Project Context — ICSDC Frontend

Reconstructed 2026-08-03 by reading the codebase (the original from the other machine was never committed — `.claude/` files other than `audit_sop.md` and `memory_index.md` are absent from git).

Full cross-repo overview lives in `../../CLAUDE.md` (parent `icsdc/` folder, not tracked).

---

## What this repo is

An Express 5 server (`server.js`) that fronts a ~50-page static HTML marketing site. Content is authored in a separate Strapi 5 CMS (`../../icsdc backend/ICSDC_Backend`) and hydrated into the HTML client-side.

No build step, no framework. Vanilla ES modules + plain CSS.

---

## Architecture

### Three rendering paths, one set of content

| Audience | Path | Where |
|---|---|---|
| Humans | static shell + JS hydration from Strapi | `<slug>.html` + `assets/js/<slug>.js` |
| Crawlers / non-JS bots | pre-baked full-DOM snapshot | `public/ICSDC_Frontend/prerendered/` |
| All requests | server-injected SEO `<head>` | `sendPageWithSeo()` in `server.js` |

Crawler detection: `BOT_UA_RE` at `server.js:21`. Snapshots are built by `prerender.js` (headless Chromium via puppeteer), which loads each page through the *running* server, waits for hydration, strips dynamic scripts (`config.js`, `main.js`, `components.js`, socket.io, GTM) and the chat widget, then rewrites `http://localhost:1337` → `https://admin.icsdc.com` and origin → `SITE_URL`.

`snapshotFileForPath()` in `server.js` and `snapshotFile()` in `prerender.js` **must stay in sync** — both map `/` → `home.html` and `/legal/x` → `legal/x.html`.

### Data flow

```
page.js  →  contentService.getXPage()  →  strapiClient.fetchAPI()
         →  GET /api/strapi/api/x-page?populate=…   (Express proxy adds the token)
         →  Strapi
         →  cms-helpers.populate*()  writes into the existing HTML
```

The HTML already contains the full section markup with empty/placeholder text. JS **fills** it — it does not create page structure (except for card grids, which are `innerHTML`-replaced).

### Key modules

| File | Role |
|---|---|
| `server.js` | proxy, admin API, builder API, sitemap, prerender trigger, robots editor, SEO injection, routing, socket.io chat |
| `prerender.js` | crawler snapshot builder |
| `assets/js/config.js` | sets `window.STRAPI_URL` / `window.SITE_URL` by hostname |
| `assets/js/services/strapiClient.js` | `fetchAPI` / `postAPI` / `uploadURL` — all via `/api/strapi` |
| `assets/js/services/contentService.js` | ~40 hand-written deep-populate queries, one per page |
| `assets/js/utils/cms-helpers.js` | shared `populate*()` renderers + FA icon resolution |
| `assets/js/main.js` | nav, footer, theme, canonical, WhatsApp widget |
| `assets/js/builder/componentRegistry.js` | 15 builder section types |
| `public/admin/` | admin SPA (dashboard, leads, pages, sitemap, robots, prerender, chat, builder) |

---

## Gotchas that cost time

- **Adding a Strapi field is a two-file change.** The schema alone is not enough — the field must also be added to that page's populate string in `contentService.js`, or it silently never arrives.
- **`components.js` is a legacy second data path.** Loaded on 31 pages, it fetches Strapi *directly* (not via `/api/strapi`), with a stale fallback host `https://icsdcadmin.duckdns.org` and a `TOKEN` global that nothing defines. Prefer `strapiClient.js`; treat `components.js` as deprecated.
- **`initTestimonials()` uses hardcoded IDs** — `testi-grid`, `testi-dots`, `testi-prev`, `testi-next`. Passing custom IDs does nothing.
- **`populateSectionHeader()` targets `.cloud-section-label` / `.ds-section-label`, `.title`, `.subtitle`.** Any other heading class = silent no-op.
- **Testimonial job title is `title`, not `role`.** `ds.testimonial-card` also has an `Avatar` media field that is never rendered.
- **`FA_ICONS` has duplicate keys** — later entries win. `scale` → `up-right-and-down-left-from-center`.
- **CMS strings are interpolated into `innerHTML` unescaped** throughout `cms-helpers.js`, and `wireCtaLink()` builds an `onclick` attribute with an unescaped link. A `'` in a CMS link breaks the page.
- **`json`-type Strapi fields must not be in a populate query** → 400 ValidationError.
- **Snapshots go stale.** Any content or markup change needs `node prerender.js` (or the `/admin/prerender` button) or crawlers keep seeing the old page.

---

## Local setup

```bash
npm install
npm run dev      # server.js + browser-sync on :3001, proxying :3000
```

**A `.env` is required and is gitignored** — it does not come with a fresh clone:
```
STRAPI_URL=http://localhost:1337
STRAPI_TOKEN=<Strapi API token>
SITE_URL=http://localhost:3000
DATABASE_URL=<postgres url>     # optional: builder version history + chat persistence
PORT=3000
```
Without `DATABASE_URL`, version history and chat persistence disable themselves silently (logged at boot).

`prerender.js` needs the server already running.

---

## Branches

`main` ← `dev` ← `feat/website-builder`. Also `feature/wix-builder`, `feat/redesign` on the remote.

Recent trajectory (git log): page-by-page DOCX audits → canonical tags + robots.txt → server-side SEO injection → crawler prerendering → pricing CTA links.

---

Related: [[audit_sop]] · [[design_system]]
