/**
 * templates.js
 * ────────────
 * Pre-built page templates offered in the "New Page" dialog.
 *
 * A template is just a starting set of sections — once created, the page is a
 * normal builder page with no ongoing link back to the template.
 *
 * Each entry:
 *   { id, label, description, icon, sections: [{ type, props?, layout? }] }
 *
 * `props` is optional: omit it and the component's own defaultProps are used
 * (so templates don't have to restate content that already has a sensible
 * default, and they stay correct if a component's defaults change).
 * Section ids/order are assigned at creation time by the editor.
 */

// Only used for kb-article's blogBody props below — see the comment there.
import { COMPONENT_REGISTRY } from './componentRegistry.js';

export const BUILDER_TEMPLATES = [
    {
        id: 'blank',
        label: 'Blank page',
        description: 'Start with nothing and build it up section by section.',
        icon: 'fa-file',
        sections: [],
    },
    {
        id: 'blog-post',
        label: 'Blog post',
        description: 'Cover image, title and author byline, then a full rich-text article.',
        icon: 'fa-newspaper',
        sections: [
            { type: 'blogHeader' },
            { type: 'blogBody' },
            {
                type: 'ctaBand',
                layout: {},
                props: {
                    variant: 'dark',
                    title: 'Have questions about your hosting?',
                    description: 'Talk to our team — we will help you pick the right setup.',
                    ctaPrimary: { text: 'Talk to an Expert', link: 'contact-popup' },
                    ctaSecondary: { text: 'See Pricing', link: '/pricing' },
                },
            },
        ],
    },
    {
        id: 'kb-article',
        label: 'Knowledge Base article',
        description: 'Legal-Pages-style header (category, title, last updated) plus a full rich-text article with an auto-generated "on this page" rail.',
        icon: 'fa-book',
        sections: [
            { type: 'kbHeader' },
            /* Providing `props` here means sectionsFromTemplate() uses EXACTLY this
               object instead of blogBody's defaultProps — it is `s.props ||
               defaultProps`, not a merge (see builder-editor.js sectionsFromTemplate).
               So this spreads blogBody's own defaultProps and overrides only
               showSidebar, rather than restating them by hand (which would fork the
               placeholder article body text into a second copy that silently drifts
               from the real one). showSidebar off: blogBody's sidebar defaults to a
               product-push promo ("View Plans") that fits a marketing article, not
               documentation. showHelp stays on — the "I need help with" links are
               still relevant context on a support/how-to article. */
            { type: 'blogBody', props: { ...COMPONENT_REGISTRY.blogBody.defaultProps, showSidebar: false } },
        ],
    },
    {
        id: 'landing',
        label: 'Landing page',
        description: 'Hero, trust pillars, features, pricing and an FAQ — a full offer page.',
        icon: 'fa-rocket',
        sections: [
            { type: 'hero' },
            { type: 'pillars' },
            { type: 'iconCards' },
            { type: 'pricing' },
            { type: 'faq' },
            { type: 'ctaBand' },
        ],
    },
    {
        id: 'service',
        label: 'Service page',
        description: 'Explain one service: hero, who we are, features, comparison and CTA.',
        icon: 'fa-layer-group',
        sections: [
            { type: 'hero' },
            { type: 'pillars' },
            { type: 'whoWeAre' },
            { type: 'iconCards' },
            { type: 'comparisonTable' },
            { type: 'faq' },
            { type: 'ctaBand' },
        ],
    },
];

export function getTemplate(id) {
    return BUILDER_TEMPLATES.find((t) => t.id === id) || BUILDER_TEMPLATES[0];
}
