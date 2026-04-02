import { getLinuxVpsHostingPage } from './services/contentService.js';
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
     * Render the 4-column VPS plans grid.
     * Each plan card uses the lvps-plan-card pattern with a 2-column spec sub-grid.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#lvps-plans .lvps-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var popularBadge = plan.popular
                ? '<div class="lvps-plan-badge">Most Popular</div>'
                : '';
            var popularClass = plan.popular ? ' lvps-plan-popular' : '';

            var specs = [
                { label: 'vCPU', value: plan.vcpu || plan.cpu || '' },
                { label: 'RAM', value: plan.ram || plan.memory || '' },
                { label: 'SSD Storage', value: plan.storage || plan.ssd || '' },
                { label: 'Bandwidth', value: plan.bandwidth || plan.bw || '' }
            ];

            var specsHtml = specs.map(function (spec) {
                return '<div class="lvps-plan-spec">' +
                    '<span class="lvps-plan-spec-label">' + spec.label + '</span>' +
                    '<span class="lvps-plan-spec-value">' + (spec.value || '&mdash;') + '</span>' +
                    '</div>';
            }).join('');

            return '<div class="lvps-plan-card' + popularClass + '">' +
                popularBadge +
                '<div class="lvps-plan-name">' + (plan.name || '') + '</div>' +
                '<div class="lvps-plan-price">' + (plan.price || '') + ' <span>/mo</span></div>' +
                '<div class="lvps-plan-specs">' + specsHtml + '</div>' +
                '<button class="lvps-plan-btn">Get ' + (plan.name || 'Plan') + ' &rarr;</button>' +
                '</div>';
        }).join('');
    }

    /**
     * Render the OS options grid with lvps-os-card pattern.
     */
    function populateOsOptions(osOptions) {
        if (!osOptions || !osOptions.length) return;
        var grid = document.querySelector('#os-options .lvps-os-grid');
        if (!grid) return;

        var sorted = osOptions.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (os) {
            return '<div class="lvps-os-card">' +
                '<div class="lvps-os-icon">' + (os.icon || '&#128192;') + '</div>' +
                '<div class="lvps-os-name">' + (os.name || '') + '</div>' +
                '<div class="lvps-os-desc">' + (os.description || os.desc || '') + '</div>' +
                '</div>';
        }).join('');
    }

    /**
     * Render the control panel cards with lvps-cp-card pattern.
     */
    function populateControlPanels(panels) {
        if (!panels || !panels.length) return;
        var grid = document.querySelector('#control-panel .lvps-cp-grid');
        if (!grid) return;

        var sorted = panels.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (panel) {
            return '<div class="lvps-cp-card">' +
                '<div class="lvps-os-icon">' + (panel.icon || '&#9881;') + '</div>' +
                '<div class="lvps-os-name">' + (panel.name || '') + '</div>' +
                '<div class="lvps-os-desc">' + (panel.description || panel.desc || '') + '</div>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getLinuxVpsHostingPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.lvps-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            if (page.heroTopBadge) setHTML(document, '.lvps-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.lvps-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.lvps-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // VPS Plans
            populateSectionHeader('#lvps-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // Power Features
            populateSectionHeader('#power', page.powerLabel, page.powerTitle, page.powerSubtitle);
            populateIconCards('#power .cloud-power-grid', page.powerFeatures, 'cloud-power-card');

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // OS Options
            populateSectionHeader('#os-options', page.osLabel, page.osTitle, page.osSubtitle);
            populateOsOptions(page.osOptions);

            // Control Panels
            populateSectionHeader('#control-panel', page.cpLabel, page.cpTitle, page.cpSubtitle);
            populateControlPanels(page.controlPanels);

            // Why Linux VPS
            populateSectionHeader('#why-vps', page.whyVpsLabel, page.whyVpsTitle, page.whyVpsSubtitle);
            populateIconCards('#why-vps .cloud-power-grid', page.whyVpsCards, 'cloud-power-card');

            // Use Cases
            populateSectionHeader('#use-cases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
            populateIconCards('#use-cases .cloud-use-grid', page.useCases, 'cloud-use-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#lvps-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#lvps-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[linux-vps-hosting] Failed to load CMS data:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
