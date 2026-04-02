import { getWordpressHostingPage } from './services/contentService.js';
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
    initTestimonials
} from './utils/cms-helpers.js';

(function () {
    'use strict';

    // ──────────────────────────────────────────────────────
    //  populatePlans
    //  Renders the 3-column .wp-plans-grid from CMS data.
    //  Marks the "popular" plan with .wp-plan-badge.
    // ──────────────────────────────────────────────────────
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#wp-plans .wp-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (plan) {
            var isPopular = plan.popular === true || plan.isPopular === true;
            var popularClass = isPopular ? ' wp-plan-popular' : '';
            var badgeHtml = isPopular
                ? '<div class="wp-plan-badge">' + (plan.badgeLabel || 'Most Popular') + '</div>'
                : '';

            var features = (plan.features || []).map(function (f) {
                var label = typeof f === 'string' ? f : (f.text || f.label || f.name || '');
                return '<li>' + label + '</li>';
            }).join('');

            return '<div class="wp-plan-card' + popularClass + '">' +
                badgeHtml +
                '<div class="wp-plan-name">' + (plan.name || '') + '</div>' +
                '<div class="wp-plan-price">' + (plan.price || '') + '<span>' + (plan.period || '/mo') + '</span></div>' +
                '<p class="wp-plan-desc">' + (plan.description || plan.tagline || '') + '</p>' +
                '<ul class="wp-plan-features">' + features + '</ul>' +
                '<button class="wp-plan-btn">' + (plan.ctaLabel || 'Get Started') + ' &rarr;</button>' +
                '</div>';
        }).join('');
    }

    // ──────────────────────────────────────────────────────
    //  populateManagedFeatures
    //  Renders the #managed section using why-card style.
    // ──────────────────────────────────────────────────────
    function populateManagedFeatures(features) {
        if (!features || !features.length) return;
        var grid = document.querySelector('#managed .managed-why-grid');
        if (!grid) return;

        var sorted = features.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (feat) {
            var iconKey = feat.icon || 'zap';
            return '<div class="why-card">' +
                '<div class="why-icon">' + resolveCardIcon(iconKey) + '</div>' +
                '<h3>' + (feat.title || '') + '</h3>' +
                '<p>' + (feat.description || '') + '</p>' +
                '</div>';
        }).join('');
    }

    // ──────────────────────────────────────────────────────
    //  resolveCardIcon
    //  Minimal inline icon resolver for why-card icons.
    //  Falls back to a generic zap icon.
    // ──────────────────────────────────────────────────────
    function resolveCardIcon(key) {
        var icons = {
            refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
            upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
            shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>',
            pulse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
            zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
        };
        return icons[key] || icons['zap'];
    }

    // ──────────────────────────────────────────────────────
    //  populateFaqContact
    // ──────────────────────────────────────────────────────
    function populateFaqContact(page) {
        var card = document.querySelector('.faq-contact-card');
        if (!card) return;

        if (page.faqContactTitle) setHTML(card, '.faq-contact-title', page.faqContactTitle);
        if (page.faqContactDescription) setHTML(card, '.faq-contact-desc', page.faqContactDescription);

        if (page.faqContactBtnLabel) {
            var btn = card.querySelector('.faq-contact-btn');
            if (btn) {
                var svg = btn.querySelector('svg');
                btn.textContent = page.faqContactBtnLabel + ' ';
                if (svg) btn.appendChild(svg);
                if (page.faqContactBtnUrl) btn.setAttribute('href', page.faqContactBtnUrl);
            }
        }
    }

    // ──────────────────────────────────────────────────────
    //  init
    // ──────────────────────────────────────────────────────
    async function init() {
        markActiveNavLink();

        try {
            var response = await getWordpressHostingPage();
            var page = response.data;

            // 1. SEO
            populateSEO(page.seo);

            // 2. Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.wp-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            // 3. Hero badges
            if (page.heroTopBadge) setHTML(document, '.wp-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.wp-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.wp-bs', page.heroStatusSubtitle);

            // 4. Why-us pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // 5. Plans
            populateSectionHeader('#wp-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // 6. Features (cloud-power-grid)
            populateSectionHeader('#features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#features .cloud-power-grid', page.featureCards, 'cloud-power-card');

            // 7. CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // 8. Performance (cloud-use-grid)
            populateSectionHeader('#performance', page.performanceLabel, page.performanceTitle, page.performanceSubtitle);
            populateIconCards('#performance .cloud-use-grid', page.performanceCards, 'cloud-use-card');

            // 9. Managed features
            populateSectionHeader('#managed', page.managedLabel, page.managedTitle, page.managedSubtitle);
            populateManagedFeatures(page.managedFeatures);

            // 10. Why Choose (cloud-power-grid)
            populateSectionHeader('#why-choose', page.whyChooseLabel, page.whyChooseTitle, page.whyChooseSubtitle);
            populateIconCards('#why-choose .cloud-power-grid', page.whyChooseCards, 'cloud-power-card');

            // 11. Testimonials
            if (page.testimonialTitle) setText(document, '#wp-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // 12. FAQ
            if (page.faqTitle) setText(document, '#wp-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // 13. FAQ contact card
            populateFaqContact(page);

            // 14. CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[wordpress-hosting] Failed to load CMS data:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
