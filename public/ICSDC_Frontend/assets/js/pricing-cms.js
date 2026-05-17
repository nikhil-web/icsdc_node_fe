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
            var icon = sec.sidebarIcon
                ? '<span class="pr-sidebar-icon"><i class="fa-solid fa-' + esc(sec.sidebarIcon) + '"></i></span> '
                : '';

            sidebarHTML += '<button class="pr-sidebar-link' + isActive + '" data-target="' + esc(sec.sectionId) + '">' +
                icon + esc(sec.sidebarLinkText) +
                '</button>';

            // Mobile tabs — icon + short text
            var mobIsActive = idx === 0 ? ' is-active' : '';
            var mobIcon = sec.sidebarIcon
                ? '<i class="fa-solid fa-' + esc(sec.sidebarIcon) + '"></i> '
                : '';
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
        var annualLabel = page.billingAnnualLabel || 'Annual';
        var savePill = page.billingSavePill || '';

        var html =
            '<div class="pr-billing-wrap">' +
              '<div class="pr-billing-row">' +
                '<span class="pr-billing-label">Billing Cycle</span>' +
                '<span class="pr-bill-opt is-monthly is-active">' + esc(monthlyLabel) + '</span>' +
                '<div class="pr-billing-switch" role="switch" aria-checked="false" tabindex="0"></div>' +
                '<span class="pr-bill-opt is-annual">' + esc(annualLabel) + '</span>' +
                (savePill ? '<span class="pr-save-pill">' + esc(savePill) + '</span>' : '') +
              '</div>' +
            '</div>';

        contentEl.insertAdjacentHTML('beforeend', html);
    }

    /* ─────────────────────────────────────────────────────────
       LEGACY SCHEMA ADAPTER
       Converts old plans[] (cpu/ram/storage/bandwidth/gpu/c1-c4)
       into the cols/rows shape expected by renderTable().
    ───────────────────────────────────────────────────────── */

    function adaptOldSchema(table) {
        var plans = Array.isArray(table.plans) ? table.plans : [];
        if (!plans.length) return { cols: [], rows: [] };

        // Spec columns — only include if at least one plan has a value
        var specDefs = [
            { key: 'cpu',       label: 'CPU',       icon: 'microchip'      },
            { key: 'ram',       label: 'RAM',       icon: 'memory'         },
            { key: 'storage',   label: 'Storage',   icon: 'hard-drive'     },
            { key: 'bandwidth', label: 'Bandwidth', icon: 'network-wired'  },
            { key: 'gpu',       label: 'GPU',       icon: 'display'        }
        ];

        // Custom columns (c1-c4) — label comes from table.c1Label etc.
        var customDefs = [
            { key: 'c1', labelField: 'c1Label' },
            { key: 'c2', labelField: 'c2Label' },
            { key: 'c3', labelField: 'c3Label' },
            { key: 'c4', labelField: 'c4Label' }
        ];

        var cols    = [];
        var colKeys = [];

        specDefs.forEach(function (def) {
            if (plans.some(function (p) { return p[def.key] != null && p[def.key] !== ''; })) {
                cols.push({ label: def.label, icon: def.icon });
                colKeys.push(def.key);
            }
        });

        customDefs.forEach(function (def) {
            if (plans.some(function (p) { return p[def.key] != null && p[def.key] !== ''; })) {
                var label = (table[def.labelField] && table[def.labelField].trim())
                    ? table[def.labelField].trim()
                    : def.key.toUpperCase();
                cols.push({ label: label, icon: null });
                colKeys.push(def.key);
            }
        });

        var rows = plans.map(function (plan) {
            return {
                name:         plan.name,
                isPopular:    plan.isPopular,
                monthlyPrice: plan.monthlyPrice,
                annualPrice:  plan.annualPrice,
                ctaText:      plan.ctaText,
                ctaLink:      plan.ctaLink,
                cells: colKeys.map(function (key) {
                    var val = plan[key];
                    return { value: (val != null && val !== '') ? String(val) : '—' };
                })
            };
        });

        return { cols: cols, rows: rows };
    }

    /* ─────────────────────────────────────────────────────────
       TABLE RENDERING
       Supports two schemas:
         New: table.columns[] + table.rows[].cells[]
         Old: table.plans[] with cpu/ram/storage/bandwidth/gpu/c1-c4
       columns[i] = { label, icon? }
       rows[i]    = { name, isPopular, monthlyPrice, annualPrice,
                      ctaText, ctaLink, cells[]: { value } }
       cells are matched to columns by array index.
    ───────────────────────────────────────────────────────── */

    function renderTable(table) {
        if (!table) return '';

        var cols, rows;

        // ── Prefer new schema (columns + rows) if populated ──
        if (Array.isArray(table.columns) && table.columns.length > 0) {
            cols = table.columns;
            rows = Array.isArray(table.rows) ? table.rows : [];
        }
        // ── Fall back to legacy plans[] schema ───────────────
        else if (Array.isArray(table.plans) && table.plans.length > 0) {
            var adapted = adaptOldSchema(table);
            cols = adapted.cols;
            rows = adapted.rows;
        }
        else {
            return '';
        }

        if (!cols.length && !rows.length) return '';

        var hasPrice   = rows.some(function (r) { return r.monthlyPrice; });
        var priceLabel = table.priceLabel || 'Monthly';

        // ── thead ──────────────────────────────────────────
        var headCells = '<th class="pr-sc-th pr-sc-th-name">Plan</th>';
        cols.forEach(function (col) {
            var icon = col.icon
                ? '<i class="fa-solid fa-' + esc(col.icon) + '"></i>'
                : '';
            headCells += '<th class="pr-sc-th pr-sc-th-spec">' +
                icon + '<span>' + esc(col.label) + '</span></th>';
        });
        if (hasPrice) {
            headCells += '<th class="pr-sc-th pr-sc-th-price">' +
                '<i class="fa-solid fa-tag"></i><span>' + esc(priceLabel) + '</span></th>';
        }
        headCells += '<th class="pr-sc-th pr-sc-th-action"></th>';

        var theadHTML = '<thead><tr class="pr-sc-head-row">' + headCells + '</tr></thead>';

        // ── tbody ───────────────────────────────────────────
        var tbodyHTML = '<tbody>' + rows.map(function (row) {
            var isFeat = !!row.isPopular;
            var rowCls = isFeat
                ? ' class="pr-sc-row pr-sc-row-featured"'
                : ' class="pr-sc-row"';

            // Name cell
            var badge  = isFeat ? '<span class="pr-sc-pop-badge">Popular</span>' : '';
            var nameTd = '<td class="pr-sc-td-name">' +
                '<span class="pr-sc-name-text">' + esc(row.name) + '</span>' +
                badge + '</td>';

            // Spec cells — one per column, matched by index
            var cells  = Array.isArray(row.cells) ? row.cells : [];
            var specTds = cols.map(function (col, i) {
                var val = (cells[i] && cells[i].value != null) ? cells[i].value : '—';
                return '<td class="pr-sc-td-spec">' + esc(val) + '</td>';
            }).join('');

            // Price cell
            var priceTd = '';
            if (hasPrice) {
                var pInner = '';
                if (row.monthlyPrice) {
                    // Always tag monthly so the billing toggle can show/hide it
                    pInner =
                        '<span class="pr-sc-price" data-price-monthly>' +
                        esc(row.monthlyPrice) +
                        '<span class="pr-sc-price-sub">/mo</span></span>';
                }
                if (row.annualPrice) {
                    pInner +=
                        '<span class="pr-sc-price" data-price-annual>' +
                        esc(row.annualPrice) +
                        '<span class="pr-sc-price-sub">/mo</span></span>';
                }
                priceTd = '<td class="pr-sc-td-price">' + pInner + '</td>';
            }

            // Action cell
            var btnCls = isFeat ? 'pr-sc-btn pr-sc-btn-featured' : 'pr-sc-btn';
            var onclk  = row.ctaLink
                ? ' onclick="window.location.href=\'' + esc(row.ctaLink) + '\'"'
                : '';
            var actionTd = '<td class="pr-sc-td-action">' +
                '<button class="' + btnCls + '"' + onclk + '>' +
                esc(row.ctaText || 'Get Started') + '</button></td>';

            return '<tr' + rowCls + '>' + nameTd + specTds + priceTd + actionTd + '</tr>';
        }).join('') + '</tbody>';

        // ── assemble ────────────────────────────────────────
        var html =
            '<div class="pr-table-wrap">' +
            '<table class="pr-table pr-spec-table">' +
            theadHTML + tbodyHTML +
            '</table></div>';

        if (table.caption) {
            html += '<p class="pr-caption">' + esc(table.caption) + '</p>';
        }
        if (table.noteText) {
            var nc = table.noteType === 'warning' ? 'pr-note pr-note-warning' : 'pr-note';
            html += '<div class="' + nc + '">&#8505;&#65039; ' + esc(table.noteText) + '</div>';
        }
        return html;
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

            var tagHTML = sec.sectionTag
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
        var descEl = document.querySelector('[data-pr="cta-desc"]');
        var primBtn = document.querySelector('[data-pr="cta-primary-btn"]');
        var secBtn = document.querySelector('[data-pr="cta-secondary-btn"]');

        setText(titleEl, cta.title || '');
        setText(descEl, cta.description || '');

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
            } else {


            }
        } else {
            secBtn.style.display = 'none';
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
