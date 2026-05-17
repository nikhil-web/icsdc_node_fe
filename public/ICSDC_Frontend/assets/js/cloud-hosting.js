import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    populatePricingPlansCloud,
    populateWhenCards,
    populateStats,
    populateTechBadges,
    hidePageLoader,
    markActiveNavLink,
    setText,
    setHTML,
    initTestimonials,
    initFAQ
} from './utils/cms-helpers.js';
import { getCloudHostingPage } from './services/contentService.js';

(async function () {
    'use strict';
    markActiveNavLink();
    try {
        var res = await getCloudHostingPage();
        var page = res.data;

        populateSEO(page.seo);

        populateHero(document.querySelector('.hero-section'), {
            eyebrow: page.heroEyebrow,
            title: page.heroTitle,
            subtitle: page.heroSubtitle,
            description: page.heroDescription,
            price: page.heroPrice,
            priceNote: page.heroPriceNote,
            ctaPrimary: page.heroCtaPrimary,
            ctaSecondary: page.heroCtaSecondary,
            heroImage: page.heroImage
        });

        populateIconCards('.why-grid', page.pillars, 'why-card');

        populateSectionHeader('#cloud-pricing', page.pricingLabel, page.pricingTitle, page.pricingSubtitle);
        // populatePricingPlans('.cloud-pricing-grid', page.pricingPlans);

        populatePricingPlansCloud('.cloud-pricing-grid', page.pricingPlans);

        populateSectionHeader('#cloud-features', page.powerLabel, page.powerTitle, page.powerSubtitle);
        populateIconCards('.cloud-power-grid', page.powerFeatures, 'cloud-power-card');

        populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

        populateSectionHeader('#cloud-frameworks', page.frameworksLabel, page.frameworksTitle, page.frameworksSubtitle);
        populateTechBadges('.cloud-frameworks-grid', page.frameworks);

        populateSectionHeader('#cloud-choice', page.choiceLabel, page.choiceTitle, page.choiceSubtitle);
        populateIconCards('.cloud-choice-options', page.choiceCards, 'cloud-choice-card');
        populateWhenCards('.cloud-portal-steps', page.portalSteps);

        populateSectionHeader('#cloud-why', page.whyLabel, page.whyTitle, page.whySubtitle);
        populateWhenCards('.cloud-why-grid', page.whyReasons);

        populateSectionHeader('#cloud-usecases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
        populateIconCards('.cloud-use-grid', page.useCases, 'cloud-use-card');

        populateSectionHeader('#cloud-workloads', page.workloadsLabel, page.workloadsTitle, page.workloadsSubtitle);
        populateIconCards('.cloud-workload-list', page.workloadFeatures, 'cloud-power-card');
        populateStats('.cloud-workload-stats', page.workloadStats);

        populateSectionHeader('#cloud-dashboard', page.dashboardLabel, page.dashboardTitle, page.dashboardSubtitle);
        populateIconCards('.cloud-dashboard-grid', page.dashboardFeatures, 'cloud-power-card');

        populateCtaBand('.cloud-cta-dark', page.ctaBand3);


        if (page.testimonials && page.testimonials.length) {
            initTestimonials(page.testimonials)
        } else {
            //hide the entire section if no testimonials            
            var testiSection = document.getElementsByClassName('testi-section');
            if (testiSection) {
                testiSection.style.display = 'none';
            }
        }

        initFAQ(page.faq);
    } catch (err) {
        console.error('[cloud-hosting] CMS load failed:', err);
    }
    hidePageLoader();
})();
