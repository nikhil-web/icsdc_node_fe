// ══════════════════════════════════════════════════════════
//  contact-modal.js — Reusable Contact Us popup
//  Reuses the same form markup + submit pipeline as contact-us.html.
//  Exposes window.openContactPopup() and auto-binds delegated clicks.
// ══════════════════════════════════════════════════════════

import { postAPI } from './services/strapiClient.js';

let modal = null;          // backdrop element (lazy-built on first open)
let isOpen = false;

// ── Build the modal DOM the first time it's needed ──────────
function buildModal() {
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'cmp-backdrop';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
        '<div class="cmp-card" role="dialog" aria-modal="true" aria-labelledby="cmp-title">' +
        '<button type="button" class="cmp-close" aria-label="Close">&times;</button>' +
        '<div class="cmp-grid">' +
        '<aside class="cmp-side">' +
        '<img class="cmp-side-logo" alt="" />' +
        '<div class="cmp-side-eyebrow">' +
        '<i class="fa-solid fa-comments" aria-hidden="true"></i> Contact ICSDC' +
        '</div>' +
        '<h3 id="cmp-title" class="cmp-side-title">Let’s talk infrastructure.</h3>' +
        '<p class="cmp-side-desc">Tell us what you’re building and our team will reach out with a tailored recommendation — no pressure, no spam.</p>' +
        '<ul class="cmp-side-points">' +
        '<li><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Reply within 1 business hour</li>' +
        '<li><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Free architecture consult</li>' +
        '<li><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Migration & scaling expertise</li>' +
        '</ul>' +
        '</aside>' +
        '<div class="cmp-main">' +
        '<form id="cmp-form" class="cu-form" novalidate>' +
        '<div class="cu-form-row">' +
        '<div class="cu-field">' +
        '<label for="cmp-name" class="cu-label">Your Name <span class="cu-required">*</span></label>' +
        '<input type="text" id="cmp-name" name="name" class="cu-input" placeholder="John Smith" required>' +
        '</div>' +
        '<div class="cu-field">' +
        '<label for="cmp-email" class="cu-label">Email Address <span class="cu-required">*</span></label>' +
        '<input type="email" id="cmp-email" name="email" class="cu-input" placeholder="john@company.com" required>' +
        '</div>' +
        '</div>' +
        '<div class="cu-form-row">' +
        '<div class="cu-field">' +
        '<label for="cmp-phone" class="cu-label">Phone Number</label>' +
        '<input type="tel" id="cmp-phone" name="phone" class="cu-input" placeholder="+91 98765 43210">' +
        '</div>' +
        '<div class="cu-field">' +
        '<label for="cmp-company" class="cu-label">Company / Organization</label>' +
        '<input type="text" id="cmp-company" name="company" class="cu-input" placeholder="Your Company Ltd.">' +
        '</div>' +
        '</div>' +
        '<div class="cu-field">' +
        '<label for="cmp-subject" class="cu-label">What Can We Help You With? <span class="cu-required">*</span></label>' +
        '<select id="cmp-subject" name="subject" class="cu-input cu-select" required>' +
        '<option value="" disabled selected>Select a topic…</option>' +
        '<option value="vps-cloud">VPS / Cloud Hosting Questions</option>' +
        '<option value="infrastructure">Infrastructure Planning</option>' +
        '<option value="migration">Migration &amp; Performance</option>' +
        '<option value="security">Security &amp; Compliance</option>' +
        '<option value="pricing">Pricing &amp; Plans</option>' +
        '<option value="partnerships">Partnerships &amp; Reseller</option>' +
        '<option value="support">Technical Support</option>' +
        '<option value="other">Other / General Inquiry</option>' +
        '</select>' +
        '</div>' +
        '<div class="cu-field">' +
        '<label for="cmp-message" class="cu-label">Your Message <span class="cu-required">*</span></label>' +
        '<textarea id="cmp-message" name="message" class="cu-input cu-textarea" rows="4" ' +
        'placeholder="Tell us about your requirement, current setup, or any questions you have…" required></textarea>' +
        '</div>' +
        '<button type="submit" class="cu-submit-btn">Send Message </button>' +
        '</form>' +
        '<div id="cmp-form-success" class="cu-form-success" style="display:none;">' +
        '<div class="cu-success-icon"><i class="fa-solid fa-circle-check" aria-hidden="true"></i></div>' +
        '<h3>Message Sent!</h3>' +
        '<p>Thank you for reaching out. Our team will get back to you shortly.</p>' +
        '</div>' +
        '</div>' +          /* /.cmp-main */
        '</div>' +              /* /.cmp-grid */
        '</div>';                   /* /.cmp-card */

    document.body.appendChild(modal);

    // Reuse the navbar's company logo (already populated by initMainLogo in main.js)
    const navLogo = document.querySelector('[data-strapi-mainLogo], [data-strapi="mainLogo"]');
    const sideLogo = modal.querySelector('.cmp-side-logo');
    if (navLogo && sideLogo) {
        if (navLogo.src) sideLogo.src = navLogo.src;
        sideLogo.alt = navLogo.alt || 'ICSDC';
        // If the navbar logo hasn't finished loading yet, listen for its load event
        if (!navLogo.complete || !navLogo.src) {
            navLogo.addEventListener('load', function () { sideLogo.src = navLogo.src; }, { once: true });
        }
    }

    // Close handlers
    modal.querySelector('.cmp-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();   // click on backdrop only
    });
    document.addEventListener('keydown', function (e) {
        if (isOpen && e.key === 'Escape') closeModal();
    });

    // Submit handler
    const form = modal.querySelector('#cmp-form');
    form.addEventListener('submit', onSubmit);

    return modal;
}

// ── Validation (mirrors contact-us.js validateForm) ─────────
function validateForm(payload) {
    if (!payload.name) return 'Please enter your name.';
    if (!payload.email) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return 'Please enter a valid email address.';
    if (!payload.subject) return 'Please select a subject.';
    if (!payload.message) return 'Please enter your message.';
    return null;
}

function showFieldError(form, message) {
    form.querySelectorAll('.cu-form-error').forEach(function (el) { el.remove(); });
    const errEl = document.createElement('p');
    errEl.className = 'cu-form-error';
    errEl.style.cssText = 'color:#e53e3e;margin-top:0.75rem;font-size:0.9rem;';
    errEl.textContent = message;
    form.querySelector('[type=submit]').insertAdjacentElement('beforebegin', errEl);
}

async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const submitBtn = form.querySelector('[type=submit]');
    form.querySelectorAll('.cu-form-error').forEach(function (el) { el.remove(); });

    const payload = {
        name: modal.querySelector('#cmp-name').value.trim(),
        email: modal.querySelector('#cmp-email').value.trim(),
        phone: modal.querySelector('#cmp-phone').value.trim(),
        company: modal.querySelector('#cmp-company').value.trim(),
        subject: modal.querySelector('#cmp-subject').value,
        message: modal.querySelector('#cmp-message').value.trim(),
    };

    const validationError = validateForm(payload);
    if (validationError) {
        showFieldError(form, validationError);
        return;
    }

    submitBtn.disabled = true;
    try {
        await postAPI('/api/contact-submissions', payload);
        form.style.display = 'none';
        const success = modal.querySelector('#cmp-form-success');
        if (success) success.style.display = 'flex';
    } catch (err) {
        submitBtn.disabled = false;
        showFieldError(form, 'Something went wrong. Please try again or email us directly.');
        console.error('[contact-modal] Submission failed:', err);
    }
}

// ── Open / close ────────────────────────────────────────────
function openModal() {
    buildModal();
    // Reset to fresh form state every time
    const form = modal.querySelector('#cmp-form');
    const success = modal.querySelector('#cmp-form-success');
    form.reset();
    form.style.display = '';
    if (success) success.style.display = 'none';
    form.querySelectorAll('.cu-form-error').forEach(function (el) { el.remove(); });
    const submitBtn = form.querySelector('[type=submit]');
    if (submitBtn) submitBtn.disabled = false;

    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cmp-scroll-lock');
    requestAnimationFrame(function () { modal.classList.add('is-open'); });
    isOpen = true;
    setTimeout(function () {
        const first = modal.querySelector('#cmp-name');
        if (first) first.focus();
    }, 80);
}

function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cmp-scroll-lock');
    isOpen = false;
}

// ── Delegated click handler (idempotent) ────────────────────
function attachDelegatedHandler() {
    if (window.__icsdc_contactModalLoaded) return;
    window.__icsdc_contactModalLoaded = true;
    document.addEventListener('click', function (e) {
        const trigger = e.target.closest(
            'a[href="contact-popup"], a[href="#contact-popup"], [data-cta-popup]'
        );
        if (!trigger) return;
        e.preventDefault();
        openModal();
    });
}

// ── Public API ──────────────────────────────────────────────
export function initContactModal() {
    attachDelegatedHandler();
}

// Also expose globally for the cms-helpers onclick wiring
window.openContactPopup = openModal;

// Auto-init on import so the delegated handler is always attached
attachDelegatedHandler();
