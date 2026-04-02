import { populateSEO, populateHero, populateIconCards, populateSectionHeader, populateCtaBand, populatePricingPlans, populateChecklist, populateComparisonTable, hidePageLoader, markActiveNavLink, setText, setHTML, initTestimonials, initFAQ } from './utils/cms-helpers.js';
import { getLinuxDedicatedServerPage } from './services/contentService.js';

(async function () {
    'use strict';
    markActiveNavLink();
    try {
        var res = await getLinuxDedicatedServerPage();
        var page = res.data;

        populateSEO(page.seo);

        populateHero(document.querySelector('.hero-section'), {
            eyebrow: page.heroEyebrow,
            title: page.heroTitle,
            subtitle: page.heroSubtitle,
            description: page.heroDescription,
            ctaPrimary: page.heroCtaPrimary,
            ctaSecondary: page.heroCtaSecondary
        });

        populateIconCards('.why-grid', page.pillars, 'why-card');

        populateSectionHeader('#pricing', page.pricingLabel, page.pricingTitle, page.pricingSubtitle);
        populatePricingPlans('.lds-pricing-grid', page.pricingPlans);

        // What Is section
        populateSectionHeader('#what', page.whatLabel, page.whatTitle, null);
        if (page.whatDescription) {
            setHTML(document.getElementById('what'), 'p, .subtitle', page.whatDescription);
        }

        populateSectionHeader('#why-linux', page.whyLabel, page.whyTitle, page.whySubtitle);
        populateIconCards('.cloud-power-grid', page.whyCards, 'cloud-power-card');

        populateSectionHeader('#comparison', page.comparisonLabel, page.comparisonTitle, page.comparisonSubtitle);
        populateComparisonTable('.compare-table', page.comparisonColumns, page.comparisonRows);

        populateSectionHeader('#specs', page.specsLabel, page.specsTitle, null);
        if (page.specsDescription) {
            setHTML(document.getElementById('specs'), 'p, .subtitle', page.specsDescription);
        }
        populateChecklist('.lds-specs-list', page.specsItems);

        populateSectionHeader('#support', page.supportLabel, page.supportTitle, page.supportSubtitle);
        populateIconCards('.lds-support-grid', page.supportCards, 'cloud-power-card');

        populateSectionHeader('#innovation', page.innovationLabel, page.innovationTitle, page.innovationSubtitle);
        populateIconCards('.lds-innovation-grid', page.innovationCards, 'cloud-power-card');

        populateSectionHeader('#use-cases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
        populateIconCards('.cloud-use-grid, .lds-usecase-grid', page.useCases, 'cloud-use-card');

        if (page.testimonialTitle) setText(document, '#lds-testimonials .testi-title', page.testimonialTitle);
        initTestimonials(page.testimonials, {
            grid: 'lds-testi-grid',
            dots: 'lds-testi-dots',
            prev: 'lds-testi-prev',
            next: 'lds-testi-next'
        });

        if (page.faqTitle) setText(document, '#lds-faq .faq-title', page.faqTitle);
        initFAQ(page.faqs, {
            containerId: 'lds-faq-accordions',
            answerPrefix: 'lds-faq'
        });

        populateCtaBand('.cloud-cta-band, .cloud-cta-dark', page.ctaBand1);
    } catch (err) {
        console.error('[linux-dedicated-server] CMS load failed:', err);
    }
    hidePageLoader();
})();
