// ══════════════════════════════════════════════════════════
//  gpu-dedicated-server.js — ICSDC GPU Dedicated Server Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getGpuDedicatedServerPage } from './services/contentService.js';
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
     * Render the 3-column GPU Dedicated Server plans grid.
     * Each plan uses the gds-plan-card CSS classes.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#gds-plans .gds-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isFeatured || plan.popular || false;
            var featuredClass = isFeatured ? ' gds-plan-featured' : '';
            var badgeLabel = plan.badge || (isFeatured ? 'Most Popular' : '');
            var badgeHtml = badgeLabel
                ? '<div class="gds-plan-badge">' + badgeLabel + '</div>'
                : '';

            var currency = plan.currency || '₹';
            var period = plan.period || 'mo';
            var priceHtml = plan.price
                ? '<div class="gds-plan-price">' + currency + plan.price + ' <span>/' + period + '</span></div>'
                : '';

            var taglineHtml = plan.tagline
                ? '<div class="gds-plan-tagline">' + plan.tagline + '</div>'
                : '';

            var featuresArr = plan.features || [];
            var featuresHtml = featuresArr.length
                ? '<ul class="gds-plan-features">' +
                    featuresArr.map(function (f) {
                        return '<li>' + (f.label || f.text || f.name || f) + '</li>';
                    }).join('') +
                  '</ul>'
                : '';

            var ctaText = plan.ctaText || 'Get Started';
            var btnClass = isFeatured ? 'gds-plan-btn-featured' : 'gds-plan-btn';

            return '<div class="gds-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="gds-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
                priceHtml +
                taglineHtml +
                featuresHtml +
                '<a href="#" class="' + btnClass + '">' + ctaText + ' &rarr;</a>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getGpuDedicatedServerPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.gds-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) setHTML(document, '.gds-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.gds-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.gds-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Plans
            populateSectionHeader('#gds-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // Technology Features (12 cards)
            populateSectionHeader('#gds-tech', page.techLabel, page.techTitle, page.techSubtitle);
            populateIconCards('#gds-tech .gds-features-grid', page.features, 'cloud-power-card');

            // Use Cases (6 cards)
            populateSectionHeader('#gds-usecases', page.usecasesLabel, page.usecasesTitle, page.usecasesSubtitle);
            populateIconCards('#gds-usecases .gds-usecases-grid', page.usecases, 'cloud-use-card');

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // Why Choose ICSDC (6 cards)
            populateSectionHeader('#gds-why', page.whyLabel, page.whyTitle, page.whySubtitle);
            populateIconCards('#gds-why .cloud-power-grid', page.whyCards, 'cloud-power-card');

            // GPU Models (6 cards)
            populateSectionHeader('#gds-models', page.modelsLabel, page.modelsTitle, page.modelsSubtitle);
            populateIconCards('#gds-models .gds-models-grid', page.models, 'cloud-use-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#gds-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#gds-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[gpu-dedicated-server] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
