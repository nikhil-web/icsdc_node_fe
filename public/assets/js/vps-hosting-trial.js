// ══════════════════════════════════════════════════════════
//  vps-hosting-trial.js — ICSDC VPS Hosting Trial Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getVpsHostingTrialPage } from './services/contentService.js';
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
     * Render the 3-column VPS plans grid.
     * Each plan uses the vht-plan-card CSS classes.
     * Strapi plan fields: tier, price, currency, period, tagline,
     *   isFeatured, badge, features (array of {label}), ctaText, ctaStyle, order.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#vht-plans .vht-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isFeatured || plan.popular || false;
            var featuredClass = isFeatured ? ' vht-plan-featured' : '';
            var badgeLabel = plan.badge || (isFeatured ? 'Most Popular' : '');
            var badgeHtml = badgeLabel
                ? '<div class="vht-plan-badge">' + badgeLabel + '</div>'
                : '';

            var currency = plan.currency || '₹';
            var period = plan.period || 'mo';
            var priceHtml = plan.price
                ? '<div class="vht-plan-price">' + currency + plan.price + ' <span>/' + period + '</span></div>'
                : '';

            var taglineHtml = plan.tagline
                ? '<div class="vht-plan-tagline">' + plan.tagline + '</div>'
                : '';

            var featuresArr = plan.features || [];
            var featuresHtml = featuresArr.length
                ? '<ul class="vht-plan-features">' +
                    featuresArr.map(function (f) {
                        return '<li>' + (f.label || f.text || f.name || f) + '</li>';
                    }).join('') +
                  '</ul>'
                : '';

            var ctaText = plan.ctaText || 'Get Started';
            var btnClass = isFeatured ? 'vht-plan-btn-featured' : 'vht-plan-btn';

            return '<div class="vht-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="vht-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
                priceHtml +
                taglineHtml +
                featuresHtml +
                '<a href="#" class="' + btnClass + '">' + ctaText + ' &rarr;</a>' +
                '</div>';
        }).join('');
    }

    /**
     * Render numbered "when / who" cards into a target grid.
     * Strapi numbered-tip fields: order, number, title, description.
     */
    function populateWhenCards(steps) {
        if (!steps || !steps.length) return;
        var grid = document.querySelector('#vht-when .vht-when-grid');
        if (!grid) return;

        var sorted = steps.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (step) {
            return '<div class="cloud-power-card" data-animate="fade-up">' +
                '<div class="cloud-power-icon">' + (step.number || step.order || '') + '</div>' +
                '<h3>' + (step.title || '') + '</h3>' +
                '<p>' + (step.description || step.desc || '') + '</p>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getVpsHostingTrialPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.vht-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) setHTML(document, '.vht-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.vht-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.vht-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Plans
            populateSectionHeader('#vht-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // Why Choose
            populateSectionHeader('#vht-why', page.whyLabel, page.whyTitle, page.whySubtitle);
            populateIconCards('#vht-why .vht-why-grid', page.whyCards, 'cloud-use-card');

            // When to Choose
            populateSectionHeader('#vht-when', page.whenLabel, page.whenTitle, page.whenSubtitle);
            populateWhenCards(page.whenCards);

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // How to Get Free VPS
            populateSectionHeader('#vht-how', page.howLabel, page.howTitle, page.howSubtitle);
            populateIconCards('#vht-how .cloud-power-grid', page.howSteps, 'cloud-power-card');

            // Specs Included
            populateSectionHeader('#vht-specs', page.specsLabel, page.specsTitle, page.specsSubtitle);
            populateIconCards('#vht-specs .cloud-power-grid', page.specs, 'cloud-power-card');

            // Who Can Use
            populateSectionHeader('#vht-who', page.whoLabel, page.whoTitle, page.whoSubtitle);
            populateIconCards('#vht-who .vht-when-grid', page.whoCards, 'cloud-power-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#vht-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#vht-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[vps-hosting-trial] CMS load failed:', err);
        } finally {
            hidePageLoader();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
