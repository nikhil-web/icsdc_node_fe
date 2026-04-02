import { getLinuxCloudHostingPage } from './services/contentService.js';
import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    hidePageLoader,
    markActiveNavLink,
    setText,
    initFAQ,
    initTestimonials
} from './utils/cms-helpers.js';

(function () {
    'use strict';

    // ─────────────────────────────────────────────
    //  populatePlans
    //  Renders .lch-plans-grid with spec cards
    //  showing vCPU / RAM / SSD / Bandwidth
    // ─────────────────────────────────────────────
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#lch-plans .lch-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (plan, i) {
            var isFeatured = plan.featured || false;
            var cardClass = 'lch-plan-card' + (isFeatured ? ' lch-plan-featured' : '');
            var btnClass = 'lch-plan-btn' + (isFeatured ? ' lch-plan-btn-featured' : '');
            var badge = isFeatured ? '<div class="lch-plan-badge">' + (plan.badgeLabel || 'Most Popular') + '</div>' : '';

            var specs = plan.specs || [];
            var specLabels = ['vCPU', 'RAM', 'NVMe SSD', 'Bandwidth'];
            var specKeys = ['vcpu', 'ram', 'ssd', 'bandwidth'];

            var specHTML = '';
            if (specs.length) {
                specHTML = specs.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
                    .map(function (spec) {
                        return '<div class="lch-plan-spec">' +
                            '<span class="lch-plan-spec-label">' + (spec.label || '') + '</span>' +
                            '<span class="lch-plan-spec-value">' + (spec.value || '') + '</span>' +
                            '</div>';
                    }).join('');
            } else {
                // fallback: render inline spec fields if no component array
                var fallbackSpecs = [
                    { label: 'vCPU',      value: plan.vcpu || '' },
                    { label: 'RAM',       value: plan.ram || '' },
                    { label: 'NVMe SSD',  value: plan.ssd || '' },
                    { label: 'Bandwidth', value: plan.bandwidth || '' }
                ];
                specHTML = fallbackSpecs.map(function (s) {
                    if (!s.value) return '';
                    return '<div class="lch-plan-spec">' +
                        '<span class="lch-plan-spec-label">' + s.label + '</span>' +
                        '<span class="lch-plan-spec-value">' + s.value + '</span>' +
                        '</div>';
                }).join('');
            }

            var price = plan.price ? '&#8377;' + plan.price + '<span>/mo</span>' : '';

            return '<div class="' + cardClass + '">' +
                badge +
                '<div class="lch-plan-name">' + (plan.name || '') + '</div>' +
                '<div class="lch-plan-price">' + price + '</div>' +
                (plan.tagline ? '<p class="lch-plan-tagline">' + plan.tagline + '</p>' : '') +
                '<div class="lch-plan-specs">' + specHTML + '</div>' +
                '<button class="' + btnClass + '">' + (plan.ctaLabel || 'Get Started') + ' &rarr;</button>' +
                '</div>';
        }).join('');
    }


    // ─────────────────────────────────────────────
    //  populateFrameworkBadges
    //  Renders .lch-frameworks-grid with tech badges
    // ─────────────────────────────────────────────
    function populateFrameworkBadges(frameworks) {
        if (!frameworks || !frameworks.length) return;
        var grid = document.querySelector('#frameworks .lch-frameworks-grid');
        if (!grid) return;

        var sorted = frameworks.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (fw) {
            return '<div class="lch-framework-badge">' + (fw.name || fw.label || fw.text || '') + '</div>';
        }).join('');
    }


    // ─────────────────────────────────────────────
    //  init
    // ─────────────────────────────────────────────
    async function init() {
        markActiveNavLink();

        try {
            var response = await getLinuxCloudHostingPage();
            var page = response.data;

            // 1 — SEO
            populateSEO(page.seo);

            // 2 — Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.lch-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            // 3 — Hero badges
            if (page.heroTopBadge) setText(document, '.lch-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.lch-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.lch-bs', page.heroStatusSubtitle);

            // 4 — Why-Us pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // 5 — Plans
            populateSectionHeader('#lch-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // 6 — Power features
            populateSectionHeader('#power', page.powerLabel, page.powerTitle, page.powerSubtitle);
            populateIconCards('#power .cloud-power-grid', page.powerFeatures, 'cloud-power-card');

            // 7 — CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // 8 — Frameworks
            populateSectionHeader('#frameworks', page.frameworksLabel, page.frameworksTitle, page.frameworksSubtitle);
            populateFrameworkBadges(page.frameworks);

            // 9 — Why Linux
            populateSectionHeader('#why-linux', page.whyLinuxLabel, page.whyLinuxTitle, page.whyLinuxSubtitle);
            populateIconCards('#why-linux .cloud-use-grid', page.whyLinuxCards, 'cloud-use-card');

            // 10 — Use Cases
            populateSectionHeader('#use-cases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
            populateIconCards('#use-cases .cloud-use-grid', page.useCases, 'cloud-use-card');

            // 11 — Workloads / Specs
            populateSectionHeader('#workloads', page.workloadsLabel, page.workloadsTitle, page.workloadsSubtitle);
            populateIconCards('#workloads .cloud-power-grid', page.workloadFeatures, 'cloud-power-card');

            // 12 — Testimonials
            if (page.testimonialTitle) setText(document, '#lch-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // 13 — FAQ
            if (page.faqTitle) setText(document, '#lch-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // 14 — FAQ contact card
            if (page.faqContactTitle) {
                var contactTitle = document.querySelector('.faq-contact-title');
                if (contactTitle) contactTitle.textContent = page.faqContactTitle;
            }
            if (page.faqContactDescription) {
                var contactDesc = document.querySelector('.faq-contact-desc');
                if (contactDesc) contactDesc.innerHTML = page.faqContactDescription;
            }

            // 15 — CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[linux-cloud-hosting] Failed to load CMS data:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
