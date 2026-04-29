// ══════════════════════════════════════════════════════════
//  contact-us.js — ICSDC Contact Us Page
// ══════════════════════════════════════════════════════════

import { getContactUsPage } from './services/contentService.js';
import {
    populateSEO,
    populateIconCards,
    hidePageLoader,
    markActiveNavLink,
    setText,
} from './utils/cms-helpers.js';

(function () {
    'use strict';

    function escapeHTML(str) {
        return String(str || '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function populateSteps(steps) {
        if (!steps || !steps.length) return;
        var flow = document.getElementById('cu-steps-flow');
        if (!flow) return;
        flow.innerHTML = steps.map(function (step, i) {
            return '<div class="cu-step">' +
                '<div class="cu-step-number">' + String(i + 1).padStart(2, '0') + '</div>' +
                '<h3 class="cu-step-title">' + escapeHTML(step.title) + '</h3>' +
                '<p class="cu-step-desc">' + escapeHTML(step.description || step.desc || '') + '</p>' +
                '</div>';
        }).join('<div class="cu-step-connector" aria-hidden="true"></div>');
    }

    function populateContactInfo(page) {
        if (page.contactEmail) setText(document, '#cu-contact-email', page.contactEmail);
        if (page.contactPhone) setText(document, '#cu-contact-phone', page.contactPhone);
        if (page.contactAddress) setText(document, '#cu-contact-address', page.contactAddress);
        if (page.officeHours) setText(document, '#cu-contact-hours', page.officeHours);
    }

    // Basic form submission handler
    function initContactForm() {
        var form = document.getElementById('cu-form');
        var successMsg = document.getElementById('cu-form-success');
        if (!form) return;
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            // Show success state (real integration can be added later)
            form.style.display = 'none';
            if (successMsg) successMsg.style.display = 'flex';
        });
    }

    async function init() {
        markActiveNavLink();
        initContactForm();

        try {
            var response = await getContactUsPage();
            var page = response.data;

            populateSEO(page.seo);

            // Hero
            if (page.heroTitle)       setText(document, '#cu-hero-title', page.heroTitle);
            if (page.heroSubtitle)    setText(document, '#cu-hero-sub', page.heroSubtitle);
            if (page.heroDescription) setText(document, '#cu-hero-desc', page.heroDescription);

            // Help section
            if (page.helpTitle)       setText(document, '#cu-help-title', page.helpTitle);
            if (page.helpDescription) setText(document, '#cu-help-desc', page.helpDescription);
            populateIconCards('#cu-help-grid', page.helpCards, 'cu-help-card');

            // Steps
            if (page.stepsTitle)       setText(document, '#cu-steps-title', page.stepsTitle);
            if (page.stepsDescription) setText(document, '#cu-steps-desc', page.stepsDescription);
            populateSteps(page.steps);

            // CTA row
            if (page.ctaTitle)       setText(document, '#cu-cta-title', page.ctaTitle);
            if (page.ctaDescription) setText(document, '#cu-cta-desc', page.ctaDescription);

            // Contact info
            populateContactInfo(page);

        } catch (err) {
            console.error('[contact-us] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
