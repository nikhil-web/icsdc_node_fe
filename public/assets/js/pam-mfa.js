// ══════════════════════════════════════════════════════════
//  pam-mfa.js — ICSDC PAM & MFA Security Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getPamMfaPage } from './services/contentService.js';
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

    /**
     * Render numbered-tip steps into a .pam-step-card grid.
     * Supports both id="pam-steps-list" (How It Works) and
     * id="pam-matters-list" (Why Matters narrative).
     * ds.numbered-tip uses 'description' (NOT 'desc').
     */
    function populatePamStepsGrid(containerId, steps) {
        if (!steps || !steps.length) return;
        var grid = document.getElementById(containerId);
        if (!grid) return;

        var sorted = steps.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (step, idx) {
            var num = step.order || (idx + 1);
            return '<div class="pam-step-card">' +
                '<div class="pam-step-num">' + num + '</div>' +
                '<h3>' + (step.title || '') + '</h3>' +
                '<p>' + (step.description || step.desc || '') + '</p>' +
                '</div>';
        }).join('');
    }

    /**
     * Render numbered-tip steps into the matters narrative list
     * using the .pam-numbered-item layout (badge + body).
     * ds.numbered-tip uses 'description' (NOT 'desc').
     */
    function populatePamMattersSteps(steps) {
        if (!steps || !steps.length) return;
        var list = document.getElementById('pam-matters-list');
        if (!list) return;

        var sorted = steps.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        list.innerHTML = sorted.map(function (step, idx) {
            var num = step.order || (idx + 1);
            return '<li class="pam-numbered-item">' +
                '<div class="pam-numbered-badge">' + num + '</div>' +
                '<div class="pam-numbered-body">' +
                '<h3>' + (step.title || '') + '</h3>' +
                '<p>' + (step.description || step.desc || '') + '</p>' +
                '</div>' +
                '</li>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getPamMfaPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: '&#128272; PAM &amp; MFA Security',
                eyebrowSelector: '.pam-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
            heroImage: page.heroImage
            });

            if (page.heroCtaPrimary) {
                var primaryBtn = document.getElementById('pam-cta-primary');
                if (primaryBtn) {
                    primaryBtn.innerHTML = (page.heroCtaPrimary.text || '') + ' &rarr;';
                    if (page.heroCtaPrimary.link) primaryBtn.setAttribute('onclick', "window.location.href='" + page.heroCtaPrimary.link + "'");
                }
            }
            if (page.heroCtaSecondary) {
                var secondaryBtn = document.getElementById('pam-cta-secondary');
                if (secondaryBtn) {
                    secondaryBtn.textContent = page.heroCtaSecondary.text || '';
                    if (page.heroCtaSecondary.link) secondaryBtn.setAttribute('onclick', "window.location.href='" + page.heroCtaSecondary.link + "'");
                }
            }

            // Pillars (4 cards)
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Why PAM section (6 cards)
            if (page.whyLabel) setText(document, '#pam-why-label', page.whyLabel);
            if (page.whyTitle) setText(document, '#pam-why-title', page.whyTitle);
            populateIconCards('#pam-why-grid', page.whyCards, 'cloud-power-card');

            // CTA Band 1
            populateCtaBand('#pam-cta1', page.ctaBand1);

            // Control Section (7 cards)
            if (page.controlLabel) setText(document, '#pam-control-label', page.controlLabel);
            if (page.controlTitle) setText(document, '#pam-control-title', page.controlTitle);
            populateIconCards('#pam-control-grid', page.controlCards, 'cloud-power-card');

            // Why Matters Narrative
            if (page.mattersTitle) setText(document, '#pam-matters-title', page.mattersTitle);
            if (page.mattersDesc) {
                var mattersDescEl = document.getElementById('pam-matters-desc');
                if (mattersDescEl) mattersDescEl.innerHTML = page.mattersDesc.replace(/\n\n/g, '</p><p>');
            }
            populatePamMattersSteps(page.mattersSteps);

            // Pricing Section
            if (page.pricingTitle) setText(document, '#pam-pricing-title', page.pricingTitle);
            if (page.pricingDesc) setText(document, '#pam-pricing-desc', page.pricingDesc);

            // CTA Band 2
            populateCtaBand('#pam-cta2', page.ctaBand2);

            // How It Works (6 steps)
            if (page.processLabel) setText(document, '#pam-process-label', page.processLabel);
            if (page.processTitle) setText(document, '#pam-process-title', page.processTitle);
            populatePamStepsGrid('pam-steps-list', page.steps);

            // Why Choose ICSDC (6 cards)
            if (page.whyChooseLabel) setText(document, '#pam-why-choose-label', page.whyChooseLabel);
            if (page.whyChooseTitle) setText(document, '#pam-why-choose-title', page.whyChooseTitle);
            populateIconCards('#pam-why-choose-grid', page.whyChooseCards, 'cloud-power-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#pam-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#pam-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 3 (dark)
            populateCtaBand('#pam-cta3', page.ctaBand3);

        } catch (err) {
            console.error('[pam-mfa] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
