// ══════════════════════════════════════════════════════════
//  vapt.js — ICSDC VAPT Security Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getVaptPage } from './services/contentService.js';
import { inlineRichText } from './utils/cms-helpers.js';
import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    populatePricingPlans,
    hidePageLoader,
    markActiveNavLink,
    setText,
    setHTML,
    initFAQ,
    initTestimonials,
    initHeroContactForm
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
                '<p>' + inlineRichText(step.description || step.desc || '') + '</p>' +
                '</div>';
        }).join('');
    }

    /**
     * Render the "When Should You Choose VAPT?" numbered points.
     * whenPoints is ds.numbered-tip[] — the full sentence lives in `title`
     * (description optional). Renders number badge + sentence.
     */
    function populateWhenPoints(points) {
        if (!points || !points.length) return;
        var grid = document.getElementById('vapt-when-grid');
        if (!grid) return;

        var sorted = points.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (p, idx) {
            var num = p.number || (idx + 1);
            var text = p.description || p.title || '';
            return '<div class="vapt-when-card">' +
                '<div class="vapt-when-num">' + num + '</div>' +
                '<p>' + text + '</p>' +
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
                ctaSecondary: page.heroCtaSecondary,
                heroImage: page.heroImage,
                heroFormEnabled: page.heroFormEnabled
            });
            if (page.heroFormEnabled) initHeroContactForm('hf-form', 'hf-success');

            if (page.heroTopBadge) setHTML(document, '.vapt-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.vapt-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.vapt-bs', page.heroStatusSubtitle);

            // Pillars (4 cards)
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Pricing
            populateSectionHeader('#vapt-pricing', page.pricingLabel, page.pricingTitle, page.pricingDesc);
            populatePricingPlans('#vapt-pricing-grid', page.pricingPlans);

            // Why ICSDC VAPT (8 cards)
            populateSectionHeader('#vapt-why', page.whyLabel, page.whyTitle, page.whySubtitle);
            populateIconCards('#vapt-why-grid', page.whyCards, 'cloud-power-card');

            // What VAPT Means (narrative section)
            if (page.whatTitle) setText(document, '#vapt-what-title', page.whatTitle);
            if (page.whatDesc) setText(document, '#vapt-what-description', page.whatDesc);
            if (page.whatLayers && page.whatLayers.length) {
                var layersEl = document.getElementById('vapt-what-layers');
                if (layersEl) {
                    layersEl.innerHTML = page.whatLayers.map(function (l, idx) {
                        return '<div class="vapt-what-layer">' +
                            '<div class="vapt-what-layer-num">' + (l.number || idx + 1) + '</div>' +
                            '<p>' + (l.text || '') + '</p>' +
                            '</div>';
                    }).join('');
                }
            }
            if (page.whatClosing) {
                var closingEl = document.getElementById('vapt-what-closing');
                if (closingEl) closingEl.innerHTML = '<em>' + page.whatClosing + '</em>';
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
            populateSectionHeader('#vapt-process', page.processLabel, page.processTitle, page.processSubtitle);
            populateSteps(page.steps);

            // When to Choose VAPT
            populateSectionHeader('#vapt-when', page.whenLabel, page.whenTitle, page.whenSubtitle);
            populateWhenPoints(page.whenPoints);
            if (page.whenClosing) setText(document, '#vapt-when-closing', page.whenClosing);

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
