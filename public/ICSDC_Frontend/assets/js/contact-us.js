// ══════════════════════════════════════════════════════════
//  contact-us.js — ICSDC Contact Us Page
// ══════════════════════════════════════════════════════════

import { getContactUsPage } from './services/contentService.js';
import { postAPI } from './services/strapiClient.js';
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
        if (page.mapEmbedUrl) {
            var mapFrame = document.getElementById('cu-map-iframe');
            if (mapFrame) mapFrame.src = page.mapEmbedUrl;
        }
    }

    function validateForm(payload) {
        if (!payload.name)    return 'Please enter your name.';
        if (!payload.email)   return 'Please enter your email address.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return 'Please enter a valid email address.';
        if (!payload.subject) return 'Please select a subject.';
        if (!payload.message) return 'Please enter your message.';
        return null;
    }

    function showFieldError(form, message) {
        var errEl = document.createElement('p');
        errEl.className = 'cu-form-error';
        errEl.style.cssText = 'color:#e53e3e;margin-top:0.75rem;font-size:0.9rem;';
        errEl.textContent = message;
        form.querySelector('[type=submit]').insertAdjacentElement('beforebegin', errEl);
    }

    function initContactForm() {
        var form = document.getElementById('cu-form');
        var successMsg = document.getElementById('cu-form-success');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var submitBtn = form.querySelector('[type=submit]');
            form.querySelectorAll('.cu-form-error').forEach(function (el) { el.remove(); });

            var payload = {
                name:    document.getElementById('cu-name').value.trim(),
                email:   document.getElementById('cu-email').value.trim(),
                phone:   document.getElementById('cu-phone').value.trim(),
                company: document.getElementById('cu-company').value.trim(),
                subject: document.getElementById('cu-subject').value,
                message: document.getElementById('cu-message').value.trim(),
            };

            var validationError = validateForm(payload);
            if (validationError) {
                showFieldError(form, validationError);
                return;
            }

            submitBtn.disabled = true;

            try {
                await postAPI('/api/contact-submissions', payload);
                form.style.display = 'none';
                if (successMsg) successMsg.style.display = 'flex';
            } catch (err) {
                submitBtn.disabled = false;
                showFieldError(form, 'Something went wrong. Please try again or email us directly.');
                console.error('[contact-us] Submission failed:', err);
            }
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
