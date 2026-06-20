// ══════════════════════════════════════════════════════════
//  cloud-storage.js — ICSDC Cloud Storage Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getCloudStoragePage } from './services/contentService.js';
import { inlineRichText } from './utils/cms-helpers.js';
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
import { uploadURL } from './services/strapiClient.js';

(function () {
    'use strict';

    /**
     * Render the 3-column Cloud Storage plans grid.
     * Each plan uses the cs-plan-card CSS classes.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#cs-plans .cs-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isFeatured || plan.popular || false;
            var featuredClass = isFeatured ? ' cs-plan-featured' : '';
            var badgeLabel = plan.badge || (isFeatured ? 'Most Popular' : '');
            var badgeHtml = badgeLabel
                ? '<div class="cs-plan-badge">' + badgeLabel + '</div>'
                : '';

            var currency = plan.currency || '₹';
            var period = plan.period || 'mo';
            var priceHtml = plan.price
                ? '<div class="cs-plan-price">' + currency + plan.price + ' <span>/' + period + '</span></div>'
                : '';

            var taglineHtml = plan.tagline
                ? '<div class="cs-plan-tagline">' + plan.tagline + '</div>'
                : '';

            var featuresArr = plan.features || [];
            var featuresHtml = featuresArr.length
                ? '<ul class="cs-plan-features">' +
                featuresArr.map(function (f) {
                    return '<li>' + (f.label || f.text || f.name || f) + '</li>';
                }).join('') +
                '</ul>'
                : '';

            var ctaText = plan.ctaText || 'Get Started';
            var btnClass = isFeatured ? 'cs-plan-btn-featured' : 'cs-plan-btn';

            return '<div class="cs-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="cs-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
                priceHtml +
                taglineHtml +
                featuresHtml +
                '<a href="#" class="' + btnClass + '">' + ctaText + ' </a>' +
                '</div>';
        }).join('');
    }

    /** Render the "When to Choose" checklist from a JSON string array. */
    function populateWhenList(points) {
        if (!points || !points.length) return;
        var list = document.getElementById('cs-when-list');
        if (!list) return;
        list.innerHTML = points.map(function (pt) {
            return '<li>' + (typeof pt === 'string' ? pt : (pt.text || pt.label || '')) + '</li>';
        }).join('');
    }

    /** Render the audience groups (For Businesses / Creators / Individuals). */
    function populateAudience(groups) {
        if (!groups || !groups.length) return;
        var grid = document.getElementById('cs-audience-grid');
        if (!grid) return;
        grid.innerHTML = groups.map(function (g) {
            var pts = (g.points || []).map(function (p) {
                return '<li>' + (typeof p === 'string' ? p : (p.text || '')) + '</li>';
            }).join('');
            return '<div class="cs-audience-card">' +
                '<h3 class="cs-audience-title">' + (g.title || '') + '</h3>' +
                (g.intro ? '<p class="cs-audience-intro">' + g.intro + '</p>' : '') +
                '<ul class="cs-audience-points">' + pts + '</ul>' +
                '</div>';
        }).join('');
    }

    /** Render the related-services cards from JSON. */
    function populateRelated(cards) {
        if (!cards || !cards.length) return;
        var grid = document.getElementById('cs-related-grid');
        if (!grid) return;
        grid.innerHTML = cards.map(function (c) {
            var cta = c.ctaText
                ? '<a href="' + (c.ctaLink || '#') + '" class="cs-related-cta">' + c.ctaText + ' </a>'
                : '';
            return '<div class="cs-related-card">' +
                '<h3 class="cs-related-title">' + (c.title || '') + '</h3>' +
                '<p class="cs-related-desc">' + inlineRichText(c.desc || c.description || '') + '</p>' +
                cta +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getCloudStoragePage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.cs-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
                heroImage: page.heroImage
            });

            if (page.heroTopBadge) setHTML(document, '.cs-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.cs-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.cs-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Plans
            populateSectionHeader('#cs-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // Who We Are
            var aboutTitleEl = document.getElementById('cs-about-title');
            if (aboutTitleEl && page.aboutTitle) aboutTitleEl.textContent = page.aboutTitle;
            var aboutDescEl = document.getElementById('cs-about-desc');
            if (aboutDescEl && page.aboutDesc) aboutDescEl.textContent = page.aboutDesc;
            if (page.aboutImage && page.aboutImage.image) {
                var aboutImg = document.getElementById('cs-about-img');
                if (aboutImg) {
                    var aboutImgUrl = uploadURL(page.aboutImage.image);
                    if (aboutImgUrl) aboutImg.src = aboutImgUrl;
                }
            }

            // Features (8 cards)
            populateSectionHeader('#cs-features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#cs-features .cs-features-grid', page.features, 'cloud-power-card');

            // When to Choose
            populateSectionHeader('#cs-when', page.whenLabel, page.whenTitle, page.whenSubtitle);
            populateWhenList(page.whenPoints);

            // One Platform for Every User
            populateSectionHeader('#cs-audience', page.audienceLabel, page.audienceTitle, page.audienceSubtitle);
            populateAudience(page.audienceGroups);

            // Related Services
            populateSectionHeader('#cs-related', page.relatedLabel, page.relatedTitle, null);
            populateRelated(page.relatedCards);

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // Who Can Use (6 cards)
            populateSectionHeader('#cs-who', page.whoLabel, page.whoTitle, page.whoSubtitle);
            populateIconCards('#cs-who .cloud-power-grid', page.whoCards, 'cloud-power-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#cs-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#cs-faq-heading', page.faqTitle);
            initFAQ(page.faq);

        } catch (err) {
            console.error('[cloud-storage] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
