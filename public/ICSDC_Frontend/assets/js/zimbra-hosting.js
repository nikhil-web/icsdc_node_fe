import { getZimbraHostingPage } from './services/contentService.js';
import { inlineRichText } from './utils/cms-helpers.js';
import { uploadURL } from './services/strapiClient.js';
import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    populatePricingPlansCloud,
    hidePageLoader,
    markActiveNavLink,
    setText,
    setHTML,
    initFAQ,
    initTestimonials
} from './utils/cms-helpers.js';

(function () {
    'use strict';

    function populateFeatureBadges(badges) {
        if (!badges || !badges.length) return;
        var grid = document.querySelector('#features .zimbra-features-grid');
        if (!grid) return;

        var sorted = badges.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (badge) {
            return '<div class="zimbra-feat-badge">' + badge.text + '</div>';
        }).join('');
    }

    function populateMigrationSteps(steps) {
        if (!steps || !steps.length) return;
        var grid = document.querySelector('#migration .zimbra-steps');
        if (!grid) return;

        var COLS = 3;

        var sorted = steps.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        var n = sorted.length;

        grid.classList.add('zimbra-flow');
        grid.innerHTML = sorted.map(function (step, i) {
            var row = Math.floor(i / COLS);
            var posInRow = i % COLS;
            var ltr = (row % 2 === 0);
            var col = ltr ? (posInRow + 1) : (COLS - posInRow);

            var dir = '';
            if (i < n - 1) {
                dir = (posInRow < COLS - 1) ? (ltr ? 'right' : 'left') : 'down';
            }
            var arrow = dir
                ? '<span class="zimbra-flow-arrow zimbra-flow-arrow--' + dir + '"></span>'
                : '';

            return '<div class="zimbra-step zimbra-flow-step" style="grid-column:' + col + ';grid-row:' + (row + 1) + ';">' +
                '<div class="zimbra-step-num">' + (step.number || (i + 1)) + '</div>' +
                '<h3>' + (step.title || '') + '</h3>' +
                '<p>' + inlineRichText(step.description || '') + '</p>' +
                arrow +
                '</div>';
        }).join('');
    }


    function populateComparison(columns, rows) {
        var section = document.getElementById('comparison');
        if (!section) return;

        if (columns && columns.length) {
            var ths = section.querySelectorAll('.zimbra-compare thead th');
            columns.forEach(function (col, i) {
                if (ths[i]) ths[i].textContent = col;
            });
        }

        if (!rows || !rows.length) return;
        var tbody = section.querySelector('.zimbra-compare tbody');
        if (!tbody) return;

        var sorted = rows.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        tbody.innerHTML = sorted.map(function (row) {
            var zimbraClass = row.zimbraStatus === 'check' ? ' class="zimbra-check"'
                : row.zimbraStatus === 'cross' ? ' class="zimbra-cross"' : '';
            var m365Class = row.m365Status === 'check' ? ' class="zimbra-check"'
                : row.m365Status === 'cross' ? ' class="zimbra-cross"' : '';

            var zimbraContent = (row.zimbraValue || '');

            return '<tr>' +
                '<td>' + (row.feature || '') + '</td>' +
                '<td' + zimbraClass + '>' + zimbraContent + '</td>' +
                '<td' + m365Class + '>' + (row.m365Value || '') + '</td>' +
                '</tr>';
        }).join('');
    }

    function populateAboutPoints(points) {
        if (!points || !points.length) return;
        var list = document.getElementById('zim-about-points');
        if (!list) return;
        list.innerHTML = points.map(function (p) {
            return '<li>' + (typeof p === 'string' ? p : (p.text || p.label || '')) + '</li>';
        }).join('');
    }

    function setSectionImage(imgId, imageComp) {
        if (!imageComp || !imageComp.image) return;
        var el = document.getElementById(imgId);
        if (!el) return;
        var url = uploadURL(imageComp.image);
        if (url) el.src = url;
    }

    function populateCompareButtons(primary, secondary) {
        if (primary && primary.text) {
            var p = document.querySelector('#zim-compare-btns .zim-compare-btn-primary');
            if (p) { p.textContent = primary.text; if (primary.link) p.setAttribute('href', primary.link); }
        }
        if (secondary && secondary.text) {
            var s = document.querySelector('#zim-compare-btns .zim-compare-btn-outline');
            if (s) { s.textContent = secondary.text; if (secondary.link) s.setAttribute('href', secondary.link); }
        }
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getZimbraHostingPage();
            var page = response.data;

            populateSEO(page.seo);

            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.zimbra-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
                heroImage: page.heroImage
            });

            if (page.heroTopBadge) setHTML(document, '.zimbra-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.zimbra-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.zimbra-bs', page.heroStatusSubtitle);

            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Plans
            populateSectionHeader('#zim-plans', null, page.plansTitle, page.plansSubtitle);
            populatePricingPlansCloud('#zim-plans-grid', page.plans);

            // Who We Are
            if (page.aboutTitle) setText(document, '#zim-about-title', page.aboutTitle);
            if (page.aboutDesc) setHTML(document, '#zim-about-desc', page.aboutDesc);
            populateAboutPoints(page.aboutPoints);
            setSectionImage('zim-about-img', page.aboutImage);

            populateSectionHeader('#features', null, page.featuresTitle, null);
            populateFeatureBadges(page.featureBadges);

            populateSectionHeader('#why-us', null, page.whyTitle, page.whySubtitle);
            populateIconCards('#why-us .cloud-power-grid', page.whyCards, 'cloud-power-card');

            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // Primary Collaborative Features
            populateSectionHeader('#zim-collab', null, page.collabTitle, page.collabSubtitle);
            populateIconCards('#zim-collab-grid', page.collabCards, 'cloud-power-card');

            populateSectionHeader('#migration', null, page.migrationTitle, page.migrationSubtitle);
            populateMigrationSteps(page.migrationSteps);

            populateSectionHeader('#comparison', null, page.comparisonTitle, page.comparisonSubtitle);
            populateComparison(page.comparisonColumns, page.comparisonRows);
            populateCompareButtons(page.comparisonCtaPrimary, page.comparisonCtaSecondary);

            // Why Choose Zimbra for Your Email Hosting
            populateSectionHeader('#zim-whychoose', null, page.whyZimbraTitle, page.whyZimbraSubtitle);
            populateIconCards('#zim-whychoose-grid', page.whyZimbraCards, 'cloud-power-card');

            if (page.testimonialTitle) setText(document, '#testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            if (page.faqTitle) setText(document, '#zim-faq-heading', page.faqTitle);
            initFAQ(page.faq);
        } catch (err) {
            console.error('[zimbra-hosting] Failed to load CMS data:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
