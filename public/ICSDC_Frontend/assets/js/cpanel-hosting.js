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
                '<a href="/contact-us.html" class="' + btnClass + '">' + ctaText + ' &rarr;</a>' +
                '</div>';
        }).join('');
    }

    function populateSupportCards(cards) {
        if (!cards || !cards.length) return;
        var el = document.querySelector('#cp-support-cards');
        if (!el) return;
        el.innerHTML = cards.map(function (card) {
            var icon = card.icon ? '<i class="' + card.icon + '" aria-hidden="true"></i>' : '<i class="fa-solid fa-circle-check" aria-hidden="true"></i>';
            var title = card.title || card.name || '';
            var desc = card.desc || card.description || '';
            return '<div class="cp-support-feat-card">' +
                '<div class="cp-support-feat-icon">' + icon + '</div>' +
                '<div class="cp-support-feat-body">' +
                '<h3>' + title + '</h3>' +
                (desc ? '<p>' + desc + '</p>' : '') +
                '</div>' +
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
                ctaSecondary: page.heroCtaSecondary,
            heroImage: page.heroImage
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

            // Who We Are
            if (page.aboutTitle) setText(document, '#cp-about-title', page.aboutTitle);
            if (page.aboutDesc) setHTML(document, '#cp-about-desc', page.aboutDesc);
            if (page.aboutImage && page.aboutImage.image && page.aboutImage.image.url) {
                var aboutImg = document.querySelector('#cp-about-img');
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

            // Why ICSDC
            populateSectionHeader('#cp-why', page.whyLabel, page.whyTitle, page.whySubtitle);
            populateIconCards('#cp-why .cp-why-grid', page.whyCards, 'cloud-power-card');

            // Who Can Use
            populateSectionHeader('#cp-who', page.whoLabel, page.whoTitle, page.whoSubtitle);
            populateIconCards('#cp-who .cp-who-grid', page.whoCards, 'cloud-use-card');

            // Stress-Free Support
            if (page.supportTitle) setText(document, '#cp-support-title', page.supportTitle);
            if (page.supportDesc) setHTML(document, '#cp-support-desc', page.supportDesc);
            populateSupportCards(page.supportCards);
            if (page.supportImage && page.supportImage.image && page.supportImage.image.url) {
                var supportImg = document.querySelector('#cp-support-img');
                if (supportImg) {
                    var _base2 = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : 'http://localhost:1337');
                    var _m2 = page.supportImage.image;
                    var _url2 = (_m2.formats && (_m2.formats.large || _m2.formats.medium || _m2.formats.small)
                        ? (_m2.formats.large || _m2.formats.medium || _m2.formats.small).url
                        : _m2.url) || '';
                    if (_url2 && !_url2.startsWith('http')) _url2 = _base2 + _url2;
                    if (_url2) { supportImg.src = _url2; supportImg.alt = _m2.alternativeText || ''; }
                }
            }

            // When to Choose cPanel
            populateSectionHeader('#cp-when', page.whenLabel, page.whenTitle, page.whenSubtitle);
            populateIconCards('#cp-when .cp-when-grid', page.whenCards, 'cloud-use-card');

            // Built-In Features
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
