// ══════════════════════════════════════════════════════════
//  microsoft-365.js — ICSDC Microsoft 365 Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getMicrosoft365Page } from './services/contentService.js';
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

(function () {
    'use strict';

    /**
     * Render a 2-column comparison table (feature | icsdc | direct).
     * Values are rendered as check/cross icons when 'yes'/'no'/true/false/✓/✗,
     * otherwise as plain text.
     */
    function cell(val) {
        if (val === true || val === '✓' || val === '✔' || /^yes$/i.test(String(val || ''))) {
            return '<i class="fa-solid fa-circle-check m365-col-yes" aria-hidden="true"></i>';
        }
        if (val === false || val === '✗' || val === '❌' || /^no$/i.test(String(val || ''))) {
            return '<i class="fa-solid fa-circle-xmark m365-col-no" aria-hidden="true"></i>';
        }
        return val == null ? '' : String(val);
    }

    function populateAdvantageTable(rows) {
        if (!rows || !rows.length) return;
        var tbody = document.getElementById('m365-advantage-tbody');
        if (!tbody) return;
        tbody.innerHTML = rows.map(function (r) {
            return '<tr><td>' + (r.feature || r.criteria || '') + '</td>' +
                '<td>' + cell(r.icsdc) + '</td>' +
                '<td>' + cell(r.direct !== undefined ? r.direct : r.microsoft) + '</td></tr>';
        }).join('');
    }

    function populateComparePlansTable(rows) {
        if (!rows || !rows.length) return;
        var tbody = document.getElementById('m365-compare-plans-tbody');
        if (!tbody) return;
        tbody.innerHTML = rows.map(function (r) {
            return '<tr><td>' + (r.feature || '') + '</td>' +
                '<td>' + cell(r.emailEssentials) + '</td>' +
                '<td>' + cell(r.onlineBusinessEssentials) + '</td>' +
                '<td>' + cell(r.businessProfessional) + '</td></tr>';
        }).join('');
    }

    function populateWhenList(points) {
        if (!points || !points.length) return;
        var list = document.getElementById('m365-when-list');
        if (!list) return;
        list.innerHTML = points.map(function (p) {
            return '<li>' + (p.text || p.label || p) + '</li>';
        }).join('');
    }

    function populateRelatedCards(cards) {
        if (!cards || !cards.length) return;
        var grid = document.getElementById('m365-related-grid');
        if (!grid) return;
        grid.innerHTML = cards.map(function (c) {
            return '<div class="m365-related-card">' +
                '<h3>' + (c.title || '') + '</h3>' +
                '<p>' + inlineRichText(c.desc || c.description || '') + '</p>' +
                '<a href="' + (c.ctaLink || c.link || '/contact-us') + '" class="m365-related-link">' +
                (c.ctaText || c.ctaLabel || 'Learn More') + ' </a>' +
                '</div>';
        }).join('');
    }

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
                '<a href="' + (plan.ctaLink || 'contact-popup') + '" class="' + btnClass + '">' + ctaText + ' </a>' +
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
                ctaSecondary: page.heroCtaSecondary,
                heroImage: page.heroImage
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

            // Features & Tools Included (15 cards)
            populateSectionHeader('#m365-tools', page.toolsLabel, page.toolsTitle, page.toolsSubtitle);
            populateIconCards('#m365-tools .m365-tools-grid', page.toolsCards, 'cloud-power-card');

            // Backup Protection (7 cards)
            populateSectionHeader('#m365-backup', page.backupLabel, page.backupTitle, page.backupSubtitle);
            populateIconCards('#m365-backup .m365-backup-grid', page.backupFeatures, 'cloud-use-card');

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // More Value, More Support (12-row advantage table)
            if (page.advantageTitle) setText(document, '#m365-advantage .title', page.advantageTitle);
            populateAdvantageTable(page.advantageRows);

            // Compare ICSDC Plans (19-row, 3-col table)
            if (page.comparePlansTitle) setText(document, '#m365-compare-plans .title', page.comparePlansTitle);
            populateComparePlansTable(page.comparePlansRows);

            // Who Should Choose (6 cards)
            populateSectionHeader('#m365-who', page.whoLabel, page.whoTitle, page.whoSubtitle);
            populateIconCards('#m365-who .cloud-power-grid', page.whoCards, 'cloud-power-card');

            // When to Choose Microsoft 365
            if (page.whenTitle) setText(document, '#m365-when .title', page.whenTitle);
            populateWhenList(page.whenPoints);
            if (page.whenImage && page.whenImage.image && page.whenImage.image.url) {
                var whenImg = document.getElementById('m365-when-img');
                if (whenImg) {
                    var whenUrl = page.whenImage.image.url;
                    whenImg.src = /^https?:\/\//.test(whenUrl) ? whenUrl : ('http://localhost:1337' + whenUrl);
                }
            }
            populateRelatedCards(page.relatedCards);

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
