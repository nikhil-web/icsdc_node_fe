// ══════════════════════════════════════════════════════════
//  vps-cpanel.js — ICSDC VPS cPanel Hosting Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getVpsCpanelPage } from './services/contentService.js';
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
     * Render the cPanel features list.
     * cpanelFeaturesList is a JSON array of strings.
     */
    function populateCpanelFeaturesList(items) {
        if (!items || !items.length) return;
        var list = document.getElementById('vpc-cpanel-features-list');
        if (!list) return;

        list.innerHTML = items.map(function (item) {
            return '<li>' + item + '</li>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getVpsCpanelPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrowSelector: '.vpc-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroStatusTitle) setText(document, '.vpc-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.vpc-bs', page.heroStatusSubtitle);

            // Pillars (4 cards)
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // About
            if (page.aboutTitle) setText(document, '#vpc-about-title', page.aboutTitle);
            if (page.aboutDesc) setText(document, '#vpc-about-desc', page.aboutDesc);

            // Key Advantages (12 cards)
            if (page.advantagesLabel) setText(document, '#vpc-advantages-label', page.advantagesLabel);
            if (page.advantagesTitle) setText(document, '#vpc-advantages-title', page.advantagesTitle);
            populateIconCards('#vpc-advantages-grid', page.advantages, 'cloud-power-card');

            // Why Choose ICSDC (8 cards)
            if (page.whyLabel) setText(document, '#vpc-why-label', page.whyLabel);
            if (page.whyTitle) setText(document, '#vpc-why-title', page.whyTitle);
            populateIconCards('#vpc-why-grid', page.whyCards, 'cloud-power-card');

            // cPanel Features
            if (page.cpanelFeaturesTitle) setText(document, '#vpc-cpanel-features-title', page.cpanelFeaturesTitle);
            if (page.cpanelFeaturesDesc) setText(document, '#vpc-cpanel-features-desc', page.cpanelFeaturesDesc);
            populateCpanelFeaturesList(page.cpanelFeaturesList);

            // CTA Band 1
            populateCtaBand('#vpc-cta1', page.ctaBand1);

            // Testimonials
            if (page.testimonialTitle) setText(document, '#vpc-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#vpc-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('#vpc-cta2', page.ctaBand2);

        } catch (err) {
            console.error('[vps-cpanel] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
