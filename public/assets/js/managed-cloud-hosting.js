// ══════════════════════════════════════════════════════════
//  managed-cloud-hosting.js — ICSDC Managed Cloud Hosting Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getManagedCloudHostingPage } from './services/contentService.js';
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
     * Render the 3-column managed cloud plans grid.
     * Each plan uses the mch-plan-card CSS classes.
     * Strapi plan fields: tier, price, currency, period, tagline,
     *   isFeatured, badge, features (array of {label}), ctaText, ctaStyle.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#mch-plans .mch-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isFeatured || plan.popular || false;
            var featuredClass = isFeatured ? ' mch-plan-featured' : '';
            var badgeLabel = plan.badge || (isFeatured ? 'Most Popular' : '');
            var badgeHtml = badgeLabel
                ? '<div class="mch-plan-badge">' + badgeLabel + '</div>'
                : '';

            var currency = plan.currency || '₹';
            var period = plan.period || 'mo';
            var priceHtml = plan.price
                ? '<div class="mch-plan-price">' + currency + plan.price + ' <span>/' + period + '</span></div>'
                : '';

            var taglineHtml = plan.tagline
                ? '<div class="mch-plan-tagline">' + plan.tagline + '</div>'
                : '';

            var featuresArr = plan.features || [];
            var featuresHtml = featuresArr.length
                ? '<ul class="mch-plan-features">' +
                    featuresArr.map(function (f) {
                        return '<li>' + (f.label || f.text || f.name || f) + '</li>';
                    }).join('') +
                  '</ul>'
                : '';

            var ctaText = plan.ctaText || 'Get Started';
            var btnClass = isFeatured ? 'mch-plan-btn-featured' : 'mch-plan-btn';

            return '<div class="mch-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="mch-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
                priceHtml +
                taglineHtml +
                featuresHtml +
                '<a href="#" class="' + btnClass + '">' + ctaText + ' &rarr;</a>' +
                '</div>';
        }).join('');
    }

    /**
     * Render "How It Works" numbered steps.
     */
    function populateHowItWorks(steps) {
        if (!steps || !steps.length) return;
        var grid = document.querySelector('#mch-how-it-works .cloud-power-grid, #mch-how-it-works .cloud-use-grid');
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
            var response = await getManagedCloudHostingPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.mch-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) setHTML(document, '.mch-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.mch-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.mch-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Plans
            populateSectionHeader('#mch-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // Features
            populateSectionHeader('#mch-features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#mch-features .mch-features-grid', page.features, 'cloud-power-card');

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // Why Managed
            populateSectionHeader('#mch-why-managed', page.whyManagedLabel, page.whyManagedTitle, page.whyManagedSubtitle);
            populateIconCards('#mch-why-managed .cloud-power-grid', page.whyManagedCards, 'cloud-power-card');

            // Services
            populateSectionHeader('#mch-services', page.servicesLabel, page.servicesTitle, page.servicesSubtitle);
            populateIconCards('#mch-services .cloud-power-grid', page.servicesCards, 'cloud-power-card');

            // How It Works
            populateSectionHeader('#mch-how-it-works', page.howItWorksLabel, page.howItWorksTitle, page.howItWorksSubtitle);
            populateHowItWorks(page.howItWorksSteps);

            // Use Cases
            populateSectionHeader('#mch-use-cases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
            populateIconCards('#mch-use-cases .cloud-use-grid', page.useCases, 'cloud-use-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#mch-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#mch-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[managed-cloud-hosting] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
