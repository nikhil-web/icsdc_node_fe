import { populateSEO, populateHero, populateIconCards, populateSectionHeader, populateCtaBand, populatePricingPlans, hidePageLoader, markActiveNavLink, initTestimonials, initFAQ, setText } from './utils/cms-helpers.js';
import { getWindowsCloudHostingPage } from './services/contentService.js';

(async function () {
    'use strict';
    markActiveNavLink();
    try {
        var res = await getWindowsCloudHostingPage();
        var page = res.data;

        populateSEO(page.seo);

        populateHero(document.querySelector('.hero-section'), {
            eyebrow: page.heroEyebrow,
            title: page.heroTitle,
            subtitle: page.heroSubtitle,
            description: page.heroDescription,
            ctaPrimary: page.heroCtaPrimary,
            ctaSecondary: page.heroCtaSecondary,
            heroImage: page.heroImage
        });

        populateIconCards('.why-grid', page.pillars, 'why-card');

        // Plans / pricing
        populateSectionHeader('#wincloud-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
        populatePricingPlans('#wincloud-pricing-grid', page.plans);

        // Who We Are
        if (page.aboutTitle) setText(document, '#wincloud-about-title', page.aboutTitle);
        if (page.aboutDesc) setText(document, '#wincloud-about-desc', page.aboutDesc);
        if (page.aboutPoints && page.aboutPoints.length) {
            var aboutList = document.getElementById('wincloud-about-list');
            if (aboutList) {
                aboutList.innerHTML = page.aboutPoints.map(function (pt) {
                    return '<li><span class="wincloud-about-check"><i class="fa-solid fa-check" aria-hidden="true"></i></span>' + pt + '</li>';
                }).join('');
            }
        }
        if (page.aboutImage && page.aboutImage.image && page.aboutImage.image.url) {
            var aboutImgUrl = page.aboutImage.image.url;
            if (!/^https?:\/\//.test(aboutImgUrl)) aboutImgUrl = 'http://localhost:1337' + aboutImgUrl;
            var aboutImg = document.getElementById('wincloud-about-img');
            var aboutFallback = document.getElementById('wincloud-about-fallback');
            if (aboutImg) { aboutImg.src = aboutImgUrl; aboutImg.style.display = ''; }
            if (aboutFallback) aboutFallback.style.display = 'none';
        }

        populateSectionHeader('#features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
        populateIconCards('.cloud-power-grid', page.features, 'cloud-power-card');

        populateSectionHeader('#why-us', page.whyLabel, page.whyTitle, page.whySubtitle);
        populateIconCards('.cloud-why-grid', page.whyCards, 'cloud-power-card');

        // Advanced (Elevate) features
        populateSectionHeader('#wincloud-advanced', page.advancedLabel, page.advancedTitle, page.advancedSubtitle);
        populateIconCards('.wincloud-advanced-grid', page.advancedCards, 'cloud-power-card');

        populateSectionHeader('#use-cases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
        populateIconCards('.cloud-use-grid', page.useCaseItems, 'cloud-use-card');

        populateSectionHeader('#apps', page.appsLabel, page.appsTitle, page.appsSubtitle);
        populateIconCards('.cloud-apps-grid', page.appCards, 'cloud-power-card');

        if (page.testimonialTitle) setText(document, '#winvps-testi-heading', page.testimonialTitle);
        initTestimonials(page.testimonials, {
            grid: 'winvps-testi-grid',
            dots: 'winvps-testi-dots',
            prev: 'winvps-testi-prev',
            next: 'winvps-testi-next'
        });

        if (page.faqTitle) setText(document, '#winvps-faq-heading', page.faqTitle);
        initFAQ(page.faq, {
            containerId: 'winvps-faq-accordions',
            answerPrefix: 'wincloud-faq'
        });

        // Related services cards
        if (page.relatedCards && page.relatedCards.length) {
            var relatedGrid = document.getElementById('wincloud-related-grid');
            if (relatedGrid) {
                var arrowSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
                relatedGrid.innerHTML = page.relatedCards.map(function (card) {
                    var iconClass = card.icon ? 'fa-solid fa-' + card.icon : 'fa-solid fa-server';
                    return '<div class="wincloud-related-card">' +
                        '<div class="wincloud-related-icon"><i class="' + iconClass + '" aria-hidden="true"></i></div>' +
                        '<p class="wincloud-related-desc">' + (card.desc || '') + '</p>' +
                        '<a href="' + (card.ctaLink || '#') + '" class="wincloud-related-btn">' +
                        (card.ctaText || '') + ' ' + arrowSVG + '</a>' +
                        '</div>';
                }).join('');
            }
        }

        populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);
        populateCtaBand('.cloud-cta-dark', page.ctaBand2);
    } catch (err) {
        console.error('[windows-cloud-hosting] CMS load failed:', err);
    }
    hidePageLoader();
})();
