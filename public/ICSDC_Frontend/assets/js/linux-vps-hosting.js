import { getLinuxVpsHostingPage } from './services/contentService.js';
import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    hidePageLoader,
    markActiveNavLink,
    setText,
    setHTML,
    initFAQ,
    initTestimonials,
    resolveIcon
} from './utils/cms-helpers.js';

(function () {
    'use strict';

    /**
     * Render the VPS plans grid.
     * Cards match the standard pricing-plan card style used site-wide:
     * name → price → checkmark feature list → CTA button.
     * Spec fields (vcpu, ram, storage, bandwidth) are rendered as feature list items.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#lvps-plans .lvps-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isPopular || false;
            var featuredClass = isFeatured ? ' lvps-plan-featured' : '';
            var badgeHtml = isFeatured
                ? '<div class="lvps-plan-badge">Most Popular</div>'
                : '';

            var priceHtml = plan.price
                ? '<div class="lvps-plan-price">&#8377;' + plan.price + ' <span>' + (plan.priceNote || '/mo') + '</span></div>'
                : '';

            // Build checkmark feature list from spec fields
            var featureItems = [];
            if (plan.vcpu)      featureItems.push(plan.vcpu);
            if (plan.ram)       featureItems.push(plan.ram + ' RAM');
            if (plan.storage)   featureItems.push(plan.storage + ' Storage');
            if (plan.bandwidth) featureItems.push(plan.bandwidth + ' Bandwidth');

            var featuresHtml = featureItems.length
                ? '<ul class="lvps-plan-features">' +
                    featureItems.map(function (f) { return '<li>' + f + '</li>'; }).join('') +
                  '</ul>'
                : '';

            var btnClass = isFeatured ? 'lvps-plan-btn-featured' : 'lvps-plan-btn';

            return '<div class="lvps-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="lvps-plan-name">' + (plan.name || '') + '</div>' +
                priceHtml +
                featuresHtml +
                '<a href="/contact-us.html" class="' + btnClass + '">Get Started &rarr;</a>' +
                '</div>';
        }).join('');
    }

    /**
     * Render the "Why Choose ICSDC" checklist.
     * Each card title becomes one checkbox item — no descriptions, exact DOCX text.
     */
    function populateWhyChooseCards(cards) {
        if (!cards || !cards.length) return;
        var grid = document.querySelector('#lvps-why-choose .lvps-checklist-grid');
        if (!grid) return;
        var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (card) {
            return '<div class="lvps-checklist-item" data-animate="fade-up">' +
                '<i class="fa-solid fa-square-check" aria-hidden="true"></i>' +
                '<span>' + (card.title || '') + '</span>' +
                '</div>';
        }).join('');
    }

    /**
     * Render the OS options grid with lvps-os-card pattern.
     */
    function populateOsOptions(osOptions) {
        if (!osOptions || !osOptions.length) return;
        var grid = document.querySelector('#os-options .lvps-os-grid');
        if (!grid) return;

        var sorted = osOptions.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (os) {
            return '<div class="lvps-os-card">' +
                '<div class="lvps-os-icon">' + resolveIcon(os.icon || 'linux') + '</div>' +
                '<div class="lvps-os-name">' + (os.name || '') + '</div>' +
                '<div class="lvps-os-desc">' + (os.description || os.desc || '') + '</div>' +
                '</div>';
        }).join('');
    }

    /**
     * Render the control panel cards with lvps-cp-card pattern.
     */
    function populateControlPanels(panels) {
        if (!panels || !panels.length) return;
        var grid = document.querySelector('#control-panel .lvps-cp-grid');
        if (!grid) return;

        var sorted = panels.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (panel) {
            return '<div class="lvps-cp-card">' +
                '<div class="lvps-os-icon">' + resolveIcon(panel.icon || 'server') + '</div>' +
                '<div class="lvps-os-name">' + (panel.name || '') + '</div>' +
                '<div class="lvps-os-desc">' + (panel.description || panel.desc || '') + '</div>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getLinuxVpsHostingPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.lvps-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
            heroImage: page.heroImage
            });

            if (page.heroTopBadge) setHTML(document, '.lvps-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.lvps-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.lvps-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // VPS Plans
            populateSectionHeader('#lvps-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // Who We Are
            if (page.aboutTitle) setText(document, '#lvps-about-title', page.aboutTitle);
            if (page.aboutDesc)  setHTML(document, '#lvps-about-desc', '<p>' + page.aboutDesc + '</p>');
            if (page.aboutImage && page.aboutImage.image && page.aboutImage.image.url) {
                var aboutImg = document.querySelector('#lvps-about-img');
                if (aboutImg) {
                    var _base = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : 'http://localhost:1337');
                    var _m = page.aboutImage.image;
                    var _url = (_m.formats && (_m.formats.large || _m.formats.medium || _m.formats.small)
                        ? (_m.formats.large || _m.formats.medium || _m.formats.small).url
                        : _m.url) || '';
                    if (_url && !_url.startsWith('http')) _url = _base + _url;
                    if (_url) { aboutImg.src = _url; aboutImg.alt = _m.alternativeText || 'ICSDC Linux VPS Hosting'; }
                }
            }

            // Power Features
            populateSectionHeader('#power', page.powerLabel, page.powerTitle, page.powerSubtitle);
            populateIconCards('#power .cloud-power-grid', page.powerFeatures, 'cloud-power-card');

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // OS Options
            populateSectionHeader('#os-options', page.osOptionsLabel, page.osOptionsTitle, page.osOptionsSubtitle);
            populateOsOptions(page.osOptions);

            // Control Panels
            populateSectionHeader('#control-panel', page.controlPanelLabel, page.controlPanelTitle, page.controlPanelSubtitle);
            populateControlPanels(page.controlPanels);

            // Why Linux VPS
            populateSectionHeader('#why-vps', page.whyVpsLabel, page.whyVpsTitle, page.whyVpsSubtitle);
            populateIconCards('#why-vps .cloud-power-grid', page.whyVpsCards, 'cloud-power-card');

            // Use Cases
            populateSectionHeader('#use-cases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
            populateIconCards('#use-cases .cloud-use-grid', page.useCases, 'cloud-use-card');

            // Why Choose ICSDC
            populateSectionHeader('#lvps-why-choose', page.whyChooseLabel, page.whyChooseTitle, page.whyChooseSubtitle);
            populateWhyChooseCards(page.whyChooseCards);

            // Testimonials
            if (page.testimonialTitle) setText(document, '#lvps-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#lvps-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[linux-vps-hosting] Failed to load CMS data:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
