import { getNvmeDedicatedServerPage } from './services/contentService.js';
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

    var checkSVG = function () {
        return '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    };

    /**
     * Render the 3-column NVMe pricing plans grid.
     * Uses ds.pricing-plan component style: tier, price, features list, CTA button.
     */
    function populatePricingPlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#nds-plans .nds-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (plan) {
            var featuredClass = plan.isFeatured ? ' nds-plan-featured' : '';
            var badge = plan.isFeatured && plan.badge
                ? '<span class="nds-plan-badge">' + plan.badge + '</span>'
                : '';
            var btnClass = plan.ctaStyle === 'primary' ? 'nds-plan-btn-primary' : 'nds-plan-btn-outline';
            var btnArrow = plan.ctaStyle === 'primary' ? ' &rarr;' : '';

            var featuresHTML = '';
            if (plan.features && plan.features.length) {
                featuresHTML = plan.features.map(function (f) {
                    return '<li class="nds-plan-feature">' +
                        '<span class="nds-plan-check">' + checkSVG() + '</span>' +
                        (f.label || '') +
                        '</li>';
                }).join('');
            }

            return '<div class="nds-plan-card' + featuredClass + '">' +
                badge +
                '<div class="nds-plan-tier">' + (plan.tier || '') + '</div>' +
                '<div class="nds-plan-price-wrap">' +
                '<span class="nds-plan-currency">&#8377;</span>' +
                '<span class="nds-plan-price">' + (plan.price || '') + '</span>' +
                '<span class="nds-plan-period">/mo</span>' +
                '</div>' +
                (plan.tagline ? '<p class="nds-plan-tagline">' + plan.tagline + '</p>' : '') +
                '<hr class="nds-plan-divider">' +
                '<ul class="nds-plan-features">' + featuresHTML + '</ul>' +
                '<button class="nds-plan-btn ' + btnClass + '">' +
                (plan.ctaText || 'Get Started') + btnArrow +
                '</button>' +
                '</div>';
        }).join('');
    }

    /**
     * Render the "When to Choose" numbered cards in nds-when-grid.
     * Uses ds.numbered-tip component: number, title, description.
     */
    function populateWhenCards(items) {
        if (!items || !items.length) return;
        var grid = document.querySelector('#nds-when .nds-when-grid');
        if (!grid) return;

        grid.innerHTML = items.map(function (item) {
            return '<div class="nds-when-card">' +
                '<div class="nds-when-num">' + (item.number || '') + '</div>' +
                '<h3>' + (item.title || '') + '</h3>' +
                '<p>' + (item.description || '') + '</p>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getNvmeDedicatedServerPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.nds-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) setHTML(document, '.nds-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.nds-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.nds-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Pricing Plans
            populateSectionHeader('#nds-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePricingPlans(page.plans);

            // Infrastructure / Solutions
            populateSectionHeader('#nds-infra', page.infraLabel, page.infraTitle, page.infraSubtitle);
            populateIconCards('#nds-infra .nds-infra-grid', page.infraFeatures, 'cloud-power-card');

            // Why NVMe
            populateSectionHeader('#nds-why', page.whyNvmeLabel, page.whyNvmeTitle, page.whyNvmeSubtitle);
            populateIconCards('#nds-why .nds-why-grid', page.whyNvmeCards, 'cloud-power-card');

            // Use Cases
            populateSectionHeader('#nds-usecases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
            populateIconCards('#nds-usecases .nds-usecases-grid', page.useCases, 'cloud-use-card');

            // When to Choose
            populateSectionHeader('#nds-when', page.whenLabel, page.whenTitle, page.whenSubtitle);
            populateWhenCards(page.whenCards);

            // Testimonials
            if (page.testimonialTitle) setText(document, '#nds-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#nds-faq-heading', page.faqTitle);
            if (page.faqContactTitle) setText(document, '#nds-faq .faq-contact-title', page.faqContactTitle);
            if (page.faqContactDesc) setHTML(document, '#nds-faq .faq-contact-desc', page.faqContactDesc);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[nvme-dedicated-servers] Failed to load CMS data:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
