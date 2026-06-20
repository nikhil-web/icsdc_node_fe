// ══════════════════════════════════════════════════════════
//  reseller-hosting.js — ICSDC Reseller Hosting Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getResellerHostingPage } from './services/contentService.js';
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
    initTestimonials,
    resolveIcon
} from './utils/cms-helpers.js';

(function () {
    'use strict';

    /**
     * Render the Related Hosting Services link-strip.
     * Each card is an <a> with icon bubble, label, and diagonal arrow.
     * Uses the rh-related-link CSS class from reseller-hosting.css.
     */
    function populateRelatedStrip(cards) {
        if (!cards || !cards.length) return;
        var strip = document.querySelector('#rh-related .rh-related-strip');
        if (!strip) return;
        var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        strip.innerHTML = sorted.map(function (card) {
            var href = card.link || '#';
            var iconHtml = resolveIcon(card.icon || 'server');
            var label = card.title || card.name || '';
            return '<a class="rh-related-link" href="' + href + '">' +
                '<span class="rh-related-icon-wrap">' + iconHtml + '</span>' +
                '<span class="rh-related-label">' + label + '</span>' +
                '<span class="rh-related-arrow">&#x2197;</span>' +
                '</a>';
        }).join('');
    }

    /**
     * Render the 3-column reseller plans grid.
     * Each plan uses the rh-plan-card CSS classes.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#rh-plans .rh-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isFeatured || plan.popular || false;
            var featuredClass = isFeatured ? ' rh-plan-featured' : '';
            var badgeLabel = plan.badge || (isFeatured ? 'Most Popular' : '');
            var badgeHtml = badgeLabel
                ? '<div class="rh-plan-badge">' + badgeLabel + '</div>'
                : '';

            var currency = plan.currency || '₹';
            var period = plan.period || 'mo';
            var priceHtml = plan.price
                ? '<div class="rh-plan-price">' + currency + plan.price + ' <span>/' + period + '</span></div>'
                : '';

            var taglineHtml = plan.tagline
                ? '<div class="rh-plan-tagline">' + plan.tagline + '</div>'
                : '';

            var featuresArr = plan.features || [];
            var featuresHtml = featuresArr.length
                ? '<ul class="rh-plan-features">' +
                featuresArr.map(function (f) {
                    return '<li>' + (f.label || f.text || f.name || f) + '</li>';
                }).join('') +
                '</ul>'
                : '';

            var ctaText = plan.ctaText || 'Get Started';
            var btnClass = isFeatured ? 'rh-plan-btn-featured' : 'rh-plan-btn';

            return '<div class="rh-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="rh-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
                priceHtml +
                taglineHtml +
                featuresHtml +
                '<a href="/contact-us.html" class="' + btnClass + '">' + ctaText + ' </a>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getResellerHostingPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.rh-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
                heroImage: page.heroImage
            });

            if (page.heroTopBadge) setHTML(document, '.rh-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.rh-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.rh-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Plans
            populateSectionHeader('#rh-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // What Is ICSDC Reseller Hosting
            if (page.aboutTitle) setText(document, '#rh-about-title', page.aboutTitle);
            if (page.aboutDesc) setHTML(document, '#rh-about-desc', page.aboutDesc);
            if (page.aboutImage && page.aboutImage.image && page.aboutImage.image.url) {
                var aboutImg = document.querySelector('#rh-about-img');
                if (aboutImg) {
                    var _base = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : 'http://localhost:1337');
                    var _m = page.aboutImage.image;
                    var _url = (_m.formats && (_m.formats.large || _m.formats.medium || _m.formats.small)
                        ? (_m.formats.large || _m.formats.medium || _m.formats.small).url
                        : _m.url) || '';
                    if (_url && !_url.startsWith('http')) _url = _base + _url;
                    if (_url) { aboutImg.src = _url; aboutImg.alt = _m.alternativeText || ''; aboutImg.style.display = ''; }
                }
            }

            // What You Get With ICSDC Reseller Hosting
            populateSectionHeader('#rh-whatyouget', page.whatYouGetLabel, page.whatYouGetTitle, page.whatYouGetSubtitle);
            populateIconCards('#rh-whatyouget .rh-whatyouget-grid', page.whatYouGetCards, 'cloud-use-card');

            // Features — everything you need
            populateSectionHeader('#rh-features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#rh-features .rh-features-grid', page.features, 'cloud-power-card');

            // Why Choose ICSDC
            populateSectionHeader('#rh-why', page.whyLabel, page.whyTitle, page.whySubtitle);
            populateIconCards('#rh-why .rh-why-grid', page.whyCards, 'cloud-use-card');

            // Business Tools
            populateSectionHeader('#rh-tools', page.toolsLabel, page.toolsTitle, page.toolsSubtitle);
            populateIconCards('#rh-tools .cloud-power-grid', page.toolsCards, 'cloud-power-card');

            // 24/7/365 Support
            populateSectionHeader('#rh-support', page.supportLabel, page.supportTitle, page.supportSubtitle);
            populateIconCards('#rh-support .rh-support-grid', page.supportCards, 'cloud-use-card');

            // Related Hosting Services
            if (page.relatedTitle) setText(document, '#rh-related .title', page.relatedTitle);
            populateRelatedStrip(page.relatedCards);

            // Testimonials
            if (page.testimonialTitle) setText(document, '#rh-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#rh-faq-heading', page.faqTitle);
            initFAQ(page.faq);

        } catch (err) {
            console.error('[reseller-hosting] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
