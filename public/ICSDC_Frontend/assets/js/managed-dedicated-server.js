// ══════════════════════════════════════════════════════════
//  managed-dedicated-server.js — ICSDC Managed Dedicated Server Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getManagedDedicatedServerPage } from './services/contentService.js';
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

    // ── Helper: set button href/onclick from a cta-link object ──
    function applyCtaButton(btnEl, cta) {
        if (!btnEl || !cta) return;
        if (cta.text) btnEl.textContent = cta.text + ' →';
        if (cta.link) btnEl.onclick = function () { location.href = cta.link; };
    }

    // ── Helper: set anchor element from a cta-link object ──
    function applyCtaAnchor(anchorEl, cta) {
        if (!anchorEl || !cta) return;
        if (cta.text) anchorEl.textContent = cta.text + ' →';
        if (cta.link) anchorEl.href = cta.link;
    }

    // ── Helper: render a JSON string[] as checkmark <li> items ──
    function renderCheckList(listEl, items) {
        if (!listEl || !Array.isArray(items) || items.length === 0) return;
        listEl.innerHTML = items.map(function (item) {
            return '<li><span class="mds-check">&#10003;</span> ' + escapeHTML(item) + '</li>';
        }).join('');
    }

    // ── Helper: escape HTML entities ──
    function escapeHTML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Helper: render multi-paragraph text ──
    function renderParagraphs(el, text) {
        if (!el || !text) return;
        var paras = String(text).split('\n\n').filter(Boolean);
        el.innerHTML = paras.map(function (p) { return '<p>' + p.replace(/\n/g, '<br>') + '</p>'; }).join('');
    }

    // ── Helper: render compare table rows ──
    function renderCompareRows(tbody, rows) {
        if (!tbody || !Array.isArray(rows) || rows.length === 0) return;
        tbody.innerHTML = rows.map(function (row) {
            var selfClass   = row.selfManaged   === '✓' ? 'mds-td-yes' : 'mds-td-no';
            var managedClass = row.fullyManaged === '✓' ? 'mds-td-yes' : 'mds-td-no';
            var selfSymbol   = row.selfManaged   === '✓' ? '&#10003;' : '&#10005;';
            var managedSymbol = row.fullyManaged === '✓' ? '&#10003;' : '&#10005;';
            return '<tr>' +
                '<td>' + escapeHTML(row.feature || '') + '</td>' +
                '<td class="' + selfClass + '">' + selfSymbol + '</td>' +
                '<td class="' + managedClass + '">' + managedSymbol + '</td>' +
                '</tr>';
        }).join('');
    }

    // ── Pricing plans (reuses ds-plan-card CSS from dedicated-server) ──
    function checkSVG() {
        return '<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clip-rule="evenodd"/></svg>';
    }

    function populatePricingPlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.getElementById('mds-pricing-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (plan) {
            var featuredClass = plan.isFeatured ? ' ds-featured' : '';
            var badge = plan.isFeatured && plan.badge
                ? '<span class="ds-plan-badge">' + plan.badge + '</span>'
                : '';
            var ctaClass = plan.ctaStyle === 'primary' ? 'ds-plan-cta-primary' : 'ds-plan-cta-outline';
            var ctaArrow = plan.ctaStyle === 'primary' ? ' &rarr;' : '';

            var featuresHTML = '';
            if (plan.features && plan.features.length) {
                featuresHTML = plan.features.map(function (f) {
                    return '<li class="ds-plan-feature">' +
                        '<span class="ds-plan-check">' + checkSVG() + '</span>' +
                        escapeHTML(f.label) +
                        '</li>';
                }).join('');
            }

            return '<div class="ds-plan-card' + featuredClass + '">' +
                badge +
                '<div class="ds-plan-tier">' + escapeHTML(plan.tier) + '</div>' +
                '<div class="ds-plan-price-wrap">' +
                '<span class="ds-plan-currency">' + (plan.currency || '₹') + '</span>' +
                '<span class="ds-plan-price">' + plan.price + '</span>' +
                '<span class="ds-plan-period">' + (plan.period || '/mo') + '</span>' +
                '</div>' +
                (plan.tagline ? '<p class="ds-plan-tagline">' + escapeHTML(plan.tagline) + '</p>' : '') +
                '<hr class="ds-plan-divider">' +
                '<ul class="ds-plan-features">' + featuresHTML + '</ul>' +
                '<button class="ds-plan-cta ' + ctaClass + '" onclick="location.href=\'#contact\'">' +
                escapeHTML(plan.ctaText || 'Get Started') + ctaArrow +
                '</button>' +
                '</div>';
        }).join('');
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getManagedDedicatedServerPage();
            var page = response.data;

            // ── SEO ──
            populateSEO(page.seo);

            // ── Hero ──
            populateHero('.hero-section', {
                eyebrowSelector: '.mds-eyebrow',
                title:       page.heroTitle,
                subtitle:    page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary:  page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
            heroImage: page.heroImage
            });
            // Override eyebrow text for MDS (no dynamic eyebrow field in schema)
            var heroTitle = document.getElementById('mds-hero-title');
            if (heroTitle && page.heroTitle) heroTitle.textContent = page.heroTitle;

            var heroSub = document.getElementById('mds-hero-subtitle');
            if (heroSub && page.heroSubtitle) heroSub.textContent = page.heroSubtitle;

            var heroDesc = document.getElementById('mds-hero-desc');
            if (heroDesc && page.heroDescription) heroDesc.textContent = page.heroDescription;

            applyCtaButton(document.getElementById('mds-cta-primary'),   page.heroCtaPrimary);
            applyCtaButton(document.getElementById('mds-cta-secondary'), page.heroCtaSecondary);

            // ── Pillars (4 why-us cards) ──
            populateIconCards('#mds-pillars-grid', page.pillars, 'why-card');

            // ── Plans / Pricing section ──
            setText(document, '#mds-plans-title',    page.plansTitle);
            setText(document, '#mds-plans-subtitle', page.plansSubtitle);
            populatePricingPlans(page.pricingPlans);

            // ── About section ──
            setText(document, '#mds-about-title', page.aboutTitle);
            renderParagraphs(document.getElementById('mds-about-desc'), page.aboutDesc);
            if (page.aboutNote) {
                var noteEl = document.getElementById('mds-about-note');
                if (noteEl) {
                    var noteIcon = noteEl.querySelector('svg');
                    noteEl.textContent = page.aboutNote;
                    if (noteIcon) noteEl.prepend(noteIcon);
                }
            }

            // ── Standout Cards (8 cards) ──
            populateSectionHeader('#mds-standout', page.standoutLabel, page.standoutTitle, null);
            populateIconCards('#mds-standout-grid', page.standoutCards, 'cloud-power-card');

            // ── Cross-sell promo banners ──
            setText(document, '#mds-baremetal-title', page.baremetalPromoTitle);
            setText(document, '#mds-baremetal-desc',  page.baremetalPromoDesc);
            applyCtaAnchor(document.getElementById('mds-baremetal-cta'), page.baremetalPromoCta);

            setText(document, '#mds-cloud-title', page.cloudPromoTitle);
            setText(document, '#mds-cloud-desc',  page.cloudPromoDesc);
            applyCtaAnchor(document.getElementById('mds-cloud-cta'), page.cloudPromoCta);

            // ── Why Choose ──
            setText(document, '#mds-why-title', page.whyChooseTitle);
            setText(document, '#mds-why-desc',  page.whyChooseDesc);
            renderCheckList(document.getElementById('mds-why-list'), page.whyChooseList);

            // ── Who Should Choose (8 cards) ──
            var whoLabel = document.getElementById('mds-who-label');
            if (whoLabel && page.whoLabel) whoLabel.textContent = page.whoLabel;
            setText(document, '#mds-who-title', page.whoTitle);
            populateIconCards('#mds-who-grid', page.whoCards, 'cloud-power-card');

            // ── OS section ──
            setText(document, '#mds-os-title', page.osTitle);
            setText(document, '#mds-os-desc',  page.osDesc);

            // ── Compare table ──
            setText(document, '#mds-compare-title', page.compareTitle);
            renderCompareRows(document.getElementById('mds-compare-tbody'), page.compareRows);

            // ── When to choose ──
            setText(document, '#mds-when-title', page.whenTitle);
            setText(document, '#mds-when-desc',  page.whenDesc);
            renderCheckList(document.getElementById('mds-when-list'), page.whenList);

            // ── Testimonials ──
            if (page.testimonialTitle) setText(document, '#mds-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // ── FAQ ──
            if (page.faqTitle) setText(document, '#mds-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // ── CTA Band ──
            populateCtaBand('#mds-cta1', page.ctaBand1);

        } catch (err) {
            console.error('[managed-dedicated-server] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
