// ══════════════════════════════════════════════════════════
//  about-us.js — ICSDC About Us Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getAboutUsPage } from './services/contentService.js';
import {
    populateSEO,
    populateCtaBand,
    hidePageLoader,
    markActiveNavLink,
    setText,
    ICONS
} from './utils/cms-helpers.js';

(function () {
    'use strict';

    /**
     * Render specialization cards into the specs grid.
     * Uses au-spec-card pattern with icon + title + description.
     */
    function populateSpecCards(cards) {
        if (!cards || !cards.length) return;
        var grid = document.getElementById('au-specs-grid');
        if (!grid) return;

        var iconKeys = ['server', 'cloud', 'refresh', 'shield'];

        grid.innerHTML = cards.map(function (card, idx) {
            var iconKey = card.icon || iconKeys[idx % iconKeys.length] || 'server';
            var iconSVG = ICONS[iconKey] || ICONS['server'];
            return '<div class="au-spec-card">' +
                '<div class="au-spec-icon" aria-hidden="true">' + iconSVG + '</div>' +
                '<h3>' + (card.title || '') + '</h3>' +
                '<p>' + (card.desc || card.description || '') + '</p>' +
                '</div>';
        }).join('');
    }

    /**
     * Render What We Do cards — numbered badge + title + description.
     */
    function populateWhatWeDoCards(cards) {
        if (!cards || !cards.length) return;
        var grid = document.getElementById('au-what-grid');
        if (!grid) return;

        grid.innerHTML = cards.map(function (card, idx) {
            var num = String(idx + 1).padStart(2, '0');
            return '<div class="au-what-card">' +
                '<div class="au-what-number">' + num + '</div>' +
                '<div class="au-what-body">' +
                '<h3>' + (card.title || '') + '</h3>' +
                '<p>' + (card.desc || card.description || '') + '</p>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    /**
     * Render "How We Started" items — array of strings → <li> elements.
     */
    function populateStartedList(items) {
        if (!items || !items.length) return;
        var list = document.getElementById('au-started-list');
        if (!list) return;
        list.innerHTML = items.map(function (item) {
            return '<li>' + item + '</li>';
        }).join('');
    }

    /**
     * Render "Where We Operate" — array of country strings → flag chips.
     */
    function populateOperateList(items) {
        if (!items || !items.length) return;
        var container = document.getElementById('au-operate-list');
        if (!container) return;
        container.innerHTML = items.map(function (country) {
            return '<span class="au-flag-chip">' + country + '</span>';
        }).join('');
    }

    /**
     * Render data centers — array of {name, partner} → <li> elements.
     */
    function populateDataCenters(items) {
        if (!items || !items.length) return;
        var list = document.getElementById('au-dc-list');
        if (!list) return;
        list.innerHTML = items.map(function (dc) {
            return '<li><strong>' + (dc.name || '') + '</strong> &mdash; ' + (dc.partner || '') + '</li>';
        }).join('');
    }

    // ── Partners logo grid (ds.partner-logo[]) ────────────────
    function populatePartners(partners) {
        if (!partners || !partners.length) return;
        var grid = document.getElementById('au-partners-grid');
        if (!grid) return;
        var strapiBase = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : 'http://13.126.9.248:1337');
        grid.innerHTML = partners.map(function (p) {
            var logoObj = p.logo;
            var logoUrl = null;
            if (logoObj) {
                var raw = logoObj.url || (logoObj.formats && (logoObj.formats.small || logoObj.formats.medium || Object.values(logoObj.formats)[0]) && ((logoObj.formats.small || logoObj.formats.medium || Object.values(logoObj.formats)[0]).url));
                if (raw) logoUrl = raw.startsWith('http') ? raw : strapiBase + raw;
            }
            var name = p.name || '';
            return '<div class="au-partner-box">' +
                (logoUrl
                    ? '<img class="au-partner-img" src="' + logoUrl + '" alt="' + name + '" loading="lazy">'
                    : '<span class="au-partner-name">' + name + '</span>') +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getAboutUsPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // ── Hero ──────────────────────────────────────────
            if (page.heroTitle)       setText(document, '#au-hero-title', page.heroTitle);
            if (page.heroSubtitle)    setText(document, '#au-hero-sub', page.heroSubtitle);
            if (page.heroDescription) setText(document, '#au-hero-desc', page.heroDescription);

            // ── Stats ─────────────────────────────────────────
            if (page.foundedYear)      setText(document, '#au-stat-founded', page.foundedYear);
            if (page.countriesCount)   setText(document, '#au-stat-countries', page.countriesCount);
            if (page.dataCentersCount) setText(document, '#au-stat-datacenters', page.dataCentersCount);
            if (page.servicesCount)    setText(document, '#au-stat-services', page.servicesCount);

            // ── Specializations ───────────────────────────────
            if (page.specializationsTitle) setText(document, '#au-specs-title', page.specializationsTitle);
            if (page.specializationsCards) populateSpecCards(page.specializationsCards);

            // ── Who We Are ────────────────────────────────────
            if (page.whoWeAreTitle)       setText(document, '#au-who-title', page.whoWeAreTitle);
            if (page.whoWeAreDescription) setText(document, '#au-who-desc', page.whoWeAreDescription);

            // ── What We Do ────────────────────────────────────
            if (page.whatWeDoTitle) setText(document, '#au-what-title', page.whatWeDoTitle);
            if (page.whatWeDoCards) populateWhatWeDoCards(page.whatWeDoCards);

            // ── Vision + Mission ──────────────────────────────
            if (page.visionTitle) setText(document, '#au-vision-title', page.visionTitle);
            if (page.visionText)  setText(document, '#au-vision-text', page.visionText);
            if (page.missionTitle) setText(document, '#au-mission-title', page.missionTitle);
            if (page.missionText)  setText(document, '#au-mission-text', page.missionText);

            // ── Why Choose Us ─────────────────────────────────
            if (page.whyChooseTitle)       setText(document, '#au-why-title', page.whyChooseTitle);
            if (page.whyChooseDescription) setText(document, '#au-why-desc', page.whyChooseDescription);

            // ── Journey ───────────────────────────────────────
            if (page.journeyTitle)  setText(document, '#au-journey-title', page.journeyTitle);
            if (page.howStartedTitle) setText(document, '#au-started-heading', page.howStartedTitle);
            if (page.howStartedItems) populateStartedList(page.howStartedItems);

            if (page.whereWeOperateTitle) setText(document, '#au-operate-heading', page.whereWeOperateTitle);
            if (page.whereWeOperateItems) populateOperateList(page.whereWeOperateItems);

            if (page.dataCentersTitle) setText(document, '#au-dc-heading', page.dataCentersTitle);
            if (page.dataCentersItems) populateDataCenters(page.dataCentersItems);

            // ── Life @ ICSDC ──────────────────────────────────
            if (page.lifeTitle)       setText(document, '#au-life-title', page.lifeTitle);
            if (page.lifeDescription) setText(document, '#au-life-desc', page.lifeDescription);

            // ── Partners ──────────────────────────────────────
            if (page.partnersTitle) setText(document, '#au-partners-title', page.partnersTitle);
            if (page.partnersCards && page.partnersCards.length) populatePartners(page.partnersCards);

            // ── CTA Band ──────────────────────────────────────
            populateCtaBand('#au-cta', page.ctaBand);

        } catch (err) {
            console.error('[about-us] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
