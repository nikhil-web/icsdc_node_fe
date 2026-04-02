// ══════════════════════════════════════════════════════════
//  cpanel-hosting.js — ICSDC cPanel Hosting Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getCpanelHostingPage } from './services/contentService.js';
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
     * Render the 3-column cPanel plans grid.
     * Each plan uses the cp-plan-card CSS classes.
     * Strapi plan fields: tier, price, currency, period, tagline,
     *   isFeatured, badge, features (array of {label}), ctaText, ctaStyle.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#cp-plans .cp-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isFeatured || plan.popular || false;
            var featuredClass = isFeatured ? ' cp-plan-popular' : '';
            var badgeLabel = plan.badge || (isFeatured ? 'Most Popular' : '');
            var badgeHtml = badgeLabel
                ? '<div class="cp-plan-badge">' + badgeLabel + '</div>'
                : '';

            var currency = plan.currency || '₹';
            var period = plan.period || 'mo';
            var priceHtml = plan.price
                ? '<div class="cp-plan-price">' + currency + plan.price + ' <span>/' + period + '</span></div>'
                : '';

            var descHtml = plan.tagline
                ? '<div class="cp-plan-desc">' + plan.tagline + '</div>'
                : '';

            var featuresArr = plan.features || [];
            var featuresHtml = featuresArr.length
                ? '<ul class="cp-plan-features">' +
                    featuresArr.map(function (f) {
                        return '<li>' + (f.label || f.text || f.name || f) + '</li>';
                    }).join('') +
                  '</ul>'
                : '';

            var ctaText = plan.ctaText || 'Get Started';
            var ctaStyle = plan.ctaStyle || (isFeatured ? 'primary' : 'outline');
            var btnClass = ctaStyle === 'primary'
                ? 'cp-plan-btn cp-plan-btn-primary'
                : 'cp-plan-btn cp-plan-btn-outline';

            return '<div class="cp-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="cp-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
                priceHtml +
                descHtml +
                featuresHtml +
                '<a href="#" class="' + btnClass + '">' + ctaText + ' &rarr;</a>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getCpanelHostingPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.cp-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) setHTML(document, '.cp-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.cp-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.cp-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Plans
            populateSectionHeader('#cp-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // Features
            populateSectionHeader('#cp-features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#cp-features .cp-features-grid', page.features, 'cloud-power-card');

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // Why ICSDC
            populateSectionHeader('#cp-why', page.whyLabel, page.whyTitle, page.whySubtitle);
            populateIconCards('#cp-why .cp-why-grid', page.whyCards, 'cloud-power-card');

            // Who Can Use
            populateSectionHeader('#cp-who', page.whoLabel, page.whoTitle, page.whoSubtitle);
            populateIconCards('#cp-who .cp-who-grid', page.whoCards, 'cloud-use-card');

            // Built-in Features
            populateSectionHeader('#cp-builtin', page.builtinLabel, page.builtinTitle, page.builtinSubtitle);
            populateIconCards('#cp-builtin .cp-builtin-grid', page.builtinFeatures, 'cloud-power-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#cp-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#cp-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[cpanel-hosting] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
