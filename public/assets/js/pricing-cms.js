/**
 * pricing-cms.js
 * ──────────────
 * Fetches all Pricing page content from Strapi and populates the DOM.
 *
 * Responsibilities:
 *   1. SEO meta tags
 *   2. Hero (eyebrow, title, sub, badges)
 *   3. Sidebar nav (grouped, with dividers)
 *   4. Mobile tab bar
 *   5. Billing toggle row (if applicable)
 *   6. All pricing sections + tables
 *   7. CTA band
 *   8. Show/hide page loader
 *
 * pricing.js handles: scroll-spy, sidebar phase (fixed/relative/absolute),
 * click-to-scroll, billing toggle state — do NOT duplicate that logic here.
 *
 * The billing toggle in pricing.js watches [data-price-monthly] and
 * [data-price-annual] attributes — these exact attribute names are used
 * when rendering price cells that have an annual subValue.
 */

import { getPricingPage } from './services/contentService.js';
import { populateSEO } from './utils/cms-helpers.js';

(function () {
    'use strict';

    /* ─────────────────────────────────────────────────────────
       SAFE TEXT / HTML HELPERS
    ───────────────────────────────────────────────────────── */

    function esc(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function setText(el, text) {
        if (el && text != null) el.textContent = text;
    }

    /* ─────────────────────────────────────────────────────────
       HERO
    ───────────────────────────────────────────────────────── */

    function populateHero(page) {
        // Eyebrow text
        var eyebrowText = document.querySelector('[data-pr="eyebrow-text"]');
        setText(eyebrowText, page.heroEyebrow || '');

        // Title
        var titleEl = document.querySelector('[data-pr="title"]');
        setText(titleEl, page.heroTitle || '');

        // Sub
        var subEl = document.querySelector('[data-pr="sub"]');
        setText(subEl, page.heroSub || '');

        // Badges
        var badgesEl = document.getElementById('pr-hero-badges');
        if (badgesEl && Array.isArray(page.heroBadges) && page.heroBadges.length) {
            badgesEl.innerHTML = page.heroBadges.map(function (b) {
                return '<span class="pr-badge">' + esc(b.text) + '</span>';
            }).join('');
        }
    }

    /* ─────────────────────────────────────────────────────────
       SIDEBAR NAV + MOBILE TABS
       Group sections by sidebarGroupLabel. A null/empty label
       means the section inherits the previous group (no new label).
    ───────────────────────────────────────────────────────── */

    function buildNavigation(sections, page) {
        var sidebarEl = document.getElementById('pr-sidebar-nav');
        var mobTabsEl = document.getElementById('pr-mob-tabs');
        if (!sidebarEl || !sections || !sections.length) return;

        var sidebarHTML = '';
        var mobHTML = '';
        var lastGroupLabel = null;
        var isFirstGroup = true;

        sections.forEach(function (sec, idx) {
            var groupLabel = sec.sidebarGroupLabel || null;

            // Start a new group if this section has a non-empty label
            if (groupLabel) {
                if (!isFirstGroup) {
                    sidebarHTML += '<div class="pr-sidebar-divider"></div>';
                }
                sidebarHTML += '<div class="pr-sidebar-label">' + esc(groupLabel) + '</div>';
                lastGroupLabel = groupLabel;
                isFirstGroup = false;
            }

            var isActive = idx === 0 ? ' is-active' : '';
            var icon = sec.sidebarIcon ? '<span class="pr-sidebar-icon">' + esc(sec.sidebarIcon) + '</span> ' : '';

            sidebarHTML += '<button class="pr-sidebar-link' + isActive + '" data-target="' + esc(sec.sectionId) + '">' +
                icon + esc(sec.sidebarLinkText) +
                '</button>';

            // Mobile tabs — use icon + short text
            var mobIsActive = idx === 0 ? ' is-active' : '';
            var mobIcon = sec.sidebarIcon ? esc(sec.sidebarIcon) + ' ' : '';
            mobHTML += '<button class="pr-mob-tab' + mobIsActive + '" data-target="' + esc(sec.sectionId) + '">' +
                mobIcon + esc(sec.sidebarLinkText) +
                '</button>';
        });

        sidebarEl.innerHTML = sidebarHTML;
        if (mobTabsEl) mobTabsEl.innerHTML = mobHTML;
    }

    /* ─────────────────────────────────────────────────────────
       BILLING TOGGLE ROW
       Inserted as first child of #pr-content.
       pricing.js will then wire up the toggle behaviour.
    ───────────────────────────────────────────────────────── */

    function buildBillingToggle(page, contentEl) {
        if (!page.showBillingToggle) return;

        var monthlyLabel = page.billingMonthlyLabel || 'Monthly';
        var annualLabel  = page.billingAnnualLabel  || 'Annual';
        var savePill     = page.billingSavePill      || '';

        var html = '<div class="pr-billing-row">' +
            '<span class="pr-bill-opt is-monthly is-active">' + esc(monthlyLabel) + '</span>' +
            '<div class="pr-billing-switch" role="switch" aria-checked="false" tabindex="0"></div>' +
            '<span class="pr-bill-opt is-annual">' + esc(annualLabel) + '</span>' +
            (savePill ? '<span class="pr-save-pill">' + esc(savePill) + '</span>' : '') +
            '</div>';

        contentEl.insertAdjacentHTML('beforeend', html);
    }

    /* ─────────────────────────────────────────────────────────
       TABLE RENDERING
       Column types drive cell rendering:
         plan   → plan name div, POPULAR badge if row.isPopular
         vram   → value wrapped in .pr-vram span
         price  → .pr-price div, with monthly/annual split if subValue present
         action → Get Started button
         text   → plain text, subValue as .pr-spec-sub if present
    ───────────────────────────────────────────────────────── */

    function renderCell(colType, cell, rowIsPopular, colIndex) {
        var val     = (cell && cell.value)    != null ? cell.value    : '';
        var sub     = (cell && cell.subValue) != null ? cell.subValue : '';
        var isHl    = cell && cell.isHighlight;
        var tdClass = isHl ? ' class="pr-cell-highlight"' : '';

        var inner = '';

        switch (colType) {
            case 'plan':
                var popularTag = rowIsPopular
                    ? ' <span class="pr-popular-tag">POPULAR</span>'
                    : '';
                inner = '<div class="pr-plan-cell">' + esc(val) + popularTag + '</div>';
                break;

            case 'vram':
                inner = '<span class="pr-vram">' + esc(val) + '</span>';
                break;

            case 'price':
                // If sub exists, it is the annual price — split for billing toggle
                if (sub) {
                    inner =
                        '<div class="pr-price" data-price-monthly>' + esc(val) + '<span class="pr-price-sub">/mo</span></div>' +
                        '<div class="pr-price-annual" data-price-annual>' + esc(sub) + '<span class="pr-price-sub">/mo</span></div>';
                } else if (val) {
                    inner = '<div class="pr-price">' + esc(val) + '<span class="pr-price-sub">/mo</span></div>';
                }
                break;

            case 'action':
                inner = '<button class="pr-row-btn">Get Started</button>';
                break;

            case 'text':
            default:
                inner = esc(val);
                if (sub) {
                    inner += '<div class="pr-spec-sub">' + esc(sub) + '</div>';
                }
                break;
        }

        return '<td' + tdClass + '>' + inner + '</td>';
    }

    function renderTable(table) {
        if (!table) return '';

        var cols = Array.isArray(table.columns) ? table.columns : [];
        var rows = Array.isArray(table.rows)    ? table.rows    : [];

        // Build <thead>
        var theadCells = cols.map(function (col) {
            // action columns get an empty header
            if (col.type === 'action') return '<th></th>';
            return '<th>' + esc(col.header) + '</th>';
        }).join('');

        // Build <tbody>
        var tbodyRows = rows.map(function (row) {
            var trClass = row.isHighlighted ? ' class="pr-row-highlighted"' : '';
            var cells = cols.map(function (col, ci) {
                var cell = (row.cells && row.cells[ci]) ? row.cells[ci] : { value: '', subValue: '' };
                return renderCell(col.type, cell, row.isPopular, ci);
            }).join('');
            return '<tr' + trClass + '>' + cells + '</tr>';
        }).join('');

        var tableHTML =
            '<div class="pr-table-wrap">' +
            '<table class="pr-table">' +
            '<thead><tr>' + theadCells + '</tr></thead>' +
            '<tbody>' + tbodyRows + '</tbody>' +
            '</table>' +
            '</div>';

        if (table.caption) {
            tableHTML += '<p class="pr-caption">' + esc(table.caption) + '</p>';
        }
        if (table.noteText) {
            var noteClass = table.noteType === 'warning' ? 'pr-note pr-note-warning' : 'pr-note';
            tableHTML += '<div class="' + noteClass + '">&#8505;&#65039; ' + esc(table.noteText) + '</div>';
        }

        return tableHTML;
    }

    /* ─────────────────────────────────────────────────────────
       SECTIONS
    ───────────────────────────────────────────────────────── */

    function buildSections(sections, contentEl) {
        if (!sections || !sections.length) return;

        sections.forEach(function (sec) {
            var tablesHTML = '';
            if (Array.isArray(sec.tables)) {
                sec.tables.forEach(function (tbl) {
                    tablesHTML += renderTable(tbl);
                });
            }

            var tagHTML  = sec.sectionTag
                ? '<span class="pr-section-tag">' + esc(sec.sectionTag) + '</span>'
                : '';
            var descHTML = sec.description
                ? '<p class="pr-section-desc">' + esc(sec.description) + '</p>'
                : '';

            var secHTML =
                '<section class="pr-section" id="' + esc(sec.sectionId) + '">' +
                tagHTML +
                '<h2 class="pr-section-title">' + esc(sec.title) + '</h2>' +
                descHTML +
                tablesHTML +
                '</section>';

            contentEl.insertAdjacentHTML('beforeend', secHTML);
        });
    }

    /* ─────────────────────────────────────────────────────────
       CTA BAND
    ───────────────────────────────────────────────────────── */

    function populateCtaBand(cta) {
        if (!cta) return;

        var titleEl = document.querySelector('[data-pr="cta-title"]');
        var descEl  = document.querySelector('[data-pr="cta-desc"]');
        var primBtn = document.querySelector('[data-pr="cta-primary-btn"]');
        var secBtn  = document.querySelector('[data-pr="cta-secondary-btn"]');

        setText(titleEl, cta.title || '');
        setText(descEl,  cta.description || '');

        if (primBtn && cta.ctaPrimary) {
            primBtn.textContent = cta.ctaPrimary.text || 'Talk to an Expert';
            if (cta.ctaPrimary.link) {
                primBtn.setAttribute('onclick', "window.location.href='" + cta.ctaPrimary.link + "'");
            }
        }
        if (secBtn && cta.ctaSecondary) {
            secBtn.textContent = cta.ctaSecondary.text || '';
            if (cta.ctaSecondary.link) {
                secBtn.setAttribute('onclick', "window.location.href='" + cta.ctaSecondary.link + "'");
            }
        }
    }

    /* ─────────────────────────────────────────────────────────
       LOADER HELPERS
    ───────────────────────────────────────────────────────── */

    function hideLoader() {
        var loader = document.getElementById('page-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(function () { loader.style.display = 'none'; }, 300);
        }
    }

    /* ─────────────────────────────────────────────────────────
       MAIN INIT
    ───────────────────────────────────────────────────────── */

    document.addEventListener('DOMContentLoaded', function () {

        getPricingPage()
            .then(function (data) {
                // Strapi v5 returns data directly for single types
                var page = data && data.data ? data.data : data;
                if (!page) {
                    console.warn('[pricing-cms] No data returned from Strapi');
                    hideLoader();
                    return;
                }

                // 1. SEO
                populateSEO(page.seo);

                // 2. Hero
                populateHero(page);

                // 3. Sidebar + Mobile tabs
                buildNavigation(page.sections || [], page);

                // 4. Content area — billing toggle + sections
                var contentEl = document.getElementById('pr-content');
                if (contentEl) {
                    // Billing toggle row first
                    buildBillingToggle(page, contentEl);

                    // Then all sections
                    buildSections(page.sections || [], contentEl);
                }

                // 5. CTA band
                populateCtaBand(page.ctaBand);

                // 6. Hide loader, then signal pricing.js to initialise
                hideLoader();
                document.dispatchEvent(new CustomEvent('pricing:ready'));
            })
            .catch(function (err) {
                console.error('[pricing-cms] Failed to load pricing page data:', err);
                hideLoader();
            });
    });

})();
