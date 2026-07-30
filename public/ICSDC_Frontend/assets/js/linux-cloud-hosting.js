import { getLinuxCloudHostingPage } from './services/contentService.js';
import { inlineRichText } from './utils/cms-helpers.js';
import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    populatePricingPlans,
    hidePageLoader,
    markActiveNavLink,
    setText,
    initFAQ,
    initTestimonials
} from './utils/cms-helpers.js';

(function () {
    'use strict';

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
                ctaSecondary: page.heroCtaSecondary,
            heroImage: page.heroImage
            });

            // 3 — Hero badges
            if (page.heroTopBadge) setText(document, '.lch-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.lch-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.lch-bs', page.heroStatusSubtitle);

            // 4 — Why-Us pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // 5 — Plans
            populateSectionHeader('#lch-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePricingPlans('#lch-pricing-grid', page.plans);

            // 4 — Why Need (prose)
            if (page.whyNeedTitle) setText(document, '#lch-why-need .title', page.whyNeedTitle);
            if (page.whyNeedDesc) {
                var whyNeedEl = document.getElementById('lch-why-need-body');
                if (whyNeedEl) {
                    whyNeedEl.innerHTML = page.whyNeedDesc
                        .split(/\n{2,}/)
                        .map(function (p) { var t = p.trim(); return t ? '<p>' + t + '</p>' : ''; })
                        .join('');
                }
            }

            // 6 — Power features
            populateSectionHeader('#power', page.powerLabel, page.powerTitle, page.powerSubtitle);
            populateIconCards('#power .cloud-power-grid', page.powerFeatures, 'cloud-power-card');

            // 7 — CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // 8 — Why Choose ICSDC (prose + bullets)
            if (page.whyChooseTitle) setText(document, '#lch-why-choose .title', page.whyChooseTitle);
            if (page.whyChooseDesc) setText(document, '#lch-why-choose-desc', page.whyChooseDesc);
            if (page.whyChoosePoints && page.whyChoosePoints.length) {
                var wcList = document.getElementById('lch-why-choose-list');
                if (wcList) {
                    wcList.innerHTML = page.whyChoosePoints.map(function (point) {
                        return '<li><span class="lch-wc-check"><i class="fa-solid fa-check" aria-hidden="true"></i></span>' +
                            point + '</li>';
                    }).join('');
                }
            }

            // 9 — Use Cases
            populateSectionHeader('#use-cases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
            populateIconCards('#use-cases .cloud-use-grid', page.useCases, 'cloud-use-card');

            // 10 — Workloads / Specs
            populateSectionHeader('#workloads', page.workloadsLabel, page.workloadsTitle, page.workloadsSubtitle);
            populateIconCards('#workloads .cloud-power-grid', page.workloadFeatures, 'cloud-power-card');

            // 11b — Related services cards
            if (page.relatedCards && page.relatedCards.length) {
                var relatedGrid = document.getElementById('lch-related-grid');
                if (relatedGrid) {
                    var arrowSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
                    relatedGrid.innerHTML = page.relatedCards.map(function (card) {
                        var iconClass = card.icon ? 'fa-solid fa-' + card.icon : 'fa-solid fa-cloud';
                        return '<div class="lch-related-card">' +
                            '<div class="lch-related-icon"><i class="' + iconClass + '" aria-hidden="true"></i></div>' +
                            '<p class="lch-related-desc">' + inlineRichText(card.desc || '') + '</p>' +
                            '<a href="' + (card.ctaLink || '#') + '" class="lch-related-btn">' +
                            (card.ctaText || '') + ' ' + arrowSVG +
                            '</a>' +
                            '</div>';
                    }).join('');
                }
            }

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
            if (page.faqContactDesc) {
                var contactDesc = document.querySelector('.faq-contact-desc');
                if (contactDesc) contactDesc.innerHTML = page.faqContactDesc;
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
