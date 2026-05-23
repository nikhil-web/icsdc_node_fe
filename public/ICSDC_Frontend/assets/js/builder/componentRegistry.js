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
import { initTestimonials as sharedInitTestimonials } from '../utils/cms-helpers.js';

/* ════ HERO ══════════════════════════════════════════════════ */
const hero = {
    label: 'Hero Section',
    icon: 'rocket',
    description: 'Page-opening hero with image, headline, sub-heading, description, and CTAs.',
    schema: [
        { key: 'eyebrow',     label: 'Eyebrow Text',    type: 'text' },
        { key: 'title',       label: 'Heading',         type: 'text', required: true },
        { key: 'subtitle',    label: 'Sub-heading',     type: 'text' },
        { key: 'description', label: 'Description',     type: 'textarea' },
        { key: 'imageUrl',    label: 'Hero Image',      type: 'image' },
        { key: 'imageAlt',    label: 'Image Alt Text',  type: 'text' },
        { key: 'imageSide',   label: 'Image Side',      type: 'select', options: ['left', 'right'], default: 'left' },
        {
            key: 'ctaPrimary', label: 'Primary CTA', type: 'cta',
            fields: [
                { key: 'text', label: 'Button Text', type: 'text' },
                { key: 'link', label: 'URL',         type: 'text' },
            ]
        },
        {
            key: 'ctaSecondary', label: 'Secondary CTA', type: 'cta',
            fields: [
                { key: 'text', label: 'Button Text', type: 'text' },
                { key: 'link', label: 'URL',         type: 'text' },
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
        ctaPrimary:   { text: 'Get Started', link: '/contact-us' },
        ctaSecondary: { text: 'Learn More',  link: '#' },
    },
    renderer(container, p) {
        const eyebrow   = p.eyebrow ? '<div class="builder-eyebrow">' + esc(p.eyebrow) + '</div>' : '';
        const subtitle  = p.subtitle ? '<p class="hero-sub">' + esc(p.subtitle) + '</p>' : '';
        const desc      = p.description ? '<p class="hero-desc">' + esc(p.description) + '</p>' : '';
        const primary   = ctaButtonHtml(p.ctaPrimary, 'btn-primary');
        const secondary = ctaButtonHtml(p.ctaSecondary, 'btn-outline');

        const contentHtml =
            '<div class="hero-content">' +
                eyebrow +
                '<h1 class="hero-title">' + esc(p.title) + '</h1>' +
                subtitle +
                desc +
                '<div class="hero-btns">' + primary + secondary + '</div>' +
            '</div>';

        const imageHtml = p.imageUrl
            ? '<div class="hero-right">' +
                  '<img class="hero-right-image" src="' + esc(p.imageUrl) + '" alt="' + esc(p.imageAlt || '') + '">' +
              '</div>'
            : '';

        // Image side controls grid order. Default = image left.
        const sideClass = (p.imageSide === 'right') ? ' builder-hero-img-right' : ' builder-hero-img-left';
        const inner = (p.imageSide === 'right') ? contentHtml + imageHtml : imageHtml + contentHtml;

        container.innerHTML =
            '<section class="hero-section builder-hero' + sideClass + '">' +
                '<div class="hero">' + inner + '</div>' +
            '</section>';
    },
};

/* ════ ICON CARDS ════════════════════════════════════════════ */
// Card-style → emitted card class + icon class. These exactly match the patterns
// used across the existing hardcoded pages (cloud-hosting.html, web-hosting.html,
// cpanel-hosting.html, shared-hosting.html, windows-dedicated-server.html, etc.).
const CARD_STYLES = {
    'cloud-power': { card: 'cloud-power-card',     icon: 'cloud-power-icon',     gridClass: 'cloud-power-grid' },
    'cloud-use':   { card: 'cloud-use-card',       icon: 'cloud-use-icon',       gridClass: 'cloud-use-grid'   },
    'why':         { card: 'why-card',             icon: 'why-icon',             gridClass: 'why-grid'         },
    'framework':   { card: 'cloud-framework-badge', icon: 'cloud-framework-icon', gridClass: 'cloud-frameworks-grid' },
    'support':     { card: 'cp-support-feat-card', icon: 'cp-support-feat-icon', gridClass: 'cp-support-features' },
};

const iconCards = {
    label: 'Icon Cards Grid',
    icon: 'grid',
    description: 'Flexible grid of icon + title + description cards. Choose card style to match any existing page.',
    schema: [
        { key: 'label',    label: 'Section Label (eyebrow)', type: 'text' },
        { key: 'title',    label: 'Section Title',           type: 'text', required: true },
        { key: 'subtitle', label: 'Section Subtitle',        type: 'textarea' },
        {
            key: 'cardStyle', label: 'Card Style', type: 'select',
            options: ['cloud-power', 'cloud-use', 'why', 'framework', 'support'],
            default: 'cloud-power',
        },
        { key: 'numbered', label: 'Numbered Cards (01, 02…)', type: 'toggle', default: false },
        { key: 'columns',  label: 'Columns',                  type: 'number', default: 3, min: 2, max: 4 },
        {
            key: 'cards', label: 'Cards', type: 'repeater',
            itemSchema: [
                { key: 'icon',  label: 'Icon Key (FA name)',  type: 'text' },
                { key: 'title', label: 'Card Title',          type: 'text' },
                { key: 'desc',  label: 'Card Description',    type: 'textarea' },
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
            { icon: 'bolt',          title: 'Fast Performance',   desc: 'Blazing fast infrastructure tuned for speed.' },
            { icon: 'shield-halved', title: 'Secure by Default',  desc: 'Enterprise-grade security at every layer.' },
            { icon: 'headset',       title: '24/7 Support',       desc: 'Real humans available around the clock.' },
        ],
    },
    renderer(container, p) {
        const style = CARD_STYLES[p.cardStyle] || CARD_STYLES['cloud-power'];
        const label = p.label ? '<span class="cloud-section-label">' + esc(p.label) + '</span>' : '';
        const sub = p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '';
        const cols = Math.min(4, Math.max(2, Number(p.columns) || 3));
        const numbered = p.numbered === true;
        const cardsHtml = (p.cards || []).map((c, i) => {
            const num = numbered
                ? '<div class="sh-when-card-num">' + String(i + 1).padStart(2, '0') + '</div>'
                : '';
            const iconHtml = c.icon
                ? '<div class="' + style.icon + '"><i class="' + resolveFaIcon(c.icon, 'check') + '" aria-hidden="true"></i></div>'
                : '';
            return '<div class="' + style.card + '">' +
                num +
                iconHtml +
                '<h3>' + esc(c.title) + '</h3>' +
                (c.desc ? '<p>' + esc(c.desc) + '</p>' : '') +
                '</div>';
        }).join('');
        container.innerHTML =
            '<section class="section">' +
                '<div class="container">' +
                    label +
                    '<h2 class="title">' + esc(p.title) + '</h2>' +
                    sub +
                    '<div class="' + style.gridClass + '" style="grid-template-columns:repeat(' + cols + ',1fr)">' + cardsHtml + '</div>' +
                '</div>' +
            '</section>';
    },
};

/* ════ CTA BAND ══════════════════════════════════════════════ */
const ctaBand = {
    label: 'CTA Band',
    icon: 'arrow',
    description: 'A full-width call-to-action band with headline and buttons.',
    schema: [
        { key: 'variant',     label: 'Variant',          type: 'select', options: ['light', 'dark'], default: 'dark' },
        { key: 'title',       label: 'Headline',         type: 'text', required: true },
        { key: 'description', label: 'Description',      type: 'textarea' },
        {
            key: 'ctaPrimary', label: 'Primary CTA', type: 'cta',
            fields: [
                { key: 'text', label: 'Button Text', type: 'text' },
                { key: 'link', label: 'URL',         type: 'text' },
            ],
        },
        {
            key: 'ctaSecondary', label: 'Secondary CTA', type: 'cta',
            fields: [
                { key: 'text', label: 'Button Text', type: 'text' },
                { key: 'link', label: 'URL',         type: 'text' },
            ],
        },
    ],
    defaultProps: {
        variant: 'dark',
        title: 'Ready to get started?',
        description: 'Deploy your infrastructure in minutes.',
        ctaPrimary:   { text: 'Start Now',   link: '/contact-us' },
        ctaSecondary: { text: 'Learn More',  link: '#' },
    },
    renderer(container, p) {
        const isDark = p.variant === 'dark';
        const cls = 'cloud-cta-band' + (isDark ? ' cloud-cta-dark' : '');
        const sub = p.description ? '<p>' + esc(p.description) + '</p>' : '';
        const primary = ctaButtonHtml(p.ctaPrimary, isDark ? 'cloud-cta-btn-primary' : 'btn-primary');
        const secondary = ctaButtonHtml(p.ctaSecondary, isDark ? 'cloud-cta-btn-outline' : 'btn-outline');
        container.innerHTML =
            '<section class="' + cls + '">' +
                '<div class="cloud-cta-inner">' +
                    '<h2>' + esc(p.title) + '</h2>' +
                    sub +
                    '<div class="cloud-cta-btns">' + primary + secondary + '</div>' +
                '</div>' +
            '</section>';
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
                { key: 'answer',   label: 'Answer',   type: 'textarea' },
            ],
        },
    ],
    defaultProps: {
        title: 'Frequently Asked Questions',
        items: [
            { question: 'What is included?',          answer: 'Replace this answer with your own content.' },
            { question: 'How do I get started?',      answer: 'Replace this answer with your own content.' },
            { question: 'Is support available 24/7?', answer: 'Replace this answer with your own content.' },
        ],
    },
    renderer(container, p) {
        const chev = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
        const items = (p.items || []).map((it, i) => {
            const num = String(i + 1).padStart(2, '0');
            const open = i === 0 ? ' open' : '';
            return '<details class="faq-item"' + open + '>' +
                '<summary class="faq-q">' +
                '<span class="faq-num">' + num + '</span>' +
                '<span class="faq-q-text">' + esc(it.question) + '</span>' +
                '<span class="faq-chev">' + chev + '</span>' +
                '</summary>' +
                '<div class="faq-a-wrap"><div class="faq-a">' + esc(it.answer).replace(/\n/g, '<br>') + '</div></div>' +
                '</details>';
        }).join('');
        container.innerHTML =
            '<section class="faq-section">' +
                '<div class="faq-container">' +
                    '<div class="faq-col">' +
                        '<h2 class="faq-title">' + esc(p.title) + '</h2>' +
                        '<div class="faq-grid">' +
                            '<div class="faq-accordions">' + items + '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</section>';

        // Single-open accordion behaviour
        const all = container.querySelectorAll('.faq-item');
        all.forEach((it) => it.addEventListener('toggle', () => {
            if (it.open) all.forEach((o) => { if (o !== it) o.open = false; });
        }));
    },
};

/* ════ PRICING ═══════════════════════════════════════════════ */
const pricing = {
    label: 'Pricing Plans',
    icon: 'tag',
    description: '3-column pricing plans with optional "popular" badge. Choose WP style (default) or Cloud style.',
    schema: [
        { key: 'label',    label: 'Section Label',    type: 'text' },
        { key: 'title',    label: 'Section Title',    type: 'text', required: true },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'style', label: 'Card Style', type: 'select',
            options: ['wp', 'cloud'], default: 'wp',
        },
        {
            key: 'plans', label: 'Plans', type: 'repeater',
            itemSchema: [
                { key: 'name',     label: 'Plan Name / Tier',  type: 'text' },
                { key: 'price',    label: 'Price',      type: 'text' },
                { key: 'period',   label: 'Period',     type: 'text', default: '/mo' },
                { key: 'currency', label: 'Currency',   type: 'text', default: '₹' },
                { key: 'desc',     label: 'Description / Tagline', type: 'textarea' },
                { key: 'features', label: 'Features (one per line)', type: 'textarea' },
                { key: 'popular',  label: 'Mark as Popular', type: 'toggle', default: false },
                { key: 'ctaText',  label: 'Button Text', type: 'text', default: 'Get Started' },
                { key: 'ctaLink',  label: 'Button URL',  type: 'text', default: '/contact-us' },
            ],
        },
    ],
    defaultProps: {
        label: 'Our Plans',
        title: 'Choose the Plan That Fits',
        subtitle: 'Transparent pricing. No surprises.',
        style: 'wp',
        plans: [
            { name: 'Starter',  price: '99',  period: '/mo', currency: '₹', desc: 'For personal projects.',  features: '1 Site\n5GB Storage\nFree SSL\n24/7 Support', popular: false, ctaText: 'Get Started', ctaLink: '/contact-us' },
            { name: 'Business', price: '249', period: '/mo', currency: '₹', desc: 'For growing teams.',      features: '5 Sites\n20GB Storage\nFree SSL + Domain\nDaily Backups\nPriority Support', popular: true, ctaText: 'Get Started', ctaLink: '/contact-us' },
            { name: 'Pro',      price: '499', period: '/mo', currency: '₹', desc: 'For high-traffic sites.', features: 'Unlimited Sites\n50GB NVMe SSD\nCDN Included\nDaily Backups\nMalware Scan\nPriority Support', popular: false, ctaText: 'Get Started', ctaLink: '/contact-us' },
        ],
    },
    renderer(container, p) {
        const label = p.label ? '<span class="cloud-section-label">' + esc(p.label) + '</span>' : '';
        const sub = p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '';
        const style = p.style === 'cloud' ? 'cloud' : 'wp';

        const cardsHtml = (p.plans || []).map((plan) => {
            const isPop = plan.popular === true;
            const feats = String(plan.features || '').split('\n').map((f) => f.trim()).filter(Boolean);

            if (style === 'cloud') {
                // Exact .cloud-plan-card markup from cloud-hosting.html
                const cls = 'cloud-plan-card' + (isPop ? ' cloud-featured' : '');
                const badge = isPop ? '<span class="cloud-plan-badge">Most Popular</span>' : '';
                const featsHtml = feats.map((f) =>
                    '<li class="cloud-plan-feature">' +
                        '<span class="cloud-plan-check"><i class="fa-solid fa-check" aria-hidden="true"></i></span>' +
                        esc(f) +
                    '</li>'
                ).join('');
                const btnCls = isPop ? 'cloud-plan-cta cloud-plan-cta-primary' : 'cloud-plan-cta cloud-plan-cta-outline';
                const btnLabel = esc(plan.ctaText || 'Get Started') + (isPop ? ' &rarr;' : '');
                return '<div class="' + cls + '">' +
                    badge +
                    '<div class="cloud-plan-tier">' + esc(plan.name) + '</div>' +
                    '<div class="cloud-plan-price-wrap">' +
                        '<span class="cloud-plan-currency">' + esc(plan.currency || '₹') + '</span>' +
                        '<span class="cloud-plan-price">' + esc(plan.price) + '</span>' +
                        '<span class="cloud-plan-period">' + esc(plan.period || '/mo') + '</span>' +
                    '</div>' +
                    (plan.desc ? '<p class="cloud-plan-tagline">' + esc(plan.desc) + '</p>' : '') +
                    '<hr class="cloud-plan-divider">' +
                    '<ul class="cloud-plan-features">' + featsHtml + '</ul>' +
                    '<a href="' + esc(plan.ctaLink || '/contact-us') + '" class="' + btnCls + '">' + btnLabel + '</a>' +
                    '</div>';
            }

            // wp style (existing default)
            const popularCls = isPop ? ' wp-plan-popular' : '';
            const badge = isPop ? '<div class="wp-plan-badge">Most Popular</div>' : '';
            const featsHtml = feats.map((f) => '<li>' + esc(f) + '</li>').join('');
            return '<div class="wp-plan-card' + popularCls + '">' +
                badge +
                '<div class="wp-plan-name">' + esc(plan.name) + '</div>' +
                '<div class="wp-plan-price">' + esc(plan.currency || '₹') + esc(plan.price) + '<span>' + esc(plan.period || '/mo') + '</span></div>' +
                '<p class="wp-plan-desc">' + esc(plan.desc) + '</p>' +
                '<ul class="wp-plan-features">' + featsHtml + '</ul>' +
                '<a href="' + esc(plan.ctaLink || '/contact-us') + '" class="wp-plan-btn">' + esc(plan.ctaText || 'Get Started') + ' &rarr;</a>' +
                '</div>';
        }).join('');

        const gridCls = style === 'cloud' ? 'cloud-pricing-grid' : 'wp-plans-grid';
        container.innerHTML =
            '<section class="section' + (style === 'cloud' ? ' cloud-pricing-section' : '') + '">' +
                '<div class="container">' +
                    label +
                    '<h2 class="title">' + esc(p.title) + '</h2>' +
                    sub +
                    '<div class="' + gridCls + '">' + cardsHtml + '</div>' +
                '</div>' +
            '</section>';
    },
};

/* ════ STATS BAND ════════════════════════════════════════════ */
const statsBand = {
    label: 'Stats / Metrics Band',
    icon: 'chart',
    description: 'A row of large metric numbers with sub-labels. e.g. 99.9% Uptime · 24/7 Support · 2-Hr RPO.',
    schema: [
        { key: 'label',    label: 'Section Label',    type: 'text' },
        { key: 'title',    label: 'Section Title',    type: 'text' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'metrics', label: 'Metrics', type: 'repeater',
            itemSchema: [
                { key: 'value', label: 'Big Value (e.g. 99.9%)', type: 'text' },
                { key: 'label', label: 'Sub-label',              type: 'text' },
            ],
        },
    ],
    defaultProps: {
        label: '',
        title: '',
        subtitle: '',
        metrics: [
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '2-Hr',  label: 'RPO Guarantee' },
            { value: '100%',  label: 'India-Hosted' },
            { value: '24/7',  label: 'Expert Support' },
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
        { key: 'label',     label: 'Section Label',         type: 'text' },
        { key: 'title',     label: 'Section Title',         type: 'text', required: true },
        { key: 'subtitle',  label: 'Section Subtitle',      type: 'textarea' },
        { key: 'colFeature',label: 'Feature Column Header', type: 'text', default: 'Feature' },
        { key: 'colOurs',   label: 'Our Column Header',     type: 'text', default: 'ICSDC' },
        { key: 'colTheirs', label: 'Their Column Header',   type: 'text', default: 'Typical Providers' },
        { key: 'mode',      label: 'Cell Mode', type: 'select', options: ['text', 'checkmark'], default: 'text' },
        {
            key: 'rows', label: 'Rows', type: 'repeater',
            itemSchema: [
                { key: 'feature', label: 'Feature',       type: 'text' },
                { key: 'ours',    label: 'Our Value (text or "yes"/"no")', type: 'text' },
                { key: 'theirs',  label: 'Their Value (text or "yes"/"no")', type: 'text' },
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
            { feature: 'Infrastructure Quality',  ours: 'Enterprise-grade servers tuned for stability', theirs: 'Mass-market shared servers oversold for cost' },
            { feature: 'Performance Consistency', ours: 'Predictable speed even during traffic spikes', theirs: 'Performance drops during peak usage' },
            { feature: 'Security Approach',       ours: 'Security-first architecture with isolation',   theirs: 'Basic security with limited visibility' },
            { feature: 'Uptime Reliability',      ours: 'High availability with proactive monitoring',  theirs: 'Reactive uptime with limited redundancy' },
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
        { key: 'label',    label: 'Section Label',    type: 'text' },
        { key: 'title',    label: 'Section Title',    type: 'text', required: true },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'steps', label: 'Steps', type: 'repeater',
            itemSchema: [
                { key: 'title', label: 'Step Title', type: 'text' },
                { key: 'desc',  label: 'Step Description (optional)', type: 'textarea' },
            ],
        },
    ],
    defaultProps: {
        label: '',
        title: 'What Happens Next',
        subtitle: '',
        steps: [
            { title: 'Share Your Requirement',     desc: '' },
            { title: 'We Review Your Use Case',    desc: '' },
            { title: 'We Suggest the Right Solution', desc: '' },
            { title: 'Setup & Beyond',             desc: '' },
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
        { key: 'label',    label: 'Section Label',    type: 'text' },
        { key: 'title',    label: 'Section Title',    type: 'text', required: true },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'logos', label: 'Logos', type: 'repeater',
            itemSchema: [
                { key: 'name',     label: 'Name (shown as text fallback)', type: 'text' },
                { key: 'imageUrl', label: 'Logo Image (optional)',         type: 'image' },
                { key: 'link',     label: 'Link URL (optional)',           type: 'text' },
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
                { key: 'quote',   label: 'Quote',          type: 'textarea' },
                { key: 'name',    label: 'Name',           type: 'text' },
                { key: 'title',   label: 'Job Title',      type: 'text' },
                { key: 'company', label: 'Company',        type: 'text' },
                { key: 'rating',  label: 'Rating (1-5)',   type: 'number', min: 1, max: 5, default: 5 },
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
            quote:   t.quote || '',
            name:    t.name  || '',
            title:   t.title || t.jobTitle || t.role || '',
            company: t.company || '',
            rating:  Math.max(1, Math.min(5, Number(t.rating) || 5)),
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
        { key: 'eyebrow',    label: 'Eyebrow (small label)', type: 'text' },
        { key: 'title',      label: 'Heading',               type: 'text', required: true },
        { key: 'body',       label: 'Body Text',             type: 'textarea' },
        { key: 'imageUrl',   label: 'Image',                 type: 'image' },
        { key: 'imageAlt',   label: 'Image Alt Text',        type: 'text' },
        { key: 'imageSide',  label: 'Image Side',            type: 'select', options: ['left', 'right'], default: 'left' },
        {
            key: 'cta', label: 'Call-to-Action (optional)', type: 'cta',
            fields: [
                { key: 'text', label: 'Button Text', type: 'text' },
                { key: 'link', label: 'URL',         type: 'text' },
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
        const body    = p.body ? '<p class="who-we-are-paragraph">' + esc(p.body) + '</p>' : '';
        const cta     = (p.cta && p.cta.text)
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
        { key: 'title',    label: 'Section Title',    type: 'text', required: true },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'items', label: 'Images', type: 'repeater',
            itemSchema: [
                { key: 'imageUrl', label: 'Image',         type: 'image' },
                { key: 'imageAlt', label: 'Alt Text',      type: 'text' },
                { key: 'label',    label: 'Overlay Label', type: 'text' },
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
        { key: 'title',    label: 'Section Title',    type: 'text', default: 'Get in Touch' },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'items', label: 'Contact Items', type: 'repeater',
            itemSchema: [
                { key: 'icon',  label: 'Icon Key (FA name)', type: 'text' },
                { key: 'label', label: 'Label',              type: 'text' },
                { key: 'value', label: 'Value',              type: 'textarea' },
                { key: 'link',  label: 'Link (optional, e.g. mailto: or tel:)', type: 'text' },
            ],
        },
    ],
    defaultProps: {
        title: 'Get in Touch',
        subtitle: "We're always ready to help. Reach out through any of the channels below.",
        items: [
            { icon: 'envelope',  label: 'Email Address', value: 'info@icsdc.com',              link: 'mailto:info@icsdc.com' },
            { icon: 'phone',     label: 'Phone Number',  value: '+91 98109 58857',             link: 'tel:+919810958857' },
            { icon: 'map-pin',   label: 'Our Address',   value: 'Plot No. 21 & 21A, 6th Floor, Sector 142, Noida, UP 201304', link: '' },
            { icon: 'clock',     label: 'Office Hours',  value: 'Monday – Friday: 9:00 AM – 6:00 PM IST | 24/7 Support for active clients', link: '' },
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
        { key: 'title',    label: 'Section Title',    type: 'text', default: 'Send Us a Message' },
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
                            '<button type="submit" class="cu-submit-btn">Send Message &rarr;</button>' +
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
                    name:    String(fd.get('name')    || '').trim(),
                    email:   String(fd.get('email')   || '').trim(),
                    phone:   String(fd.get('phone')   || '').trim(),
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
        { key: 'title',    label: 'Section Title (optional)',    type: 'text' },
        { key: 'embedUrl', label: 'Google Maps Embed URL', type: 'textarea', required: true },
        { key: 'height',   label: 'Height (px)',           type: 'number', default: 420, min: 200, max: 800 },
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

/* ════ EXPORT ════════════════════════════════════════════════ */
export const COMPONENT_REGISTRY = {
    hero,
    iconCards,
    imageText,
    statsBand,
    comparisonTable,
    processSteps,
    ctaBand,
    pricing,
    testimonials,
    logoCloud,
    gallery,
    contactInfo,
    contactForm,
    mapEmbed,
    faq,
};

export const COMPONENT_ORDER = [
    'hero',
    'iconCards',
    'imageText',
    'statsBand',
    'comparisonTable',
    'processSteps',
    'ctaBand',
    'pricing',
    'testimonials',
    'logoCloud',
    'gallery',
    'contactInfo',
    'contactForm',
    'mapEmbed',
    'faq',
];
