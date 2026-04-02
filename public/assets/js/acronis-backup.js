/**
 * acronis-backup.js
 * ─────────────────
 * CMS-driven version: fetches all page content from Strapi
 * and populates DOM sections dynamically.
 *
 * Sections handled:
 *   1.  SEO meta tags
 *   2.  Hero (eyebrow + shield visual + stat cards + status badge)
 *   3.  4 Pillars (icon cards)
 *   4.  Pricing (section header + placeholder message + CTA)
 *   5.  Features (section header + 12 icon cards)
 *   6.  CTA Band #1
 *   7.  Why Choose ICSDC (section header + 6 icon cards)
 *   8.  Testimonials
 *   9.  FAQ
 *   10. CTA Band #2
 */

import { getAcronisBackupPage } from './services/contentService.js';

import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    populateTldCards,
    populateStats,
    hidePageLoader,
    markActiveNavLink,
    setText,
    setHTML,
    initFAQ,
    initTestimonials
} from './utils/cms-helpers.js';

(function () {
    'use strict';

    /* ─────────────────────────────────────────────────────────
       LOCAL HELPERS
    ───────────────────────────────────────────────────────── */

    function getInitials(name) {
        if (!name) return '';
        return name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase().slice(0, 2);
    }

    function starSVG() {
        return '<svg class="testi-star" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
            '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>' +
            '</svg>';
    }

    /* ─────────────────────────────────────────────────────────
       SECTION POPULATORS
    ───────────────────────────────────────────────────────── */

    /** 2. Hero Section */
    function populateAcrHero(page) {
        var section = document.querySelector('.hero-section');
        if (!section) return;

        // Eyebrow
        if (page.heroEyebrow) {
            var eyebrow = section.querySelector('.acr-eyebrow');
            if (eyebrow) {
                var dot = eyebrow.querySelector('.acr-eyebrow-dot');
                eyebrow.textContent = '';
                if (dot) eyebrow.appendChild(dot);
                eyebrow.appendChild(document.createTextNode(' ' + page.heroEyebrow));
            }
        }

        if (page.heroTitle) setText(section, '.hero-title', page.heroTitle);
        if (page.heroSubtitle) setText(section, '.hero-sub', page.heroSubtitle);
        if (page.heroDescription) setHTML(section, '.hero-desc', page.heroDescription);

        // CTA Buttons
        var btns = section.querySelectorAll('.hero-btns button');
        if (btns.length >= 1 && page.heroCtaPrimary) {
            btns[0].innerHTML = page.heroCtaPrimary.text;
            if (page.heroCtaPrimary.link) btns[0].setAttribute('onclick', "window.location.href='" + page.heroCtaPrimary.link + "'");
        }
        if (btns.length >= 2 && page.heroCtaSecondary) {
            btns[1].textContent = page.heroCtaSecondary.text;
            if (page.heroCtaSecondary.link) btns[1].setAttribute('onclick', "window.location.href='" + page.heroCtaSecondary.link + "'");
        }

        // Hero stat cards
        if (page.heroStats && page.heroStats.length) {
            var stat1 = section.querySelector('.acr-stat-1');
            var stat2 = section.querySelector('.acr-stat-2');
            if (stat1 && page.heroStats[0]) {
                setText(stat1, '.acr-stat-val', page.heroStats[0].value);
                setText(stat1, '.acr-stat-label', page.heroStats[0].label);
            }
            if (stat2 && page.heroStats[1]) {
                setText(stat2, '.acr-stat-val', page.heroStats[1].value);
                setText(stat2, '.acr-stat-label', page.heroStats[1].label);
            }
        }
    }

    /** 3. Pillars (4 icon cards in .why-us .why-grid) */
    function populatePillars(pillars) {
        if (!pillars || !pillars.length) return;
        populateIconCards('.why-us .why-grid', pillars, 'why-card');
    }

    /** 4. Pricing Section (header + placeholder message + CTA) */
    function populatePricing(page) {
        populateSectionHeader('#acr-pricing', page.pricingLabel, page.pricingTitle, page.pricingSubtitle);

        // Pricing placeholder message
        if (page.pricingMessage) {
            var placeholder = document.querySelector('#acr-pricing .acr-pricing-placeholder');
            if (placeholder) {
                var msgP = placeholder.querySelector('p');
                if (msgP) msgP.textContent = page.pricingMessage;
            }
        }

        // Pricing CTA buttons
        var pricingBtns = document.querySelectorAll('#acr-pricing .hero-btns button');
        if (pricingBtns.length >= 1 && page.pricingCtaPrimary) {
            pricingBtns[0].innerHTML = page.pricingCtaPrimary.text;
            if (page.pricingCtaPrimary.link) pricingBtns[0].setAttribute('onclick', "window.location.href='" + page.pricingCtaPrimary.link + "'");
        }
        if (pricingBtns.length >= 2 && page.pricingCtaSecondary) {
            pricingBtns[1].textContent = page.pricingCtaSecondary.text;
            if (page.pricingCtaSecondary.link) pricingBtns[1].setAttribute('onclick', "window.location.href='" + page.pricingCtaSecondary.link + "'");
        }
    }

    /** 5. Features (12 icon cards in #acr-features .cloud-power-grid) */
    function populateFeatures(label, title, subtitle, features) {
        populateSectionHeader('#acr-features', label, title, subtitle);
        if (features && features.length) {
            populateIconCards('#acr-features .cloud-power-grid', features, 'cloud-power-card');
        }
    }

    /** 7. Why Choose ICSDC (6 icon cards in #acr-why .cloud-use-grid) */
    function populateWhyCards(label, title, subtitle, cards) {
        populateSectionHeader('#acr-why', label, title, subtitle);
        if (cards && cards.length) {
            populateIconCards('#acr-why .cloud-use-grid', cards, 'cloud-use-card');
        }
    }


    /* ─────────────────────────────────────────────────────────
       BOOT -- Fetch from CMS, then populate all sections
    ───────────────────────────────────────────────────────── */
    async function init() {
        markActiveNavLink();

        try {
            var response = await getAcronisBackupPage();
            var page = response.data;

            // 1. SEO
            populateSEO(page.seo);

            // 2. Hero
            populateAcrHero(page);

            // 3. Pillars
            populatePillars(page.pillars);

            // 4. Pricing
            populatePricing(page);

            // 5. Features
            populateFeatures(page.featuresLabel, page.featuresTitle, page.featuresSubtitle, page.features);

            // 6. CTA Band #1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // 7. Why Choose ICSDC
            populateWhyCards(page.whyLabel, page.whyTitle, page.whySubtitle, page.whyCards);

            // 8. Testimonials


            if (page.testimonials && page.testimonials.length) {
                initTestimonials(page.testimonials)
            } else {
                //hide the entire section if no testimonials            
                var testiSection = document.getElementsByClassName('testi-section');
                if (testiSection) {
                    testiSection.style.display = 'none';
                }
            }


            // 9. FAQ
            if (page.faqTitle) {
                setText(document, '#acr-faq-heading', page.faqTitle);
            }
            initFAQ(page.faq);

            // 10. CTA Band #2
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[acronis-backup] Failed to load CMS data:', err);
        }

        // Always hide loader after content attempt
        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
