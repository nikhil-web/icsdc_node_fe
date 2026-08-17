/**
 * componentRegistry.js
 * ────────────────────
 * The single source of truth for the page builder.
 *
 * Each entry maps a section `type` to:
 *   { label, icon, schema[], defaultProps, renderer(container, props) }
 *
 * Adding a new component = adding ONE entry here.
 * The editor's left panel auto-iterates Object.keys() to render the library.
 * The editor's right panel auto-iterates `schema` to render the property form.
 * The frontend page-renderer dispatches to `renderer`.
 *
 * Renderers emit HTML using the existing design-system classes
 * (.hero-section, .cloud-power-card, .cloud-cta-band, .faq-section, .wp-plan-card)
 * — they do NOT depend on page-specific JS files.
 */

import { esc, resolveFaIcon, ctaButtonHtml } from './builder-utils.js';
import {
    populateHero,
    populateIconCards,
    populateCtaBand,
    populatePricingPlans,
    populatePricingPlansCloud,
    initFAQ as sharedInitFAQ,
    initTestimonials as sharedInitTestimonials,
    inlineRichText,
    resolveIcon,
} from '../utils/cms-helpers.js';

// Each builder section gets a unique id so multiple instances of the same
// component on a page never collide when the helpers query by selector.
let _bldSeq = 0;
function bldId(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + (_bldSeq++); }

/* ════ HERO ══════════════════════════════════════════════════ */
const hero = {
    label: 'Hero Section',
    icon: 'rocket',
    description: 'Page-opening hero with image, headline, sub-heading, description, and CTAs.',
    schema: [
        { key: 'eyebrow', label: 'Eyebrow Text', type: 'text' },
        { key: 'title', label: 'Heading', type: 'text', required: true },
        { key: 'subtitle', label: 'Sub-heading', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'imageUrl', label: 'Hero Image', type: 'image' },
        { key: 'imageAlt', label: 'Image Alt Text', type: 'text' },
        { key: 'imageSide', label: 'Image Side', type: 'select', options: ['left', 'right'], default: 'left' },
        {
            key: 'ctaPrimary', label: 'Primary CTA', type: 'cta',
            fields: [
                { key: 'text', label: 'Button Text', type: 'text' },
                { key: 'link', label: 'URL', type: 'text' },
            ]
        },
        {
            key: 'ctaSecondary', label: 'Secondary CTA', type: 'cta',
            fields: [
                { key: 'text', label: 'Button Text', type: 'text' },
                { key: 'link', label: 'URL', type: 'text' },
            ]
        },
    ],
    defaultProps: {
        eyebrow: '',
        title: 'Your Headline Here',
        subtitle: 'A short supporting sub-heading.',
        description: 'A longer description that explains the offering. Replace this with your own content.',
        imageUrl: '/assets/images/trusted-cloud-service-provider 1.png',
        imageAlt: 'Hero illustration',
        imageSide: 'left',
        ctaPrimary: { text: 'Get Started', link: '/contact-us' },
        ctaSecondary: { text: 'Learn More', link: '#' },
    },
    renderer(container, p) {
        // Emit the same scaffold the hand-built hosting pages use, then hand it
        // to the shared populateHero() helper. Identical code path = identical output.
        const sideClass = (p.imageSide === 'right') ? ' builder-hero-img-right' : ' builder-hero-img-left';
        const heroRight = p.imageUrl
            ? '<div class="hero-right"><img class="hero-right-image" alt="' + esc(p.imageAlt || '') + '"></div>'
            : '';
        const contentHtml =
            '<div class="hero-content">' +
            (p.eyebrow ? '<div class="eyebrow-badge"></div>' : '') +
            '<h1 class="hero-title"></h1>' +
            '<p class="hero-sub"></p>' +
            '<p class="hero-desc"></p>' +
            '<div class="hero-btns">' +
            '<button class="btn-outline"></button>' +
            '<button class="btn-primary"></button>' +
            '</div>' +
            '</div>';
        const inner = (p.imageSide === 'right') ? contentHtml + heroRight : heroRight + contentHtml;
        container.innerHTML =
            '<section class="hero-section builder-hero' + sideClass + '">' +
            '<div class="hero">' + inner + '</div>' +
            '</section>';

        const section = container.querySelector('.hero-section');
        // populateHero expects Strapi nested heroImage shape; fake it from a plain URL.
        const heroImagePayload = p.imageUrl
            ? { image: { url: p.imageUrl } }
            : null;
        populateHero(section, {
            eyebrow: p.eyebrow,
            title: p.title,
            subtitle: p.subtitle,
            description: p.description,
            ctaPrimary: p.ctaPrimary,
            ctaSecondary: p.ctaSecondary,
            heroImage: heroImagePayload,
        });

        // Clean up empty optional elements so we don't leave hollow tags behind.
        ['.hero-sub', '.hero-desc', '.eyebrow-badge'].forEach((sel) => {
            const el = section.querySelector(sel);
            if (el && !el.textContent.trim() && !el.innerHTML.trim()) el.remove();
        });
    },
};

/* ════ ICON CARDS ════════════════════════════════════════════ */
// Card-style → emitted card class + icon class. These exactly match the patterns
// used across the existing hardcoded pages (cloud-hosting.html, web-hosting.html,
// cpanel-hosting.html, shared-hosting.html, windows-dedicated-server.html, etc.).
const CARD_STYLES = {
    'cloud-power': { card: 'cloud-power-card', icon: 'cloud-power-icon', gridClass: 'cloud-power-grid' },
    'cloud-use': { card: 'cloud-use-card', icon: 'cloud-use-icon', gridClass: 'cloud-use-grid' },
    'why': { card: 'why-card', icon: 'why-icon', gridClass: 'why-grid' },
    'framework': { card: 'cloud-framework-badge', icon: 'cloud-framework-icon', gridClass: 'cloud-frameworks-grid' },
    'support': { card: 'cp-support-feat-card', icon: 'cp-support-feat-icon', gridClass: 'cp-support-features' },
};

const iconCards = {
    label: 'Icon Cards Grid',
    icon: 'grid',
    description: 'Flexible grid of icon + title + description cards. Choose card style to match any existing page.',
    schema: [
        { key: 'label', label: 'Section Label (eyebrow)', type: 'text' },
        { key: 'title', label: 'Section Title', type: 'text', required: true },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'cardStyle', label: 'Card Style', type: 'select',
            options: ['cloud-power', 'cloud-use', 'why', 'framework', 'support'],
            default: 'cloud-power',
        },
        { key: 'numbered', label: 'Numbered Cards (01, 02…)', type: 'toggle', default: false },
        { key: 'columns', label: 'Columns', type: 'number', default: 3, min: 2, max: 4 },
        {
            key: 'cards', label: 'Cards', type: 'repeater',
            itemSchema: [
                { key: 'icon', label: 'Icon Key (FA name)', type: 'text' },
                { key: 'title', label: 'Card Title', type: 'text' },
                { key: 'desc', label: 'Card Description', type: 'textarea' },
            ],
        },
    ],
    defaultProps: {
        label: 'Features',
        title: 'Why Choose Us',
        subtitle: '',
        cardStyle: 'cloud-power',
        numbered: false,
        columns: 3,
        cards: [
            { icon: 'bolt', title: 'Fast Performance', desc: 'Blazing fast infrastructure tuned for speed.' },
            { icon: 'shield-halved', title: 'Secure by Default', desc: 'Enterprise-grade security at every layer.' },
            { icon: 'headset', title: '24/7 Support', desc: 'Real humans available around the clock.' },
        ],
    },
    renderer(container, p) {
        const style = CARD_STYLES[p.cardStyle] || CARD_STYLES['cloud-power'];
        const label = p.label ? '<span class="cloud-section-label">' + esc(p.label) + '</span>' : '';
        const sub = p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '';
        const cols = Math.min(4, Math.max(2, Number(p.columns) || 3));
        const numbered = p.numbered === true;
        const gridId = bldId('bld-cards');

        // Emit just the section + empty grid; populateIconCards fills the grid.
        container.innerHTML =
            '<section class="section">' +
            '<div class="container">' +
            label +
            '<h2 class="title">' + esc(p.title) + '</h2>' +
            sub +
            '<div id="' + gridId + '" class="' + style.gridClass + '" style="grid-template-columns:repeat(' + cols + ',1fr)"></div>' +
            '</div>' +
            '</section>';

        if (numbered) {
            // No shared helper for the numbered .sh-when-card pattern — emit it directly.
            const grid = container.querySelector('#' + gridId);
            grid.innerHTML = (p.cards || []).map((c, i) =>
                '<div class="' + style.card + '">' +
                '<div class="sh-when-card-num">' + String(i + 1).padStart(2, '0') + '</div>' +
                '<h3>' + esc(c.title) + '</h3>' +
                (c.desc ? '<p>' + esc(c.desc) + '</p>' : '') +
                '</div>'
            ).join('');
        } else {
            // Delegate to the canonical helper used by every hand-built hosting page.
            populateIconCards('#' + gridId, p.cards || [], style.card);
        }
    },
};

/* ════ CTA BAND ══════════════════════════════════════════════ */
const ctaBand = {
    label: 'CTA Band',
    icon: 'arrow',
    description: 'A full-width call-to-action band with headline and buttons.',
    schema: [
        { key: 'variant', label: 'Variant', type: 'select', options: ['light', 'dark'], default: 'dark' },
        { key: 'title', label: 'Headline', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        {
            key: 'ctaPrimary', label: 'Primary CTA', type: 'cta',
            fields: [
                { key: 'text', label: 'Button Text', type: 'text' },
                { key: 'link', label: 'URL', type: 'text' },
            ],
        },
        {
            key: 'ctaSecondary', label: 'Secondary CTA', type: 'cta',
            fields: [
                { key: 'text', label: 'Button Text', type: 'text' },
                { key: 'link', label: 'URL', type: 'text' },
            ],
        },
    ],
    defaultProps: {
        variant: 'dark',
        title: 'Ready to get started?',
        description: 'Deploy your infrastructure in minutes.',
        ctaPrimary: { text: 'Start Now', link: '/contact-us' },
        ctaSecondary: { text: 'Learn More', link: '#' },
    },
    renderer(container, p) {
        // Emit the empty .cloud-cta-band scaffold the shared populateCtaBand() expects,
        // then delegate. Same code path the hardcoded hosting pages use.
        const isDark = p.variant === 'dark';
        const id = bldId('bld-cta');
        const cls = 'cloud-cta-band' + (isDark ? ' cloud-cta-dark' : '');
        const btnPrimaryCls = isDark ? 'cloud-cta-btn-primary' : 'btn-primary';
        const btnSecondaryCls = isDark ? 'cloud-cta-btn-outline' : 'btn-outline';
        container.innerHTML =
            '<section id="' + id + '" class="' + cls + '">' +
            '<div class="cloud-cta-inner">' +
            '<h2></h2>' +
            '<p></p>' +
            '<div class="cloud-cta-btns">' +
            '<button class="' + btnSecondaryCls + '"></button>' +
            '<button class="' + btnPrimaryCls + '"></button>' +
            '</div>' +
            '</div>' +
            '</section>';
        populateCtaBand('#' + id, {
            title: p.title,
            description: p.description,
            ctaPrimary: p.ctaPrimary,
            ctaSecondary: p.ctaSecondary,
        });
    },
};

/* ════ FAQ ═══════════════════════════════════════════════════ */
const faq = {
    label: 'FAQ Section',
    icon: 'question',
    description: 'Numbered accordion of frequently-asked questions.',
    schema: [
        { key: 'title', label: 'Section Title', type: 'text', default: 'Frequently Asked Questions' },
        {
            key: 'items', label: 'FAQ Items', type: 'repeater',
            itemSchema: [
                { key: 'question', label: 'Question', type: 'text' },
                { key: 'answer', label: 'Answer', type: 'textarea' },
            ],
        },
    ],
    defaultProps: {
        title: 'Frequently Asked Questions',
        items: [
            { question: 'What is included?', answer: 'Replace this answer with your own content.' },
            { question: 'How do I get started?', answer: 'Replace this answer with your own content.' },
            { question: 'Is support available 24/7?', answer: 'Replace this answer with your own content.' },
        ],
    },
    renderer(container, p) {
        // Emit the exact scaffold the shared initFAQ() helper expects (hardcoded id="faq-accordions")
        // then hand it the items. Identical to every hand-built hosting page's FAQ.
        container.innerHTML =
            '<section class="faq-section">' +
            '<div class="faq-container">' +
            '<div class="faq-col">' +
            '<h2 class="faq-title">' + esc(p.title) + '</h2>' +
            '<div class="faq-grid">' +
            '<div class="faq-accordions" id="faq-accordions"></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</section>';
        Promise.resolve().then(() => sharedInitFAQ(p.items || []));
    },
};

/* ════ PRICING ═══════════════════════════════════════════════ */
const pricing = {
    label: 'Pricing Plans',
    icon: 'tag',
    description: '3-column pricing plans with optional "popular" badge. Choose WP style (default) or Cloud style.',
    schema: [
        { key: 'label', label: 'Section Label', type: 'text' },
        { key: 'title', label: 'Section Title', type: 'text', required: true },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'style', label: 'Card Style', type: 'select',
            options: ['wp', 'cloud'], default: 'wp',
        },
        {
            key: 'plans', label: 'Plans', type: 'repeater',
            itemSchema: [
                { key: 'name', label: 'Plan Name / Tier', type: 'text' },
                { key: 'price', label: 'Price', type: 'text' },
                { key: 'period', label: 'Period', type: 'text', default: '/mo' },
                { key: 'currency', label: 'Currency', type: 'text', default: '₹' },
                { key: 'desc', label: 'Description / Tagline', type: 'textarea' },
                { key: 'features', label: 'Features (one per line)', type: 'textarea' },
                { key: 'popular', label: 'Mark as Popular', type: 'toggle', default: false },
                { key: 'ctaText', label: 'Button Text', type: 'text', default: 'Get Started' },
                { key: 'ctaLink', label: 'Button URL', type: 'text', default: '/contact-us' },
            ],
        },
    ],
    defaultProps: {
        label: 'Our Plans',
        title: 'Choose the Plan That Fits',
        subtitle: 'Transparent pricing. No surprises.',
        style: 'wp',
        plans: [
            { name: 'Starter', price: '99', period: '/mo', currency: '₹', desc: 'For personal projects.', features: '1 Site\n5GB Storage\nFree SSL\n24/7 Support', popular: false, ctaText: 'Get Started', ctaLink: '/contact-us' },
            { name: 'Business', price: '249', period: '/mo', currency: '₹', desc: 'For growing teams.', features: '5 Sites\n20GB Storage\nFree SSL + Domain\nDaily Backups\nPriority Support', popular: true, ctaText: 'Get Started', ctaLink: '/contact-us' },
            { name: 'Pro', price: '499', period: '/mo', currency: '₹', desc: 'For high-traffic sites.', features: 'Unlimited Sites\n50GB NVMe SSD\nCDN Included\nDaily Backups\nMalware Scan\nPriority Support', popular: false, ctaText: 'Get Started', ctaLink: '/contact-us' },
        ],
    },
    renderer(container, p) {
        const label = p.label ? '<span class="cloud-section-label">' + esc(p.label) + '</span>' : '';
        const sub = p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '';
        const style = p.style === 'cloud' ? 'cloud' : 'wp';
        const gridId = bldId('bld-pricing');

        // Map the builder's plain plan schema onto the shape the canonical
        // populatePricingPlans / populatePricingPlansCloud helpers expect.
        const plans = (p.plans || []).map((plan) => ({
            tier: plan.name || plan.tier || '',
            currency: plan.currency || '₹',
            price: plan.price || '',
            period: plan.period || '/mo',
            tagline: plan.desc || plan.tagline || '',
            features: String(plan.features || '').split('\n').map((f) => f.trim()).filter(Boolean).map((f) => ({ label: f })),
            isFeatured: plan.popular === true,
            badge: plan.badgeLabel || 'Most Popular',
            ctaText: plan.ctaText || 'Get Started',
            ctaStyle: (plan.popular === true) ? 'primary' : 'outline',
            // ctaLink carried through and applied post-render (the helpers emit <button>)
            _ctaLink: plan.ctaLink || '/contact-us',
        }));

        const gridCls = style === 'cloud' ? 'cloud-pricing-grid' : 'wp-plans-grid';
        const sectionCls = style === 'cloud' ? 'section cloud-pricing-section' : 'section';
        container.innerHTML =
            '<section class="' + sectionCls + '">' +
            '<div class="container">' +
            label +
            '<h2 class="title">' + esc(p.title) + '</h2>' +
            sub +
            '<div id="' + gridId + '" class="' + gridCls + '"></div>' +
            '</div>' +
            '</section>';

        const grid = container.querySelector('#' + gridId);

        if (style === 'cloud') {
            // Delegate to the canonical helper used by cloud-hosting/pricing pages.
            populatePricingPlansCloud('#' + gridId, plans);
            const btns = grid.querySelectorAll('.cloud-plan-cta');
            btns.forEach((btn, i) => {
                const link = plans[i] && plans[i]._ctaLink;
                if (link) btn.setAttribute('onclick', "window.location.href='" + link + "'");
            });
        } else {
            // .wp-plan-card has no shared populate helper — emit markup that
            // matches wordpress-hosting.css exactly (same shape WP CMS produces).
            grid.innerHTML = plans.map((plan) => {
                const isPop = plan.isFeatured;
                const popularCls = isPop ? ' wp-plan-popular' : '';
                const badge = isPop ? '<div class="wp-plan-badge">' + esc(plan.badge) + '</div>' : '';
                const featsHtml = (plan.features || []).map((f) => '<li>' + esc(f.label) + '</li>').join('');
                return '<div class="wp-plan-card' + popularCls + '">' +
                    badge +
                    '<div class="wp-plan-name">' + esc(plan.tier) + '</div>' +
                    '<div class="wp-plan-price">' + esc(plan.currency) + esc(plan.price) + '<span>' + esc(plan.period) + '</span></div>' +
                    (plan.tagline ? '<p class="wp-plan-desc">' + esc(plan.tagline) + '</p>' : '') +
                    '<ul class="wp-plan-features">' + featsHtml + '</ul>' +
                    '<a href="' + esc(plan._ctaLink) + '" class="wp-plan-btn">' + esc(plan.ctaText) + ' </a>' +
                    '</div>';
            }).join('');
        }
    },
};

/* ════ STATS BAND ════════════════════════════════════════════ */
const statsBand = {
    label: 'Stats / Metrics Band',
    icon: 'chart',
    description: 'A row of large metric numbers with sub-labels. e.g. 99.9% Uptime · 24/7 Support · 2-Hr RPO.',
    schema: [
        { key: 'label', label: 'Section Label', type: 'text' },
        { key: 'title', label: 'Section Title', type: 'text' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'metrics', label: 'Metrics', type: 'repeater',
            itemSchema: [
                { key: 'value', label: 'Big Value (e.g. 99.9%)', type: 'text' },
                { key: 'label', label: 'Sub-label', type: 'text' },
            ],
        },
    ],
    defaultProps: {
        label: '',
        title: '',
        subtitle: '',
        metrics: [
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '2-Hr', label: 'RPO Guarantee' },
            { value: '100%', label: 'India-Hosted' },
            { value: '24/7', label: 'Expert Support' },
        ],
    },
    renderer(container, p) {
        const label = p.label ? '<span class="cloud-section-label">' + esc(p.label) + '</span>' : '';
        const title = p.title ? '<h2 class="title">' + esc(p.title) + '</h2>' : '';
        const sub = p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '';
        const items = (p.metrics || []).map((m) =>
            '<div class="cloud-wl-metric">' +
            '<strong>' + esc(m.value) + '</strong>' +
            '<span>' + esc(m.label) + '</span>' +
            '</div>'
        ).join('');
        container.innerHTML =
            '<section class="section cloud-workload-section">' +
            '<div class="container">' +
            label + title + sub +
            '<div class="cloud-wl-metrics">' + items + '</div>' +
            '</div>' +
            '</section>';
    },
};

/* ════ COMPARISON TABLE ══════════════════════════════════════ */
const comparisonTable = {
    label: 'Comparison Table',
    icon: 'compare',
    description: 'ICSDC vs Typical Providers — feature-by-feature comparison table.',
    schema: [
        { key: 'label', label: 'Section Label', type: 'text' },
        { key: 'title', label: 'Section Title', type: 'text', required: true },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        { key: 'colFeature', label: 'Feature Column Header', type: 'text', default: 'Feature' },
        { key: 'colOurs', label: 'Our Column Header', type: 'text', default: 'ICSDC' },
        { key: 'colTheirs', label: 'Their Column Header', type: 'text', default: 'Typical Providers' },
        { key: 'mode', label: 'Cell Mode', type: 'select', options: ['text', 'checkmark'], default: 'text' },
        {
            key: 'rows', label: 'Rows', type: 'repeater',
            itemSchema: [
                { key: 'feature', label: 'Feature', type: 'text' },
                { key: 'ours', label: 'Our Value (text or "yes"/"no")', type: 'text' },
                { key: 'theirs', label: 'Their Value (text or "yes"/"no")', type: 'text' },
            ],
        },
    ],
    defaultProps: {
        label: '',
        title: 'How We Compare',
        subtitle: '',
        colFeature: 'Feature',
        colOurs: 'ICSDC',
        colTheirs: 'Typical Providers',
        mode: 'text',
        rows: [
            { feature: 'Infrastructure Quality', ours: 'Enterprise-grade servers tuned for stability', theirs: 'Mass-market shared servers oversold for cost' },
            { feature: 'Performance Consistency', ours: 'Predictable speed even during traffic spikes', theirs: 'Performance drops during peak usage' },
            { feature: 'Security Approach', ours: 'Security-first architecture with isolation', theirs: 'Basic security with limited visibility' },
            { feature: 'Uptime Reliability', ours: 'High availability with proactive monitoring', theirs: 'Reactive uptime with limited redundancy' },
        ],
    },
    renderer(container, p) {
        const label = p.label ? '<span class="cloud-section-label">' + esc(p.label) + '</span>' : '';
        const sub = p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '';
        const mode = p.mode === 'checkmark' ? 'checkmark' : 'text';
        function cell(v) {
            if (mode !== 'checkmark') return esc(v);
            const yes = /^(yes|true|✓|y|1)$/i.test(String(v || '').trim());
            return yes
                ? '<i class="fa-solid fa-check" style="color:#16a34a" aria-hidden="true"></i>'
                : '<i class="fa-solid fa-xmark" style="color:#94a3b8" aria-hidden="true"></i>';
        }
        const rowsHtml = (p.rows || []).map((r) =>
            '<tr>' +
            '<td>' + esc(r.feature) + '</td>' +
            '<td class="webh-col-icsdc">' + cell(r.ours) + '</td>' +
            '<td>' + cell(r.theirs) + '</td>' +
            '</tr>'
        ).join('');
        container.innerHTML =
            '<section class="section">' +
            '<div class="container">' +
            label +
            '<h2 class="title">' + esc(p.title) + '</h2>' +
            sub +
            '<div class="webh-compare-table-wrap">' +
            '<table class="webh-compare-table">' +
            '<thead><tr><th>' + esc(p.colFeature) + '</th><th class="webh-col-icsdc">' + esc(p.colOurs) + '</th><th>' + esc(p.colTheirs) + '</th></tr></thead>' +
            '<tbody>' + rowsHtml + '</tbody>' +
            '</table>' +
            '</div>' +
            '</div>' +
            '</section>';
    },
};

/* ════ PROCESS STEPS ═════════════════════════════════════════ */
const processSteps = {
    label: 'Process Steps',
    icon: 'steps',
    description: 'Horizontal flow of numbered steps. e.g. "What Happens Next" — 01 → 02 → 03.',
    schema: [
        { key: 'label', label: 'Section Label', type: 'text' },
        { key: 'title', label: 'Section Title', type: 'text', required: true },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'steps', label: 'Steps', type: 'repeater',
            itemSchema: [
                { key: 'title', label: 'Step Title', type: 'text' },
                { key: 'desc', label: 'Step Description (optional)', type: 'textarea' },
            ],
        },
    ],
    defaultProps: {
        label: '',
        title: 'What Happens Next',
        subtitle: '',
        steps: [
            { title: 'Share Your Requirement', desc: '' },
            { title: 'We Review Your Use Case', desc: '' },
            { title: 'We Suggest the Right Solution', desc: '' },
            { title: 'Setup & Beyond', desc: '' },
        ],
    },
    renderer(container, p) {
        const label = p.label ? '<span class="cloud-section-label">' + esc(p.label) + '</span>' : '';
        const sub = p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '';
        const steps = p.steps || [];
        const stepsHtml = steps.map((s, i) => {
            const stepEl =
                '<div class="cu-step">' +
                '<div class="cu-step-number">' + String(i + 1).padStart(2, '0') + '</div>' +
                '<h3 class="cu-step-title">' + esc(s.title) + '</h3>' +
                (s.desc ? '<p class="cu-step-desc" style="text-align:center;color:var(--muted);margin-top:8px">' + esc(s.desc) + '</p>' : '') +
                '</div>';
            const connector = (i < steps.length - 1) ? '<div class="cu-step-connector" aria-hidden="true"></div>' : '';
            return stepEl + connector;
        }).join('');
        container.innerHTML =
            '<section class="section">' +
            '<div class="container">' +
            label +
            '<h2 class="title">' + esc(p.title) + '</h2>' +
            sub +
            '<div class="cu-steps-flow">' + stepsHtml + '</div>' +
            '</div>' +
            '</section>';
    },
};

/* ════ LOGO CLOUD (Partners) ═════════════════════════════════ */
const logoCloud = {
    label: 'Logo Cloud / Partners',
    icon: 'partners',
    description: 'Grid of partner / client logos or text badges.',
    schema: [
        { key: 'label', label: 'Section Label', type: 'text' },
        { key: 'title', label: 'Section Title', type: 'text', required: true },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'logos', label: 'Logos', type: 'repeater',
            itemSchema: [
                { key: 'name', label: 'Name (shown as text fallback)', type: 'text' },
                { key: 'imageUrl', label: 'Logo Image (optional)', type: 'image' },
                { key: 'link', label: 'Link URL (optional)', type: 'text' },
            ],
        },
    ],
    defaultProps: {
        label: '',
        title: 'Our Partners',
        subtitle: '',
        logos: [
            { name: 'Partner A', imageUrl: '', link: '' },
            { name: 'Partner B', imageUrl: '', link: '' },
            { name: 'Partner C', imageUrl: '', link: '' },
            { name: 'Partner D', imageUrl: '', link: '' },
        ],
    },
    renderer(container, p) {
        const label = p.label ? '<span class="cloud-section-label">' + esc(p.label) + '</span>' : '';
        const sub = p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '';
        const itemsHtml = (p.logos || []).map((l) => {
            const inner = l.imageUrl
                ? '<img src="' + esc(l.imageUrl) + '" alt="' + esc(l.name || '') + '" style="max-width:140px;max-height:60px;object-fit:contain">'
                : '<span class="au-partner-name">' + esc(l.name) + '</span>';
            return l.link
                ? '<a href="' + esc(l.link) + '" class="au-partner-box" style="text-decoration:none">' + inner + '</a>'
                : '<div class="au-partner-box">' + inner + '</div>';
        }).join('');
        container.innerHTML =
            '<section class="section au-partners-section">' +
            '<div class="container">' +
            label +
            '<h2 class="title">' + esc(p.title) + '</h2>' +
            sub +
            '<div class="au-partners-grid">' + itemsHtml + '</div>' +
            '</div>' +
            '</section>';
    },
};

/* ════ TESTIMONIALS ══════════════════════════════════════════ */
// Uses the SHARED initTestimonials helper from utils/cms-helpers.js — the same
// renderer every hand-built hosting page calls. We just emit the .testi-section
// scaffold with the global IDs the helper expects (#testi-grid, #testi-dots,
// #testi-prev, #testi-next) and hand it the items.
const testimonials = {
    label: 'Testimonials',
    icon: 'star',
    description: 'Carousel of customer quotes — uses the shared cms-helpers.initTestimonials() renderer.',
    schema: [
        { key: 'title', label: 'Section Title', type: 'text', default: 'What Our Customers Say' },
        {
            key: 'items', label: 'Testimonials', type: 'repeater',
            itemSchema: [
                { key: 'quote', label: 'Quote', type: 'textarea' },
                { key: 'name', label: 'Name', type: 'text' },
                { key: 'title', label: 'Job Title', type: 'text' },
                { key: 'company', label: 'Company', type: 'text' },
                { key: 'rating', label: 'Rating (1-5)', type: 'number', min: 1, max: 5, default: 5 },
            ],
        },
    ],
    defaultProps: {
        title: 'What Our Customers Say',
        items: [
            { quote: "Switching to ICSDC was a defining strategic move. Our previous cloud provider's outages were costing us dearly. Since migrating, our verified uptime has been flawless. They deliver the high performance and reliability they promise.", name: 'Aarav Sharma', title: 'Chief Technology Officer', company: 'reputable IT Firm', rating: 5 },
            { quote: "The complexity of billing from our last provider was a nightmare. It's a genuine partnership built on clarity, and the performance for our core banking applications is consistently superior.", name: 'Priya Singh', title: 'Head of IT Infrastructure', company: 'FinTech Solution Provider', rating: 5 },
            { quote: 'The zero-downtime migration guarantee was the reason we chose ICSDC. They delivered on that promise, making the transition seamless and risk-free.', name: 'Rajesh Menon', title: 'Director of Digital Transformation', company: 'Logistic Partner', rating: 5 },
        ],
    },
    renderer(container, p) {
        // Map prior draft shapes (jobTitle / role) onto `title` so the helper sees them.
        const items = (p.items || []).map((t) => ({
            quote: t.quote || '',
            name: t.name || '',
            title: t.title || t.jobTitle || t.role || '',
            company: t.company || '',
            rating: Math.max(1, Math.min(5, Number(t.rating) || 5)),
        }));

        // Emit the exact scaffold initTestimonials expects (with global IDs).
        container.innerHTML =
            '<section class="testi-section" aria-labelledby="bld-testi-heading">' +
            '<div class="testi-container">' +
            '<h2 id="bld-testi-heading" class="testi-title">' + esc(p.title) + '</h2>' +
            '<div class="testi-scroll-viewport">' +
            '<div class="testi-grid" id="testi-grid" role="list" aria-label="Customer testimonials"></div>' +
            '</div>' +
            '<div class="testi-pagination" id="testi-dots" role="tablist" aria-label="Testimonial navigation"></div>' +
            '<div class="testi-nav">' +
            '<button class="testi-nav-btn" id="testi-prev" aria-label="Previous testimonial">&#8249;</button>' +
            '<button class="testi-nav-btn" id="testi-next" aria-label="Next testimonial">&#8250;</button>' +
            '</div>' +
            '</div>' +
            '</section>';

        // Defer one microtask so the DOM is queryable, then run the shared helper —
        // the same code path every hand-built hosting page uses.
        Promise.resolve().then(() => sharedInitTestimonials(items));
    },
};

const imageText = {
    label: 'Image + Text Split',
    icon: 'image',
    description: 'Two-column layout: image on one side, headline + paragraph + optional CTA on the other.',
    schema: [
        { key: 'eyebrow', label: 'Eyebrow (small label)', type: 'text' },
        { key: 'title', label: 'Heading', type: 'text', required: true },
        { key: 'body', label: 'Body Text', type: 'textarea' },
        { key: 'imageUrl', label: 'Image', type: 'image' },
        { key: 'imageAlt', label: 'Image Alt Text', type: 'text' },
        { key: 'imageSide', label: 'Image Side', type: 'select', options: ['left', 'right'], default: 'left' },
        {
            key: 'cta', label: 'Call-to-Action (optional)', type: 'cta',
            fields: [
                { key: 'text', label: 'Button Text', type: 'text' },
                { key: 'link', label: 'URL', type: 'text' },
            ],
        },
    ],
    defaultProps: {
        eyebrow: 'About ICSDC',
        title: 'Who We Are?',
        body: 'At ICSDC, we are redefining reliability and performance in web hosting. From shared hosting to enterprise cloud, we are a trusted provider in India, built for the world with enterprise-grade performance at every tier.',
        imageUrl: '/assets/images/trusted-cloud-service-provider 1.png',
        imageAlt: 'ICSDC Team',
        imageSide: 'left',
        cta: { text: '', link: '' },
    },
    renderer(container, p) {
        const eyebrow = p.eyebrow ? '<span class="cloud-section-label">' + esc(p.eyebrow) + '</span>' : '';
        const body = p.body ? '<p class="who-we-are-paragraph">' + esc(p.body) + '</p>' : '';
        const cta = (p.cta && p.cta.text)
            ? '<a class="btn-primary" style="margin-top:18px;align-self:flex-start" href="' + esc(p.cta.link || '#') + '">' + esc(p.cta.text) + '</a>'
            : '';
        const imageHtml =
            '<div class="who-we-are-image">' +
            (p.imageUrl
                ? '<img src="' + esc(p.imageUrl) + '" alt="' + esc(p.imageAlt || '') + '">'
                : '<div style="aspect-ratio:4/3;background:var(--blue-light);border-radius:16px;display:flex;align-items:center;justify-content:center;color:var(--blue);font-weight:600">No image</div>') +
            '</div>';
        const contentHtml =
            '<div class="blue-container">' +
            eyebrow +
            '<h2 class="title" style="text-align:left;margin-top:8px">' + esc(p.title) + '</h2>' +
            body +
            cta +
            '</div>';
        const inner = p.imageSide === 'right'
            ? contentHtml + imageHtml
            : imageHtml + contentHtml;
        container.innerHTML =
            '<section class="who-we-are section">' +
            '<div class="who-we-are-inner">' + inner + '</div>' +
            '</section>';
    },
};

/* ════ GALLERY (Life @ ICSDC) ════════════════════════════════ */
const gallery = {
    label: 'Image Gallery',
    icon: 'gallery',
    description: 'Grid of images with overlay labels — like the "Life @ ICSDC" section on About Us.',
    schema: [
        { key: 'title', label: 'Section Title', type: 'text', required: true },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'items', label: 'Images', type: 'repeater',
            itemSchema: [
                { key: 'imageUrl', label: 'Image', type: 'image' },
                { key: 'imageAlt', label: 'Alt Text', type: 'text' },
                { key: 'label', label: 'Overlay Label', type: 'text' },
            ],
        },
    ],
    defaultProps: {
        title: 'Life @ ICSDC',
        subtitle: 'Where ideas, collaboration, and everyday moments come together.',
        items: [
            { imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80', imageAlt: 'Team event', label: 'Team Events' },
            { imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80', imageAlt: 'Celebrations', label: 'Celebrations' },
            { imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80', imageAlt: 'Collaboration', label: 'Collaboration' },
            { imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', imageAlt: 'Office culture', label: 'Culture' },
            { imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80', imageAlt: 'Growth', label: 'Growth' },
        ],
    },
    renderer(container, p) {
        const sub = p.subtitle ? '<p class="au-life-desc">' + esc(p.subtitle) + '</p>' : '';
        const cardsHtml = (p.items || []).map((it) =>
            '<div class="au-life-card">' +
            '<img src="' + esc(it.imageUrl) + '" alt="' + esc(it.imageAlt || '') + '" loading="lazy">' +
            (it.label
                ? '<div class="au-life-card-overlay"><span class="au-life-card-label">' + esc(it.label) + '</span></div>'
                : '') +
            '</div>'
        ).join('');
        container.innerHTML =
            '<section class="section au-life-section">' +
            '<div class="container">' +
            '<h2 class="title">' + esc(p.title) + '</h2>' +
            sub +
            '</div>' +
            '<div class="au-life-gallery">' + cardsHtml + '</div>' +
            '</section>';
    },
};

/* ════ CONTACT INFO CARDS ════════════════════════════════════ */
const contactInfo = {
    label: 'Contact Info Cards',
    icon: 'info',
    description: 'Stack of icon + label + value cards. Email, phone, address, office hours.',
    schema: [
        { key: 'title', label: 'Section Title', type: 'text', default: 'Get in Touch' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'items', label: 'Contact Items', type: 'repeater',
            itemSchema: [
                { key: 'icon', label: 'Icon Key (FA name)', type: 'text' },
                { key: 'label', label: 'Label', type: 'text' },
                { key: 'value', label: 'Value', type: 'textarea' },
                { key: 'link', label: 'Link (optional, e.g. mailto: or tel:)', type: 'text' },
            ],
        },
    ],
    defaultProps: {
        title: 'Get in Touch',
        subtitle: "We're always ready to help. Reach out through any of the channels below.",
        items: [
            { icon: 'envelope', label: 'Email Address', value: 'info@icsdc.com', link: 'mailto:info@icsdc.com' },
            { icon: 'phone', label: 'Phone Number', value: '+91 98109 58857', link: 'tel:+919810958857' },
            { icon: 'map-pin', label: 'Our Address', value: 'Plot No. 21 & 21A, 6th Floor, Sector 142, Noida, UP 201304', link: '' },
            { icon: 'clock', label: 'Office Hours', value: 'Monday – Friday: 9:00 AM – 6:00 PM IST | 24/7 Support for active clients', link: '' },
        ],
    },
    renderer(container, p) {
        const subtitle = p.subtitle ? '<p class="cu-info-subtitle">' + esc(p.subtitle) + '</p>' : '';
        const cardsHtml = (p.items || []).map((it) => {
            const inner =
                '<div class="cu-info-icon"><i class="' + resolveFaIcon(it.icon, 'circle-info') + '" aria-hidden="true"></i></div>' +
                '<div class="cu-info-text">' +
                '<span class="cu-info-label">' + esc(it.label) + '</span>' +
                '<span class="cu-info-value">' + esc(it.value) + '</span>' +
                '</div>';
            return it.link
                ? '<a href="' + esc(it.link) + '" class="cu-info-card" style="text-decoration:none">' + inner + '</a>'
                : '<div class="cu-info-card">' + inner + '</div>';
        }).join('');
        container.innerHTML =
            '<section class="section cu-contact-section">' +
            '<div class="container">' +
            '<div class="cu-info-col">' +
            '<h3 class="cu-info-title">' + esc(p.title) + '</h3>' +
            subtitle +
            '<div class="cu-info-cards">' + cardsHtml + '</div>' +
            '</div>' +
            '</div>' +
            '</section>';
    },
};

/* ════ CONTACT FORM ══════════════════════════════════════════ */
const contactForm = {
    label: 'Contact Form',
    icon: 'envelope',
    description: 'Full contact form with name/email/phone/company/subject/message. Submits to /api/strapi/api/contact-submissions.',
    schema: [
        { key: 'title', label: 'Section Title', type: 'text', default: 'Send Us a Message' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        { key: 'subjectOptions', label: 'Subject Options (one per line; blank for free-text field)', type: 'textarea' },
        { key: 'successMessage', label: 'Success Message', type: 'textarea', default: 'Thank you for reaching out. Our team will get back to you shortly.' },
    ],
    defaultProps: {
        title: 'Send Us a Message',
        subtitle: '',
        subjectOptions: 'VPS / Cloud Hosting Questions\nInfrastructure Planning\nMigration & Performance\nSecurity & Compliance\nPricing & Plans\nPartnerships & Reseller\nTechnical Support\nOther / General Inquiry',
        successMessage: 'Thank you for reaching out. Our team will get back to you shortly.',
    },
    renderer(container, p) {
        const subtitle = p.subtitle ? '<p class="subtitle" style="margin-bottom:24px">' + esc(p.subtitle) + '</p>' : '';
        const opts = String(p.subjectOptions || '').split('\n').map((s) => s.trim()).filter(Boolean);
        const subjectField = opts.length
            ? '<select id="bld-cf-subject" name="subject" class="cu-input cu-select" required>' +
            '<option value="" disabled selected>Select a topic…</option>' +
            opts.map((o) => '<option value="' + esc(o) + '">' + esc(o) + '</option>').join('') +
            '</select>'
            : '<input type="text" id="bld-cf-subject" name="subject" class="cu-input" placeholder="What is this about?" required>';

        // Unique form ID so multiple contact forms on one page don't collide
        const formId = 'bld-cf-' + Math.random().toString(36).slice(2, 9);

        container.innerHTML =
            '<section class="section">' +
            '<div class="container" style="max-width:760px">' +
            '<div class="cu-hero-form-wrap">' +
            '<h3 class="cu-hero-form-title">' + esc(p.title) + '</h3>' +
            subtitle +
            '<form id="' + formId + '" class="cu-form" novalidate>' +
            '<div class="cu-form-row">' +
            '<div class="cu-field"><label class="cu-label">Your Name <span class="cu-required">*</span></label>' +
            '<input type="text" name="name" class="cu-input" placeholder="John Smith" required></div>' +
            '<div class="cu-field"><label class="cu-label">Email Address <span class="cu-required">*</span></label>' +
            '<input type="email" name="email" class="cu-input" placeholder="john@company.com" required></div>' +
            '</div>' +
            '<div class="cu-form-row">' +
            '<div class="cu-field"><label class="cu-label">Phone Number</label>' +
            '<input type="tel" name="phone" class="cu-input" placeholder="+91 98765 43210"></div>' +
            '<div class="cu-field"><label class="cu-label">Company / Organization</label>' +
            '<input type="text" name="company" class="cu-input" placeholder="Your Company Ltd."></div>' +
            '</div>' +
            '<div class="cu-field"><label class="cu-label">What Can We Help You With? <span class="cu-required">*</span></label>' +
            subjectField +
            '</div>' +
            '<div class="cu-field"><label class="cu-label">Your Message <span class="cu-required">*</span></label>' +
            '<textarea name="message" class="cu-input cu-textarea" rows="4" placeholder="Tell us about your requirement…" required></textarea>' +
            '</div>' +
            '<button type="submit" class="cu-submit-btn">Send Message </button>' +
            '</form>' +
            '<div class="cu-form-success" style="display:none">' +
            '<div class="cu-success-icon"><i class="fa-solid fa-circle-check" aria-hidden="true"></i></div>' +
            '<h3>Message Sent!</h3>' +
            '<p>' + esc(p.successMessage) + '</p>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</section>';

        // Wire submission to the existing /api/strapi proxy that the hand-built contact-us page uses
        const form = container.querySelector('#' + formId);
        const success = container.querySelector('.cu-form-success');
        if (form && success) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = form.querySelector('.cu-submit-btn');
                const orig = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Sending…';
                const fd = new FormData(form);
                const payload = {
                    name: String(fd.get('name') || '').trim(),
                    email: String(fd.get('email') || '').trim(),
                    phone: String(fd.get('phone') || '').trim(),
                    company: String(fd.get('company') || '').trim(),
                    subject: String(fd.get('subject') || '').trim(),
                    message: String(fd.get('message') || '').trim(),
                };
                try {
                    const r = await fetch('/api/strapi/api/contact-submissions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ data: payload }),
                    });
                    if (!r.ok) throw new Error('submit failed (' + r.status + ')');
                    form.style.display = 'none';
                    success.style.display = 'block';
                } catch (err) {
                    submitBtn.innerHTML = orig;
                    submitBtn.disabled = false;
                    alert('Could not send your message: ' + err.message);
                }
            });
        }
    },
};

/* ════ MAP EMBED ═════════════════════════════════════════════ */
const mapEmbed = {
    label: 'Map Embed',
    icon: 'map',
    description: 'Google Maps iframe — full-bleed location embed.',
    schema: [
        { key: 'title', label: 'Section Title (optional)', type: 'text' },
        { key: 'embedUrl', label: 'Google Maps Embed URL', type: 'textarea', required: true },
        { key: 'height', label: 'Height (px)', type: 'number', default: 420, min: 200, max: 800 },
    ],
    defaultProps: {
        title: '',
        embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3504.7!2d77.4100!3d28.5850!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce8b12345678%3A0xabcdef1234567890!2sSector%20142%2C%20Noida%2C%20Uttar%20Pradesh%20201304!5e0!3m2!1sen!2sin!4v1700000000001!5m2!1sen!2sin',
        height: 420,
    },
    renderer(container, p) {
        const h = Math.max(200, Math.min(800, Number(p.height) || 420));
        const title = p.title ? '<h2 class="title" style="text-align:center;margin-bottom:24px">' + esc(p.title) + '</h2>' : '';
        container.innerHTML =
            '<section class="section">' +
            '<div class="container">' +
            title +
            '<div class="cu-map-col" style="height:' + h + 'px;border-radius:12px;overflow:hidden">' +
            '<iframe src="' + esc(p.embedUrl) + '" width="100%" height="100%" style="border:0" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map"></iframe>' +
            '</div>' +
            '</div>' +
            '</section>';
    },
};

/* ═══════════════════════════════════════════════════════════════
   HARVESTED SITE COMPONENTS (2026-07-03)
   Each one reuses the exact markup/classes of an existing page
   section so builder pages are visually identical to hand-built
   pages. Source pattern noted per component.
   ═══════════════════════════════════════════════════════════════ */

/* ════ PILLARS — hero pillar strip (why-card grid, site-wide) ═ */
const pillars = {
    label: 'Hero Pillars',
    icon: 'star',
    description: 'The 3–4 pillar badges strip that sits under the hero on every hosting page (why-card style).',
    schema: [
        {
            key: 'items', label: 'Pillars', type: 'repeater',
            itemSchema: [
                { key: 'icon', label: 'Icon Key (FA name)', type: 'text' },
                { key: 'title', label: 'Title', type: 'text' },
                { key: 'desc', label: 'Short Description', type: 'textarea' },
            ],
        },
    ],
    defaultProps: {
        items: [
            { icon: 'gauge-high', title: '99.9% Uptime', desc: 'Guaranteed availability backed by SLA.' },
            { icon: 'shield-halved', title: 'Enterprise Security', desc: 'Protected at every layer, always.' },
            { icon: 'headset', title: '24/7 Support', desc: 'Real engineers, around the clock.' },
            { icon: 'indian-rupee-sign', title: 'Transparent Pricing', desc: 'No hidden fees. Ever.' },
        ],
    },
    renderer(container, p) {
        const gridId = bldId('bld-pillars');
        container.innerHTML =
            '<section class="section"><div class="container">' +
            '<div id="' + gridId + '" class="why-grid"></div>' +
            '</div></section>';
        populateIconCards('#' + gridId, p.items || [], 'why-card');
    },
};

/* ════ CHECKLIST SPLIT — "When to choose" list (cs-when) ═════ */
const checklistSplit = {
    label: 'Checklist Section',
    icon: 'info',
    description: 'Title + intro + checklist of bullet points (the "When should you choose…" pattern).',
    schema: [
        { key: 'title', label: 'Section Title', type: 'text', required: true },
        { key: 'subtitle', label: 'Intro Line', type: 'text' },
        {
            key: 'items', label: 'Checklist Items', type: 'repeater',
            itemSchema: [{ key: 'text', label: 'Item', type: 'textarea' }],
        },
    ],
    defaultProps: {
        title: 'When Should You Choose This?',
        subtitle: 'Choose this solution if:',
        items: [
            { text: 'Your data is growing and local infrastructure is hard to manage.' },
            { text: 'You need secure access from multiple locations or remote teams.' },
            { text: 'You want to avoid the cost of maintaining physical systems.' },
            { text: 'You prefer a managed solution without infrastructure overhead.' },
        ],
    },
    renderer(container, p) {
        const lis = (p.items || []).map((i) => '<li>' + esc(i.text || '') + '</li>').join('');
        container.innerHTML =
            '<section class="section"><div class="container">' +
            '<h2 class="title">' + esc(p.title) + '</h2>' +
            (p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '') +
            '<ul class="cs-when-list">' + lis + '</ul>' +
            '</div></section>';
    },
};

/* ════ WHO WE ARE — image + blue container (homepage) ════════ */
const whoWeAre = {
    label: 'Who We Are',
    icon: 'info',
    description: 'Image left + blue panel with heading, paragraph and feature buttons — the site-wide "Who We Are" pattern.',
    schema: [
        { key: 'title', label: 'Heading', type: 'text', required: true },
        { key: 'paragraph', label: 'Paragraph', type: 'textarea' },
        { key: 'imageUrl', label: 'Image', type: 'image' },
        { key: 'imageAlt', label: 'Image Alt Text', type: 'text' },
        {
            key: 'points', label: 'Feature Buttons', type: 'repeater',
            itemSchema: [{ key: 'text', label: 'Text', type: 'text' }],
        },
        {
            key: 'cta', label: 'CTA Button (last, highlighted)', type: 'cta',
            fields: [
                { key: 'text', label: 'Button Text', type: 'text' },
                { key: 'link', label: 'URL', type: 'text' },
            ],
        },
    ],
    defaultProps: {
        title: 'Who We Are?',
        paragraph: 'At ICSDC, we don’t just host your data — we power your digital infrastructure with advanced technology and expert support.',
        imageUrl: '/assets/images/Home page images_s.webp',
        imageAlt: 'About ICSDC',
        points: [
            { text: 'Ultra-fast and scalable cloud solutions built for growth' },
            { text: 'Enterprise-grade security with least downtime' },
            { text: 'Real people, real support — available 24/7' },
        ],
        cta: { text: 'Connect with a Cloud Architect Now', link: '/contact-us' },
    },
    renderer(container, p) {
        const btns = (p.points || []).map((pt) =>
            '<button class="btn-outline feature-cards">' + esc(pt.text || '') + '</button>').join('');
        const ctaBtn = (p.cta && p.cta.text)
            ? '<button class="btn-primary feature-cards" onclick="window.location.href=\'' + esc(p.cta.link || '#') + '\'">' + esc(p.cta.text) + '</button>'
            : '';
        container.innerHTML =
            '<section class="who-we-are section">' +
            '<div class="who-we-are-inner">' +
            '<div class="who-we-are-image">' +
            (p.imageUrl ? '<img src="' + esc(p.imageUrl) + '" alt="' + esc(p.imageAlt || '') + '">' : '') +
            '</div>' +
            '<div class="blue-container">' +
            '<h2 class="title">' + esc(p.title) + '</h2>' +
            '<p class="who-we-are-paragraph">' + inlineRichText(p.paragraph || '') + '</p>' +
            '<div class="who-we-are-btns">' + btns + ctaBtn + '</div>' +
            '</div>' +
            '</div>' +
            '</section>';
    },
};

/* ════ FEATURE ROWS — alternating image/text rows ════════════ */
const featureRows = {
    label: 'Feature Rows',
    icon: 'image',
    description: 'Alternating image + text rows (image left, then right, then left…). Great for feature deep-dives.',
    schema: [
        { key: 'title', label: 'Section Title (optional)', type: 'text' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'rows', label: 'Rows', type: 'repeater',
            itemSchema: [
                { key: 'title', label: 'Row Heading', type: 'text' },
                { key: 'body', label: 'Row Text', type: 'textarea' },
                { key: 'imageUrl', label: 'Image', type: 'image' },
                { key: 'imageAlt', label: 'Image Alt', type: 'text' },
            ],
        },
    ],
    defaultProps: {
        title: 'Everything You Need, End to End',
        subtitle: '',
        rows: [
            { title: 'Launch in minutes', body: 'Provision production-ready infrastructure with a few clicks.', imageUrl: '/assets/images/Home page images_s.webp', imageAlt: '' },
            { title: 'Scale without limits', body: 'Grow capacity on demand — pay only for what you use.', imageUrl: '/assets/images/Home page images_s.webp', imageAlt: '' },
        ],
    },
    renderer(container, p) {
        const head = (p.title || p.subtitle)
            ? '<div class="container" style="text-align:center;margin-bottom:36px">' +
              (p.title ? '<h2 class="title">' + esc(p.title) + '</h2>' : '') +
              (p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '') +
              '</div>'
            : '';
        const rows = (p.rows || []).map((r, i) => {
            const img = '<div class="who-we-are-image">' +
                (r.imageUrl ? '<img src="' + esc(r.imageUrl) + '" alt="' + esc(r.imageAlt || '') + '">' : '') +
                '</div>';
            const txt = '<div class="blue-container">' +
                '<h2 class="title">' + esc(r.title || '') + '</h2>' +
                '<p class="who-we-are-paragraph">' + inlineRichText(r.body || '') + '</p>' +
                '</div>';
            const inner = (i % 2 === 0) ? img + txt : txt + img;
            return '<div class="who-we-are-inner" style="margin-bottom:40px">' + inner + '</div>';
        }).join('');
        container.innerHTML = '<section class="who-we-are section">' + head + rows + '</section>';
    },
};

/* ════ STAT CHIPS — hp-stat row (homepage partner section) ═══ */
const statChips = {
    label: 'Stat Chips',
    icon: 'chart',
    description: 'Row of icon + big number + label chips (homepage "99.9% Uptime SLA" style).',
    schema: [
        {
            key: 'stats', label: 'Stats', type: 'repeater',
            itemSchema: [
                { key: 'icon', label: 'Icon Key (FA name)', type: 'text' },
                { key: 'number', label: 'Value', type: 'text' },
                { key: 'label', label: 'Label', type: 'text' },
            ],
        },
    ],
    defaultProps: {
        stats: [
            { icon: 'gauge-high', number: '99.9%', label: 'Uptime SLA' },
            { icon: 'users', number: '500+', label: 'Clients Served' },
            { icon: 'headset', number: '24/7', label: 'Expert Support' },
            { icon: 'certificate', number: 'ISO', label: 'Certified' },
        ],
    },
    renderer(container, p) {
        const chips = (p.stats || []).map((s) =>
            '<div class="hp-stat">' +
            '<span class="hp-stat-icon"><i class="' + resolveFaIcon(s.icon) + '" aria-hidden="true"></i></span>' +
            '<div><span class="hp-stat-num">' + esc(s.number || '') + '</span>' +
            '<span class="hp-stat-label">' + esc(s.label || '') + '</span></div>' +
            '</div>').join('');
        container.innerHTML =
            '<section class="hp-partner-section"><div class="hp-partner-inner">' +
            '<div class="hp-partner-stats is-visible">' + chips + '</div>' +
            '</div></section>';
    },
};

/* ════ TAG CARDS — hp-partner-card grid (homepage) ═══════════ */
const tagCards = {
    label: 'Tag Cards',
    icon: 'tag',
    description: 'Cards with a small tag chip + heading + text (homepage "Why Partner With Us" cards).',
    schema: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'title', label: 'Section Title', type: 'text' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'cards', label: 'Cards', type: 'repeater',
            itemSchema: [
                { key: 'tag', label: 'Tag Chip', type: 'text' },
                { key: 'title', label: 'Card Heading', type: 'text' },
                { key: 'desc', label: 'Card Text', type: 'textarea' },
            ],
        },
    ],
    defaultProps: {
        eyebrow: 'Why Partner With Us',
        title: 'Our Partnerships Assure Best Cloud Services',
        subtitle: '',
        cards: [
            { tag: 'India First', title: 'We Are the Local Experts', desc: 'Deep roots in the Indian market with local support teams.' },
            { tag: '99.9% SLA', title: 'Your Uptime is Our Promise', desc: 'Guaranteed availability backed by redundant infrastructure.' },
        ],
    },
    renderer(container, p) {
        const cards = (p.cards || []).map((c) =>
            '<article class="hp-partner-card">' +
            (c.tag ? '<span class="hp-partner-tag">' + esc(c.tag) + '</span>' : '') +
            '<h3>' + esc(c.title || '') + '</h3>' +
            '<p>' + inlineRichText(c.desc || '') + '</p>' +
            '</article>').join('');
        container.innerHTML =
            '<section class="hp-partner-section"><div class="hp-partner-inner">' +
            '<div class="hp-partner-header">' +
            (p.eyebrow ? '<span class="hp-eyebrow">' + esc(p.eyebrow) + '</span>' : '') +
            (p.title ? '<h2 class="hp-section-title is-visible">' + esc(p.title) + '</h2>' : '') +
            (p.subtitle ? '<p class="hp-section-sub is-visible">' + esc(p.subtitle) + '</p>' : '') +
            '</div>' +
            '<div class="hp-partner-grid is-visible">' + cards + '</div>' +
            '</div></section>';
    },
};

/* ════ INDUSTRY TABS — hp-industry tabbed panels (homepage) ══ */
const industryTabs = {
    label: 'Industry Tabs',
    icon: 'compare',
    description: 'Tabbed industry panels — tab strip + per-industry card with features, "used by" and a CTA.',
    schema: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'title', label: 'Section Title', type: 'text' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'industries', label: 'Industries', type: 'repeater',
            itemSchema: [
                { key: 'icon', label: 'Tab Icon (FA name)', type: 'text' },
                { key: 'tabLabel', label: 'Tab Label', type: 'text' },
                { key: 'title', label: 'Panel Title', type: 'text' },
                { key: 'desc', label: 'Panel Description', type: 'textarea' },
                { key: 'usedBy', label: '"Used by" line', type: 'text' },
                {
                    key: 'cta', label: 'Panel CTA', type: 'cta',
                    fields: [
                        { key: 'text', label: 'Text', type: 'text' },
                        { key: 'link', label: 'URL', type: 'text' },
                    ],
                },
            ],
        },
    ],
    defaultProps: {
        eyebrow: 'Solutions by industry',
        title: 'Cloud built for your world',
        subtitle: 'Every industry has unique challenges. Pick yours to see how we solve them.',
        industries: [
            { icon: 'heart-pulse', tabLabel: 'Healthcare', title: 'Healthcare cloud solutions', desc: 'Secure, compliant infrastructure for hospitals and health-tech.', usedBy: 'Hospitals, clinics, health-tech startups', cta: { text: 'Explore healthcare cloud', link: '/contact-us' } },
            { icon: 'graduation-cap', tabLabel: 'Education', title: 'Education cloud solutions', desc: 'Scalable infrastructure for EdTech platforms and universities.', usedBy: 'EdTech platforms, universities', cta: { text: 'Explore education cloud', link: '/contact-us' } },
        ],
    },
    renderer(container, p) {
        const inds = Array.isArray(p.industries) ? p.industries : [];
        const secId = bldId('bld-ind');
        const tabs = inds.map((ind, i) =>
            '<button class="hp-industry-tab' + (i === 0 ? ' is-active' : '') + '" role="tab" data-idx="' + i + '">' +
            '<i class="' + resolveFaIcon(ind.icon) + '" aria-hidden="true"></i> ' + esc(ind.tabLabel || '') +
            '</button>').join('');
        container.innerHTML =
            '<section class="hp-industry-section" id="' + secId + '"><div class="hp-industry-inner">' +
            '<div class="hp-industry-header">' +
            (p.eyebrow ? '<span class="hp-eyebrow">' + esc(p.eyebrow) + '</span>' : '') +
            (p.title ? '<h2 class="hp-section-title is-visible">' + esc(p.title) + '</h2>' : '') +
            (p.subtitle ? '<p class="hp-section-sub is-visible">' + esc(p.subtitle) + '</p>' : '') +
            '</div>' +
            '<div class="hp-industry-tabs" role="tablist">' + tabs + '</div>' +
            '<div class="hp-industry-panel" role="tabpanel"></div>' +
            '</div></section>';

        const root = container.querySelector('#' + secId);
        const panel = root.querySelector('.hp-industry-panel');
        function renderPanel(i) {
            const ind = inds[i]; if (!ind) { panel.innerHTML = ''; return; }
            const cta = (ind.cta && ind.cta.text)
                ? '<a href="' + esc(ind.cta.link || '#') + '" class="hp-industry-cta">' + esc(ind.cta.text) +
                  ' <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>'
                : '';
            panel.innerHTML =
                '<div class="hp-industry-card-head">' +
                '<div class="hp-industry-card-icon"><i class="' + resolveFaIcon(ind.icon) + '" aria-hidden="true"></i></div>' +
                '<div><h3 class="hp-industry-card-title">' + esc(ind.title || '') + '</h3>' +
                '<p class="hp-industry-card-desc">' + inlineRichText(ind.desc || '') + '</p></div>' +
                '</div>' +
                '<div class="hp-industry-card-foot">' +
                (ind.usedBy ? '<span class="hp-industry-usedby"><strong>Used by:</strong> ' + esc(ind.usedBy) + '</span>' : '') +
                cta +
                '</div>';
        }
        renderPanel(0);
        root.querySelector('.hp-industry-tabs').addEventListener('click', (e) => {
            const btn = e.target.closest('.hp-industry-tab'); if (!btn) return;
            root.querySelectorAll('.hp-industry-tab').forEach((t) => t.classList.remove('is-active'));
            btn.classList.add('is-active');
            renderPanel(Number(btn.dataset.idx));
        });
    },
};

/* ════ SECURITY CARDS — hp-security-card grid (homepage) ═════ */
const securityCards = {
    label: 'Security Cards',
    icon: 'grid',
    description: 'Icon + heading + text + highlight chip cards (homepage Security & Compliance grid).',
    schema: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'title', label: 'Section Title', type: 'text' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'cards', label: 'Cards', type: 'repeater',
            itemSchema: [
                { key: 'icon', label: 'Icon (FA name)', type: 'text' },
                { key: 'title', label: 'Heading', type: 'text' },
                { key: 'desc', label: 'Text', type: 'textarea' },
                { key: 'chip', label: 'Highlight Chip', type: 'text' },
            ],
        },
    ],
    defaultProps: {
        eyebrow: 'Security & compliance',
        title: 'Your data is safe. Always.',
        subtitle: '',
        cards: [
            { icon: 'lock', title: 'End-to-end encryption', desc: 'All data encrypted at rest and in transit.', chip: 'AES-256 + TLS 1.3' },
            { icon: 'database', title: 'Automated backups', desc: 'Daily incremental and weekly full backups.', chip: '30-day retention' },
        ],
    },
    renderer(container, p) {
        const cards = (p.cards || []).map((c) =>
            '<article class="hp-security-card">' +
            '<div class="hp-security-icon"><i class="' + resolveFaIcon(c.icon) + '" aria-hidden="true"></i></div>' +
            '<h3>' + esc(c.title || '') + '</h3>' +
            '<p>' + inlineRichText(c.desc || '') + '</p>' +
            (c.chip ? '<span class="hp-security-chip">' + esc(c.chip) + '</span>' : '') +
            '</article>').join('');
        container.innerHTML =
            '<section class="hp-security-section"><div class="hp-security-inner">' +
            '<div class="hp-security-header">' +
            (p.eyebrow ? '<span class="hp-eyebrow">' + esc(p.eyebrow) + '</span>' : '') +
            (p.title ? '<h2 class="hp-section-title is-visible">' + esc(p.title) + '</h2>' : '') +
            (p.subtitle ? '<p class="hp-section-sub is-visible">' + esc(p.subtitle) + '</p>' : '') +
            '</div>' +
            '<div class="hp-security-grid is-visible">' + cards + '</div>' +
            '</div></section>';
    },
};

/* ════ BADGE ROW — hp-compliance-badge strip (homepage) ══════ */
const badgeRow = {
    label: 'Badge Row',
    icon: 'star',
    description: 'Row of small icon + label pills (compliance badges: ISO, RBI, GDPR…).',
    schema: [
        {
            key: 'badges', label: 'Badges', type: 'repeater',
            itemSchema: [
                { key: 'icon', label: 'Icon (FA name)', type: 'text' },
                { key: 'title', label: 'Label', type: 'text' },
            ],
        },
    ],
    defaultProps: {
        badges: [
            { icon: 'shield-halved', title: 'ISO 27001 certified' },
            { icon: 'award', title: 'ISO 9001 certified' },
            { icon: 'circle-check', title: 'GDPR ready' },
            { icon: 'location-dot', title: 'India data residency' },
        ],
    },
    renderer(container, p) {
        const badges = (p.badges || []).map((b) =>
            '<span class="hp-compliance-badge"><i class="' + resolveFaIcon(b.icon) + '" aria-hidden="true"></i> ' +
            esc(b.title || '') + '</span>').join('');
        container.innerHTML =
            '<section class="hp-security-section"><div class="hp-security-inner">' +
            '<div class="hp-compliance-badges is-visible">' + badges + '</div>' +
            '</div></section>';
    },
};

/* ════ RELATED SERVICES — 2-card cross-sell (veeam pattern) ══ */
const relatedServices = {
    label: 'Related Services',
    icon: 'grid',
    description: 'Cross-sell cards: heading + text + button, 2-up (Related Services pattern).',
    schema: [
        { key: 'title', label: 'Section Title', type: 'text' },
        {
            key: 'cards', label: 'Cards', type: 'repeater',
            itemSchema: [
                { key: 'title', label: 'Card Heading', type: 'text' },
                { key: 'desc', label: 'Card Text', type: 'textarea' },
                { key: 'btnLabel', label: 'Button Label', type: 'text' },
                { key: 'btnUrl', label: 'Button URL', type: 'text' },
            ],
        },
    ],
    defaultProps: {
        title: 'Related Services',
        cards: [
            { title: 'Managed Cloud Hosting', desc: 'Secure, high-performance cloud managed end-to-end by ICSDC.', btnLabel: 'Explore Managed Cloud', btnUrl: '/managed-cloud-hosting' },
            { title: 'Backup & Recovery', desc: 'Enterprise backup with rapid recovery and expert management.', btnLabel: 'View Backup Solutions', btnUrl: '/acronis-backup' },
        ],
    },
    renderer(container, p) {
        const cards = (p.cards || []).map((c) =>
            '<div class="veeam-related-card">' +
            '<h3>' + esc(c.title || '') + '</h3>' +
            '<p>' + inlineRichText(c.desc || '') + '</p>' +
            (c.btnLabel ? '<a href="' + esc(c.btnUrl || '#') + '" class="veeam-related-btn">' + esc(c.btnLabel) + '</a>' : '') +
            '</div>').join('');
        container.innerHTML =
            '<section class="section"><div class="container">' +
            (p.title ? '<h2 class="title" style="text-align:center">' + esc(p.title) + '</h2>' : '') +
            '<div class="veeam-related-grid">' + cards + '</div>' +
            '</div></section>';
    },
};

/* ════ NUMBERED TIPS — grouped bullet lists (mch-optim) ══════ */
const numberedTips = {
    label: 'Grouped Bullet Lists',
    icon: 'steps',
    description: 'Titled groups each with a bullet list (Server Optimisations pattern).',
    schema: [
        { key: 'title', label: 'Section Title', type: 'text' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'groups', label: 'Groups', type: 'repeater',
            itemSchema: [
                { key: 'title', label: 'Group Title', type: 'text' },
                { key: 'bullets', label: 'Bullets (one per line)', type: 'textarea' },
            ],
        },
    ],
    defaultProps: {
        title: 'What We Optimise',
        subtitle: '',
        groups: [
            { title: 'Performance', bullets: 'Caching tuned per workload\nDatabase query optimisation\nCDN configuration' },
            { title: 'Security', bullets: 'Firewall hardening\nMalware scanning\nPatch management' },
        ],
    },
    renderer(container, p) {
        const groups = (p.groups || []).map((g) => {
            const lis = String(g.bullets || '').split('\n').map((s) => s.trim()).filter(Boolean)
                .map((b) => '<li>' + esc(b) + '</li>').join('');
            return '<div class="mch-optim-group">' +
                '<h3 class="mch-optim-group-title">' + esc(g.title || '') + '</h3>' +
                '<ul class="mch-optim-list">' + lis + '</ul>' +
                '</div>';
        }).join('');
        container.innerHTML =
            '<section class="section"><div class="container">' +
            (p.title ? '<h2 class="title" style="text-align:center">' + esc(p.title) + '</h2>' : '') +
            (p.subtitle ? '<p class="subtitle" style="text-align:center">' + esc(p.subtitle) + '</p>' : '') +
            '<div class="mch-optim-groups">' + groups + '</div>' +
            '</div></section>';
    },
};

/* ════ PLANS TABLE — vm-plans-table (virtual machine page) ═══ */
const plansTable = {
    label: 'Plans Table',
    icon: 'tag',
    description: 'Spec-by-spec plans table with a CTA per row (Virtual Machine plans pattern).',
    schema: [
        { key: 'title', label: 'Section Title', type: 'text' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        { key: 'columns', label: 'Column Headers (comma-separated)', type: 'text' },
        { key: 'ctaLabel', label: 'Row CTA Label', type: 'text', default: 'Get Started' },
        { key: 'ctaLink', label: 'Row CTA Link', type: 'text', default: '/contact-us' },
        {
            key: 'rows', label: 'Plan Rows', type: 'repeater',
            itemSchema: [
                { key: 'cells', label: 'Cells (comma-separated, matches headers)', type: 'textarea' },
            ],
        },
    ],
    defaultProps: {
        title: 'Choose Your Plan',
        subtitle: '',
        columns: 'Plan Name, vCPU, RAM, Storage, Data Transfer, Starting Price',
        ctaLabel: 'Get Started',
        ctaLink: '/contact-us',
        rows: [
            { cells: 'Starter, 2 vCPU, 4 GB, 80 GB NVMe, 2 TB, Contact Us' },
            { cells: 'Business, 4 vCPU, 8 GB, 160 GB NVMe, 4 TB, Contact Us' },
        ],
    },
    renderer(container, p) {
        const cols = String(p.columns || '').split(',').map((s) => s.trim()).filter(Boolean);
        const ths = cols.map((c) => '<th>' + esc(c) + '</th>').join('') + '<th>Action</th>';
        const trs = (p.rows || []).map((r) => {
            const cells = String(r.cells || '').split(',').map((s) => s.trim());
            const tds = cols.map((_, i) => '<td>' + esc(cells[i] || '') + '</td>').join('');
            const cta = '<td><a href="' + esc(p.ctaLink || '/contact-us') + '" class="btn-primary" style="padding:8px 16px;font-size:13px;white-space:nowrap">' + esc(p.ctaLabel || 'Get Started') + '</a></td>';
            return '<tr>' + tds + cta + '</tr>';
        }).join('');
        container.innerHTML =
            '<section class="section cloud-pricing-section"><div class="container">' +
            (p.title ? '<h2 class="title">' + esc(p.title) + '</h2>' : '') +
            (p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '') +
            '<div class="vm-plans-table-wrap">' +
            '<table class="vm-plans-table"><thead><tr>' + ths + '</tr></thead><tbody>' + trs + '</tbody></table>' +
            '</div>' +
            '</div></section>';
    },
};

/* ════ AUDIENCE GROUPS — cs-audience cards (cloud storage) ═══ */
const audienceGroups = {
    label: 'Audience Groups',
    icon: 'partners',
    description: 'Cards per audience: heading + intro + bullet list ("For Businesses / Creators / Individuals").',
    schema: [
        { key: 'title', label: 'Section Title', type: 'text' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'groups', label: 'Groups', type: 'repeater',
            itemSchema: [
                { key: 'title', label: 'Group Heading', type: 'text' },
                { key: 'intro', label: 'Intro Line', type: 'textarea' },
                { key: 'points', label: 'Points (one per line)', type: 'textarea' },
            ],
        },
    ],
    defaultProps: {
        title: 'One Platform for Every Type of User',
        subtitle: '',
        groups: [
            { title: 'For Businesses', intro: 'Built for teams that need secure, reliable infrastructure.', points: 'Central, secure data environment\nControlled team access\nGranular permissions' },
            { title: 'For Individuals', intro: 'Simple and dependable for personal use.', points: 'Easy setup\nAffordable plans\nAccess anywhere' },
        ],
    },
    renderer(container, p) {
        const cards = (p.groups || []).map((g) => {
            const lis = String(g.points || '').split('\n').map((s) => s.trim()).filter(Boolean)
                .map((pt) => '<li>' + esc(pt) + '</li>').join('');
            return '<div class="cs-audience-card">' +
                '<h3 class="cs-audience-title">' + esc(g.title || '') + '</h3>' +
                (g.intro ? '<p class="cs-audience-intro">' + esc(g.intro) + '</p>' : '') +
                '<ul class="cs-audience-points">' + lis + '</ul>' +
                '</div>';
        }).join('');
        container.innerHTML =
            '<section class="section cloud-power-section"><div class="container">' +
            (p.title ? '<h2 class="title">' + esc(p.title) + '</h2>' : '') +
            (p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '') +
            '<div class="cs-audience-grid">' + cards + '</div>' +
            '</div></section>';
    },
};

/* ════ RICH TEXT — free-form content block ═══════════════════ */
const richText = {
    label: 'Rich Text Block',
    icon: 'info',
    description: 'Free-form text/HTML block for anything the other components don’t cover.',
    schema: [
        { key: 'title', label: 'Heading (optional)', type: 'text' },
        { key: 'body', label: 'Content (HTML allowed)', type: 'textarea', required: true },
        { key: 'centered', label: 'Center Text', type: 'toggle', default: false },
    ],
    defaultProps: {
        title: '',
        body: 'Write anything here. Basic HTML like <strong>bold</strong> and <a href="/contact-us">links</a> is supported.',
        centered: false,
    },
    renderer(container, p) {
        const align = p.centered ? ' style="text-align:center"' : '';
        container.innerHTML =
            '<section class="section"><div class="container"' + align + '>' +
            (p.title ? '<h2 class="title">' + esc(p.title) + '</h2>' : '') +
            '<div class="bld-richtext" style="font-size:15px;line-height:1.65;color:var(--c-text-dark)">' +
            inlineRichText(p.body || '') +
            '</div>' +
            '</div></section>';
    },
};

/* ════ SPACER / DIVIDER ══════════════════════════════════════ */
const spacer = {
    label: 'Spacer / Divider',
    icon: 'steps',
    description: 'Vertical spacing between sections, with an optional divider line.',
    schema: [
        { key: 'height', label: 'Height (px)', type: 'number', default: 60, min: 8, max: 240 },
        { key: 'divider', label: 'Show Divider Line', type: 'toggle', default: false },
    ],
    defaultProps: { height: 60, divider: false },
    renderer(container, p) {
        const h = Math.max(8, Math.min(240, Number(p.height) || 60));
        const line = p.divider
            ? '<div style="max-width:1200px;margin:0 auto;border-top:1px solid var(--c-border,#e6e9f0)"></div>'
            : '';
        container.innerHTML = '<div style="height:' + Math.floor(h / 2) + 'px"></div>' + line +
            '<div style="height:' + Math.ceil(h / 2) + 'px"></div>';
    },
};

/* ════ VIDEO EMBED ═══════════════════════════════════════════ */
const videoEmbed = {
    label: 'Video Embed',
    icon: 'image',
    description: 'Responsive YouTube / Vimeo embed with optional heading.',
    schema: [
        { key: 'title', label: 'Heading (optional)', type: 'text' },
        { key: 'embedUrl', label: 'Embed URL (youtube.com/embed/…)', type: 'text', required: true },
    ],
    defaultProps: {
        title: '',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    renderer(container, p) {
        container.innerHTML =
            '<section class="section"><div class="container">' +
            (p.title ? '<h2 class="title" style="text-align:center;margin-bottom:24px">' + esc(p.title) + '</h2>' : '') +
            '<div style="position:relative;padding-top:56.25%;border-radius:12px;overflow:hidden;max-width:960px;margin:0 auto">' +
            '<iframe src="' + esc(p.embedUrl) + '" style="position:absolute;inset:0;width:100%;height:100%;border:0" ' +
            'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" title="' + esc(p.title || 'Video') + '"></iframe>' +
            '</div>' +
            '</div></section>';
    },
};

/* ════ BLOG HEADER — cover, title, author byline ═════════════ */
const blogHeader = {
    label: 'Blog Header',
    icon: 'info',
    description: 'Article header: cover image, category, title, excerpt and author byline.',
    schema: [
        { key: 'coverImage', label: 'Cover Image', type: 'image' },
        { key: 'coverAlt', label: 'Cover Alt Text', type: 'text' },
        { key: 'category', label: 'Category / Kicker', type: 'text' },
        { key: 'title', label: 'Post Title', type: 'text', required: true },
        { key: 'excerpt', label: 'Excerpt / Standfirst', type: 'textarea' },
        { key: 'authorName', label: 'Author Name', type: 'text' },
        { key: 'authorRole', label: 'Author Role', type: 'text' },
        { key: 'authorAvatar', label: 'Author Photo', type: 'image' },
        { key: 'publishDate', label: 'Publish Date', type: 'text' },
        { key: 'readTime', label: 'Read Time', type: 'text' },
        { key: 'showSocial', label: 'Show social links (from site footer)', type: 'toggle', default: true },
    ],
    defaultProps: {
        coverImage: '/assets/images/Home page images_s.webp',
        coverAlt: 'Article cover image',
        category: 'Cloud Hosting',
        title: 'How to Choose the Right Cloud Hosting for Your Business',
        excerpt: 'A practical guide to comparing performance, security and cost so you can pick a plan that actually fits how you work.',
        authorName: 'ICSDC Team',
        authorRole: 'Cloud Specialists',
        authorAvatar: '',
        publishDate: '',
        readTime: '5 min read',
        showSocial: true,
    },
    renderer(container, p) {
        // `!== false` so posts saved before this field existed still get the row
        // — defaultProps only seed NEWLY created sections.
        const showSocial = p.showSocial !== false;
        const initials = String(p.authorName || 'I').trim().split(/\s+/)
            .map((w) => w[0]).join('').toUpperCase().slice(0, 2);
        const avatar = p.authorAvatar
            ? '<img class="blogh-avatar" src="' + esc(p.authorAvatar) + '" alt="' + esc(p.authorName || '') + '">'
            : '<span class="blogh-avatar blogh-avatar-initials">' + esc(initials) + '</span>';
        const meta = [p.publishDate, p.readTime].filter(Boolean)
            .map((m) => '<span>' + esc(m) + '</span>').join('<span class="blogh-dot">·</span>');

        const byline =
            '<div class="blogh-byline">' +
            avatar +
            '<div class="blogh-byline-text">' +
            (p.authorName ? '<span class="blogh-author">' + esc(p.authorName) + '</span>' : '') +
            (p.authorRole ? '<span class="blogh-role">' + esc(p.authorRole) + '</span>' : '') +
            '</div>' +
            (meta ? '<div class="blogh-meta">' + meta + '</div>' : '') +
            '</div>';

        /* Two columns: all the text on the left, cover image on the right.
           The cover used to be a full-bleed band under the headline, which at the
           header's 1560px measure rendered enormous — it dominated the screen and
           pushed the article itself below the fold. Side by side, the image is
           roughly half the width and the headline keeps the top of the page.

           `.blogh-text` wraps every text element so it is ONE grid item; without
           it each of kicker/title/excerpt/byline would take its own cell and the
           layout would fall apart. Text comes first in source order so that the
           ≤1024px `display:block` rule (which the header already shares with the
           body) stacks headline-then-image with no extra work — and so the h1 is
           still the first thing in the document. */
        container.innerHTML =
            '<section class="section blogh-section">' +
            '<div class="container blogh-inner">' +
            '<div class="blogh-text">' +
            (p.category ? '<span class="blogh-kicker">' + esc(p.category) + '</span>' : '') +
            '<h1 class="blogh-title">' + esc(p.title || '') + '</h1>' +
            (p.excerpt ? '<p class="blogh-excerpt">' + esc(p.excerpt) + '</p>' : '') +
            byline +
            (showSocial
                ? '<div class="blogh-social" data-blogh-social aria-label="Follow ICSDC"></div>'
                : '') +
            '</div>' +
            (p.coverImage
                ? '<figure class="blogh-cover"><img src="' + esc(p.coverImage) + '" alt="' + esc(p.coverAlt || '') + '"></figure>'
                : '') +
            '</div>' +
            '</section>';

        if (showSocial) fillBlogSocial(container);
    },
};

/* Social icons under the byline, reusing the FOOTER's links so there is one
   source of truth: same Strapi `footer.commonFooter.socialLinks`, same
   resolveIcon() call, same order. Edit them once in the CMS and both update.

   Styling is NOT reused: .footer-social-link is built for the dark footer
   (translucent-white fill, white glyphs) and would be invisible on the header's
   light background, so .blogh-social-link restates the same 36px circle in
   theme tokens instead.

   Fire-and-forget, like fillBlogHelp(): the row simply stays empty if Strapi is
   unreachable rather than throwing and taking the rest of the header with it. */
/* Memoised GET, keyed by URL, for CMS lookups made from inside renderers.
   Renderers are NOT called once per page: the builder canvas re-runs every
   renderer on each `bld:render` postMessage, which the editor sends debounced
   on every property edit — so an un-cached fetch here fires again on each
   keystroke batch while an author is typing. Caching the PROMISE (not the
   result) also collapses concurrent callers into one request.
   Page-lifetime only — a reload picks up CMS changes. */
const _cmsGetCache = Object.create(null);
function cmsGet(url) {
    if (!_cmsGetCache[url]) {
        _cmsGetCache[url] = fetch(url)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null);
    }
    return _cmsGetCache[url];
}

function fillBlogSocial(container) {
    const box = container.querySelector('[data-blogh-social]');
    if (!box) return;
    cmsGet('/api/strapi/api/footer?populate[commonFooter][populate][socialLinks]=*')
        .then((json) => {
            const cf = json && json.data && json.data.commonFooter;
            const links = (cf && cf.socialLinks) || [];
            const html = links
                .filter((s) => s.url)
                .map((s) =>
                    '<a class="blogh-social-link" href="' + esc(s.url) + '"' +
                    ' aria-label="' + esc(s.name || 'Social link') + '"' +
                    ' target="_blank" rel="noopener noreferrer">' +
                    resolveIcon(s.icon) + '</a>')
                .join('');
            // Leave the row absent rather than an empty bordered strip.
            if (html) box.innerHTML = html;
            else box.remove();
        })
        .catch(() => { if (box) box.remove(); });
}

/* ════ BLOG BODY — full article, WYSIWYG-edited ══════════════ */
const blogBody = {
    label: 'Article Body',
    icon: 'info',
    description: 'The article itself, written in a full rich-text editor (headings, lists, links, quotes, images). Optional contents rail and promo card fill the side margins.',
    schema: [
        { key: 'body', label: 'Article Content', type: 'richtext' },
        { key: 'showToc', label: 'Show "On this page" contents rail', type: 'toggle', default: true },
        { key: 'showSidebar', label: 'Show side promo card', type: 'toggle', default: true },
        { key: 'showHelp', label: 'Show "I need help with" card', type: 'toggle', default: true },
        { key: 'sidebarTitle', label: 'Promo Title', type: 'text' },
        { key: 'sidebarText', label: 'Promo Text', type: 'textarea' },
        {
            key: 'sidebarCta', label: 'Promo Button', type: 'cta',
            fields: [
                { key: 'text', label: 'Button Text', type: 'text' },
                { key: 'link', label: 'URL', type: 'text' },
            ]
        },
    ],
    defaultProps: {
        body: '<p>Start writing your article here. Use the toolbar above to add headings, lists, links, quotes and images.</p>' +
              '<h2>A section heading</h2>' +
              '<p>Break the article into sections so it stays easy to scan. Keep paragraphs short and lead with the point.</p>' +
              '<ul><li>Bullet lists work well for specifics</li><li>So do short, concrete examples</li></ul>' +
              '<blockquote>Pull out a quote when you want a line to land.</blockquote>',
        showToc: true,
        showSidebar: true,
        showHelp: true,
        sidebarTitle: 'Need hosting that keeps up?',
        sidebarText: 'Talk to our team about a plan sized to your traffic, budget and growth.',
        sidebarCta: { text: 'View Plans', link: '/pricing' },
    },
    renderer(container, p) {
        // Toggles default ON — `undefined` means "prop never set" (older posts
        // created before these fields existed), which should still get the rails.
        const showToc = p.showToc !== false;
        const showSidebar = p.showSidebar !== false;

        // Mirrors the /legal/* TOC markup (aside > details > summary + ul), which
        // already solves the mobile-collapse case. NOTE: a bare <nav> here is a
        // trap — style.css styles the element itself (`nav { position: fixed;
        // top: 0; z-index: 1000 }`) for the site navbar, so a <nav> in the rail
        // gets ripped out and pinned over the header. Plain <ul> only.
        const tocHtml = showToc
            ? '<aside class="blogb-toc" data-blogb-toc hidden aria-label="On this page">' +
              '<details class="blogb-toc-collapsed" open>' +
              '<summary>On this page</summary>' +
              '<p class="blogb-toc-title">Contents</p>' +
              '<ul class="blogb-toc-list"></ul>' +
              '</details>' +
              '</aside>'
            : '';

        // defaultProps only seed NEWLY created sections — posts saved before these
        // fields existed have them undefined, which rendered an empty bordered box.
        // Fall back to the same copy defaultProps uses so old posts look right too.
        const sideTitle = p.sidebarTitle || 'Need hosting that keeps up?';
        const sideText = p.sidebarText || 'Talk to our team about a plan sized to your traffic, budget and growth.';
        const ctaText = (p.sidebarCta && p.sidebarCta.text) || 'View Plans';
        const ctaLink = (p.sidebarCta && p.sidebarCta.link) || '/pricing';
        const showHelp = p.showHelp !== false;

        // Reuses the /blogs index's .blog-help markup and classes verbatim (its
        // CSS is loaded by builder-template.html) so the two cannot drift apart.
        // Rendered with the same defaults blogs.js falls back to, then filled from
        // Strapi below — one edit in the CMS updates the index AND every article.
        const helpHtml = showHelp
            ? '<div class="blog-help blogb-help">' +
              '<h3>I need help with</h3>' +
              '<div class="blog-help-grid" data-blogb-help-grid>' +
              BLOG_HELP_DEFAULTS.map(helpItemHtml).join('') +
              '</div>' +
              '</div>'
            : '';

        const sidebarHtml = (showSidebar || showHelp)
            ? '<aside class="blogb-side">' +
              (showSidebar
                  ? '<div class="blogb-promo">' +
                    '<h3>' + esc(sideTitle) + '</h3>' +
                    '<p>' + esc(sideText) + '</p>' +
                    '<a class="btn-primary blogb-promo-btn" href="' + esc(ctaLink) + '">' + esc(ctaText) + '</a>' +
                    '</div>'
                  : '') +
              helpHtml +
              '</aside>'
            : '';

        // NOTE: deliberately NOT inlineRichText() — that collapses <p> blocks into
        // <br><br>, which is right for one-line CMS fields but destroys an article.
        container.innerHTML =
            '<section class="section blogb-section">' +
            '<div class="container blogb-inner">' +
            tocHtml +
            '<article class="blogb-body">' + (p.body || '') + '</article>' +
            sidebarHtml +
            '</div>' +
            '</section>';

        if (showToc) buildBlogToc(container);
        if (showHelp) fillBlogHelp(container);
    },
};

/* The "I need help with" links, shared with the /blogs index.
   Kept in sync by SOURCE, not by copy: these are only the pre-fetch defaults
   (identical to blogs.js's FALLBACK_HELP_LINKS), and fillBlogHelp() replaces
   them with blog-index-page.helpLinks from Strapi when that is reachable. */
const BLOG_HELP_DEFAULTS = [
    { icon: 'fa-cloud', title: 'Cloud Hosting', link: '/cloud-hosting' },
    { icon: 'fa-server', title: 'VPS Hosting', link: '/vps-hosting' },
    { icon: 'fa-database', title: 'Dedicated Servers', link: '/dedicated-server' },
    { icon: 'fa-globe', title: 'Web Hosting', link: '/web-hosting' },
    { icon: 'fa-users', title: 'Reseller Hosting', link: '/reseller-hosting' },
    { icon: 'fa-shield-halved', title: 'Backup & Security', link: '/cloud-storage' },
];

function helpItemHtml(h) {
    return '<a class="blog-help-item" href="' + esc(h.link || '#') + '">' +
        '<i class="fa-solid ' + esc(h.icon || 'fa-circle') + '" aria-hidden="true"></i>' +
        '<span>' + esc(h.title) + '</span></a>';
}

/* Swap the baked-in defaults for the CMS list. Deliberately fire-and-forget:
   the card is already rendered and readable, so a slow or dead Strapi costs
   nothing but keeps the defaults — never a blank box, never a thrown error
   that would take the rest of the renderer down with it. */
function fillBlogHelp(container) {
    const grid = container.querySelector('[data-blogb-help-grid]');
    if (!grid) return;
    cmsGet('/api/strapi/api/blog-index-page?populate[helpLinks]=*')
        .then((json) => {
            const links = json && json.data && json.data.helpLinks;
            if (!links || !links.length) return;
            const sorted = links.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
            grid.innerHTML = sorted.map(helpItemHtml).join('');
        })
        .catch(() => { /* keep defaults */ });
}

/* Builds the "On this page" rail from the article's own h2/h3 headings.
   Done here rather than in the editor because the body is free-form rich text —
   headings have no ids until we assign them. Runs for both the live page and the
   builder canvas, so what an editor previews is what ships. */
function buildBlogToc(container) {
    const body = container.querySelector('.blogb-body');
    const aside = container.querySelector('[data-blogb-toc]');
    const list = aside && aside.querySelector('.blogb-toc-list');
    if (!body || !list) return;

    const headings = Array.from(body.querySelectorAll('h2, h3'));
    // One or two headings isn't a table of contents — leave the rail hidden and
    // let the article use the space instead.
    if (headings.length < 2) return;

    const used = Object.create(null);

    // Assign ids first, then group: each h2 owns the h3s that follow it, so the
    // rail can show only the current section's sub-headings instead of every
    // h3 in the article at once.
    const items = [];
    headings.forEach((h) => {
        const text = (h.textContent || '').trim();
        if (!text) return;
        let id = h.id || text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .trim().replace(/\s+/g, '-')
            .slice(0, 60);
        if (!id) id = 'section';
        // Duplicate headings are common ("Overview" twice) — suffix so anchors stay unique.
        if (used[id]) { used[id] += 1; id = id + '-' + used[id]; } else { used[id] = 1; }
        h.id = id;
        items.push({ id: id, text: text, level: h.tagName.toLowerCase() });
    });

    const linkHtml = (it) =>
        '<a class="blogb-toc-link" href="#' + it.id + '">' + esc(it.text) + '</a>';

    // Two separate flags on purpose: an h2 <li> is always opened, but its
    // collapsible <ul> only exists if that h2 actually has sub-headings. Using
    // one flag left an h2-with-no-children unclosed and produced nested <li>s.
    let html = '';
    let liOpen = false;    // an h2 <li> awaiting its </li>
    let subOpen = false;   // that h2's <div><ul> awaiting its close

    const closeGroup = () => {
        if (subOpen) { html += '</ul></div>'; subOpen = false; }
        if (liOpen) { html += '</li>'; liOpen = false; }
    };

    items.forEach((it) => {
        if (it.level === 'h2') {
            closeGroup();
            html += '<li class="blogb-toc-h2 blogb-toc-group">' + linkHtml(it);
            liOpen = true;
        } else if (liOpen) {
            // Wrapper opened lazily on the first child, so an h2 without
            // sub-headings never renders an empty collapsible container.
            if (!subOpen) { html += '<div class="blogb-toc-sub-wrap"><ul class="blogb-toc-sub">'; subOpen = true; }
            html += '<li class="blogb-toc-h3">' + linkHtml(it) + '</li>';
        } else {
            // h3 before any h2 — no parent to nest under, so keep it top-level
            // rather than dropping it from the rail entirely.
            html += '<li class="blogb-toc-h3">' + linkHtml(it) + '</li>';
        }
    });
    closeGroup();

    list.innerHTML = html;
    aside.hidden = false;

    // Deliberately NO preventDefault/scrollTo here: style.css already sets
    // `html { scroll-behavior: smooth }` globally and the headings carry
    // `scroll-margin-top` (builder-page.css), so the plain anchor jump is both
    // smooth AND clears the fixed navbar. Doing it in JS as well only adds a
    // path that can silently fail (and breaks middle-click / open-in-new-tab).
    list.querySelectorAll('.blogb-toc-link').forEach((a) => {
        a.addEventListener('click', () => {
            // Expand straight away rather than waiting for the scroll observer
            // to catch up — otherwise clicking an h2 looks like nothing happened.
            setOpenGroup(a.closest('.blogb-toc-group'));
            // Collapse the accordion again on mobile, where it sits above the article.
            const details = a.closest('details.blogb-toc-collapsed');
            if (details && window.innerWidth < 1025) details.open = false;
        });
    });

    // Open the first group up front. Deliberately BEFORE the IntersectionObserver
    // guard below: without it the rail renders fully collapsed until the reader
    // scrolls far enough to trip the observer — and on a browser with no
    // IntersectionObserver it would stay collapsed forever.
    setOpenGroup(list.querySelector('.blogb-toc-group'));

    // Highlight the section you're currently reading.
    if (typeof IntersectionObserver !== 'function') return;
    const linkFor = {};
    list.querySelectorAll('.blogb-toc-link').forEach((a) => {
        linkFor[a.getAttribute('href').slice(1)] = a;
    });
    let currentId = null;
    const observer = new IntersectionObserver((entries) => {
        // Pick the TOP-MOST intersecting heading, not simply the last entry in
        // the batch — an h2 and its first h3 are often in the band together, and
        // "last wins" made the sub-heading beat its own parent. Same approach as
        // legal.js's TOC.
        let topMost = null;
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            if (!topMost || entry.boundingClientRect.top < topMost.boundingClientRect.top) topMost = entry;
        });
        if (!topMost || topMost.target.id === currentId) return;
        currentId = topMost.target.id;
        const a = linkFor[currentId];
        if (!a) return;
        list.querySelectorAll('.blogb-toc-active').forEach((el) => el.classList.remove('blogb-toc-active'));
        a.classList.add('blogb-toc-active');
        setOpenGroup(a.closest('.blogb-toc-group'));
    }, { rootMargin: '-96px 0px -70% 0px' });
    headings.forEach((h) => { if (h.id) observer.observe(h); });

    /* Only ONE group is expanded at a time: the section being read. Sub-headings
       for every other h2 stay collapsed, so the rail shows where you are rather
       than every h3 in the article at once. `.closest()` resolves an active h3
       to its parent h2's group, so clicking/scrolling into a sub-heading keeps
       its own group open instead of collapsing the list under the reader. */
    function setOpenGroup(group) {
        list.querySelectorAll('.blogb-toc-group.is-open').forEach((g) => {
            if (g !== group) g.classList.remove('is-open');
        });
        if (group) group.classList.add('is-open');
    }
}

/* ════ EXPORT ════════════════════════════════════════════════ */
export const COMPONENT_REGISTRY = {
    hero,
    blogHeader,
    blogBody,
    pillars,
    iconCards,
    imageText,
    whoWeAre,
    featureRows,
    checklistSplit,
    richText,
    statsBand,
    statChips,
    tagCards,
    securityCards,
    badgeRow,
    industryTabs,
    audienceGroups,
    comparisonTable,
    processSteps,
    numberedTips,
    ctaBand,
    pricing,
    plansTable,
    relatedServices,
    testimonials,
    logoCloud,
    gallery,
    contactInfo,
    contactForm,
    mapEmbed,
    videoEmbed,
    faq,
    spacer,
};

export const COMPONENT_ORDER = [
    'hero',
    'blogHeader',
    'blogBody',
    'pillars',
    'iconCards',
    'imageText',
    'whoWeAre',
    'featureRows',
    'checklistSplit',
    'richText',
    'statsBand',
    'statChips',
    'tagCards',
    'securityCards',
    'badgeRow',
    'industryTabs',
    'audienceGroups',
    'comparisonTable',
    'processSteps',
    'numberedTips',
    'ctaBand',
    'pricing',
    'plansTable',
    'relatedServices',
    'testimonials',
    'logoCloud',
    'gallery',
    'contactInfo',
    'contactForm',
    'mapEmbed',
    'videoEmbed',
    'faq',
    'spacer',
];

/* Library groupings for the editor's left panel. Order inside each
   category is display order; categories render in this order. */
export const COMPONENT_CATEGORIES = [
    { label: 'Heroes & Headers', types: ['hero', 'pillars', 'badgeRow', 'statChips'] },
    { label: 'Content', types: ['imageText', 'whoWeAre', 'featureRows', 'checklistSplit', 'richText'] },
    { label: 'Grids & Cards', types: ['iconCards', 'tagCards', 'securityCards', 'audienceGroups', 'relatedServices', 'gallery'] },
    { label: 'Data & Compare', types: ['statsBand', 'comparisonTable', 'plansTable', 'processSteps', 'numberedTips', 'industryTabs'] },
    { label: 'Social Proof', types: ['testimonials', 'logoCloud'] },
    { label: 'Conversion', types: ['ctaBand', 'pricing', 'contactForm', 'contactInfo', 'faq'] },
    { label: 'Blog', types: ['blogHeader', 'blogBody'] },
    { label: 'Media & Layout', types: ['mapEmbed', 'videoEmbed', 'spacer'] },
];
