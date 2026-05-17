// ══════════════════════════════════════════════════════════
//  ssl-certificate.js — ICSDC SSL Certificate Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getSslCertificatePage } from './services/contentService.js';
import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    hidePageLoader,
    markActiveNavLink,
    setText,
    initFAQ,
    initTestimonials
} from './utils/cms-helpers.js';

(function () {
    'use strict';

    /**
     * Render the SSL type cards (OV + EV).
     * sslTypes is ds.ssl-type[] — fields: title, subtitle, desc, ctaText, ctaLink
     */
    function populateSslTypes(sslTypes) {
        if (!sslTypes || !sslTypes.length) return;
        var list = document.getElementById('ssl-types-list');
        if (!list) return;

        list.innerHTML = sslTypes.map(function (item, idx) {
            var badgeExtra = idx > 0 ? ' ssl-type-badge-ev' : '';
            return '<div class="ssl-type-card">' +
                '<div class="ssl-type-badge' + badgeExtra + '">' + (item.subtitle || '') + '</div>' +
                '<h3 class="ssl-type-title">' + (item.title || '') + '</h3>' +
                '<p class="ssl-type-desc">' + (item.desc || item.description || '') + '</p>' +
                '<a href="' + (item.ctaLink || '#contact') + '" class="ssl-type-cta">' +
                (item.ctaText || 'Contact Us') + ' &rarr;' +
                '</a>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getSslCertificatePage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrowSelector: '.ssl-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
            heroImage: page.heroImage
            });

            // Pillars (4 why-us cards)
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Pricing section text
            if (page.pricingTitle) setText(document, '.ssl-pricing-title', page.pricingTitle);
            if (page.pricingDesc) {
                var pricingDescEl = document.querySelector('.ssl-pricing-desc');
                if (pricingDescEl) pricingDescEl.textContent = page.pricingDesc;
            }

            // What We Offer (5 cards)
            populateSectionHeader('#ssl-offers', page.offersLabel, page.offersTitle, null);
            populateIconCards('#ssl-offers-grid', page.offersCards, 'cloud-power-card');

            // SSL Types (OV + EV cards)
            if (page.sslTypesTitle) setText(document, '.ssl-types-title', page.sslTypesTitle);
            if (page.sslTypesSubtitle) setText(document, '.ssl-types-subtitle', page.sslTypesSubtitle);
            populateSslTypes(page.sslTypes);

            // SSL Types at a Glance (3 cards)
            if (page.typesGlanceTitle) setText(document, '#ssl-glance .title', page.typesGlanceTitle);
            populateIconCards('#ssl-glance-grid', page.typesGlanceCards, 'cloud-power-card ssl-glance-card');

            // Power of Securing (8 cards)
            populateSectionHeader('#ssl-power', page.powerLabel, page.powerTitle, null);
            populateIconCards('#ssl-power-grid', page.powerCards, 'cloud-power-card');

            // Why Choose ICSDC (8 cards)
            populateSectionHeader('#ssl-why', page.whyLabel, page.whyTitle, null);
            if (page.whyDesc) {
                var whyDescEl = document.querySelector('.ssl-why-desc');
                if (whyDescEl) whyDescEl.textContent = page.whyDesc;
            }
            populateIconCards('#ssl-why-grid', page.whyCards, 'cloud-power-card');

            // CTA Band 1
            populateCtaBand('#ssl-cta1', page.ctaBand1);

            // Testimonials
            if (page.testimonialTitle) setText(document, '#ssl-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#ssl-faq-heading', page.faqTitle);
            initFAQ(page.faq);

        } catch (err) {
            console.error('[ssl-certificate] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
