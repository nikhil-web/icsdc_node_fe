/**
 * domain-registration.js
 * ──────────────────────
 * CMS-driven version: fetches all page content from Strapi
 * and populates DOM sections dynamically.
 *
 * DOCX section order:
 *   1.  SEO
 *   2.  Hero (eyebrow + search bar + TLD pills)
 *   3.  4 Pillars
 *   4.  Core Principles / Features (12 cards)
 *   5.  Why Choose ICSDC (4 cards)  ← NEW
 *   6.  TLD Pricing
 *   7.  Why a Domain Name Matters (checklist + image)
 *   8.  Own Your Domain / Privacy section (text + image)  ← NEW
 *   9.  Smart Tips (6 cards)
 *   10. Who We Are (checklist + image)  ← NEW
 *   11. CTA Band
 *   12. Testimonials
 *   13. FAQ
 */

import { getDomainRegistrationPage } from './services/contentService.js';
import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    populateTldCards,
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

    function uploadURL(url) {
        if (!url) return '';
        return /^https?:\/\//.test(url) ? url : ('http://localhost:1337' + url);
    }

    /* ─────────────────────────────────────────────────────────
       SECTION POPULATORS
    ───────────────────────────────────────────────────────── */

    /** Hero section */
    function populateDomHero(page) {
        var section = document.querySelector('.hero-section');
        if (!section) return;

        if (page.heroTitle) setText(section, '.hero-title', page.heroTitle);
        if (page.heroSubtitle) setText(section, '.hero-sub', page.heroSubtitle);
        if (page.heroDescription) setHTML(section, '.hero-desc', page.heroDescription);

        var searchBtn = section.querySelector('.dom-search-btn');
        if (searchBtn && page.heroCtaPrimary) {
            searchBtn.innerHTML = page.heroCtaPrimary.text || searchBtn.innerHTML;
            if (page.heroCtaPrimary.link && page.heroCtaPrimary.link !== '#') {
                searchBtn.setAttribute('onclick', "window.location.href='" + page.heroCtaPrimary.link + "'");
            }
        }

        if (page.tldPills && page.tldPills.length) {
            var pillsContainer = section.querySelector('.dom-tld-pills');
            if (pillsContainer) {
                pillsContainer.innerHTML = page.tldPills.map(function (tld) {
                    return '<span class="dom-tld">' + tld + '</span>';
                }).join('');
            }
        }
    }

    /** Pillars (4 icon cards) */
    function populatePillars(pillars) {
        if (!pillars || !pillars.length) return;
        populateIconCards('.why-us .why-grid', pillars, 'why-card');
    }

    /** Features — 12 icon cards */
    function populateFeatures(label, title, subtitle, features) {
        populateSectionHeader('#dom-features', label, title, subtitle);
        if (features && features.length) {
            populateIconCards('#dom-features .cloud-power-grid', features, 'cloud-power-card');
        }
    }

    /** Why Choose ICSDC — 4 icon cards */
    function populateWhyChoose(page) {
        populateSectionHeader('#dom-why-choose', page.whyChooseLabel, page.whyChooseTitle, page.whyChooseSubtitle);
        if (page.whyChooseCards && page.whyChooseCards.length) {
            populateIconCards('#dom-why-choose .cloud-power-grid', page.whyChooseCards, 'cloud-power-card');
        }
    }

    /** TLD Pricing */
    function populateTldPricing(label, title, subtitle, cards) {
        populateSectionHeader('#dom-pricing', label, title, subtitle);

        if (!cards || !cards.length) return;
        var grid = document.querySelector('#dom-pricing .dom-tld-grid');
        if (!grid) return;

        var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (card) {
            var ext = card.extension || '';
            var featuredClass = card.badge ? ' dom-tld-featured' : '';

            // Top badge (Popular / Trending / etc.)
            var badgeHTML = card.badge
                ? '<span class="dom-tld-badge">' + card.badge + '</span>'
                : '';

            // Original price + SAVE % row
            var priceRowHTML = '';
            if (card.originalPrice) {
                var origNum = parseFloat((card.originalPrice || '').replace(/[^\d.]/g, ''));
                var currNum = parseFloat((card.price || '').replace(/[^\d.]/g, ''));
                var saveHTML = '';
                if (origNum && currNum && origNum > currNum) {
                    var pct = Math.round((origNum - currNum) / origNum * 100);
                    saveHTML = '<span class="dom-tld-save-badge">Save ' + pct + '%</span>';
                }
                priceRowHTML = '<div class="dom-tld-price-row">' +
                    '<span class="dom-tld-orig-price">' + card.originalPrice + '</span>' +
                    saveHTML +
                    '</div>';
            } else {
                priceRowHTML = '<div class="dom-tld-price-row"></div>';
            }

            // Format current price — add /year class
            var priceFormatted = (card.price || '').replace(/(\/yr(\.?)|\/year)/i,
                '<span class="dom-tld-per">$&</span>');

            var descHTML = card.description
                ? '<p class="dom-tld-desc">' + card.description + '</p>'
                : '<p class="dom-tld-desc"></p>';

            return '<div class="dom-tld-card' + featuredClass + '" data-ext="' + ext + '">' +
                badgeHTML +
                '<div class="dom-tld-logo">' + ext + '</div>' +
                descHTML +
                priceRowHTML +
                '<div class="dom-tld-curr-price">' + priceFormatted + '</div>' +
                '<a href="/contact-us" class="dom-tld-register-btn">Register</a>' +
                '</div>';
        }).join('');
    }

    /** Why a Domain Name Matters — checklist + image */
    function populateDomWhy(page) {
        if (page.whyTitle) setText(document, '#dom-why .title', page.whyTitle);

        if (page.whyCards && page.whyCards.length) {
            var list = document.querySelector('#dom-why .dom-why-list');
            if (list) {
                list.innerHTML = page.whyCards.map(function (c) {
                    return '<li><i class="fa-solid fa-circle-check" aria-hidden="true"></i>' + (c.title || '') + '</li>';
                }).join('');
            }
        }

        if (page.whyImage && page.whyImage.image && page.whyImage.image.url) {
            var img = document.getElementById('dom-why-img');
            if (img) {
                img.src = uploadURL(page.whyImage.image.url);
                img.style.display = '';
            }
        }
    }

    /** Own Your Domain — Privacy section (text + image) */
    function populateDomPrivacy(page) {
        if (page.privacyTitle) setText(document, '#dom-privacy-title', page.privacyTitle);
        if (page.privacyDesc) setHTML(document, '#dom-privacy-desc', page.privacyDesc);

        if (page.privacyImage && page.privacyImage.image && page.privacyImage.image.url) {
            var img = document.getElementById('dom-privacy-img');
            if (img) {
                img.src = uploadURL(page.privacyImage.image.url);
                img.style.display = '';
            }
        }
    }

    /** Smart Tips — 6 icon cards */
    function populateTips(label, title, subtitle, tips) {
        populateSectionHeader('#dom-tips', label, title, subtitle);
        if (tips && tips.length) {
            populateIconCards('#dom-tips .cloud-power-grid', tips, 'cloud-power-card');
        }
    }

    /** Who We Are — checklist + image */
    function populateDomAbout(page) {
        if (page.aboutTitle) setText(document, '#dom-about-title', page.aboutTitle);
        if (page.aboutDesc) setText(document, '#dom-about-desc', page.aboutDesc);

        if (page.aboutPoints && page.aboutPoints.length) {
            var list = document.getElementById('dom-about-list');
            if (list) {
                list.innerHTML = page.aboutPoints.map(function (p) {
                    return '<li>' + (p.text || p.label || p) + '</li>';
                }).join('');
            }
        }

        if (page.aboutImage && page.aboutImage.image && page.aboutImage.image.url) {
            var img = document.getElementById('dom-about-img');
            if (img) {
                img.src = uploadURL(page.aboutImage.image.url);
                img.style.display = '';
            }
        }
    }

    /* ─────────────────────────────────────────────────────────
       BOOT
    ───────────────────────────────────────────────────────── */
    async function init() {
        markActiveNavLink();

        try {
            var response = await getDomainRegistrationPage();
            var page = response.data;

            // 1. SEO
            populateSEO(page.seo);

            // 2. Hero
            populateDomHero(page);
            populateHero('.hero-section', { heroImage: page.heroImage });

            // 3. Pillars
            populatePillars(page.pillars);

            // 4. Features
            populateFeatures(page.featuresLabel, page.featuresTitle, page.featuresSubtitle, page.features);

            // 5. Why Choose ICSDC
            populateWhyChoose(page);

            // 6. TLD Pricing
            populateTldPricing(page.tldLabel, page.tldTitle, page.tldSubtitle, page.tldCards);

            // 7. Why a Domain Name Matters
            populateDomWhy(page);

            // 8. Privacy section
            populateDomPrivacy(page);

            // 9. Smart Tips
            populateTips(page.tipsLabel, page.tipsTitle, page.tipsSubtitle, page.tips);

            // 10. Who We Are
            populateDomAbout(page);

            // 11. CTA Band
            populateCtaBand('.cloud-cta-band', page.ctaBand1);

            // 12. Testimonials
            if (page.testimonialTitle) setText(document, '#dom-testi-heading', page.testimonialTitle);
            if (page.testimonials && page.testimonials.length) {
                initTestimonials(page.testimonials);
            } else {
                var testiSection = document.querySelector('.testi-section');
                if (testiSection) testiSection.style.display = 'none';
            }

            // 13. FAQ
            if (page.faqTitle) setText(document, '#dom-faq-heading', page.faqTitle);
            initFAQ(page.faq);

        } catch (err) {
            console.error('[domain-registration] Failed to load CMS data:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
