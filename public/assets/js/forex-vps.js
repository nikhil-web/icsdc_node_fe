// ══════════════════════════════════════════════════════════
//  forex-vps.js — ICSDC Forex VPS Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getForexVpsPage } from './services/contentService.js';
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

    async function init() {
        markActiveNavLink();

        try {
            var response = await getForexVpsPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrowSelector: '.fvps-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) {
                var topBadge = document.querySelector('.fvps-top-badge');
                if (topBadge) topBadge.textContent = page.heroTopBadge;
            }
            if (page.heroStatusTitle) {
                var bt = document.querySelector('.fvps-bt');
                if (bt) bt.textContent = page.heroStatusTitle;
            }
            if (page.heroStatusSubtitle) {
                var bs = document.querySelector('.fvps-bs');
                if (bs) bs.textContent = page.heroStatusSubtitle;
            }

            // Pillars (4 why-cards)
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Features section (9 cards)
            populateSectionHeader('#fvps-features', page.featuresLabel, page.featuresTitle, null);
            populateIconCards('#fvps-features-grid', page.features, 'cloud-power-card');

            // Use Cases (6 cards)
            populateSectionHeader('#fvps-usecases', page.useCasesLabel, page.useCasesTitle, null);
            populateIconCards('#fvps-usecases-grid', page.useCasesCards, 'cloud-power-card');

            // Who Should Use (6 cards)
            populateSectionHeader('#fvps-who', page.whoLabel, page.whoTitle, null);
            populateIconCards('#fvps-who-grid', page.whoCards, 'cloud-power-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#fvps-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // CTA Band 1
            populateCtaBand('#fvps-cta1', page.ctaBand1);

            // FAQ
            if (page.faqTitle) setText(document, '#fvps-faq-heading', page.faqTitle);
            initFAQ(page.faq);

        } catch (err) {
            console.error('[forex-vps] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
