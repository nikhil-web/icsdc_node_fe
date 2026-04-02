import { getManagedVpsHostingPage } from './services/contentService.js';
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
     * Render the 3-column managed VPS plans grid.
     * Each plan card uses the mvps-plan-card pattern with a features list.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#mvps-plans .mvps-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var featuredBadge = plan.featured || plan.popular
                ? '<div class="mvps-plan-badge">Most Popular</div>'
                : '';
            var featuredClass = plan.featured || plan.popular ? ' mvps-plan-featured' : '';
            var btnFeaturedClass = plan.featured || plan.popular ? ' mvps-plan-btn-featured' : '';

            var featuresHtml = '';
            if (plan.features && plan.features.length) {
                var featureItems = plan.features.slice()
                    .sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
                    .map(function (f) {
                        return '<li>' + (f.text || f.label || f.name || '') + '</li>';
                    }).join('');
                featuresHtml = '<ul class="mvps-plan-features">' + featureItems + '</ul>';
            }

            var btnLabel = (plan.ctaLabel || plan.cta || 'Get ' + (plan.tier || plan.name || 'Plan'));

            return '<div class="mvps-plan-card' + featuredClass + '">' +
                featuredBadge +
                '<div class="mvps-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
                '<div class="mvps-plan-price">' + (plan.price || '') + ' <span>/mo</span></div>' +
                '<p class="mvps-plan-tagline">' + (plan.tagline || plan.description || '') + '</p>' +
                featuresHtml +
                '<button class="mvps-plan-btn' + btnFeaturedClass + '">' + btnLabel + ' &rarr;</button>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getManagedVpsHostingPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.mvps-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) setHTML(document, '.mvps-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.mvps-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.mvps-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Managed VPS Plans
            populateSectionHeader('#mvps-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // Core Features
            populateSectionHeader('#mvps-features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#mvps-features .mvps-features-grid', page.features, 'cloud-power-card');

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // What We Manage
            populateSectionHeader('#mvps-what-we-manage', page.whatWeManageLabel, page.whatWeManageTitle, page.whatWeManageSubtitle);
            populateIconCards('#mvps-what-we-manage .cloud-power-grid', page.whatWeManage, 'cloud-power-card');

            // Why Managed VPS
            populateSectionHeader('#mvps-why-managed', page.whyManagedLabel, page.whyManagedTitle, page.whyManagedSubtitle);
            populateIconCards('#mvps-why-managed .cloud-power-grid', page.whyManagedCards, 'cloud-power-card');

            // Use Cases
            populateSectionHeader('#mvps-usecases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
            populateIconCards('#mvps-usecases .cloud-use-grid', page.useCases, 'cloud-use-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#mvps-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#mvps-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[managed-vps-hosting] Failed to load CMS data:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
