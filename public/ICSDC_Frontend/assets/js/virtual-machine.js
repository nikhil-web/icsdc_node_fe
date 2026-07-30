// ══════════════════════════════════════════════════════════
//  virtual-machine.js — ICSDC Virtual Machine Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getVirtualMachinePage } from './services/contentService.js';
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
    initFAQ,
    initTestimonials
} from './utils/cms-helpers.js';
import { uploadURL } from './services/strapiClient.js';

(function () {
    'use strict';

    /**
     * Populate the VM plans table from Strapi vmPlans (ds.icon-card[]).
     * title = plan name, desc = "cores · RAM · storage · transfer"
     * Rebuilds the tbody rows while preserving category header rows.
     */
    function populatePlansTable(vmPlans) {
        if (!vmPlans || !vmPlans.length) return;
        var tbody = document.querySelector('.vm-plans-table tbody');
        if (!tbody) return;

        // Category markers — plan names starting with these prefixes get a category header
        var categories = {
            'Standard': false,
            'CPU Optimized': false,
            'Memory Optimized': false
        };

        var rows = '';
        vmPlans.forEach(function (plan) {
            var name = plan.title || '';
            var desc = plan.desc || plan.description || '';
            var parts = desc.split(/\s*[·•]\s*/);
            var vcpu = parts[0] || '';
            var ram = parts[1] || '';
            var storage = parts[2] || '';
            var xfer = parts[3] || '';
            var price = parts[4] || 'Contact Us';

            // Inject category header if needed
            Object.keys(categories).forEach(function (cat) {
                if (!categories[cat] && name.startsWith(cat)) {
                    rows += '<tr class="vm-category-row"><td colspan="7">' + cat + '</td></tr>';
                    categories[cat] = true;
                }
            });

            rows += '<tr>' +
                '<td class="vm-plan-name">' + name + '</td>' +
                '<td>' + vcpu + '</td>' +
                '<td>' + ram + '</td>' +
                '<td>' + storage + '</td>' +
                '<td>' + xfer + '</td>' +
                '<td class="vm-plan-price">' + price + '</td>' +
                // vmPlans is a ds.icon-card (no ctaText/ctaLink) — its `link` field is
                // the per-row destination; empty → contact popup. Label stays uniform
                // ("Get Started") as this is a table action column.
                '<td><a href="' + (plan.link || 'contact-popup') + '" class="vm-plan-btn">Get Started</a></td>' +
                '</tr>';
        });

        tbody.innerHTML = rows;
    }

    /**
     * Render the VM vs Shared Hosting comparison rows.
     * compareRows is a JSON array: [{ criteria, shared, icsdc }]
     */
    function populateCompareTable(rows) {
        if (!rows || !rows.length) return;
        var tbody = document.getElementById('vm-compare-tbody');
        if (!tbody) return;
        tbody.innerHTML = rows.map(function (row) {
            return '<tr>' +
                '<td class="vm-criteria">' + (row.criteria || '') + '</td>' +
                '<td>' + (row.shared || '') + '</td>' +
                '<td class="vm-col-good">' + (row.icsdc || '') + '</td>' +
                '</tr>';
        }).join('');
    }

    /**
     * Populate the "When to Choose" cards from Strapi whenCards.
     * Uses ds.icon-card format: title, desc.
     */
    function populateWhenCards(whenCards) {
        if (!whenCards || !whenCards.length) return;
        var grid = document.querySelector('#vm-when .vm-when-grid');
        if (!grid) return;

        grid.innerHTML = whenCards.map(function (card, idx) {
            var num = String(idx + 1).padStart(2, '0');
            return '<div class="vm-when-card">' +
                '<div class="vm-when-num">' + num + '</div>' +
                '<h3>' + (card.title || '') + '</h3>' +
                '<p>' + inlineRichText(card.desc || card.description || '') + '</p>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getVirtualMachinePage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.vm-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
                heroImage: page.heroImage
            });

            if (page.heroTopBadge) document.querySelector('.vm-top-badge').textContent = page.heroTopBadge;
            if (page.heroStatusTitle) setText(document, '.vm-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.vm-bs', page.heroStatusSubtitle);

            // Pillars (4 cards)
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // VM Plans Table
            populateSectionHeader('#vm-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlansTable(page.vmPlans);

            // Features (12 cards)
            populateSectionHeader('#vm-features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#vm-features .vm-features-grid', page.features, 'cloud-power-card');

            // CTA Band 1 (inline — no dedicated ID)
            // The CTA band is static; update text only if provided
            var ctaBand1 = document.querySelector('.cloud-cta-band:not(.cloud-cta-dark)');
            if (ctaBand1 && page.ctaBand1) {
                var b1h2 = ctaBand1.querySelector('h2');
                var b1p = ctaBand1.querySelector('p');
                if (b1h2 && page.ctaBand1.title) b1h2.textContent = page.ctaBand1.title;
                if (b1p && page.ctaBand1.description) b1p.textContent = page.ctaBand1.description;
            }

            // Why Choose ICSDC (4 cards)
            populateSectionHeader('#vm-why', page.whyLabel, page.whyTitle, page.whySubtitle);
            populateIconCards('#vm-why .vm-why-grid', page.whyCards, 'cloud-power-card');

            // Block Storage section
            if (page.blockStorageTitle) setText(document, '.vm-bs-title', page.blockStorageTitle);
            if (page.blockStorageSubtitle) setText(document, '.vm-bs-subtitle', page.blockStorageSubtitle);
            if (page.blockStorageSubheading) setText(document, '.vm-bs-subheading', page.blockStorageSubheading);
            if (page.blockStorageDescription) setText(document, '.vm-bs-desc', page.blockStorageDescription);
            if (page.blockStorageCta) {
                var bsCta = document.querySelector('.vm-bs-cta');
                if (bsCta) {
                    if (page.blockStorageCta.text) bsCta.innerHTML = page.blockStorageCta.text + ' ';
                    if (page.blockStorageCta.link) bsCta.href = page.blockStorageCta.link;
                }
            }
            if (page.blockStorageImage && page.blockStorageImage.image) {
                var bsImg = document.getElementById('vm-bs-img');
                if (bsImg) {
                    var bsImgUrl = uploadURL(page.blockStorageImage.image);
                    if (bsImgUrl) bsImg.src = bsImgUrl;
                }
            }

            // Use Cases (8 cards)
            populateSectionHeader('#vm-usecases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
            populateIconCards('#vm-usecases .cloud-use-grid', page.useCases, 'cloud-power-card');

            // When to Choose (7 cards)
            populateSectionHeader('#vm-when', page.whenLabel, page.whenTitle, page.whenSubtitle);
            populateWhenCards(page.whenCards);

            // Comparison Table (VM vs Shared Hosting)
            populateSectionHeader('#vm-compare', null, page.compareTitle, page.compareSubtitle);
            populateCompareTable(page.compareRows);

            // Why Choose VMs Over Shared Hosting
            var whyOverTitleEl = document.getElementById('vm-whyover-title');
            if (whyOverTitleEl && page.whyOverTitle) whyOverTitleEl.textContent = page.whyOverTitle;
            var whyOverDescEl = document.getElementById('vm-whyover-desc');
            if (whyOverDescEl && page.whyOverDesc) whyOverDescEl.textContent = page.whyOverDesc;
            var whyOverLabelEl = document.getElementById('vm-whyover-points-label');
            if (whyOverLabelEl && page.whyOverPointsLabel) whyOverLabelEl.textContent = page.whyOverPointsLabel;
            if (page.whyOverPoints && page.whyOverPoints.length) {
                var whyOverList = document.getElementById('vm-whyover-points');
                if (whyOverList) {
                    whyOverList.innerHTML = page.whyOverPoints.map(function (pt) {
                        return '<li>' + pt + '</li>';
                    }).join('');
                }
            }
            if (page.whyOverImage && page.whyOverImage.image) {
                var whyOverImg = document.getElementById('vm-whyover-img');
                if (whyOverImg) {
                    var whyOverImgUrl = uploadURL(page.whyOverImage.image);
                    if (whyOverImgUrl) whyOverImg.src = whyOverImgUrl;
                }
            }

            // Testimonials
            if (page.testimonialTitle) setText(document, '#vm-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#vm-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            var ctaBand2 = document.querySelector('.cloud-cta-dark');
            if (ctaBand2 && page.ctaBand2) {
                var b2h2 = ctaBand2.querySelector('h2');
                var b2p = ctaBand2.querySelector('p');
                if (b2h2 && page.ctaBand2.title) b2h2.textContent = page.ctaBand2.title;
                if (b2p && page.ctaBand2.description) b2p.textContent = page.ctaBand2.description;
            }

        } catch (err) {
            console.error('[virtual-machine] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
