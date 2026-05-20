import { getZimbraHostingPage } from './services/contentService.js';
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

        var sorted = steps.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (step, i) {
            var arrow = i < sorted.length - 1 ? '<div class="zimbra-step-arrow">&#8250;</div>' : '';
            return '<div class="zimbra-step">' +
                '<div class="zimbra-step-num">' + (step.number || '') + '</div>' +
                '<h3>' + (step.title || '') + '</h3>' +
                '<p>' + (step.description || '') + '</p>' +
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

            var zimbraContent = row.zimbraStatus === 'neutral'
                ? '<strong>' + (row.zimbraValue || '') + '</strong>'
                : (row.zimbraValue || '');

            return '<tr>' +
                '<td>' + (row.feature || '') + '</td>' +
                '<td' + zimbraClass + '>' + zimbraContent + '</td>' +
                '<td' + m365Class + '>' + (row.m365Value || '') + '</td>' +
                '</tr>';
        }).join('');
    }

    function initZimbraFAQ(faqItems) {
        var container = document.getElementById('zimbra-faq-accordions');
        if (!container || !faqItems || !faqItems.length) return;

        var sorted = faqItems.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        var chev = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

        container.innerHTML = sorted.map(function (faq, i) {
            var num = String(i + 1).padStart(2, '0');
            return '<details class="faq-item"' + (i === 0 ? ' open' : '') + '>' +
                '<summary class="faq-q">' +
                '<span class="faq-num">' + num + '</span>' +
                '<span class="faq-q-text">' + (faq.question || '') + '</span>' +
                '<span class="faq-chev">' + chev + '</span>' +
                '</summary>' +
                '<div class="faq-a-wrap"><div class="faq-a">' + (faq.answer || '') + '</div></div>' +
                '</details>';
        }).join('');

        var items = container.querySelectorAll('.faq-item');
        items.forEach(function (item) {
            item.addEventListener('toggle', function () {
                if (item.open) {
                    items.forEach(function (o) { if (o !== item) o.open = false; });
                }
            });
        });
    }

    function populateFaqContact(page) {
        var card = document.querySelector('.faq-contact-card');
        if (!card) return;

        if (page.faqContactTitle) setHTML(card, '.faq-contact-title', page.faqContactTitle);
        if (page.faqContactDescription) setHTML(card, '.faq-contact-desc', page.faqContactDescription);

        if (page.faqContactBtnLabel) {
            var btn = card.querySelector('.faq-contact-btn');
            if (btn) {
                var svg = btn.querySelector('svg');
                btn.textContent = page.faqContactBtnLabel + ' ';
                if (svg) btn.appendChild(svg);
                if (page.faqContactBtnUrl) btn.setAttribute('href', page.faqContactBtnUrl);
            }
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

            populateSectionHeader('#features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateFeatureBadges(page.featureBadges);

            populateSectionHeader('#why-us', page.whyLabel, page.whyTitle, page.whySubtitle);
            populateIconCards('#why-us .cloud-power-grid', page.whyCards, 'cloud-power-card');

            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            populateSectionHeader('#migration', page.migrationLabel, page.migrationTitle, page.migrationSubtitle);
            populateMigrationSteps(page.migrationSteps);

            populateSectionHeader('#comparison', page.comparisonLabel, page.comparisonTitle, page.comparisonSubtitle);
            populateComparison(page.comparisonColumns, page.comparisonRows);

            if (page.testimonialTitle) setText(document, '#winvps-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            if (page.faqTitle) setText(document, '#winvps-faq-heading', page.faqTitle);
            initFAQ(page.faq);


            populateFaqContact(page);

            populateCtaBand('.cloud-cta-dark', page.ctaBand2);
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
