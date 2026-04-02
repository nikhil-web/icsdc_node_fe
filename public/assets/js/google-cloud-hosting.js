// ══════════════════════════════════════════════════════════
//  google-cloud-hosting.js — ICSDC Google Cloud Hosting Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getGoogleCloudHostingPage } from './services/contentService.js';
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

    /**
     * Render the Google Cloud plans grid.
     * Each plan uses the gch-plan-card CSS classes.
     * Strapi plan fields: tier, price, tagline,
     *   isFeatured, badge, features (array of {label}), ctaText.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#gch-plans .gch-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isFeatured || plan.popular || false;
            var featuredClass = isFeatured ? ' gch-plan-featured' : '';
            var badgeLabel = plan.badge || (isFeatured ? 'Most Popular' : '');
            var badgeHtml = badgeLabel
                ? '<div class="gch-plan-badge">' + badgeLabel + '</div>'
                : '';

            var priceHtml = plan.price
                ? '<div class="gch-plan-price">&#8377;' + plan.price + ' <span>/mo</span></div>'
                : '';

            var taglineHtml = plan.tagline
                ? '<div class="gch-plan-tagline">' + plan.tagline + '</div>'
                : '';

            var featuresArr = plan.features || [];
            var featuresHtml = featuresArr.length
                ? '<ul class="gch-plan-features">' +
                    featuresArr.map(function (f) {
                        return '<li>' + (f.label || f.text || f.name || f) + '</li>';
                    }).join('') +
                  '</ul>'
                : '';

            var ctaText = plan.ctaText || 'Get Started';
            var btnClass = isFeatured ? 'gch-plan-btn gch-plan-btn-primary' : 'gch-plan-btn gch-plan-btn-outline';

            return '<div class="gch-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="gch-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
                priceHtml +
                taglineHtml +
                featuresHtml +
                '<a href="#" class="' + btnClass + '">' + ctaText + ' &rarr;</a>' +
                '</div>';
        }).join('');
    }

    /**
     * Render migration steps as numbered cards.
     */
    function populateMigrationSteps(steps) {
        if (!steps || !steps.length) return;
        var grid = document.querySelector('#gch-migration .cloud-power-grid, #gch-migration .cloud-use-grid');
        if (!grid) return;

        var sorted = steps.slice().sort(function (a, b) { return (a.order || a.step || 0) - (b.order || b.step || 0); });
        grid.innerHTML = sorted.map(function (step, i) {
            return '<div class="cloud-power-card" data-animate="fade-up">' +
                '<div class="cloud-power-icon">' + (step.icon || (i + 1)) + '</div>' +
                '<h3>' + (step.title || '') + '</h3>' +
                '<p>' + (step.description || step.desc || '') + '</p>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getGoogleCloudHostingPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.gch-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) setHTML(document, '.gch-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.gch-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.gch-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Plans
            populateSectionHeader('#gch-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // Why Google
            populateSectionHeader('#gch-why-google', page.whyGoogleLabel, page.whyGoogleTitle, page.whyGoogleSubtitle);
            populateIconCards('#gch-why-google .cloud-power-grid', page.whyGoogleCards, 'cloud-power-card');

            // Services
            populateSectionHeader('#gch-services', page.servicesLabel, page.servicesTitle, page.servicesSubtitle);
            populateIconCards('#gch-services .cloud-power-grid', page.servicesCards, 'cloud-power-card');

            // Use Cases
            populateSectionHeader('#gch-use-cases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
            populateIconCards('#gch-use-cases .cloud-use-grid', page.useCases, 'cloud-use-card');

            // Migration Steps
            populateSectionHeader('#gch-migration', page.migrationLabel, page.migrationTitle, page.migrationSubtitle);
            populateMigrationSteps(page.migrationSteps);

            // Testimonials
            if (page.testimonialTitle) setText(document, '#gch-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#gch-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[google-cloud-hosting] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
