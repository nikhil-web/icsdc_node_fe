import { populateSEO, populateHero, populateIconCards, populateSectionHeader, populateCtaBand, populateChecklist, populateComparisonTable, hidePageLoader, markActiveNavLink, setText, setHTML, initTestimonials, initFAQ } from './utils/cms-helpers.js';
import { getWindowsDedicatedServerPage } from './services/contentService.js';

(async function () {
    'use strict';
    markActiveNavLink();
    try {
        var res = await getWindowsDedicatedServerPage();
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

        // Pricing placeholder
        populateSectionHeader('#pricing', page.pricingLabel, page.pricingTitle, null);
        if (page.pricingDescription) {
            setHTML(document.getElementById('pricing'), '.subtitle, p', page.pricingDescription);
        }

        // About with checklist items
        populateSectionHeader('#about', page.aboutLabel, page.aboutTitle, null);
        if (page.aboutDescription) {
            setHTML(document.getElementById('about'), '.who-we-are-paragraph, p.subtitle', page.aboutDescription);
        }
        populateChecklist('.wds-about-list', page.aboutItems);

        populateSectionHeader('#features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
        populateIconCards('.cloud-power-grid', page.features, 'cloud-power-card');

        populateSectionHeader('#comparison', page.comparisonLabel, page.comparisonTitle, page.comparisonSubtitle);
        populateComparisonTable('.compare-table', page.comparisonColumns, page.comparisonRows);

        populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

        populateSectionHeader('#why-choose', page.whyLabel, page.whyTitle, page.whySubtitle);
        populateIconCards('.wds-why-grid', page.whyCards, 'cloud-power-card');

        populateSectionHeader('#ready', page.readyLabel, page.readyTitle, page.readySubtitle);
        populateIconCards('.wds-ready-grid', page.readyCards, 'cloud-power-card');

        populateSectionHeader('#use-cases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
        populateIconCards('.cloud-use-grid', page.useCases, 'cloud-use-card');

        if (page.testimonialTitle) setText(document, '#wds-testi-heading', page.testimonialTitle);
        initTestimonials(page.testimonials, {
            grid: 'wds-testi-grid',
            dots: 'wds-testi-dots',
            prev: 'wds-testi-prev',
            next: 'wds-testi-next'
        });

        if (page.faqTitle) setText(document, '#wds-faq-heading', page.faqTitle);
        initFAQ(page.faq, {
            containerId: 'wds-faq-accordions',
            answerPrefix: 'wds-faq'
        });

        populateCtaBand('.cloud-cta-dark', page.ctaBand2);
    } catch (err) {
        console.error('[windows-dedicated-server] CMS load failed:', err);
    }
    hidePageLoader();
})();
