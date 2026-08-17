import { populateSEO, populateHero, populateIconCards, populateSectionHeader, populateCtaBand, populateComparisonTable, populatePricingPlansCloud, wireCtaLink, hidePageLoader, markActiveNavLink, setText, setHTML, initTestimonials, initFAQ } from './utils/cms-helpers.js';
import { getWindowsDedicatedServerPage } from './services/contentService.js';

// Comparison-table CTAs. These are <button>s, so the destination must go through
// wireCtaLink() — it opens the contact modal for 'contact-popup' and navigates
// otherwise. Never hand-wire an onclick here (see CLAUDE.md).
// Each button is only touched when Strapi actually supplies text, so a blank CMS
// field leaves the HTML fallback label in place rather than emptying the button.
function populateCompareButtons(primary, secondary) {
    var pairs = [
        [primary, '#wds-compare-btns .wds-compare-btn-primary'],
        [secondary, '#wds-compare-btns .wds-compare-btn-outline']
    ];
    pairs.forEach(function (pair) {
        var cta = pair[0];
        var btn = document.querySelector(pair[1]);
        if (!btn || !cta || !cta.text) return;
        btn.textContent = cta.text;
        wireCtaLink(btn, cta.link);
    });
}

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
            ctaSecondary: page.heroCtaSecondary,
            heroImage: page.heroImage
        });

        populateIconCards('.why-grid', page.pillars, 'why-card');

        // Pricing — header + plan cards. populatePricingPlansCloud() wires each
        // CTA to plan.ctaLink, falling back to the site-wide contact popup.
        populateSectionHeader('#wds-pricing', page.pricingLabel, page.pricingTitle, null);
        if (page.pricingDescription) {
            setHTML(document.getElementById('wds-pricing'), '.subtitle, p', page.pricingDescription);
        }
        populatePricingPlansCloud('#wds-pricing .cloud-pricing-grid', page.plans);

        // About with checklist items
        populateSectionHeader('#wds-about', page.aboutLabel, page.aboutTitle, null);
        if (page.aboutDescription) {
            setHTML(document.getElementById('wds-about'), '.wds-about-subtitle', page.aboutDescription);
        }
        if (page.aboutItems && page.aboutItems.length) {
            var aboutUl = document.querySelector('.wds-about-list');
            if (aboutUl) {
                var sortedAbout = page.aboutItems.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
                aboutUl.innerHTML = sortedAbout.map(function (item) {
                    return '<li class="wds-about-item"><i class="fa-solid fa-circle-check" aria-hidden="true"></i><span>' + (item.label || '') + '</span></li>';
                }).join('');
            }
        }

        populateSectionHeader('#wds-features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
        populateIconCards('#wds-features .cloud-power-grid', page.features, 'cloud-power-card');

        populateSectionHeader('#wds-comparison', page.comparisonLabel, page.comparisonTitle, page.comparisonSubtitle);
        populateComparisonTable('.wds-compare-table', page.comparisonColumns, page.comparisonRows);
        populateCompareButtons(page.comparisonCtaPrimary, page.comparisonCtaSecondary);

        populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

        populateSectionHeader('#wds-why', page.whyLabel, page.whyTitle, page.whySubtitle);
        populateIconCards('#wds-why .cloud-power-grid', page.whyCards, 'cloud-power-card');

        populateSectionHeader('#wds-ready', page.readyLabel, page.readyTitle, page.readySubtitle);
        populateIconCards('#wds-ready .cloud-power-grid', page.readyCards, 'cloud-power-card');

        populateSectionHeader('#wds-usecases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
        populateIconCards('.cloud-use-grid', page.useCases, 'cloud-use-card');

        if (page.testimonialTitle) setText(document, '#testi-heading', page.testimonialTitle);
        initTestimonials(page.testimonials, {
            grid: 'wds-testi-grid',
            dots: 'wds-testi-dots',
            prev: 'wds-testi-prev',
            next: 'wds-testi-next'
        });

        if (page.faqTitle) setText(document, '#acr-faq-heading', page.faqTitle);
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
