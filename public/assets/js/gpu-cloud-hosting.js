// ══════════════════════════════════════════════════════════
//  gpu-cloud-hosting.js — ICSDC GPU Cloud Hosting Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getGpuCloudHostingPage } from './services/contentService.js';
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
     * Render the 3-column GPU plans grid.
     * Each plan uses the gpu-plan-card CSS classes.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#gpu-plans .gpu-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isFeatured || plan.popular || false;
            var featuredClass = isFeatured ? ' gpu-plan-featured' : '';
            var badgeLabel = plan.badge || (isFeatured ? 'Most Popular' : '');
            var badgeHtml = badgeLabel
                ? '<div class="gpu-plan-badge">' + badgeLabel + '</div>'
                : '';

            var currency = plan.currency || '₹';
            var period = plan.period || 'mo';
            var priceHtml = plan.price
                ? '<div class="gpu-plan-price">' + currency + plan.price + ' <span>/' + period + '</span></div>'
                : '';

            var taglineHtml = plan.tagline
                ? '<div class="gpu-plan-tagline">' + plan.tagline + '</div>'
                : '';

            var featuresArr = plan.features || [];
            var featuresHtml = featuresArr.length
                ? '<ul class="gpu-plan-features">' +
                    featuresArr.map(function (f) {
                        return '<li>' + (f.label || f.text || f.name || f) + '</li>';
                    }).join('') +
                  '</ul>'
                : '';

            var ctaText = plan.ctaText || 'Get Started';
            var btnClass = isFeatured ? 'gpu-plan-btn-featured' : 'gpu-plan-btn';

            return '<div class="gpu-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="gpu-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
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
            var response = await getGpuCloudHostingPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.gpu-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) setHTML(document, '.gpu-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.gpu-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.gpu-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Plans
            populateSectionHeader('#gpu-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // Enterprise Features
            populateSectionHeader('#gpu-features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#gpu-features .gpu-features-grid', page.features, 'cloud-power-card');

            // Built-in Features
            populateSectionHeader('#gpu-builtin', page.builtinLabel, page.builtinTitle, page.builtinSubtitle);
            populateIconCards('#gpu-builtin .cloud-power-grid', page.builtinFeatures, 'cloud-use-card');

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // GPU Portfolio
            populateSectionHeader('#gpu-portfolio', page.portfolioLabel, page.portfolioTitle, page.portfolioSubtitle);
            populateIconCards('#gpu-portfolio .cloud-power-grid', page.gpuPortfolio, 'cloud-power-card');

            // Why Choose ICSDC
            populateSectionHeader('#gpu-why', page.whyLabel, page.whyTitle, page.whySubtitle);
            populateIconCards('#gpu-why .cloud-use-grid', page.whyCards, 'cloud-use-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#gpu-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#gpu-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[gpu-cloud-hosting] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
