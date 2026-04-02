// ══════════════════════════════════════════════════════════
//  firewall-security.js — ICSDC Firewall Security Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getFirewallSecurityPage } from './services/contentService.js';
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

    async function init() {
        markActiveNavLink();

        try {
            var response = await getFirewallSecurityPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.fw-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            // Pillars (4 cards)
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // How ICSDC Strengthens Your Network (8 cards)
            populateSectionHeader('#fw-features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#fw-features-grid', page.features, 'cloud-power-card');

            // Firewall Security That Adapts (8 cards)
            populateSectionHeader('#fw-adapts', page.adaptsLabel, page.adaptsTitle, page.adaptsSubtitle);
            populateIconCards('#fw-adapts-grid', page.adapts, 'cloud-power-card');

            // Threat Detection narrative
            if (page.threatLabel) {
                var threatLabel = document.querySelector('#fw-threat .fw-label-light');
                if (threatLabel) threatLabel.textContent = page.threatLabel;
            }
            if (page.threatTitle) {
                var threatTitle = document.querySelector('#fw-threat .title');
                if (threatTitle) threatTitle.textContent = page.threatTitle;
            }
            if (page.threatDescription) {
                var threatDesc = document.getElementById('fw-threat-description');
                if (threatDesc) threatDesc.innerHTML = page.threatDescription.replace(/\n\n/g, '</p><p>');
            }

            // Environment cards (3 cards)
            populateSectionHeader('#fw-env', page.envLabel, page.envTitle, page.envSubtitle);
            populateIconCards('#fw-env-grid', page.envCards, 'cloud-power-card');

            // CTA Band 1
            populateCtaBand('#fw-cta1', page.ctaBand1);

            // Managed Firewall Services (10 cards)
            populateSectionHeader('#fw-services', page.servicesLabel, page.servicesTitle, page.servicesSubtitle);
            populateIconCards('#fw-services-grid', page.servicesCards, 'cloud-power-card');

            // Use Cases (8 cards)
            populateSectionHeader('#fw-usecases', page.usecasesLabel, page.usecasesTitle, page.usecasesSubtitle);
            populateIconCards('#fw-usecases-grid', page.usecasesCards, 'cloud-power-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#fw-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#fw-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('#fw-cta2', page.ctaBand2);

        } catch (err) {
            console.error('[firewall-security] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
