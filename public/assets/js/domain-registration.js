/**
 * domain-registration.js
 * ──────────────────────
 * CMS-driven version: fetches all page content from Strapi
 * and populates DOM sections dynamically.
 *
 * Sections handled:
 *   1.  SEO meta tags
 *   2.  Hero (eyebrow + search bar + TLD pills + globe visual)
 *   3.  4 Pillars (icon cards)
 *   4.  TLD Pricing (section header + TLD cards)
 *   5.  Features (section header + 12 icon cards)
 *   6.  CTA Band #1
 *   7.  Why Domain Matters (section header + 6 icon cards)
 *   8.  Smart Tips (section header + 6 icon cards)
 *   9.  Testimonials
 *   10. FAQ
 *   11. CTA Band #2
 */

import { getDomainRegistrationPage } from './services/contentService.js';
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
    function populateDomHero(page) {
        var section = document.querySelector('.hero-section');
        if (!section) return;

        // Eyebrow
        if (page.heroEyebrow) {
            var eyebrow = section.querySelector('.dom-eyebrow');
            if (eyebrow) {
                var dot = eyebrow.querySelector('.dom-eyebrow-dot');
                eyebrow.textContent = '';
                if (dot) eyebrow.appendChild(dot);
                eyebrow.appendChild(document.createTextNode(' ' + page.heroEyebrow));
            }
        }

        if (page.heroTitle) setText(section, '.hero-title', page.heroTitle);
        if (page.heroSubtitle) setText(section, '.hero-sub', page.heroSubtitle);
        if (page.heroDescription) setHTML(section, '.hero-desc', page.heroDescription);

        // CTA / Search button
        var searchBtn = section.querySelector('.dom-search-btn');
        if (searchBtn && page.heroCtaPrimary) {
            searchBtn.innerHTML = page.heroCtaPrimary.text;
            if (page.heroCtaPrimary.link && page.heroCtaPrimary.link !== '#') {
                searchBtn.setAttribute('onclick', "window.location.href='" + page.heroCtaPrimary.link + "'");
            }
        }

        // TLD Pills
        if (page.tldPills && page.tldPills.length) {
            var pillsContainer = section.querySelector('.dom-tld-pills');
            if (pillsContainer) {
                pillsContainer.innerHTML = page.tldPills.map(function (tld) {
                    return '<span class="dom-tld">' + tld + '</span>';
                }).join('');
            }
        }
    }

    /** 3. Pillars (4 icon cards in .why-us .why-grid) */
    function populatePillars(pillars) {
        if (!pillars || !pillars.length) return;
        populateIconCards('.why-us .why-grid', pillars, 'why-card');
    }

    /** 4. TLD Pricing Cards */
    function populateTldPricing(label, title, subtitle, cards) {
        populateSectionHeader('#dom-pricing', label, title, subtitle);

        if (!cards || !cards.length) return;
        var grid = document.querySelector('#dom-pricing .dom-tld-grid');
        if (!grid) return;

        var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (card) {
            var featuredClass = card.badge ? ' dom-tld-featured' : '';
            var badgeHTML = card.badge
                ? '<span class="dom-tld-badge">' + card.badge + '</span>'
                : '';

            return '<div class="dom-tld-card' + featuredClass + '">' +
                '<span class="dom-tld-ext">' + (card.extension || '') + '</span>' +
                badgeHTML +
                '<span class="dom-tld-price">' + (card.price || '') + '</span>' +
                '</div>';
        }).join('');
    }

    /** 5. Features (12 icon cards in #dom-features .cloud-power-grid) */
    function populateFeatures(label, title, subtitle, features) {
        populateSectionHeader('#dom-features', label, title, subtitle);
        if (features && features.length) {
            populateIconCards('#dom-features .cloud-power-grid', features, 'cloud-power-card');
        }
    }

    /** 7. Why Domain Matters (6 icon cards in #dom-why .cloud-use-grid) */
    function populateWhyCards(label, title, subtitle, cards) {
        populateSectionHeader('#dom-why', label, title, subtitle);
        if (cards && cards.length) {
            populateIconCards('#dom-why .cloud-use-grid', cards, 'cloud-use-card');
        }
    }

    /** 8. Smart Tips (6 icon cards in #dom-tips .cloud-power-grid) */
    function populateTips(label, title, subtitle, tips) {
        populateSectionHeader('#dom-tips', label, title, subtitle);
        if (tips && tips.length) {
            populateIconCards('#dom-tips .cloud-power-grid', tips, 'cloud-power-card');
        }
    }

    /** 9. Testimonials */
    function buildTestiCard(t, index) {
        var initials = getInitials(t.name);
        var stars = '';
        for (var s = 0; s < (t.rating || 5); s++) { stars += starSVG(); }

        return '<article class="testi-card" role="listitem" data-testi-index="' + index + '" aria-label="Testimonial from ' + t.name + '">' +
            '<div class="testi-left">' +
            '<div class="testi-avatar" aria-hidden="true">' +
            '<span class="testi-avatar-initials">' + initials + '</span>' +
            '</div>' +
            '<div class="testi-client-info">' +
            '<p class="testi-name">' + t.name + '</p>' +
            '<p class="testi-job">' + (t.title || '') + '</p>' +
            '<p class="testi-company">' + (t.company || '') + '</p>' +
            '</div>' +
            '<div class="testi-rating" aria-label="Rating: ' + (t.rating || 5) + ' out of 5 stars">' + stars + '</div>' +
            '</div>' +
            '<div class="testi-right">' +
            '<blockquote class="testi-quote">' + t.quote + '</blockquote>' +
            '</div>' +
            '</article>';
    }





    /* ─────────────────────────────────────────────────────────
       BOOT -- Fetch from CMS, then populate all sections
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

            // 3. Pillars
            populatePillars(page.pillars);

            // 4. TLD Pricing
            populateTldPricing(page.tldLabel, page.tldTitle, page.tldSubtitle, page.tldCards);

            // 5. Features
            populateFeatures(page.featuresLabel, page.featuresTitle, page.featuresSubtitle, page.features);

            // 6. CTA Band #1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // 7. Why Domain Matters
            populateWhyCards(page.whyLabel, page.whyTitle, page.whySubtitle, page.whyCards);

            // 8. Smart Tips
            populateTips(page.tipsLabel, page.tipsTitle, page.tipsSubtitle, page.tips);

            // 9. Testimonials
            if (page.testimonialTitle) {
                setText(document, '#dom-testi-heading', page.testimonialTitle);
            }
            initTestimonials(page.testimonials);



            if (page.testimonials && page.testimonials.length) {
                initTestimonials(page.testimonials)
            } else {
                //hide the entire section if no testimonials            
                var testiSection = document.getElementsByClassName('testi-section');
                if (testiSection) {
                    testiSection.style.display = 'none';
                }
            }

            // 10. FAQ
            if (page.faqTitle) {
                setText(document, '#dom-faq-heading', page.faqTitle);
            }
            // 9. FAQ
            if (page.faqTitle) {
                setText(document, '#acr-faq-heading', page.faqTitle);
            }
            initFAQ(page.faq);

            // 11. CTA Band #2
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[domain-registration] Failed to load CMS data:', err);
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
