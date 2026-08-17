/**
 * acronis-backup.js
 * ─────────────────
 * CMS-driven version: fetches all page content from Strapi
 * and populates DOM sections dynamically.
 *
 * Sections handled:
 *   1.  SEO meta tags
 *   2.  Hero (title/sub/description + CTAs + image)
 *   3.  4 Pillars (icon cards)
 *   4.  Pricing (section header + plan cards)
 *   5.  Who We Are (title, description, points, feature blocks)
 *   6.  Features (section header + 12 icon cards)
 *   7.  CTA Band #1
 *   8.  Why Choose ICSDC (section header + icon cards + image)
 *   9.  Testimonials
 *   10. FAQ
 *   11. CTA Band #2
 *
 * Section eyebrows/labels are deliberately NOT CMS-driven on this page — the
 * source document defines none and the house preference is to omit them, so
 * heroEyebrow/pricingLabel/featuresLabel/whyLabel were dropped from the schema.
 */

import { wireCtaLink } from './utils/cms-helpers.js';
import { getAcronisBackupPage } from './services/contentService.js';

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

    /* ─────────────────────────────────────────────────────────
       SECTION POPULATORS
    ───────────────────────────────────────────────────────── */

    /** 2. Hero Section */
    function populateAcrHero(page) {
        var section = document.querySelector('.hero-section');
        if (!section) return;

        if (page.heroTitle) setText(section, '.hero-title', page.heroTitle);
        if (page.heroSubtitle) setText(section, '.hero-sub', page.heroSubtitle);
        if (page.heroDescription) setHTML(section, '.hero-desc', page.heroDescription);

        // CTA Buttons
        var btns = section.querySelectorAll('.hero-btns button');
        if (btns.length >= 1 && page.heroCtaPrimary) {
            btns[0].innerHTML = page.heroCtaPrimary.text || '';
            wireCtaLink(btns[0], page.heroCtaPrimary.link);
        }
        if (btns.length >= 2 && page.heroCtaSecondary) {
            btns[1].textContent = page.heroCtaSecondary.text || '';
            wireCtaLink(btns[1], page.heroCtaSecondary.link);
        }
    }

    /** 3. Pillars (4 icon cards in .why-us .why-grid) */
    function populatePillars(pillars) {
        if (!pillars || !pillars.length) return;
        populateIconCards('.why-us .why-grid', pillars, 'why-card');
    }

    /** 4. Pricing Section (header + plan cards)
     *  `null` label — this page has no section eyebrows (see file header). The
     *  grid stays empty until real plan tiers are added in the CMS; the source
     *  document supplies no prices, so none are invented here. */
    function populatePricing(page) {
        populateSectionHeader('#acr-pricing', null, page.pricingTitle, page.pricingSubtitle);
        populatePricingPlansCloud('#acr-pricing .cloud-pricing-grid', page.plans);
    }

    /** 6. Features (12 icon cards in #acr-features .cloud-power-grid) */
    function populateFeatures(title, subtitle, features) {
        populateSectionHeader('#acr-features', null, title, subtitle);
        if (features && features.length) {
            populateIconCards('#acr-features .cloud-power-grid', features, 'cloud-power-card');
        }
    }

    /** 8. Why Choose ICSDC (icon cards in #acr-why .cloud-use-grid) */
    function populateWhyCards(title, subtitle, cards) {
        populateSectionHeader('#acr-why', null, title, subtitle);
        if (cards && cards.length) {
            populateIconCards('#acr-why .cloud-use-grid', cards, 'cloud-use-card');
        }
    }

    /** 7b. Why section image (optional — set in Strapi via whyImage) */
    function populateWhyImage(whyImage) {
        var wrap = document.getElementById('acr-why-image');
        if (!wrap) return;
        var media = whyImage && whyImage.image;
        if (!media) return;

        var img = wrap.querySelector('img');
        if (!img) return;

        var base = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : 'http://localhost:1337');
        var picked = (media.formats && (media.formats.large || media.formats.medium || media.formats.small)) || media;
        var url = picked.url || '';
        if (url && !url.startsWith('http')) url = base + url;
        if (!url) return;

        img.src = url;
        img.alt = media.alternativeText || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        wrap.style.display = '';
    }

    /** 4b. Who We Are (about section) */
    function populateAbout(page) {
        if (page.aboutTitle) setText(document, '#acr-about-title', page.aboutTitle);
        if (page.aboutDescription) setText(document, '#acr-about-description', page.aboutDescription);
        if (page.aboutPointsTitle) setText(document, '#acr-about-points-title', page.aboutPointsTitle);

        // About points — title-only badges
        var pointsGrid = document.getElementById('acr-about-points');
        if (pointsGrid && Array.isArray(page.aboutPoints) && page.aboutPoints.length) {
            pointsGrid.innerHTML = page.aboutPoints.map(function (p) {
                return '<div class="acr-about-point">' + (p.title || '') + '</div>';
            }).join('');
        }

        // About features — full cards
        if (Array.isArray(page.aboutFeatures) && page.aboutFeatures.length) {
            populateIconCards('#acr-about-features', page.aboutFeatures, 'cloud-power-card');
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
            populateHero('.hero-section', { heroImage: page.heroImage });

            // 3. Pillars
            populatePillars(page.pillars);

            // 4. Pricing
            populatePricing(page);

            // 4b. Who We Are
            populateAbout(page);

            // 6. Features
            populateFeatures(page.featuresTitle, page.featuresSubtitle, page.features);

            // 7. CTA Band #1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // 8. Why Choose ICSDC
            populateWhyCards(page.whyTitle, page.whySubtitle, page.whyCards);
            populateWhyImage(page.whyImage);

            // 9. Testimonials
            if (page.testimonialTitle) {
                setText(document, '#testi-heading', page.testimonialTitle);
            }
            if (page.testimonials && page.testimonials.length) {
                initTestimonials(page.testimonials);
            } else {
                var testiSection = document.querySelector('.testi-section');
                if (testiSection) testiSection.style.display = 'none';
            }

            // 10. FAQ
            if (page.faqTitle) {
                setText(document, '#acr-faq-heading', page.faqTitle);
            }
            initFAQ(page.faq);

            // 11. CTA Band #2 — the source document specifies a second CTA
            // ("Talk to Our Backup Experts from ICSDC") after the FAQ.
            populateCtaBand('.cloud-cta-band.cloud-cta-dark', page.ctaBand2);

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
