import { populateSEO, populateHero, populateIconCards, populateSectionHeader, populateCtaBand, hidePageLoader, markActiveNavLink, initTestimonials, initFAQ, setText } from './utils/cms-helpers.js';
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
            ctaSecondary: page.heroCtaSecondary
        });

        populateIconCards('.why-grid', page.pillars, 'why-card');

        populateSectionHeader('#features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
        populateIconCards('.cloud-power-grid', page.features, 'cloud-power-card');

        populateSectionHeader('#why-choose', page.whyLabel, page.whyTitle, page.whySubtitle);
        populateIconCards('.cloud-why-grid', page.whyCards, 'cloud-power-card');

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

        populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);
        populateCtaBand('.cloud-cta-dark', page.ctaBand2);
    } catch (err) {
        console.error('[windows-cloud-hosting] CMS load failed:', err);
    }
    hidePageLoader();
})();
