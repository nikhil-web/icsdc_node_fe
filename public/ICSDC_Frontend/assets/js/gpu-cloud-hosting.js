// ══════════════════════════════════════════════════════════
//  gpu-cloud-hosting.js — ICSDC GPU Cloud Hosting Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getGpuCloudHostingPage } from './services/contentService.js';
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
     * Render the 3-column GPU plans grid.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#gpu-plans .gpu-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isFeatured || plan.popular || false;
            var featuredClass = isFeatured ? ' gpu-plan-featured' : '';
            var badgeLabel = plan.badge || (isFeatured ? 'Most Popular' : '');
            var badgeHtml = badgeLabel
                ? '<div class="gpu-plan-badge">' + badgeLabel + '</div>'
                : '';

            var currency = plan.currency || '₹';
            var period = plan.period || 'mo';
            var priceHtml = plan.price
                ? '<div class="gpu-plan-price">' + currency + plan.price + ' <span>/' + period + '</span></div>'
                : '';

            var taglineHtml = plan.tagline
                ? '<div class="gpu-plan-tagline">' + plan.tagline + '</div>'
                : '';

            var featuresArr = plan.features || [];
            var featuresHtml = featuresArr.length
                ? '<ul class="gpu-plan-features">' +
                    featuresArr.map(function (f) {
                        return '<li>' + (f.label || f.text || f.name || f) + '</li>';
                    }).join('') +
                  '</ul>'
                : '';

            var ctaText = plan.ctaText || 'Get Started';
            var btnClass = isFeatured ? 'gpu-plan-btn-featured' : 'gpu-plan-btn';

            return '<div class="gpu-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="gpu-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
                priceHtml +
                taglineHtml +
                featuresHtml +
                '<a href="/contact-us" class="' + btnClass + '">' + ctaText + ' &rarr;</a>' +
                '</div>';
        }).join('');
    }

    /**
     * Render OS badge chips row (Deploy & Scale section).
     * Each badge is { icon: "fa-brands fa-ubuntu", name: "Ubuntu" }
     */
    function populateDeployBadges(badges) {
        var el = document.getElementById('gpu-os-badges');
        if (!el || !badges || !badges.length) return;
        el.innerHTML = badges.map(function (b) {
            var iconClass = (typeof b === 'object' && b.icon) ? b.icon : 'fa-solid fa-circle-dot';
            var name = (typeof b === 'object') ? (b.name || b) : b;
            return '<span class="gpu-os-badge">' +
                '<i class="' + iconClass + '" aria-hidden="true"></i>' +
                name +
                '</span>';
        }).join('');
    }

    /**
     * Render the Enterprise Infrastructure section (text + bullets).
     */
    function populateInfra(page) {
        if (page.infraTitle) setText(document, '#gpu-infra-title', page.infraTitle);
        if (page.infraDesc)  setText(document, '#gpu-infra-desc',  page.infraDesc);

        var list = document.getElementById('gpu-infra-list');
        if (list && page.infraPoints && page.infraPoints.length) {
            list.innerHTML = page.infraPoints.map(function (pt) {
                return '<li>' + pt + '</li>';
            }).join('');
        }
        if (page.infraClosing) setText(document, '#gpu-infra-closing', page.infraClosing);
    }

    /**
     * Render Related Services cards.
     */
    function populateRelated(page) {
        if (page.relatedTitle) setText(document, '#gpu-related-title', page.relatedTitle);

        var grid = document.getElementById('gpu-related-grid');
        if (!grid || !page.relatedCards || !page.relatedCards.length) return;

        var arrowSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
        grid.innerHTML = page.relatedCards.map(function (card) {
            var iconClass = card.icon ? 'fa-solid fa-' + card.icon : 'fa-solid fa-server';
            return '<div class="gpu-related-card">' +
                '<div class="gpu-related-icon"><i class="' + iconClass + '" aria-hidden="true"></i></div>' +
                '<h3 class="gpu-related-title-card">' + (card.title || '') + '</h3>' +
                '<p class="gpu-related-desc">' + (card.desc || '') + '</p>' +
                '<a href="' + (card.ctaLink || '#') + '" class="gpu-related-btn">' +
                (card.ctaText || 'Learn More') + ' ' + arrowSVG +
                '</a>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getGpuCloudHostingPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.gpu-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
                heroImage: page.heroImage
            });

            if (page.heroTopBadge)      setHTML(document, '.gpu-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle)   setText(document, '.gpu-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.gpu-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Plans
            populateSectionHeader('#gpu-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // Enterprise Features (What You Get — 10 cards)
            populateSectionHeader('#gpu-features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#gpu-features .gpu-features-grid', page.features, 'cloud-power-card');

            // Built-in Features (8 cards)
            populateSectionHeader('#gpu-builtin', page.builtinLabel, page.builtinTitle, page.builtinSubtitle);
            populateIconCards('#gpu-builtin .cloud-power-grid', page.builtinFeatures, 'cloud-use-card');

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // Deploy & Scale With Confidence
            populateSectionHeader('#gpu-deploy', page.deployLabel, page.deployTitle, page.deploySubtitle);
            populateIconCards('#gpu-deploy .gpu-deploy-grid', page.deployCards, 'cloud-power-card');
            populateDeployBadges(page.deployBadges);

            // GPU Portfolio — section header (H2 + subtitle)
            populateSectionHeader('#gpu-portfolio', null, page.portfolioTitle, page.portfolioSubtitle);

            // Portfolio image (between subtitle and H3)
            if (page.portfolioImage && page.portfolioImage.image && page.portfolioImage.image.url) {
                var strapiBase = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : '');
                var pImgUrl = page.portfolioImage.image.url;
                if (!/^https?:\/\//.test(pImgUrl)) pImgUrl = strapiBase + pImgUrl;
                var pImg = document.getElementById('gpu-portfolio-img');
                var pWrap = document.getElementById('gpu-portfolio-img-wrap');
                if (pImg) { pImg.src = pImgUrl; }
                if (pWrap) { pWrap.style.display = ''; }
            }

            // H3 sub-heading "Explore Our High-Performance GPU Portfolio"
            if (page.portfolioLabel) setText(document, '#gpu-portfolio-subheading', page.portfolioLabel);

            // Portfolio cards (9 GPUs)
            populateIconCards('#gpu-portfolio .cloud-power-grid', page.gpuPortfolio, 'cloud-power-card');

            // Enterprise Infrastructure
            populateInfra(page);

            // Related Services
            populateRelated(page);

            // Enterprise-Ready Tools (5 cards)
            populateSectionHeader('#gpu-tools', page.toolsLabel, page.toolsTitle, page.toolsSubtitle);
            populateIconCards('#gpu-tools .cloud-use-grid', page.toolsCards, 'cloud-use-card');

            // Why Choose ICSDC (9 cards)
            populateSectionHeader('#gpu-why', page.whyLabel, page.whyTitle, page.whySubtitle);
            populateIconCards('#gpu-why .cloud-use-grid', page.whyCards, 'cloud-use-card');

            // Who Should Choose (8 cards)
            populateSectionHeader('#gpu-who', page.whoLabel, page.whoTitle, page.whoSubtitle);
            populateIconCards('#gpu-who .cloud-use-grid', page.whoCards, 'cloud-use-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#gpu-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#gpu-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[gpu-cloud-hosting] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
