/**
 * vps-hosting.js
 * ──────────────
 * CMS-driven version: fetches all page content from Strapi
 * and populates DOM sections dynamically.
 *
 * Sections handled:
 *   1.  SEO meta tags
 *   2.  Hero (eyebrow + VM stack visual)
 *   3.  Why-Us Pillars (4 icon cards)
 *   4.  Infrastructure (14 pillar cards)
 *   5.  Pricing Plans (3 cards)
 *   6.  VPS Types (button strip)
 *   7.  Speed Architecture (stats + feature list)
 *   8.  Management Systems (6 cards)
 *   9.  CTA Band #1
 *   10. VPS Difference (3 cards)
 *   11. Global Deployment (locations grid)
 *   12. Use Cases (4 cards)
 *   13. Control Panels (5 badges)
 *   14. Testimonials
 *   15. FAQ
 *   16. CTA Band #2 (final CTA)
 */

import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    populatePricingPlans,
    populateStats,
    populateTechBadges,
    populateLocationCards,
    hidePageLoader,
    markActiveNavLink,
    setText,
    setHTML,
    resolveIcon,
    ICONS,
    starSVG,
    getInitials,
    checkSVG,
    initTestimonials,
    initFAQ
} from './utils/cms-helpers.js';

import { getVpsHostingPage } from './services/contentService.js';

(async function () {
    'use strict';

    markActiveNavLink();

    try {
        var res = await getVpsHostingPage();
        var page = res.data;

        /* ── 1. SEO ─────────────────────────────────────────── */
        populateSEO(page.seo);

        /* ── 2. Hero ────────────────────────────────────────── */
        var heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            populateHero(heroSection, {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.vps-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                price: page.heroPrice,
                priceNote: page.heroPriceNote,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary
            });
        }

        /* ── 3. Why-Us Pillars (4 cards) ────────────────────── */
        populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

        /* ── 4. Infrastructure Section (14 cards) ───────────── */
        (function () {
            var section = document.getElementById('vps-infrastructure');
            if (!section) return;
            if (page.infraLabel) setText(section, '.vps-section-label', page.infraLabel);
            if (page.infraTitle) setText(section, '.title', page.infraTitle);
            if (page.infraSubtitle) setText(section, '.subtitle', page.infraSubtitle);

            if (page.infraCards && page.infraCards.length) {
                var grid = section.querySelector('.vps-pillar-grid');
                if (grid) {
                    grid.innerHTML = page.infraCards.map(function (card) {
                        return '<div class="vps-pillar-card">' +
                            '<div class="vps-pillar-icon">' + resolveIcon(card.icon) + '</div>' +
                            '<h3>' + (card.title || '') + '</h3>' +
                            '<p>' + (card.description || '') + '</p>' +
                            '</div>';
                    }).join('');
                }
            }
        })();

        /* ── 5. Pricing Plans ───────────────────────────────── */
        (function () {
            var section = document.getElementById('vps-pricing');
            if (!section) return;
            if (page.pricingLabel) setText(section, '.vps-section-label', page.pricingLabel);
            if (page.pricingTitle) setText(section, '.title', page.pricingTitle);
            if (page.pricingSubtitle) setHTML(section, '.subtitle', page.pricingSubtitle);

            if (page.pricingPlans && page.pricingPlans.length) {
                var grid = section.querySelector('.vps-pricing-grid');
                if (grid) {
                    grid.innerHTML = page.pricingPlans.map(function (plan) {
                        var isFeatured = plan.badge && plan.badge.length > 0;
                        var featuredClass = isFeatured ? ' vps-featured' : '';
                        var badgeHTML = isFeatured
                            ? '<span class="vps-plan-badge">' + plan.badge + '</span>'
                            : '';
                        var ctaClass = plan.ctaStyle === 'primary' ? 'vps-plan-cta-primary' : 'vps-plan-cta-outline';

                        var featuresHTML = '';
                        if (plan.features && plan.features.length) {
                            featuresHTML = plan.features.map(function (f) {
                                return '<li class="vps-plan-feature">' +
                                    '<span class="vps-plan-check">' + checkSVG() + '</span>' +
                                    (f.label || '') +
                                    '</li>';
                            }).join('');
                        }

                        return '<div class="vps-plan-card' + featuredClass + '">' +
                            badgeHTML +
                            '<div class="vps-plan-tier">' + (plan.tier || '') + '</div>' +
                            '<div class="vps-plan-price-wrap">' +
                            '<span class="vps-plan-currency">' + (plan.currency || '&#8377;') + '</span>' +
                            '<span class="vps-plan-price">' + (plan.price || '') + '</span>' +
                            '<span class="vps-plan-period">/mo</span>' +
                            '</div>' +
                            (plan.tagline ? '<p class="vps-plan-tagline">' + plan.tagline + '</p>' : '') +
                            '<hr class="vps-plan-divider">' +
                            '<ul class="vps-plan-features">' + featuresHTML + '</ul>' +
                            '<button class="vps-plan-cta ' + ctaClass + '">' + (plan.ctaText || '') + '</button>' +
                            '</div>';
                    }).join('');
                }
            }
        })();

        /* ── 6. VPS Types (button strip) ────────────────────── */
        (function () {
            if (!page.vpsTypes || !page.vpsTypes.length) return;
            var strip = document.querySelector('.vps-types-strip');
            if (!strip) return;

            strip.innerHTML = page.vpsTypes.map(function (t) {
                return '<button class="vps-type-link">' +
                    resolveIcon(t.icon) +
                    (t.title || '') +
                    '<span class="vps-type-arrow">&rarr;</span>' +
                    '</button>';
            }).join('');
        })();

        /* ── 7. Speed Architecture ──────────────────────────── */
        (function () {
            var section = document.getElementById('vps-speed');
            if (!section) return;

            // Stats (left visual)
            if (page.speedStats && page.speedStats.length) {
                var statWrap = section.querySelector('.vps-speed-stat-wrap');
                if (statWrap) {
                    statWrap.innerHTML = page.speedStats.map(function (s) {
                        return '<div class="vps-speed-stat">' +
                            '<strong>' + (s.value || '') + '</strong>' +
                            '<span>' + (s.label || '') + '</span>' +
                            '</div>';
                    }).join('');
                }
            }

            // Section label + title (right side)
            if (page.speedLabel) setText(section, '.vps-section-label', page.speedLabel);
            if (page.speedTitle) setHTML(section, '.title', page.speedTitle);

            // Feature items (right list)
            if (page.speedFeatures && page.speedFeatures.length) {
                var list = section.querySelector('.vps-speed-list');
                if (list) {
                    list.innerHTML = page.speedFeatures.map(function (f) {
                        return '<div class="vps-speed-item">' +
                            '<div class="vps-speed-icon">' + resolveIcon(f.icon) + '</div>' +
                            '<div>' +
                            '<h3>' + (f.title || '') + '</h3>' +
                            '<p>' + (f.description || '') + '</p>' +
                            '</div>' +
                            '</div>';
                    }).join('');
                }
            }
        })();

        /* ── 8. Management Systems (6 cards) ────────────────── */
        (function () {
            var section = document.getElementById('vps-management');
            if (!section) return;
            if (page.mgmtLabel) setText(section, '.vps-section-label', page.mgmtLabel);
            if (page.mgmtTitle) setText(section, '.title', page.mgmtTitle);
            if (page.mgmtSubtitle) setText(section, '.subtitle', page.mgmtSubtitle);

            if (page.mgmtCards && page.mgmtCards.length) {
                var grid = section.querySelector('.vps-mgmt-grid');
                if (grid) {
                    grid.innerHTML = page.mgmtCards.map(function (card) {
                        return '<div class="vps-mgmt-card">' +
                            '<div class="vps-mgmt-icon">' + resolveIcon(card.icon) + '</div>' +
                            '<h3>' + (card.title || '') + '</h3>' +
                            '<p>' + (card.description || '') + '</p>' +
                            '</div>';
                    }).join('');
                }
            }
        })();

        /* ── 9. CTA Band #1 ────────────────────────────────── */
        (function () {
            var cta = page.ctaBand1;
            if (!cta) return;
            var section = document.querySelector('.vps-cta-band:not(.vps-cta-dark)');
            if (!section) return;
            var inner = section.querySelector('.vps-cta-inner');
            if (!inner) return;

            setHTML(inner, 'h2', cta.title);
            setHTML(inner, 'p', cta.description);

            var btns = inner.querySelector('.vps-cta-btns');
            if (btns) {
                var primaryBtn = btns.querySelector('.vps-cta-btn-primary');
                var secondaryBtn = btns.querySelector('.vps-cta-btn-outline');
                if (primaryBtn && cta.ctaPrimary) {
                    primaryBtn.innerHTML = cta.ctaPrimary.text;
                    if (cta.ctaPrimary.link) primaryBtn.setAttribute('onclick', "window.location.href='" + cta.ctaPrimary.link + "'");
                }
                if (secondaryBtn && cta.ctaSecondary) {
                    secondaryBtn.textContent = cta.ctaSecondary.text;
                    if (cta.ctaSecondary.link) secondaryBtn.setAttribute('onclick', "window.location.href='" + cta.ctaSecondary.link + "'");
                }
            }
        })();

        /* ── 10. VPS Difference (3 cards) ───────────────────── */
        (function () {
            var section = document.getElementById('vps-difference');
            if (!section) return;
            if (page.diffLabel) setText(section, '.vps-section-label', page.diffLabel);
            if (page.diffTitle) setHTML(section, 'h2:not(.vps-section-label)', page.diffTitle);
            if (page.diffSubtitle) setHTML(section, 'p[data-animate]', page.diffSubtitle);

            if (page.diffCards && page.diffCards.length) {
                var grid = section.querySelector('.vps-diff-grid');
                if (grid) {
                    grid.innerHTML = page.diffCards.map(function (card) {
                        return '<div class="vps-diff-card">' +
                            '<div class="vps-diff-icon">' + resolveIcon(card.icon) + '</div>' +
                            '<h3>' + (card.title || '') + '</h3>' +
                            '<p>' + (card.description || '') + '</p>' +
                            '</div>';
                    }).join('');
                }
            }
        })();

        /* ── 11. Global Deployment (locations) ──────────────── */
        (function () {
            var section = document.getElementById('vps-global');
            if (!section) return;

            var content = section.querySelector('.vps-global-content');
            if (content) {
                if (page.globalLabel) setText(content, '.vps-section-label', page.globalLabel);
                if (page.globalTitle) setHTML(content, '.title', page.globalTitle);

                // Description (may contain multiple paragraphs)
                if (page.globalDescription) {
                    var paragraphs = content.querySelectorAll('.who-we-are-paragraph');
                    var descParts = page.globalDescription.split('\n\n');
                    paragraphs.forEach(function (p, i) {
                        if (descParts[i]) p.innerHTML = descParts[i];
                    });
                }

                // CTA buttons
                var primaryBtn = content.querySelector('.btn-primary');
                var outlineBtn = content.querySelector('.btn-outline');
                if (primaryBtn && page.globalCtaPrimary) {
                    primaryBtn.innerHTML = page.globalCtaPrimary.text;
                    if (page.globalCtaPrimary.link) primaryBtn.setAttribute('onclick', "window.location.href='" + page.globalCtaPrimary.link + "'");
                }
                if (outlineBtn && page.globalCtaSecondary) {
                    outlineBtn.textContent = page.globalCtaSecondary.text;
                    if (page.globalCtaSecondary.link) outlineBtn.setAttribute('onclick', "window.location.href='" + page.globalCtaSecondary.link + "'");
                }
            }

            // Location cards
            if (page.locations && page.locations.length) {
                var grid = section.querySelector('.vps-locations-grid');
                if (grid) {
                    var sorted = page.locations.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
                    grid.innerHTML = sorted.map(function (loc) {
                        return '<div class="vps-location-card">' +
                            '<span class="vps-location-flag">' + (loc.flag || '') + '</span>' +
                            '<div class="vps-location-info">' +
                            '<h4>' + (loc.name || '') + '</h4>' +
                            '<p>' + (loc.description || '') + '</p>' +
                            '</div>' +
                            '</div>';
                    }).join('');
                }
            }
        })();

        /* ── 12. Use Cases (4 cards) ────────────────────────── */
        (function () {
            var section = document.getElementById('vps-usecases');
            if (!section) return;
            if (page.useCasesLabel) setText(section, '.vps-section-label', page.useCasesLabel);
            if (page.useCasesTitle) setText(section, '.title', page.useCasesTitle);
            if (page.useCasesSubtitle) setText(section, '.subtitle', page.useCasesSubtitle);

            if (page.useCases && page.useCases.length) {
                var grid = section.querySelector('.vps-use-grid');
                if (grid) {
                    grid.innerHTML = page.useCases.map(function (card) {
                        return '<div class="vps-use-card">' +
                            '<div class="vps-use-icon">' + resolveIcon(card.icon) + '</div>' +
                            '<div>' +
                            '<h3>' + (card.title || '') + '</h3>' +
                            '<p>' + (card.description || '') + '</p>' +
                            '</div>' +
                            '</div>';
                    }).join('');
                }
            }
        })();

        /* ── 13. Control Panels (5 badges) ──────────────────── */
        (function () {
            var section = document.getElementById('vps-panels');
            if (!section) return;
            if (page.panelsLabel) setText(section, '.vps-section-label', page.panelsLabel);
            if (page.panelsTitle) setText(section, '.title', page.panelsTitle);
            if (page.panelsSubtitle) setText(section, '.subtitle', page.panelsSubtitle);

            if (page.controlPanels && page.controlPanels.length) {
                var strip = section.querySelector('.vps-panels-strip');
                if (strip) {
                    var sorted = page.controlPanels.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
                    strip.innerHTML = sorted.map(function (panel) {
                        return '<div class="vps-panel-badge">' +
                            '<div class="vps-panel-icon">' + resolveIcon(panel.icon) + '</div>' +
                            '<span class="vps-panel-name">' + (panel.name || '') + '</span>' +
                            '</div>';
                    }).join('');
                }
            }
        })();

        if (page.testimonials && page.testimonials.length) {
            initTestimonials(page.testimonials)
        } else {
            //hide the entire section if no testimonials            
            var testiSection = document.getElementsByClassName('testi-section');
            if (testiSection) {
                testiSection.style.display = 'none';
            }
        }


        // 9. FAQ
        if (page.faqTitle) {
            setText(document, '#acr-faq-heading', page.faqTitle);
        }
        initFAQ(page.faq);

        /* ── 16. CTA Band #2 (final CTA) ───────────────────── */
        (function () {
            var cta = page.ctaBand2;
            if (!cta) return;
            var section = document.querySelector('.vps-cta-dark');
            if (!section) return;
            var inner = section.querySelector('.vps-cta-inner');
            if (!inner) return;

            setHTML(inner, 'h2', cta.title);
            setHTML(inner, 'p', cta.description);

            var btns = inner.querySelector('.vps-cta-btns');
            if (btns) {
                var primaryBtn = btns.querySelector('.vps-cta-btn-primary');
                var secondaryBtn = btns.querySelector('.vps-cta-btn-outline');
                if (primaryBtn && cta.ctaPrimary) {
                    primaryBtn.innerHTML = cta.ctaPrimary.text;
                    if (cta.ctaPrimary.link) primaryBtn.setAttribute('onclick', "window.location.href='" + cta.ctaPrimary.link + "'");
                }
                if (secondaryBtn && cta.ctaSecondary) {
                    secondaryBtn.textContent = cta.ctaSecondary.text;
                    if (cta.ctaSecondary.link) secondaryBtn.setAttribute('onclick', "window.location.href='" + cta.ctaSecondary.link + "'");
                }
            }
        })();

    } catch (err) {
        console.error('[vps-hosting] CMS load failed:', err);
    }

    hidePageLoader();
})();
