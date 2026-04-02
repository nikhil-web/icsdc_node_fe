/**
 * dedicated-server.js
 * ───────────────────
 * CMS-driven version: fetches all page content from Strapi
 * and populates DOM sections dynamically.
 *
 * Sections handled:
 *   1.  SEO meta tags
 *   2.  Hero (+ server rack visual)
 *   3.  Feature Highlights (4 cards)
 *   4.  Pricing (section header + 3 plan cards)
 *   5.  Pillars (section header + 12 cards)
 *   6.  CTA Band #1
 *   7.  Security (header + shield visual + 4 cards)
 *   8.  More Services (header + image + buttons)
 *   9.  Comparison table
 *   10. Performance (header + checklist + CTA buttons + stats)
 *   11. Global Locations (header + map pins + tags)
 *   12. When Do You Need (header + 5 cards)
 *   13. Who Can Use (header + 10 cards)
 *   14. Testimonials
 *   15. FAQ
 *   16. CTA Band #2
 *   17. Footer
 */

import { getDedicatedServerPage } from './services/contentService.js';
import { initFAQ } from './utils/cms-helpers.js';

(function () {
    'use strict';

    /* ─────────────────────────────────────────────────────────
       ICONS MAP — CMS stores key names, we resolve to SVG here
    ───────────────────────────────────────────────────────── */
    var ICONS = {
        lightning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
        dollar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
        users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
        lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
        pulse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
        database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
        'globe-lines': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10"/><path d="M12 2a15.3 15.3 0 00-4 10 15.3 15.3 0 004 10"/></svg>',
        shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        document: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        firewall: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
        'lock-key': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1"/></svg>',
        'shield-check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>',
        ssl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><line x1="12" y1="15" x2="12" y2="17"/></svg>',
        layout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
        gaming: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><path d="M17.32 5H6.68a4 4 0 00-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 003 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 019.828 16h4.344a2 2 0 011.414.586L17 18c.5.5 1 1 2 1a3 3 0 003-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0017.32 5z"/></svg>',
        video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
        code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
        mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
    };

    /* ─────────────────────────────────────────────────────────
       HELPERS
    ───────────────────────────────────────────────────────── */

    function setText(parent, selector, text) {
        var el = parent.querySelector(selector);
        if (el && text != null) el.textContent = text;
    }

    function setHTML(parent, selector, html) {
        var el = parent.querySelector(selector);
        if (el && html != null) el.innerHTML = html;
    }

    function getInitials(name) {
        return name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase().slice(0, 2);
    }

    function resolveIcon(key) {
        return (key && ICONS[key]) || defaultIconSVG();
    }

    function starSVG() {
        return '<svg class="testi-star" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
            '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>' +
            '</svg>';
    }

    function checkSVG() {
        return '<svg viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" /></svg>';
    }

    function comparisonIcon(type) {
        if (type === 'check') {
            return '<span class="ds-check-icon"><svg viewBox="0 0 14 14" fill="none">' +
                '<polyline points="2,7 5.5,10.5 12,3" stroke-linecap="round" stroke-linejoin="round" />' +
                '</svg></span>';
        }
        if (type === 'partial') {
            return '<span class="ds-partial-icon"><svg viewBox="0 0 14 14" fill="none">' +
                '<line x1="3" y1="7" x2="11" y2="7" stroke-linecap="round" />' +
                '</svg></span>';
        }
        return '<span class="ds-cross-icon"><svg viewBox="0 0 14 14" fill="none">' +
            '<line x1="3" y1="3" x2="11" y2="11" stroke-linecap="round" />' +
            '<line x1="11" y1="3" x2="3" y2="11" stroke-linecap="round" />' +
            '</svg></span>';
    }

    function defaultIconSVG() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">' +
            '<circle cx="12" cy="12" r="10" />' +
            '</svg>';
    }

    /* ─────────────────────────────────────────────────────────
       SECTION POPULATORS
    ───────────────────────────────────────────────────────── */

    /** 1. SEO Meta */
    function populateSEO(seo) {
        if (!seo) return;
        if (seo.metaTitle) document.title = seo.metaTitle;
        if (seo.metaDescription) {
            var meta = document.querySelector('meta[name="description"]');
            if (meta) meta.setAttribute('content', seo.metaDescription);
        }
    }

    /** 2. Hero Section */
    function populateHero(hero) {
        if (!hero) return;
        var section = document.querySelector('.hero-section');
        if (!section) return;

        // Eyebrow
        var eyebrow = section.querySelector('.ds-eyebrow');
        if (eyebrow && hero.eyebrow) {
            var dot = eyebrow.querySelector('.ds-eyebrow-dot');
            eyebrow.textContent = '';
            if (dot) eyebrow.appendChild(dot);
            eyebrow.appendChild(document.createTextNode(' ' + hero.eyebrow));
        }

        setText(section, '.hero-title', hero.title);
        setText(section, '.hero-sub', hero.subtitle);
        setHTML(section, '.hero-desc', hero.description);

        // Price
        if (hero.price) {
            var priceEl = section.querySelector('.hero-price');
            if (priceEl) {
                var currency = hero.priceCurrency || '₹';
                var priceSpan = priceEl.querySelector('span:first-child');
                if (priceSpan) priceSpan.innerHTML = currency + hero.price;
            }
        }
        if (hero.priceUnit) setText(section, '.price-unit', hero.priceUnit);
        if (hero.priceNote) setHTML(section, '.price-note', hero.priceNote);

        // CTA Buttons
        var btns = section.querySelectorAll('.hero-btns button');
        if (btns.length >= 2) {
            if (hero.ctaSecondary) {
                btns[0].textContent = hero.ctaSecondary.text;
                if (hero.ctaSecondary.link) btns[0].setAttribute('onclick', "window.location.href='" + hero.ctaSecondary.link + "'");
            }
            if (hero.ctaPrimary) {
                btns[1].innerHTML = hero.ctaPrimary.text + ' &rarr;';
                if (hero.ctaPrimary.link) btns[1].setAttribute('onclick', "window.location.href='" + hero.ctaPrimary.link + "'");
            }
        }

        // Server Rack
        if (hero.serverRack && hero.serverRack.length) {
            var rack = section.querySelector('.ds-server-rack');
            if (rack) {
                rack.innerHTML = hero.serverRack.map(function (unit) {
                    return '<div class="ds-rack-unit">' +
                        '<div class="ds-rack-led"></div>' +
                        '<div class="ds-rack-bars">' +
                        '<div class="ds-rack-bar" style="flex:' + unit.bar1 + '"></div>' +
                        '<div class="ds-rack-bar" style="flex:' + unit.bar2 + '"></div>' +
                        '<div class="ds-rack-bar" style="flex:' + unit.bar3 + '"></div>' +
                        '</div>' +
                        '<span class="ds-rack-label">' + unit.label + '</span>' +
                        '<span class="ds-rack-stat">' + unit.stat + '</span>' +
                        '</div>';
                }).join('');
            }
        }

        // Uptime badge
        setText(section, '.ds-hero-badge-text', hero.uptimeBadgeText);
        setText(section, '.ds-hero-badge-sub', hero.uptimeBadgeSub);
    }

    /** 3. Feature Highlights */
    function populateFeatureHighlights(cards) {
        if (!cards || !cards.length) return;
        var grid = document.querySelector('#ds-features .why-grid');
        if (!grid) return;

        var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (card) {
            return '<div class="why-card">' +
                '<div class="why-icon" aria-hidden="true">' +
                resolveIcon(card.icon) +
                '</div>' +
                '<h3>' + card.title + '</h3>' +
                '<p>' + card.description + '</p>' +
                '</div>';
        }).join('');
    }

    /** 4. Pricing Section */
    function populatePricingHeader(label, title, subtitle) {
        var section = document.getElementById('ds-pricing');
        if (!section) return;
        if (label) setText(section, '.ds-section-label', label);
        if (title) setText(section, '.title', title);
        if (subtitle) setText(section, '.subtitle', subtitle);
    }

    function populatePricingPlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#ds-pricing .ds-pricing-grid');
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
                        f.label +
                        '</li>';
                }).join('');
            }

            return '<div class="ds-plan-card' + featuredClass + '">' +
                badge +
                '<div class="ds-plan-tier">' + plan.tier + '</div>' +
                '<div class="ds-plan-price-wrap">' +
                '<span class="ds-plan-currency">' + (plan.currency || '₹') + '</span>' +
                '<span class="ds-plan-price">' + plan.price + '</span>' +
                '<span class="ds-plan-period">' + (plan.period || '/mo') + '</span>' +
                '</div>' +
                (plan.tagline ? '<p class="ds-plan-tagline">' + plan.tagline + '</p>' : '') +
                '<hr class="ds-plan-divider">' +
                '<ul class="ds-plan-features">' + featuresHTML + '</ul>' +
                '<button class="ds-plan-cta ' + ctaClass + '">' +
                plan.ctaText + ctaArrow +
                '</button>' +
                '</div>';
        }).join('');
    }

    /** 5. Pillars */
    function populatePillars(label, title, subtitle, pillars) {
        var section = document.getElementById('ds-pillars');
        if (!section) return;
        if (label) setText(section, '.ds-section-label', label);
        if (title) setText(section, '.title', title);
        if (subtitle) setText(section, '.subtitle', subtitle);

        if (!pillars || !pillars.length) return;
        var grid = section.querySelector('.ds-pillar-grid');
        if (!grid) return;

        var sorted = pillars.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (p) {
            return '<div class="ds-pillar-card">' +
                '<div class="ds-pillar-icon">' + resolveIcon(p.icon) + '</div>' +
                '<h3>' + p.title + '</h3>' +
                '<p>' + p.description + '</p>' +
                '</div>';
        }).join('');
    }

    /** 6. CTA Band */
    function populateCtaBand(selector, cta) {
        if (!cta) return;
        var section = document.querySelector(selector);
        if (!section) return;
        var inner = section.querySelector('.ds-cta-inner');
        if (!inner) return;

        setHTML(inner, 'h2', cta.title);
        setHTML(inner, 'p', cta.description);

        var btns = inner.querySelector('.ds-cta-btns');
        if (btns) {
            var primaryBtn = btns.querySelector('.ds-cta-btn-primary');
            var secondaryBtn = btns.querySelector('.ds-cta-btn-outline');
            if (primaryBtn && cta.ctaPrimary) {
                primaryBtn.innerHTML = cta.ctaPrimary.text + ' &rarr;';
                if (cta.ctaPrimary.link) primaryBtn.setAttribute('onclick', "window.location.href='" + cta.ctaPrimary.link + "'");
            }
            if (secondaryBtn && cta.ctaSecondary) {
                secondaryBtn.textContent = cta.ctaSecondary.text;
                if (cta.ctaSecondary.link) secondaryBtn.setAttribute('onclick', "window.location.href='" + cta.ctaSecondary.link + "'");
            }
        }
    }

    /** 7. Security Section */
    function populateSecurity(label, title, desc, shieldVisual, cards) {
        var section = document.getElementById('ds-security');
        if (!section) return;

        // Shield visual text
        if (shieldVisual) {
            var shieldStat = section.querySelector('.ds-security-shield-stat');
            if (shieldStat) {
                setText(shieldStat, 'strong', shieldVisual.headline);
                setText(shieldStat, 'span', shieldVisual.subtext);
            }
        }

        var textBlock = section.querySelector('.ds-security-text');
        if (textBlock) {
            if (label) setText(textBlock, '.ds-section-label', label);
            if (title) setText(textBlock, '.title', title);
            if (desc) setHTML(textBlock, '.who-we-are-paragraph', desc);
        }

        if (!cards || !cards.length) return;
        var grid = section.querySelector('.ds-security-grid');
        if (!grid) return;

        var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (c) {
            return '<div class="ds-security-card">' +
                '<div class="ds-security-icon">' + resolveIcon(c.icon) + '</div>' +
                '<h3>' + c.title + '</h3>' +
                '<p>' + c.description + '</p>' +
                '</div>';
        }).join('');
    }

    /** 8. More Services */
    function populateServices(label, title, desc, image, imageAlt, buttons) {
        var section = document.getElementById('ds-services');
        if (!section) return;

        var blueContainer = section.querySelector('.blue-container');
        if (blueContainer) {
            if (label) setText(blueContainer, '.ds-section-label', label);
            if (title) setText(blueContainer, '.title', title);
            if (desc) setHTML(blueContainer, '.who-we-are-paragraph', desc);
        }

        // Image (stored as plain string path)
        if (image) {
            var imgEl = section.querySelector('.who-we-are-image img');
            if (imgEl) {
                imgEl.src = image;
                imgEl.alt = imageAlt || 'ICSDC dedicated server services';
            }
        }

        // Buttons
        if (buttons && buttons.length) {
            var btnWrap = section.querySelector('.who-we-are-btns');
            if (btnWrap) {
                btnWrap.innerHTML = buttons.map(function (b) {
                    var cls = b.style === 'primary' ? 'btn-primary' : 'btn-outline';
                    return '<button class="' + cls + ' feature-cards">' + b.text + '</button>';
                }).join('');
            }
        }
    }

    /** 9. Comparison Table */
    function populateComparison(label, title, subtitle, columns, rows) {
        var section = document.getElementById('ds-comparison');
        if (!section) return;

        if (label) setText(section, '.ds-section-label', label);
        if (title) setText(section, '.title', title);
        if (subtitle) setHTML(section, '.subtitle', subtitle);

        // Update column headers if provided
        if (columns && columns.length) {
            var ths = section.querySelectorAll('.ds-comparison-table thead th');
            columns.forEach(function (col, i) {
                if (ths[i]) ths[i].textContent = col;
            });
        }

        if (!rows || !rows.length) return;
        var tbody = section.querySelector('.ds-comparison-table tbody');
        if (!tbody) return;

        var sorted = rows.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        tbody.innerHTML = sorted.map(function (r) {
            return '<tr>' +
                '<td>' + r.feature + '</td>' +
                '<td class="ds-col-icsdc">' + comparisonIcon(r.icsdcStatus) + '</td>' +
                '<td style="text-align:center;">' + comparisonIcon(r.othersStatus) + '</td>' +
                '</tr>';
        }).join('');
    }

    /** 10. Performance Section */
    function populatePerformance(label, title, desc, checklist, ctaPrimary, ctaSecondary, stats) {
        var section = document.getElementById('ds-performance');
        if (!section) return;

        if (label) setText(section, '.ds-section-label', label);
        if (title) setText(section, '.title', title);
        if (desc) setText(section, '.who-we-are-paragraph', desc);

        // Checklist
        if (checklist && checklist.length) {
            var ul = section.querySelector('.ds-checklist');
            if (ul) {
                var sorted = checklist.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
                ul.innerHTML = sorted.map(function (item) {
                    return '<li class="ds-checklist-item">' +
                        '<span class="ds-cl-icon"><svg viewBox="0 0 12 12" fill="none">' +
                        '<polyline points="2,6 5,9 10,3" stroke-linecap="round" stroke-linejoin="round" />' +
                        '</svg></span>' +
                        '<span><strong>' + item.label + '</strong> ' + item.description + '</span>' +
                        '</li>';
                }).join('');
            }
        }

        // CTA Buttons
        var perfBtns = section.querySelectorAll('.hero-btns button');
        if (perfBtns.length >= 2) {
            if (ctaPrimary) {
                perfBtns[0].innerHTML = ctaPrimary.text + ' &rarr;';
                if (ctaPrimary.link) perfBtns[0].setAttribute('onclick', "window.location.href='" + ctaPrimary.link + "'");
            }
            if (ctaSecondary) {
                perfBtns[1].textContent = ctaSecondary.text;
                if (ctaSecondary.link) perfBtns[1].setAttribute('onclick', "window.location.href='" + ctaSecondary.link + "'");
            }
        }

        // Stats
        if (stats && stats.length) {
            var statsEl = section.querySelector('.ds-perf-stats');
            if (statsEl) {
                statsEl.innerHTML = stats.map(function (s) {
                    return '<div class="ds-perf-stat">' +
                        '<span class="ds-perf-stat-val">' + s.value + '</span>' +
                        '<span class="ds-perf-stat-label">' + s.label + '</span>' +
                        '</div>';
                }).join('');
            }
        }
    }

    /** 11. Global Locations */
    function populateLocations(label, title, desc, pins, tags) {
        var section = document.getElementById('ds-locations');
        if (!section) return;

        if (label) setText(section, '.ds-section-label', label);
        if (title) setText(section, '.title', title);
        if (desc) setHTML(section, '.who-we-are-paragraph', desc);

        // Map pins — top/left are CSS strings like "38%"
        if (pins && pins.length) {
            var mapVisual = section.querySelector('.ds-map-visual');
            if (mapVisual) {
                mapVisual.innerHTML = pins.map(function (pin) {
                    return '<div class="ds-map-pin" style="top:' + pin.top + '; left:' + pin.left + ';">' +
                        '<div class="ds-map-pin-dot"></div>' +
                        '<div class="ds-map-pin-label">' + pin.label + '</div>' +
                        '</div>';
                }).join('');
            }
        }

        // Tags — emoji + text
        if (tags && tags.length) {
            var tagWrap = section.querySelector('.ds-location-tags');
            if (tagWrap) {
                tagWrap.innerHTML = tags.map(function (t) {
                    return '<span class="ds-location-tag">' + t.emoji + ' ' + t.text + '</span>';
                }).join('');
            }
        }
    }

    /** 12. When Do You Need */
    function populateWhenCards(label, title, subtitle, cards) {
        var section = document.getElementById('ds-when');
        if (!section) return;

        if (label) setText(section, '.ds-section-label', label);
        if (title) setText(section, '.title', title);
        if (subtitle) setHTML(section, '.subtitle', subtitle);

        if (!cards || !cards.length) return;
        var grid = section.querySelector('.ds-when-grid');
        if (!grid) return;

        grid.innerHTML = cards.map(function (card) {
            return '<div class="ds-when-card">' +
                '<div class="ds-when-num">' + card.number + '</div>' +
                '<h3>' + card.title + '</h3>' +
                '<p>' + card.description + '</p>' +
                '</div>';
        }).join('');
    }

    /** 13. Who Can Use */
    function populateUseCases(label, title, subtitle, cards) {
        var section = document.getElementById('ds-who');
        if (!section) return;

        if (label) setText(section, '.ds-section-label', label);
        if (title) setText(section, '.title', title);
        if (subtitle) setText(section, '.subtitle', subtitle);

        if (!cards || !cards.length) return;
        var grid = section.querySelector('.ds-use-grid');
        if (!grid) return;

        var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (card) {
            return '<div class="ds-use-card">' +
                '<div class="ds-use-icon">' + resolveIcon(card.icon) + '</div>' +
                '<h3>' + card.title + '</h3>' +
                '<p>' + card.description + '</p>' +
                '</div>';
        }).join('');
    }

    /** 14. Testimonials */
    function buildTestiCard(t, index) {
        var initials = getInitials(t.name);
        var stars = '';
        for (var s = 0; s < (t.rating || 5); s++) { stars += starSVG(); }

        return '<article class="testi-card" role="listitem" data-testi-index="' + index + '" aria-label="Testimonial from ' + t.name + '">' +
            '<div class="testi-left">' +
            '<div class="testi-avatar" aria-hidden="true">' +
            '<span class="testi-avatar-initials">' + initials + '</span>' +
            '</div>' +
            '<div class="testi-client-info">' +
            '<p class="testi-name">' + t.name + '</p>' +
            '<p class="testi-job">' + (t.title || '') + '</p>' +
            '<p class="testi-company">' + (t.company || '') + '</p>' +
            '</div>' +
            '<div class="testi-rating" aria-label="Rating: ' + (t.rating || 5) + ' out of 5 stars">' + stars + '</div>' +
            '</div>' +
            '<div class="testi-right">' +
            '<blockquote class="testi-quote">' + t.quote + '</blockquote>' +
            '</div>' +
            '</article>';
    }

    function initDSTestimonials(items) {
        var grid = document.getElementById('ds-testi-grid');
        var dotsWrap = document.getElementById('ds-testi-dots');
        var prevBtn = document.getElementById('ds-testi-prev');
        var nextBtn = document.getElementById('ds-testi-next');
        if (!grid || !dotsWrap || !items || !items.length) return;

        grid.innerHTML = items.map(function (t, i) { return buildTestiCard(t, i); }).join('');

        dotsWrap.innerHTML = items.map(function (_, i) {
            return '<button class="testi-dot' + (i === 0 ? ' testi-dot-active' : '') + '" role="tab" aria-selected="' + (i === 0) + '" aria-label="Go to testimonial ' + (i + 1) + '" data-dot="' + i + '"></button>';
        }).join('');

        var cards = Array.from(grid.querySelectorAll('.testi-card'));
        var dots = Array.from(dotsWrap.querySelectorAll('.testi-dot'));

        function scrollToCard(index) {
            var card = cards[index];
            if (!card) return;
            grid.scrollTo({ left: card.offsetLeft - 4, behavior: 'smooth' });
        }

        dots.forEach(function (btn, i) {
            btn.addEventListener('click', function () { scrollToCard(i); });
        });

        function currentIndex() {
            var scrollLeft = grid.scrollLeft;
            var closest = 0, minDist = Infinity;
            cards.forEach(function (card, i) {
                var dist = Math.abs(card.offsetLeft - scrollLeft);
                if (dist < minDist) { minDist = dist; closest = i; }
            });
            return closest;
        }

        if (prevBtn) prevBtn.addEventListener('click', function () {
            var idx = currentIndex();
            scrollToCard(idx === 0 ? items.length - 1 : idx - 1);
        });

        if (nextBtn) nextBtn.addEventListener('click', function () {
            var idx = currentIndex();
            scrollToCard(idx === items.length - 1 ? 0 : idx + 1);
        });

        var scrollTimer;
        grid.addEventListener('scroll', function () {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function () {
                var idx = currentIndex();
                dots.forEach(function (d, i) {
                    d.classList.toggle('testi-dot-active', i === idx);
                    d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
                });
            }, 80);
        });
    }

    /** 15. FAQ Accordion */
    function initDSFAQ(faqItems) {
        var dl = document.getElementById('ds-faq-accordions');
        if (!dl || !faqItems || !faqItems.length) return;

        var sorted = faqItems.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        var openIndex = 0;

        function render() {
            dl.innerHTML = sorted.map(function (faq, i) {
                var isOpen = i === openIndex;
                return '<div class="faq-item' + (isOpen ? ' faq-open' : '') + '" data-faq-index="' + i + '">' +
                    '<dt>' +
                    '<button class="faq-question" aria-expanded="' + isOpen + '" aria-controls="ds-faq-answer-' + i + '" id="ds-faq-question-' + i + '">' +
                    '<span>' + faq.question + '</span>' +
                    '<svg class="faq-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
                    '<path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                    '</svg>' +
                    '</button>' +
                    '</dt>' +
                    '<dd class="faq-answer" id="ds-faq-answer-' + i + '" role="region" aria-labelledby="ds-faq-question-' + i + '">' +
                    '<p>' + faq.answer + '</p>' +
                    '</dd>' +
                    '</div>';
            }).join('');

            dl.querySelectorAll('.faq-answer').forEach(function (ans) {
                ans.style.display = 'block';
                ans.style.overflow = 'hidden';
            });

            dl.querySelectorAll('.faq-question').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var index = parseInt(btn.closest('.faq-item').dataset.faqIndex, 10);
                    openIndex = (openIndex === index) ? null : index;
                    render();
                });
            });
        }

        render();
    }

    /** Populate FAQ contact card */
    function populateFaqContact(title, desc, btnLabel, btnUrl) {
        var card = document.querySelector('.faq-contact-card');
        if (!card) return;
        if (title) setText(card, '.faq-contact-title', title);
        if (desc) setText(card, '.faq-contact-desc', desc);
        if (btnLabel) {
            var btn = card.querySelector('.faq-contact-btn');
            if (btn) {
                var svg = btn.querySelector('svg');
                btn.textContent = btnLabel + ' ';
                if (svg) btn.appendChild(svg);
                if (btnUrl) btn.setAttribute('href', btnUrl);
            }
        }
    }

    /** 17. Footer */
    function populateFooter(footer) {
        if (!footer) return;
        var footerEl = document.querySelector('.site-footer');
        if (!footerEl) return;

        // Logo
        if (footer.logo) {
            var logoImg = footerEl.querySelector('.footer-logo');
            if (logoImg) logoImg.src = footer.logo;
        }

        // Address
        if (footer.address) {
            var addr = footerEl.querySelector('.footer-address');
            if (addr) {
                var a = footer.address;
                addr.innerHTML =
                    '<span>' + a.street + '</span>' +
                    '<span>' + a.city + '</span>' +
                    '<span>' + a.country + '</span>' +
                    '<span class="footer-phone">Phone: ' + a.phone + '</span>' +
                    '<span>Email: <a href="mailto:' + a.email + '" class="footer-email-link">' + a.email + '</a></span>';
            }
        }

        // Social links
        if (footer.socialLinks && footer.socialLinks.length) {
            var socialWrap = footerEl.querySelector('.footer-social');
            if (socialWrap) {
                socialWrap.innerHTML = footer.socialLinks.map(function (s) {
                    return '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer" class="footer-social-link" aria-label="' + s.label + '">' +
                        s.svg +
                        '</a>';
                }).join('');
            }
        }

        // Link groups
        if (footer.linkGroups && footer.linkGroups.length) {
            var groups = footerEl.querySelectorAll('.footer-link-group');
            // Replace existing groups or build new ones
            var container = footerEl.querySelector('.footer-container');
            if (container) {
                // Remove existing link groups
                groups.forEach(function (g) { g.remove(); });

                // Build new ones from CMS
                footer.linkGroups.forEach(function (group) {
                    var div = document.createElement('div');
                    div.className = 'footer-link-group';
                    div.setAttribute('aria-labelledby', group.groupId);
                    div.innerHTML =
                        '<h3 id="' + group.groupId + '" class="footer-link-title">' + group.title + '</h3>' +
                        '<ul>' +
                        (group.links || []).map(function (link) {
                            return '<li><a href="' + link.url + '" class="footer-link">' + link.text + '</a></li>';
                        }).join('') +
                        '</ul>';
                    container.appendChild(div);
                });
            }
        }

        // Copyright
        if (footer.copyrightText) {
            var bottomP = footerEl.querySelector('.footer-bottom p');
            if (bottomP) {
                bottomP.innerHTML = footer.copyrightText.replace('{year}', new Date().getFullYear());
            }
        }
    }

    /* ─────────────────────────────────────────────────────────
       BUTTON RIPPLE EXTENSION
    ───────────────────────────────────────────────────────── */
    function initCTARipple() {
        function addRipple(e) {
            var btn = e.currentTarget;
            var existing = btn.querySelector('.ripple-effect');
            if (existing) existing.remove();

            var rect = btn.getBoundingClientRect();
            var size = Math.max(rect.width, rect.height);
            var x = e.clientX - rect.left - size / 2;
            var y = e.clientY - rect.top - size / 2;

            var ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            ripple.style.cssText = [
                'position:absolute',
                'border-radius:50%',
                'background:rgba(255,255,255,0.25)',
                'transform:scale(0)',
                'animation:rippleAnim 0.5s linear',
                'pointer-events:none',
                'width:' + size + 'px',
                'height:' + size + 'px',
                'left:' + x + 'px',
                'top:' + y + 'px'
            ].join(';');

            btn.style.overflow = 'hidden';
            btn.style.position = 'relative';
            btn.appendChild(ripple);
            ripple.addEventListener('animationend', function () { ripple.remove(); });
        }

        document.querySelectorAll('.ds-cta-btn-primary').forEach(function (btn) {
            btn.addEventListener('click', addRipple);
        });
    }

    /* ─────────────────────────────────────────────────────────
       PAGE LOADER
    ───────────────────────────────────────────────────────── */
    function hidePageLoader() {
        var loader = document.getElementById('page-loader');
        if (!loader) return;
        loader.classList.add('loader-done');
        setTimeout(function () {
            loader.classList.add('loader-hidden');
        }, 520);
    }

    /* ─────────────────────────────────────────────────────────
       NAVBAR ACTIVE STATE
    ───────────────────────────────────────────────────────── */
    function markActiveNavLink() {
        var path = window.location.pathname;
        document.querySelectorAll('.nav-link, .mobile-nav-links .nav-link').forEach(function (link) {
            var href = link.getAttribute('href') || '';
            if (href && path.includes(href) && href !== '/') {
                link.classList.add('active');
            }
        });
    }

    /* ─────────────────────────────────────────────────────────
       BOOT — Fetch from CMS, then populate all sections
    ───────────────────────────────────────────────────────── */
    async function init() {
        initCTARipple();
        markActiveNavLink();

        try {
            var response = await getDedicatedServerPage();
            var page = response.data;

            // 1. SEO
            populateSEO(page.seo);

            // 2. Hero (+ server rack + CTA links)
            populateHero(page.hero);

            // 3. Feature Highlights
            populateFeatureHighlights(page.featureHighlights);

            // 4. Pricing
            populatePricingHeader(page.pricingLabel, page.pricingTitle, page.pricingSubtitle);
            populatePricingPlans(page.pricingPlans);

            // 5. Pillars
            populatePillars(page.pillarsLabel, page.pillarsTitle, page.pillarsSubtitle, page.pillars);

            // 6. CTA Band #1
            populateCtaBand('.ds-cta-band:not(.ds-cta-dark)', page.ctaBand1);

            // 7. Security (+ shield visual)
            populateSecurity(page.securityLabel, page.securityTitle, page.securityDescription, page.shieldVisual, page.securityCards);

            // 8. More Services
            populateServices(page.servicesLabel, page.servicesTitle, page.servicesDescription, page.servicesImage, page.servicesImageAlt, page.serviceButtons);

            // 9. Comparison
            populateComparison(page.comparisonLabel, page.comparisonTitle, page.comparisonSubtitle, page.comparisonColumns, page.comparisonRows);

            // 10. Performance (+ CTA buttons)
            populatePerformance(page.performanceLabel, page.performanceTitle, page.performanceDescription, page.performanceChecklist, page.performanceCtaPrimary, page.performanceCtaSecondary, page.performanceStats);

            // 11. Locations
            populateLocations(page.locationsLabel, page.locationsTitle, page.locationsDescription, page.locationPins, page.locationTags);

            // 12. When Do You Need
            populateWhenCards(page.whenLabel, page.whenTitle, page.whenSubtitle, page.whenCards);

            // 13. Who Can Use
            populateUseCases(page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle, page.useCaseCards);

            // 14. Testimonials
            if (page.testimonialTitle) {
                setText(document, '.testi-title', page.testimonialTitle);
            }
            initDSTestimonials(page.testimonials);

            // 15. FAQ
            if (page.faqTitle) {
                setText(document, '.faq-title', page.faqTitle);
            }
            initFAQ(page.faq);
            populateFaqContact(page.faqContactTitle, page.faqContactDescription, page.faqContactBtnLabel, page.faqContactBtnUrl);

            // 16. CTA Band #2
            populateCtaBand('.ds-cta-dark', page.ctaBand2);


        } catch (err) {
            console.error('[dedicated-server] Failed to load CMS data:', err);
            // Page will display with hardcoded fallback content from HTML
        }

        // Always hide loader after content attempt
        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
