// ══════════════════════════════════════════════════════════
//  forex-vps.js — ICSDC Forex VPS Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getForexVpsPage } from './services/contentService.js';
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
    initFAQ,
    initTestimonials
} from './utils/cms-helpers.js';

(function () {
    'use strict';

    /**
     * Adapt forex-vps plan fields (vcpu/ram/storage/bandwidth/isPopular)
     * into the standard ds-plan-card format used by populatePricingPlans().
     */
    function normalisePlans(plans) {
        if (!plans || !plans.length) return [];
        return plans.map(function (plan) {
            // Strip currency symbol so ds-plan-currency renders it separately
            var rawPrice = (plan.price || '').replace(/[₹₹]/g, '').trim();

            var features = [];
            if (plan.vcpu)      features.push({ label: plan.vcpu      + ' vCPU' });
            if (plan.ram)       features.push({ label: plan.ram       + ' RAM' });
            if (plan.storage)   features.push({ label: plan.storage   + ' SSD Storage' });
            if (plan.bandwidth) features.push({ label: plan.bandwidth + ' Bandwidth' });

            return {
                order:      plan.order || 0,
                tier:       plan.name  || '',
                currency:   '₹',
                price:      rawPrice,
                period:     '/mo',
                tagline:    plan.priceNote || null,
                isFeatured: !!plan.isPopular,
                badge:      plan.isPopular ? 'Most Popular' : null,
                ctaText:    'Get Started',
                ctaStyle:   plan.isPopular ? 'primary' : 'outline',
                features:   features
            };
        });
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getForexVpsPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrowSelector: '.fvps-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
            heroImage: page.heroImage
            });

            if (page.heroTopBadge) {
                var topBadge = document.querySelector('.fvps-top-badge');
                if (topBadge) topBadge.textContent = page.heroTopBadge;
            }
            if (page.heroStatusTitle) {
                var bt = document.querySelector('.fvps-bt');
                if (bt) bt.textContent = page.heroStatusTitle;
            }
            if (page.heroStatusSubtitle) {
                var bs = document.querySelector('.fvps-bs');
                if (bs) bs.textContent = page.heroStatusSubtitle;
            }

            // Pillars (4 why-cards)
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Plans
            if (page.plansLabel) {
                var plansLabel = document.getElementById('fvps-plans-label');
                if (plansLabel) plansLabel.textContent = page.plansLabel;
            }
            if (page.plansTitle) {
                var plansTitle = document.getElementById('fvps-plans-title');
                if (plansTitle) plansTitle.textContent = page.plansTitle;
            }
            if (page.plansSubtitle) {
                var plansSub = document.getElementById('fvps-plans-subtitle');
                if (plansSub) plansSub.textContent = page.plansSubtitle;
            }
            populatePricingPlans('#fvps-plans .ds-plan-grid', normalisePlans(page.plans));

            // Features section (9 cards)
            populateSectionHeader('#fvps-features', page.featuresLabel, page.featuresTitle, null);
            populateIconCards('#fvps-features-grid', page.features, 'cloud-power-card');

            // Why Choose ICSDC
            if (page.whyChooseLabel) {
                var whyLabel = document.getElementById('fvps-why-choose-label');
                if (whyLabel) whyLabel.textContent = page.whyChooseLabel;
            }
            if (page.whyChooseTitle) {
                var whyTitle = document.getElementById('fvps-why-choose-title');
                if (whyTitle) whyTitle.textContent = page.whyChooseTitle;
            }
            populateIconCards('#fvps-why-choose-grid', page.whyChooseCards, 'cloud-power-card');

            // Setup Steps
            if (page.setupStepsTitle) {
                var setupTitle = document.getElementById('fvps-setup-title');
                if (setupTitle) setupTitle.textContent = page.setupStepsTitle;
            }
            var stepsGrid = document.getElementById('fvps-steps-grid');
            if (stepsGrid && Array.isArray(page.setupSteps)) {
                stepsGrid.innerHTML = page.setupSteps.map(function (step) {
                    return '<div class="fvps-step-card">' +
                        '<div class="fvps-step-number">' + (step.number || step.order || '') + '</div>' +
                        '<h3>' + (step.title || '') + '</h3>' +
                        '<p>' + inlineRichText(step.description || '') + '</p>' +
                        '</div>';
                }).join('');
            }

            // Trading Apps
            if (page.tradingAppsTitle) {
                var appsTitle = document.getElementById('fvps-apps-title');
                if (appsTitle) appsTitle.textContent = page.tradingAppsTitle;
            }
            var appsGrid = document.getElementById('fvps-apps-grid');
            if (appsGrid && Array.isArray(page.tradingApps)) {
                appsGrid.innerHTML = page.tradingApps.map(function (app) {
                    return '<div class="fvps-app-card">' +
                        '<div class="fvps-app-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>' +
                        '<span>' + (app.title || '') + '</span>' +
                        '</div>';
                }).join('');
            }

            // Use Cases (6 cards)
            populateSectionHeader('#fvps-usecases', page.useCasesLabel, page.useCasesTitle, null);
            populateIconCards('#fvps-usecases-grid', page.useCasesCards, 'cloud-power-card');

            // Who Should Use (6 cards)
            populateSectionHeader('#fvps-who', page.whoLabel, page.whoTitle, null);
            populateIconCards('#fvps-who-grid', page.whoCards, 'cloud-power-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#fvps-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // CTA Band 1
            populateCtaBand('#fvps-cta1', page.ctaBand1);

            // FAQ
            if (page.faqTitle) setText(document, '#fvps-faq-heading', page.faqTitle);
            initFAQ(page.faq);

        } catch (err) {
            console.error('[forex-vps] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
