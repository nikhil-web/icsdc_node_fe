// ══════════════════════════════════════════════════════════
//  managed-vps-hosting.js — Managed VPS Hosting Page
//  Fetches from the managed-vps-hosting-page Strapi single type.
// ══════════════════════════════════════════════════════════

import { getManagedVpsHostingPage } from './services/contentService.js';
import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateCtaBand,
    populatePricingPlans,
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
     * Render the complex-software features as a tabbed panel.
     * cpanelFeaturesList may be:
     *   - A grouped array: [{ category: "...", items: ["...", "..."] }, ...]
     *   - A flat array of strings (fallback: all shown under one "All" tab)
     */
    function populateSoftwareTabs(data) {
        if (!data || !data.length) return;
        var nav = document.getElementById('vpc-software-tab-nav');
        var content = document.getElementById('vpc-software-tab-content');
        if (!nav || !content) return;

        // Normalise to grouped format
        var groups;
        if (typeof data[0] === 'string') {
            groups = [{ category: 'All', items: data }];
        } else {
            groups = data;
        }

        function renderCard(group) {
            var items = (group.items || []).map(function (item) {
                return '<div class="vpc-sw-item">' +
                    '<i class="fa-solid fa-circle-check" aria-hidden="true"></i>' +
                    '<span>' + item + '</span>' +
                    '</div>';
            }).join('');
            return '<div class="vpc-sw-card">' +
                '<div class="vpc-sw-card-title">' + (group.category || '') + '</div>' +
                (group.subtitle ? '<div class="vpc-sw-card-sub">' + group.subtitle + '</div>' : '') +
                '<div class="vpc-sw-items">' + items + '</div>' +
                '<div class="vpc-sw-cta">' +
                    '<a href="/contact-us.html" class="vpc-sw-cta-btn">Get Managed Setup &rarr;</a>' +
                '</div>' +
                '</div>';
        }

        // Build tab buttons
        nav.innerHTML = groups.map(function (g, i) {
            return '<button class="vpc-sw-tab-btn' + (i === 0 ? ' is-active' : '') + '" data-idx="' + i + '">' +
                (g.category || ('Tab ' + (i + 1))) +
                '</button>';
        }).join('');

        // Show first tab
        content.innerHTML = renderCard(groups[0]);

        // Click handler
        nav.addEventListener('click', function (e) {
            var btn = e.target.closest('.vpc-sw-tab-btn');
            if (!btn) return;
            var idx = parseInt(btn.dataset.idx, 10);
            nav.querySelectorAll('.vpc-sw-tab-btn').forEach(function (b) { b.classList.remove('is-active'); });
            btn.classList.add('is-active');
            content.innerHTML = renderCard(groups[idx]);
        });
    }

    /**
     * Render a comparison table body from a JSON array.
     * col3 always gets .vpc-table-highlight; isTotal rows get .vpc-table-total
     */
    function populateCompareTable(tbodyId, rows, col1, col2, col3) {
        if (!rows || !rows.length) return;
        var tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        tbody.innerHTML = rows.map(function (row) {
            var isTotal = row.isTotal || false;
            var rowClass = isTotal ? ' class="vpc-table-total"' : '';
            return '<tr' + rowClass + '>' +
                '<td>' + (isTotal ? '<strong>' : '') + (row[col1] || '') + (isTotal ? '</strong>' : '') + '</td>' +
                '<td>' + (isTotal ? '<strong>' : '') + (row[col2] || '') + (isTotal ? '</strong>' : '') + '</td>' +
                '<td class="vpc-table-highlight">' + (isTotal ? '<strong>' : '') + (row[col3] || '') + (isTotal ? '</strong>' : '') + '</td>' +
                '</tr>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getManagedVpsHostingPage();
            var page = response.data;

            // ── SEO ────────────────────────────────────────────────
            populateSEO(page.seo);

            // ── Hero ───────────────────────────────────────────────
            populateHero('.hero-section', {
                eyebrowSelector: '.vpc-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
                heroImage: page.heroImage
            });

            if (page.heroStatusTitle) setText(document, '.vpc-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.vpc-bs', page.heroStatusSubtitle);

            // ── Pillars (4 cards) ──────────────────────────────────
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // ── Plans & Pricing ────────────────────────────────────
            if (page.plansLabel) setText(document, '#vpc-plans-label', page.plansLabel);
            if (page.plansTitle) setText(document, '#vpc-plans-title', page.plansTitle);
            if (page.plansSubtitle) setText(document, '#vpc-plans-subtitle', page.plansSubtitle);
            if (page.plans && page.plans.length) {
                populatePricingPlans('#vpc-plans-grid', page.plans);
            }

            // ── Key Advantages (7 cards) ───────────────────────────
            if (page.advantagesLabel) setText(document, '#vpc-advantages-label', page.advantagesLabel);
            if (page.advantagesTitle) setText(document, '#vpc-advantages-title', page.advantagesTitle);
            populateIconCards('#vpc-advantages-grid', page.advantages, 'cloud-power-card');

            // ── Cost Efficiency Table ──────────────────────────────
            if (page.costComparison) {
                if (page.costComparison.title) setText(document, '#vpc-cost-title', page.costComparison.title);
                if (page.costComparison.subtitle) setText(document, '#vpc-cost-subtitle', page.costComparison.subtitle);
                if (page.costComparison.rows) {
                    populateCompareTable('vpc-cost-tbody', page.costComparison.rows, 'feature', 'self', 'icsdc');
                }
            } else if (Array.isArray(page.costComparison)) {
                populateCompareTable('vpc-cost-tbody', page.costComparison, 'feature', 'self', 'icsdc');
            }

            // ── About / Who We Are (image + text layout) ───────────
            if (page.aboutTitle) setText(document, '#vpc-about-title', page.aboutTitle);
            if (page.aboutDesc) setHTML(document, '#vpc-about-desc', '<p>' + page.aboutDesc + '</p>');
            if (page.aboutImage && page.aboutImage.image && page.aboutImage.image.url) {
                var aboutImg = document.querySelector('#vpc-about-img');
                if (aboutImg) {
                    var _m = page.aboutImage.image;
                    var _url = _m.url
                        ? (_m.url.startsWith('http') ? _m.url : (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : '') + _m.url)
                        : null;
                    if (_url) { aboutImg.src = _url; aboutImg.alt = _m.alternativeText || 'ICSDC Managed VPS Hosting'; }
                }
            }

            // ── Complex Software — Tabbed Panel ───────────────────
            if (page.cpanelFeaturesTitle) setText(document, '#vpc-cpanel-features-title', page.cpanelFeaturesTitle);
            if (page.cpanelFeaturesDesc) setText(document, '#vpc-cpanel-features-desc', page.cpanelFeaturesDesc);
            populateSoftwareTabs(page.cpanelFeaturesList);

            // ── Why Choose ICSDC (8 cards) ─────────────────────────
            if (page.whyLabel) setText(document, '#vpc-why-label', page.whyLabel);
            if (page.whyTitle) setText(document, '#vpc-why-title', page.whyTitle);
            populateIconCards('#vpc-why-grid', page.whyCards, 'cloud-power-card');

            // ── Self-Managed vs Fully Managed Table ────────────────
            if (page.selfManagedComparison) {
                if (page.selfManagedComparison.title) setText(document, '#vpc-self-managed-title', page.selfManagedComparison.title);
                if (page.selfManagedComparison.subtitle) setText(document, '#vpc-self-managed-subtitle', page.selfManagedComparison.subtitle);
                if (page.selfManagedComparison.rows) {
                    populateCompareTable('vpc-compare-tbody', page.selfManagedComparison.rows, 'feature', 'self', 'managed');
                }
            } else if (Array.isArray(page.selfManagedComparison)) {
                populateCompareTable('vpc-compare-tbody', page.selfManagedComparison, 'feature', 'self', 'managed');
            }

            // ── What You Get (11 cards) ────────────────────────────
            if (page.whatYouGetLabel) setText(document, '#vpc-wyg-label', page.whatYouGetLabel);
            if (page.whatYouGetTitle) setText(document, '#vpc-wyg-title', page.whatYouGetTitle);
            if (page.whatYouGetSubtitle) setText(document, '#vpc-wyg-subtitle', page.whatYouGetSubtitle);
            populateIconCards('#vpc-wyg-grid', page.whatYouGetCards, 'cloud-power-card');

            // ── Use Cases / Ideal For (12 cards) ───────────────────
            if (page.useCasesLabel) setText(document, '#vpc-uc-label', page.useCasesLabel);
            if (page.useCasesTitle) setText(document, '#vpc-uc-title', page.useCasesTitle);
            if (page.useCasesSubtitle) setText(document, '#vpc-uc-subtitle', page.useCasesSubtitle);
            populateIconCards('#vpc-uc-grid', page.useCaseCards, 'cloud-power-card');

            // ── CTA Band 1 ─────────────────────────────────────────
            populateCtaBand('#vpc-cta1', page.ctaBand1);

            // ── Testimonials ───────────────────────────────────────
            if (page.testimonialTitle) setText(document, '#vpc-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // ── FAQ ────────────────────────────────────────────────
            if (page.faqTitle) setText(document, '#vpc-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // ── CTA Band 2 (dark) ──────────────────────────────────
            populateCtaBand('#vpc-cta2', page.ctaBand2);

        } catch (err) {
            console.error('[managed-vps-hosting] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
