// ══════════════════════════════════════════════════════════
//  web-hosting.js — ICSDC Web Hosting Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getWebHostingPage } from './services/contentService.js';
import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    hidePageLoader,
    markActiveNavLink,
    setText,
    initFAQ,
    initTestimonials
} from './utils/cms-helpers.js';

(function () {
    'use strict';

    /**
     * Render comparison table 1 rows from Strapi data.
     * compareRows is ds.icon-card[] where title = feature name,
     * desc = "ICSDC value | Typical value" (pipe-separated).
     */
    function populateCompareTable(rows) {
        if (!rows || !rows.length) return;
        var tbody = document.getElementById('webh-compare-tbody');
        if (!tbody) return;

        tbody.innerHTML = rows.map(function (row) {
            var parts = (row.desc || row.description || '').split('|');
            var icsdcVal = (parts[0] || '').trim();
            var typicalVal = (parts[1] || '').trim();
            return '<tr>' +
                '<td>' + (row.title || '') + '</td>' +
                '<td class="webh-col-icsdc"><span class="webh-check">&#10003;</span> ' + icsdcVal + '</td>' +
                '<td>' + typicalVal + '</td>' +
                '</tr>';
        }).join('');
    }

    /**
     * Render comparison table 2 rows from Strapi data (checkmark style).
     * compareRows2 is ds.icon-card[] where title = feature name,
     * desc = "✔|✘" (pipe-separated checkmarks).
     */
    function populateCompareTable2(rows) {
        if (!rows || !rows.length) return;
        var tbody = document.getElementById('webh-compare2-tbody');
        if (!tbody) return;

        tbody.innerHTML = rows.map(function (row) {
            var parts = (row.desc || row.description || '').split('|');
            var icsdcVal = (parts[0] || '').trim();
            var otherVal = (parts[1] || '').trim();
            // Render checkmark/cross based on content
            var icsdcCell = icsdcVal === '✔' || icsdcVal === '&#10004;'
                ? '<span class="webh-yes">&#10004;</span>'
                : icsdcVal;
            var otherCell = otherVal === '✘' || otherVal === '&#10008;'
                ? '<span class="webh-no">&#10008;</span>'
                : otherVal;
            return '<tr>' +
                '<td>' + (row.title || '') + '</td>' +
                '<td class="webh-col-icsdc">' + icsdcCell + '</td>' +
                '<td>' + otherCell + '</td>' +
                '</tr>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getWebHostingPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrowSelector: '.webh-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
            heroImage: page.heroImage
            });

            // Pillars (4 cards)
            populateIconCards('#webh-pillars-grid', page.pillars, 'why-card');

            // Plans section
            if (page.plansTitle) setText(document, '#webh-plans-title', page.plansTitle);
            if (page.plansSubtitle) setText(document, '#webh-plans-subtitle', page.plansSubtitle);

            // CTA Band 1
            populateCtaBand('#webh-cta1', page.ctaBand1);

            // What Makes ICSDC Different (12 cards)
            if (page.featuresLabel) setText(document, '#webh-features-label', page.featuresLabel);
            if (page.featuresTitle) setText(document, '#webh-features-title', page.featuresTitle);
            populateIconCards('#webh-features-grid', page.featuresCards, 'cloud-power-card');

            // Is It Safe (5 cards)
            if (page.safetyTitle) setText(document, '#webh-safety-title', page.safetyTitle);
            if (page.safetyDesc) setText(document, '#webh-safety-desc', page.safetyDesc);
            populateIconCards('#webh-safety-grid', page.safetyCards, 'cloud-power-card');

            // Compare Table 1
            if (page.compareTitle) setText(document, '#webh-compare-title', page.compareTitle);
            populateCompareTable(page.compareRows);

            // Why Choose (6 cards)
            if (page.whyLabel) setText(document, '#webh-why-label', page.whyLabel);
            if (page.whyTitle) setText(document, '#webh-why-title', page.whyTitle);
            populateIconCards('#webh-why-grid', page.whyCards, 'cloud-power-card');

            // Designed to Succeed (3 cards)
            if (page.succeedTitle) setText(document, '#webh-succeed-title', page.succeedTitle);
            populateIconCards('#webh-succeed-grid', page.succeedCards, 'webh-succeed-card');

            // Need Help (3 cards)
            if (page.helpTitle) setText(document, '#webh-help-title', page.helpTitle);
            if (page.helpDesc) setText(document, '#webh-help-desc', page.helpDesc);
            populateIconCards('#webh-help-grid', page.helpCards, 'cloud-power-card');

            // Compare Table 2 (checkmark style)
            if (page.compareTitle2) setText(document, '#webh-compare2-title', page.compareTitle2);
            populateCompareTable2(page.compareRows2);

            // PAM cross-sell
            if (page.pamPromoTitle) setText(document, '#webh-pam-title', page.pamPromoTitle);
            if (page.pamPromoDesc) setText(document, '#webh-pam-desc', page.pamPromoDesc);
            if (page.pamPromoCta) {
                var pamBtn = document.getElementById('webh-pam-cta');
                if (pamBtn) {
                    if (page.pamPromoCta.text) pamBtn.textContent = page.pamPromoCta.text;
                    if (page.pamPromoCta.link) pamBtn.href = page.pamPromoCta.link;
                }
            }

            // Backup cross-sell
            if (page.backupPromoTitle) setText(document, '#webh-backup-title', page.backupPromoTitle);
            if (page.backupPromoDesc) setText(document, '#webh-backup-desc', page.backupPromoDesc);
            if (page.backupPromoCta) {
                var backupBtn = document.getElementById('webh-backup-cta');
                if (backupBtn) {
                    if (page.backupPromoCta.text) backupBtn.textContent = page.backupPromoCta.text;
                    if (page.backupPromoCta.link) backupBtn.href = page.backupPromoCta.link;
                }
            }

            // Testimonials
            if (page.testimonialTitle) setText(document, '#webh-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#webh-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('#webh-cta2', page.ctaBand2);

        } catch (err) {
            console.error('[web-hosting] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
