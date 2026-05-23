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
        { key: 'imageUrl',    label: 'Hero Image URL',  type: 'text' },
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
const iconCards = {
    label: 'Icon Cards Grid',
    icon: 'grid',
    description: 'A grid of icon + title + description cards. Great for features and benefits.',
    schema: [
        { key: 'label',    label: 'Section Label (eyebrow)', type: 'text' },
        { key: 'title',    label: 'Section Title',           type: 'text', required: true },
        { key: 'subtitle', label: 'Section Subtitle',        type: 'textarea' },
        { key: 'columns',  label: 'Columns',                 type: 'number', default: 3, min: 2, max: 4 },
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
        columns: 3,
        cards: [
            { icon: 'bolt',          title: 'Fast Performance',   desc: 'Blazing fast infrastructure tuned for speed.' },
            { icon: 'shield-halved', title: 'Secure by Default',  desc: 'Enterprise-grade security at every layer.' },
            { icon: 'headset',       title: '24/7 Support',       desc: 'Real humans available around the clock.' },
        ],
    },
    renderer(container, p) {
        const label = p.label ? '<span class="cloud-section-label">' + esc(p.label) + '</span>' : '';
        const sub = p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '';
        const cols = Math.min(4, Math.max(2, Number(p.columns) || 3));
        const cardsHtml = (p.cards || []).map((c) =>
            '<div class="cloud-power-card">' +
                '<div class="cloud-power-icon"><i class="' + resolveFaIcon(c.icon, 'check') + '" aria-hidden="true"></i></div>' +
                '<h3>' + esc(c.title) + '</h3>' +
                '<p>' + esc(c.desc) + '</p>' +
            '</div>'
        ).join('');
        container.innerHTML =
            '<section class="section">' +
                '<div class="container">' +
                    label +
                    '<h2 class="title">' + esc(p.title) + '</h2>' +
                    sub +
                    '<div class="cloud-power-grid" style="grid-template-columns:repeat(' + cols + ',1fr)">' + cardsHtml + '</div>' +
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
    description: '3-column pricing plans with optional "popular" badge.',
    schema: [
        { key: 'label',    label: 'Section Label',    type: 'text' },
        { key: 'title',    label: 'Section Title',    type: 'text', required: true },
        { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
        {
            key: 'plans', label: 'Plans', type: 'repeater',
            itemSchema: [
                { key: 'name',     label: 'Plan Name',  type: 'text' },
                { key: 'price',    label: 'Price',      type: 'text' },
                { key: 'period',   label: 'Period',     type: 'text', default: '/mo' },
                { key: 'currency', label: 'Currency',   type: 'text', default: '₹' },
                { key: 'desc',     label: 'Description',type: 'textarea' },
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
        plans: [
            { name: 'Starter',  price: '99',  period: '/mo', currency: '₹', desc: 'For personal projects.',  features: '1 Site\n5GB Storage\nFree SSL\n24/7 Support', popular: false, ctaText: 'Get Started', ctaLink: '/contact-us' },
            { name: 'Business', price: '249', period: '/mo', currency: '₹', desc: 'For growing teams.',      features: '5 Sites\n20GB Storage\nFree SSL + Domain\nDaily Backups\nPriority Support', popular: true, ctaText: 'Get Started', ctaLink: '/contact-us' },
            { name: 'Pro',      price: '499', period: '/mo', currency: '₹', desc: 'For high-traffic sites.', features: 'Unlimited Sites\n50GB NVMe SSD\nCDN Included\nDaily Backups\nMalware Scan\nPriority Support', popular: false, ctaText: 'Get Started', ctaLink: '/contact-us' },
        ],
    },
    renderer(container, p) {
        const label = p.label ? '<span class="cloud-section-label">' + esc(p.label) + '</span>' : '';
        const sub = p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '';
        const cardsHtml = (p.plans || []).map((plan) => {
            const isPop = plan.popular === true;
            const popularCls = isPop ? ' wp-plan-popular' : '';
            const badge = isPop ? '<div class="wp-plan-badge">Most Popular</div>' : '';
            const feats = String(plan.features || '').split('\n').map((f) => f.trim()).filter(Boolean)
                .map((f) => '<li>' + esc(f) + '</li>').join('');
            return '<div class="wp-plan-card' + popularCls + '">' +
                badge +
                '<div class="wp-plan-name">' + esc(plan.name) + '</div>' +
                '<div class="wp-plan-price">' + esc(plan.currency || '₹') + esc(plan.price) + '<span>' + esc(plan.period || '/mo') + '</span></div>' +
                '<p class="wp-plan-desc">' + esc(plan.desc) + '</p>' +
                '<ul class="wp-plan-features">' + feats + '</ul>' +
                '<a href="' + esc(plan.ctaLink || '/contact-us') + '" class="wp-plan-btn">' + esc(plan.ctaText || 'Get Started') + ' &rarr;</a>' +
                '</div>';
        }).join('');
        container.innerHTML =
            '<section class="section">' +
                '<div class="container">' +
                    label +
                    '<h2 class="title">' + esc(p.title) + '</h2>' +
                    sub +
                    '<div class="wp-plans-grid">' + cardsHtml + '</div>' +
                '</div>' +
            '</section>';
    },
};

/* ════ TESTIMONIALS ══════════════════════════════════════════ */
const testimonials = {
    label: 'Testimonials',
    icon: 'star',
    description: 'Carousel of customer quotes with name, role and rating.',
    schema: [
        { key: 'title', label: 'Section Title', type: 'text', default: 'What Our Customers Say' },
        {
            key: 'items', label: 'Testimonials', type: 'repeater',
            itemSchema: [
                { key: 'quote',  label: 'Quote',          type: 'textarea' },
                { key: 'name',   label: 'Name',           type: 'text' },
                { key: 'role',   label: 'Role / Company', type: 'text' },
                { key: 'rating', label: 'Rating (1-5)',   type: 'number', min: 1, max: 5, default: 5 },
            ],
        },
    ],
    defaultProps: {
        title: 'What Our Customers Say',
        items: [
            { quote: 'ICSDC has transformed how we manage our infrastructure. Reliable, fast, and the support is second-to-none.', name: 'Aarav Sharma', role: 'CTO, FinTech Co.', rating: 5 },
            { quote: 'Migrated our entire stack to ICSDC last year. Zero downtime, dramatic performance improvement, and the team made it painless.', name: 'Priya Patel', role: 'Engineering Lead, ShopStack', rating: 5 },
            { quote: 'The cPanel hosting just works. No more chasing tickets — issues get resolved before we even notice them.', name: 'Rahul Verma', role: 'Founder, DesignLab', rating: 5 },
        ],
    },
    renderer(container, p) {
        const cardsHtml = (p.items || []).map((t) => {
            const rating = Math.max(1, Math.min(5, Number(t.rating) || 5));
            const stars = '<i class="fa-solid fa-star" aria-hidden="true"></i>'.repeat(rating);
            const initials = String(t.name || '?').split(/\s+/).map((w) => w[0] || '').slice(0, 2).join('').toUpperCase();
            return '<article class="testi-card" role="listitem">' +
                '<div class="testi-rating" aria-label="Rated ' + rating + ' out of 5">' + stars + '</div>' +
                '<blockquote class="testi-quote">"' + esc(t.quote) + '"</blockquote>' +
                '<div class="testi-person">' +
                    '<div class="testi-avatar">' + esc(initials) + '</div>' +
                    '<div class="testi-meta">' +
                        '<div class="testi-name">' + esc(t.name) + '</div>' +
                        '<div class="testi-role">' + esc(t.role) + '</div>' +
                    '</div>' +
                '</div>' +
                '</article>';
        }).join('');
        container.innerHTML =
            '<section class="testi-section">' +
                '<div class="testi-container">' +
                    '<h2 class="testi-title">' + esc(p.title) + '</h2>' +
                    '<div class="testi-scroll-viewport">' +
                        '<div class="testi-grid" role="list">' + cardsHtml + '</div>' +
                    '</div>' +
                '</div>' +
            '</section>';
    },
};

/* ════ IMAGE + TEXT (Who-We-Are split) ══════════════════════ */
const imageText = {
    label: 'Image + Text Split',
    icon: 'image',
    description: 'Two-column layout: image on one side, headline + paragraph + optional CTA on the other.',
    schema: [
        { key: 'eyebrow',    label: 'Eyebrow (small label)', type: 'text' },
        { key: 'title',      label: 'Heading',               type: 'text', required: true },
        { key: 'body',       label: 'Body Text',             type: 'textarea' },
        { key: 'imageUrl',   label: 'Image URL',             type: 'text' },
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

/* ════ EXPORT ════════════════════════════════════════════════ */
export const COMPONENT_REGISTRY = {
    hero,
    iconCards,
    imageText,
    ctaBand,
    pricing,
    testimonials,
    faq,
};

export const COMPONENT_ORDER = ['hero', 'iconCards', 'imageText', 'ctaBand', 'pricing', 'testimonials', 'faq'];
