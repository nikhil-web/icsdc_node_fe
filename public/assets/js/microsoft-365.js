// ══════════════════════════════════════════════════════════
//  microsoft-365.js — ICSDC Microsoft 365 Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getMicrosoft365Page } from './services/contentService.js';
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
     * Render the 3-column Microsoft 365 plans grid.
     * Each plan uses the m365-plan-card CSS classes.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#m365-plans .m365-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isFeatured || plan.popular || false;
            var featuredClass = isFeatured ? ' m365-plan-featured' : '';
            var badgeLabel = plan.badge || (isFeatured ? 'Most Popular' : '');
            var badgeHtml = badgeLabel
                ? '<div class="m365-plan-badge">' + badgeLabel + '</div>'
                : '';

            var currency = plan.currency || '₹';
            var period = plan.period || 'user/mo';
            var priceHtml = plan.price
                ? '<div class="m365-plan-price">' + currency + plan.price + ' <span>/' + period + '</span></div>'
                : '';

            var taglineHtml = plan.tagline
                ? '<div class="m365-plan-tagline">' + plan.tagline + '</div>'
                : '';

            var featuresArr = plan.features || [];
            var featuresHtml = featuresArr.length
                ? '<ul class="m365-plan-features">' +
                featuresArr.map(function (f) {
                    return '<li>' + (f.label || f.text || f.name || f) + '</li>';
                }).join('') +
                '</ul>'
                : '';

            var ctaText = plan.ctaText || 'Get Started';
            var btnClass = isFeatured ? 'm365-plan-btn-featured' : 'm365-plan-btn';

            return '<div class="m365-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="m365-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
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
            var response = await getMicrosoft365Page();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.m365-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) setHTML(document, '.m365-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.m365-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.m365-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Plans
            populateSectionHeader('#m365-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // Productivity Features (12 cards)
            populateSectionHeader('#m365-features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#m365-features .m365-features-grid', page.features, 'cloud-power-card');

            // Backup Protection (7 cards)
            populateSectionHeader('#m365-backup', page.backupLabel, page.backupTitle, page.backupSubtitle);
            populateIconCards('#m365-backup .m365-backup-grid', page.backupFeatures, 'cloud-use-card');

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // Who Should Choose (6 cards)
            populateSectionHeader('#m365-who', page.whoLabel, page.whoTitle, page.whoSubtitle);
            populateIconCards('#m365-who .cloud-power-grid', page.whoCards, 'cloud-power-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#m365-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#m365-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[microsoft-365] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
