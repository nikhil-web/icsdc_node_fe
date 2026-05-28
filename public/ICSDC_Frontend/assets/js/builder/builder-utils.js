/**
 * builder-utils.js
 * ────────────────
 * Tiny helpers used by the builder renderer + admin editor.
 */

/* Generate a stable section id for new sections. */
export function generateSectionId() {
    return 'sec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

/* HTML escape — used by renderers when emitting user-provided strings. */
export function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* Resolve a Font Awesome icon key OR a raw fa-* class to a class string. */
export function resolveFaIcon(key, fallback = 'circle') {
    if (!key) return 'fa-solid fa-' + fallback;
    const k = String(key).trim();
    if (k.includes('fa-')) return k.startsWith('fa-') ? 'fa-solid ' + k : k;
    return 'fa-solid fa-' + k;
}

/* Build a CTA button anchor HTML for any of the design system button styles. */
export function ctaButtonHtml(cta, styleClass) {
    if (!cta || !cta.text) return '';
    const href = cta.link || '#';
    const text = esc(cta.text);
    const cls = styleClass || 'btn-primary';
    return '<a href="' + esc(href) + '" class="' + cls + '">' + text + '</a>';
}
