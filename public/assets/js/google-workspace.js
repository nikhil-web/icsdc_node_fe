import { getGoogleWorkspacePage } from './services/contentService.js';
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

    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('.gws-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (plan) {
            var badgeHtml = plan.isPopular
                ? '<div class="gws-plan-badge">Most Popular</div>'
                : '';
            var popularClass = plan.isPopular ? ' gws-plan-popular' : '';

            var featuresHtml = '';
            if (plan.features && plan.features.length) {
                featuresHtml = plan.features.map(function (f) {
                    return '<li>' + (f.text || f) + '</li>';
                }).join('');
            }

            return '<div class="gws-plan-card' + popularClass + '">' +
                badgeHtml +
                '<div class="gws-plan-name">' + (plan.name || '') + '</div>' +
                '<div class="gws-plan-price">' + (plan.price || '') +
                '<span>' + (plan.priceSuffix || '/user/month') + '</span>' +
                '</div>' +
                (plan.description ? '<p style="font-size:13px;color:var(--muted);margin:12px 0 0;">' + plan.description + '</p>' : '') +
                '<ul class="gws-plan-features">' + featuresHtml + '</ul>' +
                '<button class="gws-plan-btn">' + (plan.ctaLabel || 'Get Started &rarr;') + '</button>' +
                '</div>';
        }).join('');
    }

    function populateSteps(steps) {
        if (!steps || !steps.length) return;
        var grid = document.querySelector('#how-it-works .gws-steps');
        if (!grid) return;

        var sorted = steps.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (step, i) {
            var arrow = i < sorted.length - 1
                ? '<div class="gws-step-arrow">&#8250;</div>'
                : '';
            return '<div class="gws-step">' +
                '<div class="gws-step-num">' + (step.number || i + 1) + '</div>' +
                '<h3>' + (step.title || '') + '</h3>' +
                '<p>' + (step.description || '') + '</p>' +
                arrow +
                '</div>';
        }).join('');
    }

    function populateFaqContact(page) {
        var card = document.querySelector('.faq-contact-card');
        if (!card) return;

        if (page.faqContactTitle) setHTML(card, '.faq-contact-title', page.faqContactTitle);
        if (page.faqContactDescription) setHTML(card, '.faq-contact-desc', page.faqContactDescription);

        if (page.faqContactBtnLabel) {
            var btn = card.querySelector('.faq-contact-btn');
            if (btn) {
                var svg = btn.querySelector('svg');
                btn.textContent = page.faqContactBtnLabel + ' ';
                if (svg) btn.appendChild(svg);
                if (page.faqContactBtnUrl) btn.setAttribute('href', page.faqContactBtnUrl);
            }
        }
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getGoogleWorkspacePage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.gws-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });

            // Hero badges
            if (page.heroTopBadge) setHTML(document, '.gws-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.gws-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.gws-bs', page.heroStatusSubtitle);

            // 4 Pillars (why-us)
            if (page.pillars) {
                populateIconCards('.why-us .why-grid', page.pillars, 'why-card');
            }

            // Plans section
            if (page.plansLabel || page.plansTitle || page.plansSubtitle) {
                populateSectionHeader('#gws-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            }
            if (page.plans) {
                populatePlans(page.plans);
            }

            // Features section
            if (page.featuresLabel || page.featuresTitle || page.featuresSubtitle) {
                populateSectionHeader('#features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            }
            if (page.features) {
                populateIconCards('.cloud-power-grid', page.features, 'cloud-power-card');
            }

            // CTA Band 1
            if (page.ctaBand1) {
                populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);
            }

            // Why ICSDC section
            if (page.whyLabel || page.whyTitle || page.whySubtitle) {
                populateSectionHeader('#why-icsdc', page.whyLabel, page.whyTitle, page.whySubtitle);
            }
            if (page.whyCards) {
                populateIconCards('#why-icsdc .cloud-use-grid', page.whyCards, 'cloud-use-card');
            }

            // How it works steps
            if (page.stepsLabel || page.stepsTitle || page.stepsSubtitle) {
                populateSectionHeader('#how-it-works', page.stepsLabel, page.stepsTitle, page.stepsSubtitle);
            }
            if (page.steps) {
                populateSteps(page.steps);
            }

            // Testimonials
            if (page.testimonialTitle) {
                setText(document, '#testi-heading', page.testimonialTitle);
            }
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) {
                setText(document, '#gws-faq-heading', page.faqTitle);
            }
            initFAQ(page.faq);
            populateFaqContact(page);

            // Final CTA dark band
            if (page.ctaBand2) {
                populateCtaBand('.cloud-cta-dark', page.ctaBand2);
            }

        } catch (err) {
            console.error('[google-workspace] Failed to load CMS data:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
