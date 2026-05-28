/**
 * page-renderer.js
 * ────────────────
 * Runs on every /builder/:slug request (and /builder/preview/:slug).
 * Fetches the page's section JSON from Strapi (or the preview token endpoint),
 * then dispatches each section to its registry renderer.
 *
 * Public pages       → /api/strapi/api/builder-pages?filters[slug][$eq]=...
 * Preview (drafts)   → /api/builder/preview/:slug?token=...
 */

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
    // URL forms:
    //   /builder/<slug>
    //   /builder/preview/<slug>?token=...
    const parts = window.location.pathname.split('/').filter(Boolean);
    let slug;
    const params = new URLSearchParams(window.location.search);
    const previewToken = params.get('token');

    if (parts[0] === 'builder' && parts[1] === 'preview' && parts[2]) {
        slug = parts[2];
    } else if (parts[0] === 'builder' && parts[1]) {
        slug = parts[1];
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

    const sections = Array.isArray(page.sections) ? page.sections : [];
    const root = document.getElementById('builder-page-root');
    if (!root) return showError('Renderer not mounted.');

    const sorted = sections
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
        try {
            entry.renderer(wrap, section.props || {});
            root.appendChild(wrap);
        } catch (err) {
            console.error('[page-renderer] Renderer threw for', section.type, err);
        }
    });

    if (page._isPreview) {
        const banner = document.createElement('div');
        banner.className = 'builder-preview-banner';
        banner.innerHTML = '<i class="fa-solid fa-eye" aria-hidden="true"></i> Preview mode — this is unsaved draft content.';
        document.body.prepend(banner);
    }

    hidePageLoader();
})();
