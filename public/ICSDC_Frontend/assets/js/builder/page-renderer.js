/**
 * page-renderer.js
 * ────────────────
 * Renders builder pages. Three modes:
 *   1. Live page      /<slug> or /builder/<slug>  → fetch published page from Strapi
 *   2. Draft preview  /builder/preview/<slug>?token=… → fetch via preview-token endpoint
 *   3. Editor canvas  /builder/__canvas?canvas=1  → no fetch; rendered live via
 *      postMessage from the admin editor (see canvas-mode.js)
 *
 * Every section is wrapped in a `.bsec` div carrying its layout classes
 * (width / align / background / padding / columns) — see builder-layout.css.
 */

// ?v= matters here, not just on the <script> tag in builder-template.html:
// bumping the version on THIS file doesn't invalidate its imports (same URL →
// served from cache), so an edit to componentRegistry.js alone would sit behind
// its 24h Cache-Control for returning visitors. Bump this when that file changes.
import { COMPONENT_REGISTRY } from './componentRegistry.js';
import { hidePageLoader } from '../utils/cms-helpers.js';

function setMeta(name, value) {
    if (!value) return;
    let el = document.querySelector('meta[name="' + name + '"]');
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', value);
}

function showError(message) {
    const root = document.getElementById('builder-page-root');
    if (root) {
        root.innerHTML =
            '<section class="section"><div class="container" style="text-align:center;padding:6rem 1rem">' +
                '<h1 class="title" style="margin-bottom:.5rem">Page unavailable</h1>' +
                '<p class="subtitle" style="max-width:520px;margin:0 auto">' + message + '</p>' +
            '</div></section>';
    }
    hidePageLoader();
}

/* ── Layout wrapper ─────────────────────────────────────────
   Maps a section's `layout` object to .bsec-* classes.
   Missing/legacy sections (no layout) render exactly as before. */
/* NOTE: the site's own CSS (`.section .container { text-align: center }`)
   already centres everything by default — that's the page's native look, not
   something this layout system applies. So the "no override" state has to be
   'center' here too, or picking "Center" would be indistinguishable from doing
   nothing while "Left" (the old default) could never actually left-align
   anything, since no class was ever emitted for it. */
const LAYOUT_DEFAULTS = { width: 'contained', align: 'center', background: 'none', padding: 'normal', columns: null };

function applyLayout(wrap, layout) {
    const l = Object.assign({}, LAYOUT_DEFAULTS, layout || {});
    wrap.classList.add('bsec');
    if (l.width && l.width !== 'contained') wrap.classList.add('bsec-w-' + l.width);
    if (l.align === 'left') wrap.classList.add('bsec-align-left');
    if (l.background && l.background !== 'none') wrap.classList.add('bsec-bg-' + l.background);
    if (l.padding && l.padding !== 'normal') wrap.classList.add('bsec-p-' + l.padding);
    const cols = Number(l.columns);
    if (cols >= 1 && cols <= 4) wrap.style.setProperty('--bsec-cols', String(cols));
}

/* ── Heal internal-only media URLs baked into saved props ────
   Media picked through the admin's media library used to be absolutified
   server-side using the SERVER's own (often localhost-internal) Strapi URL,
   which then got saved permanently into a section's props. That URL is
   broken for every browser except one that happens to run Strapi on its own
   port 1337 too. The server no longer does this (see STRAPI_PUBLIC_URL in
   server.js), but pages saved before that fix still carry the bad absolute
   URL — rewrite it at render time to this environment's real Strapi origin
   rather than requiring every affected image to be re-picked by hand. */
const INTERNAL_MEDIA_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1|160\.25\.110\.10)(?::\d+)?(\/uploads\/.*)$/i;

function healMediaUrl(v) {
    if (typeof v !== 'string') return v;
    const m = INTERNAL_MEDIA_RE.exec(v);
    if (m && typeof window !== 'undefined' && window.STRAPI_URL) return window.STRAPI_URL + m[1];
    return v;
}

function healMediaUrls(value) {
    if (Array.isArray(value)) return value.map(healMediaUrls);
    if (value && typeof value === 'object') {
        const out = {};
        for (const k in value) out[k] = healMediaUrls(value[k]);
        return out;
    }
    return healMediaUrl(value);
}

/**
 * Render an array of section objects into `root`.
 * Exported for canvas-mode.js (editor live canvas) to reuse.
 */
export function renderSections(root, sections) {
    root.innerHTML = '';
    const sorted = (Array.isArray(sections) ? sections : [])
        .filter((s) => s && s.visible !== false && s.type)
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    sorted.forEach((section) => {
        const entry = COMPONENT_REGISTRY[section.type];
        if (!entry) {
            console.warn('[page-renderer] Unknown section type:', section.type);
            return;
        }
        const wrap = document.createElement('div');
        wrap.dataset.sectionId = section.id || '';
        wrap.dataset.sectionType = section.type;
        applyLayout(wrap, section.layout);
        // Append BEFORE rendering: many renderers populate via document-level
        // selectors (populateIconCards('#id'), initFAQ, …) which find nothing
        // while the wrapper is detached → empty sections.
        root.appendChild(wrap);
        section = Object.assign({}, section, { props: healMediaUrls(section.props || {}) });
        try {
            entry.renderer(wrap, section.props || {});
        } catch (err) {
            console.error('[page-renderer] Renderer threw for', section.type, err);
            wrap.remove();
        }
    });
}

async function fetchPage(slug, previewToken) {
    if (previewToken) {
        const r = await fetch('/api/builder/preview/' + encodeURIComponent(slug) + '?token=' + encodeURIComponent(previewToken));
        if (!r.ok) throw new Error('preview-token-invalid');
        const json = await r.json();
        return json.data;
    }

    const r = await fetch(
        '/api/strapi/api/builder-pages?filters[slug][$eq]=' + encodeURIComponent(slug) +
        '&pagination[pageSize]=1'
    );
    if (!r.ok) throw new Error('strapi-error');
    const json = await r.json();
    const page = (json && json.data && json.data[0]) || null;
    return page;
}

(async function initBuilderPage() {
    const params = new URLSearchParams(window.location.search);

    // ── Editor canvas mode: no fetch, rendered via postMessage ──
    if (params.get('canvas') === '1') {
        hidePageLoader();
        try {
            const mod = await import('./canvas-mode.js');
            mod.initCanvasMode(renderSections);
        } catch (err) {
            console.error('[page-renderer] canvas-mode failed to load:', err);
        }
        return;
    }

    // URL forms:
    //   /<slug>                      (top-level builder page)
    //   /blogs/<slug>                (blog post — see server.js isBlogSlug())
    //   /builder/<slug>              (legacy)
    //   /builder/preview/<slug>?token=…
    const parts = window.location.pathname.split('/').filter(Boolean);
    let slug;
    const previewToken = params.get('token');

    if (parts[0] === 'builder' && parts[1] === 'preview' && parts[2]) {
        slug = parts[2];
    } else if (parts[0] === 'builder' && parts[1]) {
        slug = parts[1];
    } else if (parts[0] === 'blogs' && parts[1]) {
        slug = parts[1];                              // /blogs/<slug>
    } else if (parts.length === 1 && parts[0]) {
        slug = parts[0];                              // top-level /<slug>
    } else {
        return showError('Invalid page URL.');
    }

    let page;
    try {
        page = await fetchPage(slug, previewToken);
    } catch (err) {
        console.error('[page-renderer] fetch failed:', err);
        return showError('Unable to load this page. Please try again later.');
    }

    if (!page) {
        return showError('This page does not exist or is not published yet.');
    }

    const title = page.title || 'Untitled';
    const metaTitle = page.metaTitle || title;
    const metaDescription = page.metaDescription || '';
    document.title = metaTitle + ' | ICSDC';
    setMeta('description', metaDescription);

    const root = document.getElementById('builder-page-root');
    if (!root) return showError('Renderer not mounted.');

    renderSections(root, page.sections);

    if (page._isPreview) {
        const banner = document.createElement('div');
        banner.className = 'builder-preview-banner';
        banner.innerHTML = '<i class="fa-solid fa-eye" aria-hidden="true"></i> Preview mode — this is unsaved draft content.';
        document.body.prepend(banner);
    }

    hidePageLoader();
})();
