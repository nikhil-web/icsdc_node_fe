// ══════════════════════════════════════════════════════════
//  vapt.js — ICSDC VAPT Security Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getVaptPage } from './services/contentService.js';
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
     * Render the 6 numbered VAPT process steps.
     * steps is ds.numbered-tip[] — uses 'description' (not 'desc').
     */
    function populateSteps(steps) {
        if (!steps || !steps.length) return;
        var grid = document.getElementById('vapt-steps-grid');
        if (!grid) return;

        var sorted = steps.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (step, idx) {
            var num = step.order || (idx + 1);
            return '<div class="vapt-step-card">' +
                '<div class="vapt-step-num">' + num + '</div>' +
                '<h3>' + (step.title || '') + '</h3>' +
                '<p>' + (step.description || step.desc || '') + '</p>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getVaptPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.vapt-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) setHTML(document, '.vapt-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.vapt-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.vapt-bs', page.heroStatusSubtitle);

            // Pillars (4 cards)
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Why ICSDC VAPT (8 cards)
            populateSectionHeader('#vapt-why', page.whyLabel, page.whyTitle, page.whySubtitle);
            populateIconCards('#vapt-why-grid', page.whyCards, 'cloud-power-card');

            // What VAPT Means (narrative section)
            if (page.whatLabel) {
                var whatLabel = document.querySelector('#vapt-what .vapt-label-light');
                if (whatLabel) whatLabel.textContent = page.whatLabel;
            }
            if (page.whatTitle) {
                var whatTitle = document.querySelector('#vapt-what .title');
                if (whatTitle) whatTitle.textContent = page.whatTitle;
            }
            if (page.whatDescription) {
                var whatDesc = document.getElementById('vapt-what-description');
                if (whatDesc) whatDesc.innerHTML = page.whatDescription.replace(/\n\n/g, '</p><p>');
            }

            // Why Choose ICSDC (7 cards)
            populateSectionHeader('#vapt-why-choose', page.whyChooseLabel, page.whyChooseTitle, page.whyChooseSubtitle);
            populateIconCards('#vapt-why-choose-grid', page.whyChooseCards, 'cloud-power-card');

            // CTA Band 1
            populateCtaBand('#vapt-cta1', page.ctaBand1);

            // VAPT Offerings (6 cards)
            populateSectionHeader('#vapt-offerings', page.offeringsLabel, page.offeringsTitle, page.offeringsSubtitle);
            populateIconCards('#vapt-offerings-grid', page.offeringsCards, 'cloud-power-card');

            // VAPT Process (6 steps)
            populateSectionHeader('#vapt-process', page.processLabel, page.processTitle, null);
            populateSteps(page.processSteps);

            // Testimonials
            if (page.testimonialTitle) setText(document, '#vapt-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#vapt-faq-heading', page.faqTitle);
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
            populateCtaBand('#vapt-cta2', page.ctaBand2);

        } catch (err) {
            console.error('[vapt] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
