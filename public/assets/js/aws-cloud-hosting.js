import { getAwsCloudHostingPage } from './services/contentService.js';

import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    populateWhenCards,
    populateComparisonTable,
    hidePageLoader,
    markActiveNavLink,
    setText,
    setHTML,
    initFAQ,
    initTestimonials
} from './utils/cms-helpers.js';

(function () {

    async function init() {

        markActiveNavLink();

        try {
            var response = await getAwsCloudHostingPage();
            var page = response.data;

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

            // About / Who We Are
            populateSectionHeader('#who-we-are', page.aboutLabel, page.aboutTitle, null);
            if (page.aboutDescription) {
                setHTML(document.getElementById('who-we-are'), '.who-we-are-paragraph', page.aboutDescription);
            }
            if (page.aboutImage) {
                var img = document.querySelector('#who-we-are .who-we-are-image img');
                if (img) img.src = page.aboutImage;
            }
            populateWhenCards('#who-we-are .cloud-numbered-grid', page.aboutItems);

            populateSectionHeader('#strengths', page.strengthsLabel, page.strengthsTitle, page.strengthsSubtitle);
            populateIconCards('.cloud-power-grid', page.strengths, 'cloud-power-card');

            populateSectionHeader('#services', page.servicesLabel, page.servicesTitle, page.servicesSubtitle);

            populateIconCards('.cloud-use-grid', page.services, 'cloud-use-card');

            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            populateSectionHeader('#comparison', page.comparisonLabel, page.comparisonTitle, page.comparisonSubtitle);
            populateComparisonTable('.aws-comparison', page.comparisonColumns, page.comparisonRows);

            populateCtaBand('.cloud-cta-dark', page.ctaBand2);


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
            console.error('[aws-cloud-hosting] CMS load failed:', err);
        }
        hidePageLoader();
        return;
    }


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }


})();



