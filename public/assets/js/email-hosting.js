import { populateSEO, populateHero, populateIconCards, populateSectionHeader, populateCtaBand, populateSolutionCards, hidePageLoader, markActiveNavLink, initTestimonials, initFAQ, setText } from './utils/cms-helpers.js';
import { getEmailHostingPage } from './services/contentService.js';

(async function () {
    'use strict';
    markActiveNavLink();
    try {
        var res = await getEmailHostingPage();
        var page = res.data;

        populateSEO(page.seo);

        populateHero(document.querySelector('.hero-section'), {
            title: page.heroTitle,
            subtitle: page.heroSubtitle,
            description: page.heroDescription,
            ctaPrimary: page.heroCtaPrimary,
            ctaSecondary: page.heroCtaSecondary
        });

        populateIconCards('.why-grid', page.pillars, 'why-card');

        populateSectionHeader('#features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
        populateIconCards('.cloud-power-grid', page.features, 'cloud-power-card');

        populateSectionHeader('#solutions', page.solutionsLabel, page.solutionsTitle, page.solutionsSubtitle);
        populateSolutionCards('.email-solutions-grid', page.solutions);

        populateSectionHeader('#use-cases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
        populateIconCards('.cloud-power-grid:last-of-type', page.useCases, 'cloud-power-card');

        if (page.testimonialTitle) setText(document, '#email-testi-heading', page.testimonialTitle);
        initTestimonials(page.testimonials);

        // 10. FAQ
        if (page.faqTitle) {
            setText(document, '#faq-title', page.faqTitle);
        }

        initFAQ(page.faq);

        populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);
        populateCtaBand('.cloud-cta-dark', page.ctaBand2);
    } catch (err) {
        console.error('[email-hosting] CMS load failed:', err);
    }
    hidePageLoader();
})();
