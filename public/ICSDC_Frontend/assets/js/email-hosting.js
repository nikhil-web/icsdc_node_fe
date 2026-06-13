// ══════════════════════════════════════════════════════════
//  email-hosting.js — ICSDC Email Hosting Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    populateSolutionCards,
    populatePricingPlansCloud,
    hidePageLoader,
    markActiveNavLink,
    initTestimonials,
    initFAQ,
    setText
} from './utils/cms-helpers.js';
import { getEmailHostingPage } from './services/contentService.js';
import { uploadURL } from './services/strapiClient.js';

(async function () {
    'use strict';
    markActiveNavLink();

    /** Set an <img> src from a common.image component, if present. */
    function setImage(id, imageComp) {
        if (!imageComp || !imageComp.image) return;
        var el = document.getElementById(id);
        if (!el) return;
        var url = uploadURL(imageComp.image);
        if (url) el.src = url;
    }

    /** Render a simple <li> checklist into a <ul> from a JSON string array. */
    function renderList(id, points) {
        if (!points || !points.length) return;
        var ul = document.getElementById(id);
        if (!ul) return;
        ul.innerHTML = points.map(function (p) {
            return '<li>' + (typeof p === 'string' ? p : (p.text || p.label || '')) + '</li>';
        }).join('');
    }

    /** Render numbered blocks ({title, desc}) into a grid.
     *  h3+p are wrapped in a body div so flex-row card layouts work. */
    function renderNumberedBlocks(gridId, blocks, cardClass, numClass) {
        if (!blocks || !blocks.length) return;
        var grid = document.getElementById(gridId);
        if (!grid) return;
        grid.innerHTML = blocks.map(function (b, i) {
            return '<div class="' + cardClass + '">' +
                '<div class="' + numClass + '">' + (i + 1) + '</div>' +
                '<div><h3>' + (b.title || '') + '</h3>' +
                '<p>' + (b.desc || b.description || '') + '</p></div>' +
                '</div>';
        }).join('');
    }

    /** Render the "When to Choose" cards (title only, no description). */
    function renderWhenCards(cards) {
        if (!cards || !cards.length) return;
        var grid = document.querySelector('#use-cases .email-when-grid');
        if (!grid) return;
        var icons = ['fa-award', 'fa-shield', 'fa-bolt', 'fa-users', 'fa-network-wired', 'fa-envelope'];
        grid.innerHTML = cards.map(function (c, i) {
            var desc = (c.desc || c.description || '').trim();
            return '<div class="email-when-card">' +
                '<div class="email-when-icon"><i class="fa-solid ' + (icons[i] || 'fa-circle-check') + '" aria-hidden="true"></i></div>' +
                '<h3>' + (c.title || '') + '</h3>' +
                (desc ? '<p>' + desc + '</p>' : '') +
                '</div>';
        }).join('');
    }

    try {
        var res = await getEmailHostingPage();
        var page = res.data;

        // SEO
        populateSEO(page.seo);

        // Hero
        populateHero(document.querySelector('.hero-section'), {
            title: page.heroTitle,
            subtitle: page.heroSubtitle,
            description: page.heroDescription,
            ctaPrimary: page.heroCtaPrimary,
            ctaSecondary: page.heroCtaSecondary,
            heroImage: page.heroImage
        });

        // Pillars (4)
        populateIconCards('.why-grid', page.pillars, 'why-card');

        // Pricing
        populateSectionHeader('#eh-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
        populatePricingPlansCloud('#eh-plans .cloud-pricing-grid', page.plans);
        document.querySelectorAll('#eh-plans .cloud-plan-cta').forEach(function (btn) {
            btn.addEventListener('click', function () { window.location.href = '/contact-us'; });
        });

        // Who We Are
        if (page.aboutTitle) setText(document, '#eh-about-title', page.aboutTitle);
        if (page.aboutDesc) setText(document, '#eh-about-desc', page.aboutDesc);
        renderList('eh-about-points', page.aboutPoints);
        if (page.aboutCta) {
            var aboutCta = document.getElementById('eh-about-cta');
            if (aboutCta) {
                if (page.aboutCta.text) aboutCta.innerHTML = page.aboutCta.text + ' &rarr;';
                if (page.aboutCta.link) aboutCta.href = page.aboutCta.link;
            }
        }
        setImage('eh-about-img', page.aboutImage);

        // Features (More Than Email)
        populateSectionHeader('#features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
        populateIconCards('#features .cloud-power-grid', page.features, 'cloud-power-card');

        // CTA Band 1
        populateCtaBand('#eh-cta1', page.ctaBand1);

        // Experience the Power
        if (page.experienceTitle) setText(document, '#eh-experience-title', page.experienceTitle);
        if (page.experienceSubtitle) setText(document, '#eh-experience-subtitle', page.experienceSubtitle);
        renderList('eh-experience-points', page.experiencePoints);
        setImage('eh-experience-img', page.experienceImage);

        // Solutions
        populateSectionHeader('#solutions', page.solutionsLabel, page.solutionsTitle, page.solutionsSubtitle);
        populateSolutionCards('#solutions .email-solutions-grid', page.solutions);

        // Digital Handshake
        if (page.handshakeTitle) setText(document, '#eh-handshake-title', page.handshakeTitle);
        if (page.handshakeSubtitle) setText(document, '#eh-handshake-subtitle', page.handshakeSubtitle);
        renderNumberedBlocks('eh-handshake-grid', page.handshakeBlocks, 'eh-handshake-card', 'eh-handshake-num');
        setImage('eh-handshake-img', page.handshakeImage);

        // CTA Band 2
        populateCtaBand('#eh-cta2', page.ctaBand2);

        // When to Choose
        populateSectionHeader('#use-cases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
        renderWhenCards(page.useCases);
        setImage('eh-when-img', page.whenImage);

        // Real-Time Applications
        if (page.realtimeTitle) setText(document, '#eh-realtime-title', page.realtimeTitle);
        if (page.realtimeSubtitle) setText(document, '#eh-realtime-subtitle', page.realtimeSubtitle);
        renderNumberedBlocks('eh-realtime-grid', page.realtimeBlocks, 'eh-realtime-card', 'eh-realtime-num');
        if (page.realtimeClosing) setText(document, '#eh-realtime-closing', page.realtimeClosing);

        // Testimonials
        if (page.testimonialTitle) setText(document, '#email-testi-heading', page.testimonialTitle);
        initTestimonials(page.testimonials);

        // FAQ
        if (page.faqTitle) setText(document, '#email-faq-heading', page.faqTitle);
        initFAQ(page.faq);

    } catch (err) {
        console.error('[email-hosting] CMS load failed:', err);
    }

    hidePageLoader();
})();
