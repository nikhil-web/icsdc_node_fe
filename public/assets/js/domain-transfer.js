// ══════════════════════════════════════════════════════════
//  domain-transfer.js — ICSDC Domain Transfer Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getDomainTransferPage } from './services/contentService.js';
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

    /** Populate the numbered tips grid */
    function populateTipsGrid(tips) {
        if (!tips || !tips.length) return;
        var grid = document.querySelector('.dt-tips-grid');
        if (!grid) return;
        var sorted = tips.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (tip, i) {
            return '<div class="dt-tip-card">' +
                '<div class="dt-tip-num">' + (tip.number || (i + 1)) + '</div>' +
                '<h3>' + (tip.title || '') + '</h3>' +
                '<p>' + (tip.description || '') + '</p>' +
                '</div>';
        }).join('');
    }

    /** Populate highlight duo (Privacy + Transfer Existing) */
    function populateHighlightCards(cards) {
        if (!cards || !cards.length) return;
        var grid = document.querySelector('.dt-highlight-grid');
        if (!grid) return;
        var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (card) {
            return '<div class="dt-highlight-card" data-animate="fade-up">' +
                '<div class="dt-highlight-icon">' + (card.icon || '') + '</div>' +
                '<h3>' + (card.title || '') + '</h3>' +
                '<p>' + (card.description || '') + '</p>' +
                '</div>';
        }).join('');
    }

    /** Populate related services cards */
    function populateRelatedCards(cards) {
        if (!cards || !cards.length) return;
        var grid = document.querySelector('.dt-related-grid');
        if (!grid) return;
        var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (card) {
            return '<div class="dt-related-card" data-animate="fade-up">' +
                '<h3>' + (card.title || '') + '</h3>' +
                '<p>' + (card.description || '') + '</p>' +
                '<a href="' + (card.btnUrl || '#') + '" class="dt-related-btn">' + (card.btnLabel || 'Learn More') + ' &rarr;</a>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getDomainTransferPage();
            var page = response.data;

            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.dt-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) setHTML(document, '.dt-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.dt-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.dt-bs', page.heroStatusSubtitle);

            // 4 Pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Benefits / Why Transfer
            populateSectionHeader('#why-transfer', page.benefitsLabel, page.benefitsTitle, page.benefitsSubtitle);
            populateIconCards('#why-transfer .cloud-power-grid', page.benefits, 'cloud-power-card');

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // Why Register
            populateSectionHeader('#why-register', page.whyRegisterLabel, page.whyRegisterTitle, page.whyRegisterSubtitle);
            populateIconCards('#why-register .cloud-use-grid', page.whyRegisterCards, 'cloud-use-card');

            // Privacy + Transfer highlight cards
            populateHighlightCards(page.highlightCards);

            // Smart Tips
            populateSectionHeader('#tips', page.tipsLabel, page.tipsTitle, page.tipsSubtitle);
            populateTipsGrid(page.tips);

            // Why Switch
            populateSectionHeader('#why-switch', page.whySwitchLabel, page.whySwitchTitle, page.whySwitchSubtitle);
            populateIconCards('#why-switch .cloud-power-grid', page.whySwitchCards, 'cloud-power-card');

            // Related Services
            populateSectionHeader('.dt-related-section', page.relatedLabel, page.relatedTitle, null);
            populateRelatedCards(page.relatedCards);

            // What You Get
            populateSectionHeader('#what-you-get', page.whatYouGetLabel, page.whatYouGetTitle, page.whatYouGetSubtitle);
            populateIconCards('#what-you-get .cloud-use-grid', page.whatYouGetCards, 'cloud-use-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#dt-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // FAQ Contact Card
            if (page.faqContactTitle) setHTML(document, '.faq-contact-title', page.faqContactTitle);
            if (page.faqContactDesc) setHTML(document, '.faq-contact-desc', page.faqContactDesc);

            // Final CTA
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[domain-transfer] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
