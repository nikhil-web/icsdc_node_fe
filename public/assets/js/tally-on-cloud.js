// ══════════════════════════════════════════════════════════
//  tally-on-cloud.js — ICSDC Tally on Cloud Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getTallyOnCloudPage } from './services/contentService.js';
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

    /** Render comparison table rows.
     *  compareRows is ds.icon-card[] where desc = "Cloud value | Desktop value"
     */
    function populateCompareTable(rows) {
        if (!rows || !rows.length) return;
        var tbody = document.getElementById('toc-compare-tbody');
        if (!tbody) return;
        tbody.innerHTML = rows.map(function (row) {
            var parts = (row.desc || row.description || '').split('|');
            var cloudVal = (parts[0] || '').trim();
            var desktopVal = (parts[1] || '').trim();
            return '<tr>' +
                '<td>' + (row.title || '') + '</td>' +
                '<td class="toc-col-cloud"><span class="toc-check">&#10003;</span>' + cloudVal + '</td>' +
                '<td class="toc-col-desktop">' + desktopVal + '</td>' +
                '</tr>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getTallyOnCloudPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrowSelector: '.toc-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });
            if (page.heroStatusTitle) setText(document, '.toc-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.toc-bs', page.heroStatusSubtitle);

            // Pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // About / Who We Are
            if (page.aboutTitle) setText(document, '#toc-about-title', page.aboutTitle);
            if (page.aboutDesc) setText(document, '#toc-about-desc', page.aboutDesc);

            // Improvements (12 cards)
            populateSectionHeader('#toc-improvements', page.improvementsLabel, page.improvementsTitle, null);
            populateIconCards('#toc-improvements-grid', page.improvements, 'cloud-power-card');

            // Why Choose ICSDC (9 cards)
            populateSectionHeader('#toc-why', page.whyLabel, page.whyTitle, null);
            populateIconCards('#toc-why-grid', page.whyCards, 'cloud-power-card');

            // Comparison Table
            if (page.compareLabel) {
                var cl = document.querySelector('#toc-compare .cloud-section-label');
                if (cl) cl.textContent = page.compareLabel;
            }
            if (page.compareTitle) {
                var ct = document.querySelector('#toc-compare .title');
                if (ct) ct.textContent = page.compareTitle;
            }
            populateCompareTable(page.compareRows);

            // CTA Band 1
            populateCtaBand('#toc-cta1', page.ctaBand1);

            // Who Can Use (7 cards)
            if (page.whoCanLabel) {
                var wl = document.querySelector('#toc-who .cloud-section-label');
                if (wl) wl.textContent = page.whoCanLabel;
            }
            if (page.whoCanTitle) {
                var wt = document.querySelector('#toc-who .title');
                if (wt) wt.textContent = page.whoCanTitle;
            }
            if (page.whoCanDesc) {
                var wd = document.querySelector('#toc-who .subtitle');
                if (wd) wd.textContent = page.whoCanDesc;
            }
            populateIconCards('#toc-who-grid', page.whoCanCards, 'cloud-use-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#toc-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#toc-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2
            populateCtaBand('#toc-cta2', page.ctaBand2);

        } catch (err) {
            console.error('[tally-on-cloud] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
