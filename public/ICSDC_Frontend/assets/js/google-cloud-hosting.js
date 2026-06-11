// ══════════════════════════════════════════════════════════
//  google-cloud-hosting.js — ICSDC Google Cloud Hosting Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getGoogleCloudHostingPage } from './services/contentService.js';
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
    initTestimonials,
    initHeroContactForm
} from './utils/cms-helpers.js';
import { uploadURL } from './services/strapiClient.js';

(function () {
    'use strict';

    /**
     * Render migration steps as numbered cards.
     */
    function populateMigrationSteps(steps) {
        if (!steps || !steps.length) return;
        var grid = document.querySelector('#gch-migration .cloud-power-grid, #gch-migration .cloud-use-grid');
        if (!grid) return;

        var sorted = steps.slice().sort(function (a, b) { return (a.order || a.step || 0) - (b.order || b.step || 0); });
        grid.innerHTML = sorted.map(function (step, i) {
            return '<div class="cloud-power-card" data-animate="fade-up">' +
                '<div class="cloud-power-icon">' + (step.icon || (i + 1)) + '</div>' +
                '<h3>' + (step.title || '') + '</h3>' +
                '<p>' + (step.description || step.desc || '') + '</p>' +
                '</div>';
        }).join('');
    }

    /**
     * Render the comparison table rows.
     * compareRows is a JSON array: [{ feature, direct, icsdc }]
     * direct/icsdc: true = check, false = cross, or string for text values.
     */
    function renderGoogleCompareTable(rows) {
        var tbody = document.getElementById('gch-compare-tbody');
        if (!tbody || !rows || !rows.length) return;
        tbody.innerHTML = rows.map(function (row) {
            function cell(val, cls) {
                if (val === true || val === 'yes') {
                    return '<td class="gch-col-yes"><i class="fa-solid fa-circle-check"></i></td>';
                }
                if (val === false || val === 'no') {
                    return '<td class="gch-col-no"><i class="fa-solid fa-circle-xmark"></i></td>';
                }
                return '<td class="' + (cls || '') + '">' + (val || '') + '</td>';
            }
            return '<tr><td>' + (row.feature || '') + '</td>' +
                cell(row.direct) + cell(row.icsdc) + '</tr>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getGoogleCloudHostingPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero — form on by default, off only if explicitly false in Strapi
            var heroFormOn = page.heroFormEnabled !== false;
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.gch-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
                heroImage: page.heroImage,
                heroFormEnabled: heroFormOn
            });
            if (heroFormOn) initHeroContactForm('hf-form', 'hf-success');

            if (page.heroTopBadge) setHTML(document, '.gch-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.gch-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.gch-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Plans
            populateSectionHeader('#gch-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePricingPlansCloud('#gch-plans .cloud-pricing-grid', page.plans);
            document.querySelectorAll('#gch-plans .cloud-plan-cta').forEach(function (btn) {
                btn.onclick = function () { window.location.href = '/contact-us'; };
            });

            // Migration Steps
            populateSectionHeader('#gch-migration', page.migrationLabel, page.migrationTitle, page.migrationSubtitle);
            populateMigrationSteps(page.migrationSteps);

            // Who We Are
            var aboutTitleEl = document.getElementById('gch-about-title');
            if (aboutTitleEl && page.aboutTitle) aboutTitleEl.textContent = page.aboutTitle;
            var aboutDescEl = document.getElementById('gch-about-desc');
            if (aboutDescEl && page.aboutDesc) aboutDescEl.textContent = page.aboutDesc;
            if (page.aboutImage && page.aboutImage.image) {
                var aboutImg = document.getElementById('gch-about-img');
                if (aboutImg) {
                    var aboutImgUrl = uploadURL(page.aboutImage.image);
                    if (aboutImgUrl) aboutImg.src = aboutImgUrl;
                }
            }

            // Why Google
            populateSectionHeader('#gch-why-google', page.whyGoogleLabel, page.whyGoogleTitle, page.whyGoogleSubtitle);
            populateIconCards('#gch-why-google .cloud-power-grid', page.whyGoogleCards, 'cloud-power-card');

            // Services
            populateSectionHeader('#gch-services', page.servicesLabel, page.servicesTitle, page.servicesSubtitle);
            populateIconCards('#gch-services .cloud-power-grid', page.servicesCards, 'cloud-power-card');

            // Use Cases
            populateSectionHeader('#gch-use-cases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
            populateIconCards('#gch-use-cases .cloud-use-grid', page.useCases, 'cloud-use-card');

            // Comparison Table
            populateSectionHeader('#gch-compare', null, page.compareTitle, page.compareSubtitle);
            renderGoogleCompareTable(page.compareRows);

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // Testimonials
            if (page.testimonialTitle) setText(document, '#gch-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#gch-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[google-cloud-hosting] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
