# Design System — ICSDC Frontend

Reconstructed 2026-08-03 from `assets/css/`. Source of truth is `style.css` (`:root`) and `dark-mode.css`.

---

## CSS load order

Every page loads these in this exact order — later files override earlier ones:

```html
<script src="assets/js/theme-init.js"></script>   <!-- sync, in <head>, anti-FOUC -->
<link href="…font-awesome/6.5.2/css/all.min.css">  <!-- CDN -->
<link href="assets/css/style.css">                 <!-- tokens + base -->
<link href="assets/css/components.css">            <!-- shared components -->
<link href="assets/css/<page>.css">                <!-- page-specific -->
<link href="assets/css/homepage-extras.css">       <!-- some pages -->
<link href="assets/css/dark-mode.css">             <!-- LAST — must win -->
```

`dark-mode.css` must stay last. Adding a page stylesheet after it silently breaks dark mode on that page.

---

## Tokens (`style.css :root`)

### Colour
| Token | Light | Purpose |
|---|---|---|
| `--blue` | `#1a56db` | primary brand |
| `--blue-dark` | `#1341b0` | hover/pressed |
| `--blue-light` | `#ebf2fc` | tinted surface |
| `--blue-hover-bg` | `#eff6ff` | hover surface |
| `--orange` | `#f59e0b` | accent / badges |
| `--accent-teal` | `#4fd1c5` | secondary accent |
| `--text` | `#1e293b` | body copy |
| `--text-dark` | `#0a1f44` | headings |
| `--muted` | `#64748b` | secondary copy |
| `--muted-alt` | `#5f6b85` | tertiary |
| `--muted-light` | `#4c4c4c` | quaternary |
| `--border` | `#e2e8f0` | dividers |
| `--border-soft` | `rgba(26,86,219,.15)` | tinted border |
| `--bg` | `#f5f7fb` | page background |
| `--bg-light` | `#f8fafc` | alt section background |
| `--white` | `#ffffff` | card surface |
| `--ink` | `#0a1230` | deepest text |

### Shadow
`--shadow`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-card`, `--shadow-card-hover`, `--shadow-icon`, `--shadow-nav`.
Card shadows are blue-tinted in light mode (`rgba(26,86,219,…)`), pure black and more opaque in dark.

### Radius
`--radius-sm: 8px` · `--radius-md: 10px` · `--radius-lg: 16px` · `--radius-xl: 50px` · `--radius-pill: 50%`

### Layout
`--content-max-width: 90%` · `--nav-height: 72px` · `--nav-offset: 75px`

### Motion
`--transition-fast: .15s` · `--transition-base: .22s` · `--transition-slow: .35s`
Easings: `--ease-spring`, `--ease-out-expo`, `--ease-in-out-quart`, `--ease-out-back`

---

## Typography

Font: **Plus Jakarta Sans**, `sans-serif` fallback.

Headings use fluid `clamp()`:
- section title — `clamp(30px, 4.5vw, 36px)`
- sub-heading — `clamp(20px, 2.5vw, 28px)`

Body sizes cluster at `13.5–15px`, small print `11.5–13px`.

---

## Dark mode

Strategy: attribute selector on `<html>`, overriding custom properties.

```css
html[data-theme="dark"] { --text: #e2e8f0; --white: #1e293b; --bg-light: #0f172a; … }
```

- Toggled by `initThemeToggle()` in `main.js`
- Persisted in `localStorage['icsdc-theme']`
- Anti-FOUC: `assets/js/theme-init.js`, loaded **synchronously in `<head>`** before any stylesheet
- `color-scheme: dark` is set so native form controls follow

Dark mode also defines a **second `--c-*` token family** (`--c-dark`, `--c-white`, `--c-border`, `--c-footer-bg`, `--c-shadow-card`, …) used by components authored against a different naming convention. When adding a component, check which family the surrounding code uses.

Note `--white: #1e293b` in dark mode — it means "card surface", not literally white. Do not hardcode `#fff` for surfaces.

---

## Breakpoints

By usage across the 55 stylesheets:

| Width | Uses | Meaning |
|---|---|---|
| `1365px` | 51 | desktop → laptop |
| `767px` | 50 | tablet → mobile |
| `1024px` | 7 | tablet landscape |
| `640px` / `600px` | 11 | small mobile |
| `479px` / `480px` | 12 | very small mobile |

`1365px` and `767px` are the real breakpoints; the rest are one-off fixes.

---

## Structural class conventions

JS populators bind to these. Renaming a class silently breaks CMS population — this is the single most common bug in this codebase (see [[audit_sop]]).

| Class / ID | Bound by |
|---|---|
| `.title` | `populateSectionHeader()` heading |
| `.subtitle` | `populateSectionHeader()` subtitle |
| `.cloud-section-label` / `.ds-section-label` | `populateSectionHeader()` eyebrow |
| `.hero-title` `.hero-sub` `.hero-desc` `.hero-price` `.price-unit` `.price-note` | `populateHero()` |
| `.eyebrow-badge` | `populateHero()` eyebrow |
| `.hero-btns button/a` | `populateHero()` CTAs — index 0 primary, 1 secondary |
| `.hero-right` `.hero-right-image` `.hero-form-wrap` | `populateHero()` image/form swap |
| `.cloud-cta-inner` / `.ds-cta-inner` | `populateCtaBand()` |
| `.cloud-cta-btn-primary` / `.ds-cta-btn-primary` | `populateCtaBand()` |
| `.cloud-cta-btn-outline` / `.ds-cta-btn-outline` | `populateCtaBand()` |
| `#faq-accordions` | `initFAQ()` |
| `#testi-grid` `#testi-dots` `#testi-prev` `#testi-next` | `initTestimonials()` — **hardcoded** |
| `#page-loader` | `hidePageLoader()` |

Card grids are `innerHTML`-replaced by `populateIconCards(gridSelector, cards, cardClass)`. The icon and link classes are **derived** from `cardClass`: `why-card` → `why-icon`, `why-link`. Keep that `-card` / `-icon` / `-link` triplet consistent.

Two parallel naming families exist for the same components — `ds-*` (design-system pages) and `cloud-*` (cloud pages). `populatePricingPlans()` emits `ds-*`, `populatePricingPlansCloud()` emits `cloud-*`. Pick the one matching the page's existing HTML.

The eyebrow label elements (`cloud-section-label` / `lds-section-label`) are being **removed** site-wide per user preference — strip them when auditing a page.

---

## Icons

Font Awesome 6.5.2 via CDN. No inline SVG.

`resolveIcon(key)` in `cms-helpers.js` resolves in order:
1. `CUSTOM_ICONS` registry (`utils/custom-icons.js`) — add your own SVGs here
2. per-call override map
3. explicit prefix — `brands:linkedin`, `regular:bell`, `solid:house`
4. `FA_ICONS` alias map — `lightning` → `bolt`
5. raw FA name — `shield-halved`, `fa-rocket`

`FA_BRANDS` decides `fa-brands` vs `fa-solid`. Fallback is `fa-circle-dot`.

**`FA_ICONS` contains ~25 duplicate keys**; the later definition wins. Known effects: `scale` → `up-right-and-down-left-from-center` (not `scale-balanced`), `support` → `headset`, `share` → `share-nodes`. Deduping it is safe cleanup.

---

## Rich text

CKEditor fields emit `<p>…</p>`. `inlineRichText()` strips the outer `<p>` and converts paragraph breaks to `<br><br>`, so content can drop into an existing `<p>` without invalid nesting. `setText()` auto-detects rich HTML via `RICH_HTML_RE` and switches to `innerHTML`; plain strings stay `textContent`.

---

Related: [[project_context]] · [[audit_sop]]
