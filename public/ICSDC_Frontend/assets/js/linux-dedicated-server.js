import { populateSEO, populateHero, hidePageLoader, markActiveNavLink, setText, setHTML, initTestimonials, initFAQ } from './utils/cms-helpers.js';
import { getLinuxDedicatedServerPage } from './services/contentService.js';

(async function () {
    'use strict';
    markActiveNavLink();
    try {
        var res = await getLinuxDedicatedServerPage();
        var page = res.data;

        populateSEO(page.seo);

        // ── HERO ──────────────────────────────────────────────────────────────────
        populateHero(document.querySelector('.hero-section'), {
            title: page.heroTitle,
            subtitle: page.heroSubtitle,
            description: page.heroDescription,
            ctaPrimary: page.heroCtaPrimary,
            ctaSecondary: page.heroCtaSecondary,
            heroImage: page.heroImage
        });
        // Eyebrow uses .lds-eyebrow (populateHero looks for .eyebrow-badge)
        if (page.heroEyebrow) {
            var eyebrowEl = document.querySelector('.lds-eyebrow');
            if (eyebrowEl) {
                var dot = eyebrowEl.querySelector('.lds-eyebrow-dot');
                eyebrowEl.textContent = ' ' + page.heroEyebrow;
                if (dot) eyebrowEl.insertBefore(dot, eyebrowEl.firstChild);
            }
        }

        // ── SECTION 2: FOUR PILLAR CARDS ─────────────────────────────────────────
        // desc is null in Strapi — update only h3 titles to preserve static descriptions
        ldsUpdateCardTitles('.why-grid .why-card', page.pillars);

        // ── SECTION 3: PRICING ───────────────────────────────────────────────────
        ldsPopulateSectionHeader('lds-pricing', page.pricingLabel, page.pricingTitle, page.pricingSubtitle);
        ldsPopulatePricingPlans('.lds-pricing-grid', page.pricingPlans);

        // ── SECTION 4: WHAT ARE LDS ──────────────────────────────────────────────
        var whatSection = document.getElementById('lds-what');
        if (whatSection) {
            if (page.whatLabel) {
                var lbl = whatSection.querySelector('.lds-section-label');
                if (lbl) lbl.textContent = page.whatLabel;
            }
            if (page.whatTitle) setHTML(whatSection, '.lds-what-title', page.whatTitle);
            if (page.whatDescription) {
                // Split on double newline to get separate paragraphs
                var paragraphs = page.whatDescription.split(/\n\n+/);
                var bodies = whatSection.querySelectorAll('.lds-what-body');
                var content = whatSection.querySelector('.lds-what-content');
                paragraphs.forEach(function (text, i) {
                    if (!text.trim()) return;
                    if (bodies[i]) {
                        bodies[i].innerHTML = text.trim();
                    } else if (content) {
                        var p = document.createElement('p');
                        p.className = 'lds-what-body';
                        p.innerHTML = text.trim();
                        var btns = content.querySelector('.hero-btns');
                        if (btns) content.insertBefore(p, btns);
                        else content.appendChild(p);
                    }
                });
            }
        }

        // ── SECTION 5: WHY BUSINESSES CHOOSE ─────────────────────────────────────
        ldsPopulateSectionHeader('lds-why', page.whyLabel, page.whyTitle, page.whySubtitle);
        ldsUpdateCardTitles('.lds-why-grid .lds-why-card', page.whyCards);

        // ── SECTION 6: COMPARISON TABLE ──────────────────────────────────────────
        ldsPopulateSectionHeader('lds-compare', page.comparisonLabel, page.comparisonTitle, null);
        ldsPopulateComparisonTable(page.comparisonColumns, page.comparisonRows);

        // ── SECTION 7: SPECS ─────────────────────────────────────────────────────
        ldsPopulateSectionHeader('lds-specs', page.specsLabel, page.specsTitle, page.specsDescription);
        ldsPopulateSpecsCards(page.specsItems);

        // ── SECTION 8: SUPPORT ───────────────────────────────────────────────────
        ldsPopulateSectionHeader('lds-support', page.supportLabel, page.supportTitle, page.supportSubtitle);
        ldsUpdateCardTitles('.lds-support-grid .lds-support-card', page.supportCards);

        // ── SECTION 9: AI/ML INNOVATION ──────────────────────────────────────────
        ldsPopulateSectionHeader('lds-innovation', page.innovationLabel, page.innovationTitle, page.innovationSubtitle);
        ldsUpdateCardTitles('.lds-innovation-grid .lds-innovation-card', page.innovationCards);

        // ── SECTION 10: USE CASES ────────────────────────────────────────────────
        ldsPopulateSectionHeader('lds-usecases', page.useCasesLabel, page.useCasesTitle, null);
        ldsUpdateCardTitles('.lds-usecase-grid .lds-usecase-card', page.useCases);

        // ── TESTIMONIALS ─────────────────────────────────────────────────────────
        if (page.testimonialTitle) setText(document, '#lds-testimonials .testi-title', page.testimonialTitle);
        initTestimonials(page.testimonials, {
            grid: 'lds-testi-grid',
            dots: 'lds-testi-dots',
            prev: 'lds-testi-prev',
            next: 'lds-testi-next'
        });

        // ── FAQ ───────────────────────────────────────────────────────────────────
        if (page.faqTitle) setText(document, '#lds-faq .faq-title', page.faqTitle);
        initFAQ(page.faq);

        // ── FINAL CTA BAND ────────────────────────────────────────────────────────
        ldsPopulateCtaBand(page.ctaBand1);

    } catch (err) {
        console.error('[linux-dedicated-server] CMS load failed:', err);
    }
    hidePageLoader();
})();

// ── PAGE-SPECIFIC HELPERS ────────────────────────────────────────────────────

/**
 * Update a section's label / title / subtitle by section ID.
 * Uses .lds-section-label (not .cloud-section-label / .ds-section-label).
 */
function ldsPopulateSectionHeader(sectionId, label, title, subtitle) {
    var section = document.getElementById(sectionId);
    if (!section) return;
    if (label) {
        var lbl = section.querySelector('.lds-section-label');
        if (lbl) lbl.textContent = label;
    }
    if (title) {
        var h2 = section.querySelector('.title');
        if (h2) h2.innerHTML = title;
    }
    if (subtitle) {
        var sub = section.querySelector('.subtitle');
        if (sub) sub.innerHTML = subtitle;
    }
}

/**
 * Update only the h3 titles of existing cards from a CMS array.
 * Preserves static descriptions / CTA links (desc is null in Strapi for these sections).
 */
function ldsUpdateCardTitles(cardsSelector, items) {
    if (!items || !items.length) return;
    var cards = document.querySelectorAll(cardsSelector);
    var sorted = items.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    sorted.forEach(function (item, i) {
        var card = cards[i];
        if (!card) return;
        var h3 = card.querySelector('h3');
        if (h3) h3.innerHTML = item.title || '';
        if ((item.desc || item.description) && card.querySelector('p')) {
            card.querySelector('p').innerHTML = item.desc || item.description;
        }
    });
}

/**
 * Populate pricing grid with lds-plan-* CSS classes (not ds-plan-*).
 */
function ldsPopulatePricingPlans(gridSelector, plans) {
    if (!plans || !plans.length) return;
    var grid = document.querySelector(gridSelector);
    if (!grid) return;
    var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    grid.innerHTML = sorted.map(function (plan) {
        var featuredClass = plan.isFeatured ? ' lds-featured' : '';
        var badge = plan.isFeatured && plan.badge
            ? '<span class="lds-plan-badge">' + plan.badge + '</span>'
            : '';
        var ctaClass = plan.ctaStyle === 'primary' ? 'lds-plan-cta-primary' : 'lds-plan-cta-secondary';
        var featuresHTML = (plan.features || []).map(function (f) {
            return '<li class="lds-plan-spec">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">' +
                '<polyline points="20 6 9 17 4 12"/></svg>' +
                (f.label || '') + '</li>';
        }).join('');
        return '<div class="lds-plan-card' + featuredClass + '">' +
            badge +
            '<p class="lds-plan-tier">' + (plan.tier || '') + '</p>' +
            '<div class="lds-plan-price-wrap">' +
            '<span class="lds-plan-currency">' + (plan.currency || '&#8377;') + '</span>' +
            '<span class="lds-plan-price">' + (plan.price || '') + '</span>' +
            '<span class="lds-plan-period">' + (plan.period || '/mo') + '</span>' +
            '</div>' +
            (plan.tagline ? '<p class="lds-plan-tagline">' + plan.tagline + '</p>' : '') +
            '<hr class="lds-plan-divider">' +
            '<ul class="lds-plan-specs">' + featuresHTML + '</ul>' +
            '<button class="lds-plan-cta ' + ctaClass + '">' + (plan.ctaText || '') + '</button>' +
            '</div>';
    }).join('');
}

/**
 * Populate .lds-compare-table with correct column order:
 * Feature | Self-Managed (icsdc) | Fully Managed (others)
 */
function ldsPopulateComparisonTable(columns, rows) {
    var table = document.querySelector('.lds-compare-table');
    if (!table) return;
    if (columns && columns.length) {
        var ths = table.querySelectorAll('thead th');
        columns.forEach(function (col, i) {
            if (ths[i]) ths[i].textContent = col;
        });
    }
    if (!rows || !rows.length) return;
    var tbody = table.querySelector('tbody');
    if (!tbody) return;
    var sorted = rows.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    tbody.innerHTML = sorted.map(function (r) {
        var selfIcon = r.icsdcStatus === 'check'
            ? '<span class="lds-compare-check">&#x2705;</span> '
            : '<span class="lds-compare-cross">&#x274C;</span> ';
        var managedIcon = r.othersStatus === 'check'
            ? '<span class="lds-compare-check">&#x2705;</span> '
            : '<span class="lds-compare-cross">&#x274C;</span> ';
        return '<tr>' +
            '<td>' + (r.feature || '') + '</td>' +
            '<td>' + selfIcon + (r.icsdc || '') + '</td>' +
            '<td>' + managedIcon + (r.others || '') + '</td>' +
            '</tr>';
    }).join('');
}

/**
 * Update existing .lds-specs-card elements:
 * h3 from item.label, .lds-specs-list from item.description.
 */
function ldsPopulateSpecsCards(items) {
    if (!items || !items.length) return;
    var cards = document.querySelectorAll('.lds-specs-grid .lds-specs-card');
    var sorted = items.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    sorted.forEach(function (item, i) {
        var card = cards[i];
        if (!card) return;
        var h3 = card.querySelector('h3');
        if (h3) h3.innerHTML = item.label || '';
        var ul = card.querySelector('.lds-specs-list');
        if (ul && item.description) {
            ul.innerHTML = '<li>' + item.description + '</li>';
        }
    });
}

/**
 * Populate the LDS CTA band using .lds-cta-* class selectors.
 */
function ldsPopulateCtaBand(cta) {
    if (!cta) return;
    var inner = document.querySelector('.lds-cta-band .lds-cta-inner');
    if (!inner) return;
    if (cta.title) {
        var h2 = inner.querySelector('h2');
        if (h2) h2.innerHTML = cta.title;
    }
    if (cta.description) {
        var p = inner.querySelector('p');
        if (p) p.innerHTML = cta.description;
    }
    var btns = inner.querySelector('.lds-cta-btns');
    if (btns) {
        var primaryBtn = btns.querySelector('.lds-cta-btn-primary');
        var outlineBtn = btns.querySelector('.lds-cta-btn-outline');
        if (primaryBtn && cta.ctaPrimary) {
            primaryBtn.innerHTML = cta.ctaPrimary.text || '';
            if (cta.ctaPrimary.link) primaryBtn.setAttribute('onclick', "window.location.href='" + cta.ctaPrimary.link + "'");
        }
        if (outlineBtn && cta.ctaSecondary) {
            outlineBtn.innerHTML = cta.ctaSecondary.text || '';
            if (cta.ctaSecondary.link) outlineBtn.setAttribute('onclick', "window.location.href='" + cta.ctaSecondary.link + "'");
        }
    }
}
