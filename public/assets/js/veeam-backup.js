// ══════════════════════════════════════════════════════════
//  veeam-backup.js — ICSDC Veeam Backup & Recovery Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getVeeamBackupPage } from './services/contentService.js';
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
     * Render the comparison table rows from Strapi data.
     * compareRows is ds.icon-card[] where title = feature name,
     * desc = "ICSDC value | Direct value" (pipe-separated).
     */
    function populateCompareTable(rows) {
        if (!rows || !rows.length) return;
        var tbody = document.getElementById('veeam-compare-tbody');
        if (!tbody) return;

        tbody.innerHTML = rows.map(function (row) {
            var parts = (row.desc || row.description || '').split('|');
            var icsdcVal = (parts[0] || '').trim();
            var directVal = (parts[1] || '').trim();
            return '<tr>' +
                '<td>' + (row.title || '') + '</td>' +
                '<td class="veeam-col-icsdc"><span class="veeam-check">&#10003;</span>' + icsdcVal + '</td>' +
                '<td>' + directVal + '</td>' +
                '</tr>';
        }).join('');
    }

    /**
     * Render the 4 cyber threat stat boxes.
     * stats is ds.icon-card[] where title = big number, desc = description text.
     */
    function populateStats(stats) {
        if (!stats || !stats.length) return;
        var grid = document.getElementById('veeam-stats-grid');
        if (!grid) return;

        grid.innerHTML = stats.map(function (stat) {
            return '<div class="veeam-stat-card">' +
                '<div class="veeam-stat-number">' + (stat.title || '') + '</div>' +
                '<p class="veeam-stat-desc">' + (stat.desc || stat.description || '') + '</p>' +
                '</div>';
        }).join('');
    }

    /**
     * Render the 5 numbered How It Works steps.
     * steps is ds.numbered-tip[] — uses 'description' (not 'desc').
     */
    function populateSteps(steps) {
        if (!steps || !steps.length) return;
        var grid = document.getElementById('veeam-steps-grid');
        if (!grid) return;

        var sorted = steps.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (step, idx) {
            var num = step.order || (idx + 1);
            return '<div class="veeam-step-card">' +
                '<div class="veeam-step-num">' + num + '</div>' +
                '<h3>' + (step.title || '') + '</h3>' +
                '<p>' + (step.description || step.desc || '') + '</p>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getVeeamBackupPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.veeam-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) setHTML(document, '.veeam-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.veeam-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.veeam-bs', page.heroStatusSubtitle);

            // Pillars (4 cards)
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Why Businesses Trust Veeam (9 cards)
            populateSectionHeader('#veeam-features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#veeam-features-grid', page.features, 'cloud-power-card');

            // Comparison Table
            if (page.compareLabel) {
                var compareLabel = document.querySelector('#veeam-compare .cloud-section-label');
                if (compareLabel) compareLabel.textContent = page.compareLabel;
            }
            if (page.compareTitle) {
                var compareTitle = document.querySelector('#veeam-compare .title');
                if (compareTitle) compareTitle.textContent = page.compareTitle;
            }
            populateCompareTable(page.compareRows);

            // Cyber Threat Stats
            populateSectionHeader('#veeam-stats', page.statsLabel, page.statsTitle, page.statsSubtitle);
            populateStats(page.stats);

            // How It Works (5 steps)
            populateSectionHeader('#veeam-how', page.stepsLabel, page.stepsTitle, null);
            populateSteps(page.steps);

            // CTA Band 1
            populateCtaBand('#veeam-cta1', page.ctaBand1);

            // Why Choose ICSDC (8 cards)
            populateSectionHeader('#veeam-why', page.whyLabel, page.whyTitle, page.whySubtitle);
            populateIconCards('#veeam-why-grid', page.whyCards, 'cloud-power-card');

            // Who Should Choose (9 cards)
            populateSectionHeader('#veeam-who', page.whoLabel, page.whoTitle, page.whoSubtitle);
            populateIconCards('#veeam-who-grid', page.whoCards, 'cloud-power-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#veeam-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#veeam-faq-heading', page.faqTitle);
            if (page.faqContactTitle) {
                var faqContactTitle = document.querySelector('.faq-contact-title');
                if (faqContactTitle) faqContactTitle.textContent = page.faqContactTitle;
            }
            if (page.faqContactDesc) {
                var faqContactDesc = document.querySelector('.faq-contact-desc');
                if (faqContactDesc) faqContactDesc.innerHTML = page.faqContactDesc.replace(/\n/g, '<br>');
            }
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('#veeam-cta2', page.ctaBand2);

        } catch (err) {
            console.error('[veeam-backup] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
