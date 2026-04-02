import { populateSEO, populateHero, populateIconCards, populateSectionHeader, populateCtaBand, hidePageLoader, markActiveNavLink, initTestimonials, initFAQ, setText } from './utils/cms-helpers.js';
import { getWindowsVpsHostingPage } from './services/contentService.js';

(async function () {
    'use strict';
    markActiveNavLink();
    try {
        var res = await getWindowsVpsHostingPage();
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

        populateSectionHeader('#security', page.securityLabel, page.securityTitle, page.securitySubtitle);
        populateIconCards('.win-security-grid', page.securityCards, 'win-security-card');

        // Tech stack is stored as JSON (3 groups with title + items)
        populateSectionHeader('#tech-stack', page.techLabel, page.techTitle, page.techSubtitle);

        populateSectionHeader('#use-cases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
        populateIconCards('.cloud-use-grid', page.useCases, 'cloud-use-card');

        if (page.testimonialTitle) setText(document, '#winvps-testi-heading', page.testimonialTitle);
        initTestimonials(page.testimonials);

        if (page.faqTitle) setText(document, '#winvps-faq-heading', page.faqTitle);
        initFAQ(page.faq);

        populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);
        populateCtaBand('.cloud-cta-dark', page.ctaBand2);
    } catch (err) {
        console.error('[windows-vps-hosting] CMS load failed:', err);
    }
    hidePageLoader();
})();
