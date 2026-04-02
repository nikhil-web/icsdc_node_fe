// ══════════════════════════════════════════════════════════
//  bare-metal-server.js — ICSDC Bare Metal Server Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getBareMetalServerPage } from './services/contentService.js';
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
     * Render the server configurations table from Strapi data.
     * Each config uses ds.icon-card: title = config name, desc = spec string.
     * Falls back to static HTML if no data.
     */
    function populateConfigsTable(serverConfigs) {
        if (!serverConfigs || !serverConfigs.length) return;
        var tbody = document.getElementById('bms-config-tbody');
        if (!tbody) return;

        tbody.innerHTML = serverConfigs.map(function (config) {
            // Parse spec string: "CPU · Cores · RAM · Storage · BW · Speed"
            var name = config.title || '';
            var desc = config.desc || '';
            // Split on middle-dot or bullet separator
            var parts = desc.split(/\s*[·•]\s*/);
            var cpu = parts[0] || '';
            var cores = parts[1] || '';
            var ram = parts[2] || '';
            var storage = parts[3] || '';
            var bw = parts[4] || '';
            var speed = parts[5] || '';

            return '<tr>' +
                '<td class="bms-config-name">' + name + '</td>' +
                '<td>' + cpu + '</td>' +
                '<td>' + cores + '</td>' +
                '<td>' + ram + '</td>' +
                '<td>' + storage + '</td>' +
                '<td>' + bw + '</td>' +
                '<td>' + speed + '</td>' +
                '<td><a href="/contact" class="bms-config-quote-btn">Get a Quote</a></td>' +
                '</tr>';
        }).join('');
    }

    /**
     * Render the managed vs self-managed comparison table from Strapi data.
     * Each feature uses ds.icon-card: title = feature name, desc = "self" | "managed" | "both".
     * Falls back to static HTML if no data.
     */
    function populateCompareTable(managedFeatures) {
        if (!managedFeatures || !managedFeatures.length) return;
        var tbody = document.getElementById('bms-compare-tbody');
        if (!tbody) return;

        tbody.innerHTML = managedFeatures.map(function (feature) {
            var name = feature.title || '';
            var availability = (feature.desc || '').toLowerCase().trim();
            var isBoth = availability === 'both';
            var rowClass = isBoth ? ' class="bms-both-row"' : '';

            var selfCell, managedCell;
            if (availability === 'self') {
                selfCell = '<td class="bms-yes">&#10004;</td>';
                managedCell = '<td class="bms-no">&#10006;</td>';
            } else if (availability === 'managed') {
                selfCell = '<td class="bms-no">&#10006;</td>';
                managedCell = '<td class="bms-yes">&#10004;</td>';
            } else {
                // both
                selfCell = '<td class="bms-yes">&#10004;</td>';
                managedCell = '<td class="bms-yes">&#10004;</td>';
            }

            return '<tr' + rowClass + '>' +
                '<td>' + name + '</td>' +
                selfCell +
                managedCell +
                '</tr>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getBareMetalServerPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.bms-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) setHTML(document, '.bms-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.bms-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.bms-bs', page.heroStatusSubtitle);

            // Pillars — 4 cards
            populateIconCards('#bms-pillars-grid', page.pillars, 'why-card');

            // Server Configs Table
            populateSectionHeader('#bms-configs', page.configsLabel, page.configsTitle, page.configsSubtitle);
            populateConfigsTable(page.serverConfigs);

            // Managed vs Self comparison
            if (page.compareTitle) setText(document, '#bms-compare-title', page.compareTitle);
            populateCompareTable(page.managedFeatures);

            // CTA Band 1
            populateCtaBand('#bms-cta-band1', page.ctaBand1);

            // Why Choose (7 cards)
            populateSectionHeader('#bms-why', page.whyLabel, page.whyTitle, page.whySubtitle);
            populateIconCards('#bms-why-grid', page.whyCards, 'cloud-power-card');

            // Who It's For (8 cards)
            populateSectionHeader('#bms-who', page.whoLabel, page.whoTitle, page.whoSubtitle);
            populateIconCards('#bms-who-grid', page.whoCards, 'cloud-power-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#bms-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#bms-faq-heading', page.faqTitle);
            if (page.faqContactTitle) setText(document, '#bms-faq-contact-title', page.faqContactTitle);
            if (page.faqContactDesc) setHTML(document, '#bms-faq-contact-desc', page.faqContactDesc.replace(/\n/g, '<br>'));
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('#bms-cta-band2', page.ctaBand2);

        } catch (err) {
            console.error('[bare-metal-server] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
