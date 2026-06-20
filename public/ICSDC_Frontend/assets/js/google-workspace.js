import { getGoogleWorkspacePage } from './services/contentService.js';
import { inlineRichText } from './utils/cms-helpers.js';
import { uploadURL } from './services/strapiClient.js';
import {
    populateSEO,
    populateHero,
    populateIconCards,
    resolveIcon,
    populateSectionHeader,
    populateCtaBand,
    populatePricingPlansCloud,
    hidePageLoader,
    markActiveNavLink,
    setText,
    setHTML,
    initFAQ,
    initTestimonials
} from './utils/cms-helpers.js';

(function () {
    'use strict';

    // Why Choose ICSDC for Google Workspace Suite — icon reason cards
    var GWS_REASON_COLORS = ['gws-why-blue', 'gws-why-peach', 'gws-why-purple', 'gws-why-green'];
    var GWS_REASON_ICONS = ['fa-shield-halved', 'fa-lock', 'fa-clock-rotate-left', 'fa-sliders', 'fa-layer-group', 'fa-globe'];
    function populateSteps(steps) {
        if (!steps || !steps.length) return;
        var grid = document.getElementById('gws-reason-grid');
        if (!grid) return;

        var sorted = steps.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (step, i) {
            var icon = step.icon ? resolveIcon(step.icon) :
                '<i class="fa-solid ' + GWS_REASON_ICONS[i % GWS_REASON_ICONS.length] + '" aria-hidden="true"></i>';
            return '<div class="gws-reason-card ' + GWS_REASON_COLORS[i % GWS_REASON_COLORS.length] + '">' +
                '<div class="gws-reason-icon">' + icon + '</div>' +
                '<h3>' + (step.title || '') + '</h3>' +
                '<p>' + inlineRichText(step.description || '') + '</p>' +
                '</div>';
        }).join('');
    }

    function setSectionImage(imgId, imageComp) {
        if (!imageComp || !imageComp.image) return;
        var el = document.getElementById(imgId);
        if (!el) return;
        var url = uploadURL(imageComp.image);
        if (url) el.src = url;
    }

    function paragraphs(text) {
        return String(text || '').split(/\n\n+/).map(function (p) {
            return '<p>' + p.trim() + '</p>';
        }).join('');
    }

    // Map a Workspace app name → { icon, color } for the showcase cards
    var GWS_APP_ICONS = {
        'gmail':      { icon: 'fa-envelope',             color: '#ea4335' },
        'drive':      { icon: 'fa-hard-drive',           color: '#1aa260' },
        'calendar':   { icon: 'fa-calendar-days',        color: '#4285f4' },
        'meet':       { icon: 'fa-video',                color: '#00ac47' },
        'chat':       { icon: 'fa-comment-dots',         color: '#34a853' },
        'docs':       { icon: 'fa-file-lines',           color: '#4285f4' },
        'sheets':     { icon: 'fa-table-cells',          color: '#0f9d58' },
        'slides':     { icon: 'fa-display',              color: '#f4b400' },
        'forms':      { icon: 'fa-square-poll-vertical', color: '#7248b9' },
        'sites':      { icon: 'fa-sitemap',              color: '#4285f4' },
        'gemini':     { icon: 'fa-wand-magic-sparkles',  color: '#4285f4' },
        'notebooklm': { icon: 'fa-book-open',            color: '#ea4335' },
        'appsheet':   { icon: 'fa-mobile-screen-button', color: '#34a853' }
    };

    function appIcon(name) {
        var key = String(name || '').toLowerCase().replace(/\s+ai$/, '').replace(/\s+/g, '');
        // try exact, then first word, then substring match
        if (GWS_APP_ICONS[key]) return GWS_APP_ICONS[key];
        var first = String(name || '').toLowerCase().split(/\s+/)[0];
        if (GWS_APP_ICONS[first]) return GWS_APP_ICONS[first];
        for (var k in GWS_APP_ICONS) {
            if (key.indexOf(k) !== -1) return GWS_APP_ICONS[k];
        }
        return { icon: 'fa-cube', color: 'var(--blue)' };
    }

    // Scale Your Business — app showcase (3 groups of icon cards)
    function populateScale(page) {
        if (page.scaleTitle) setText(document, '#gws-scale-title', page.scaleTitle);
        if (page.scaleDesc) setHTML(document, '#gws-scale-desc', paragraphs(page.scaleDesc));

        if (page.scaleGroups && page.scaleGroups.length) {
            var wrap = document.getElementById('gws-scale-groups');
            if (wrap) {
                wrap.innerHTML = page.scaleGroups.map(function (g) {
                    var apps = (g.apps || []).map(function (a) {
                        var ic = appIcon(a.name);
                        return '<div class="gws-app-card">' +
                            '<div class="gws-app-icon" style="color:' + ic.color + '">' +
                            '<i class="fa-solid ' + ic.icon + '" aria-hidden="true"></i></div>' +
                            '<h4>' + (a.name || '') + '</h4>' +
                            '<p>' + inlineRichText(a.desc || '') + '</p>' +
                            '</div>';
                    }).join('');
                    return '<div class="gws-scale-group">' +
                        '<h3 class="gws-scale-group-title">' + (g.title || '') + '</h3>' +
                        '<div class="gws-scale-apps">' + apps + '</div>' +
                        '</div>';
                }).join('');
            }
        }
        setSectionImage('gws-scale-img', page.scaleImage);
    }

    // Why Choose Google Workspace — bento grid (featured first card + color cycling)
    var GWS_WHY_COLORS = ['gws-why-blue', 'gws-why-peach', 'gws-why-green', 'gws-why-purple'];
    function populateWhyIcsdc(cards) {
        if (!cards || !cards.length) return;
        var grid = document.getElementById('why-icsdc-grid');
        if (!grid) return;

        var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (card, i) {
            var classes = ['gws-why-card', GWS_WHY_COLORS[i % GWS_WHY_COLORS.length]];
            if (i === 0) classes.push('gws-why-featured');
            else if (i % 4 === 0) classes.push('gws-why-tall');

            return '<div class="' + classes.join(' ') + '">' +
                '<div class="gws-why-icon" aria-hidden="true">' + resolveIcon(card.icon) + '</div>' +
                '<h3>' + (card.title || '') + '</h3>' +
                '<p>' + inlineRichText(card.desc || card.description || '') + '</p>' +
                '</div>';
        }).join('');
    }

    // Plan comparison tables — either single-column (Feature | value) or
    // 4-plan (Feature | starter | standard | plus | enterprise)
    var GWS_PLAN_COLS = ['starter', 'standard', 'plus', 'enterprise'];
    function compareCell(v) {
        v = v || '';
        var cls = v === '✅' || v === 'check' ? ' class="gws-yes"'
            : v === '❌' || v === 'cross' ? ' class="gws-no"' : '';
        var disp = v === '✅' || v === 'check' ? '✓' : v === '❌' || v === 'cross' ? '✗' : v;
        return '<td' + cls + '>' + disp + '</td>';
    }
    function populateCompareTable(tableId, rows) {
        if (!rows || !rows.length) return;
        var tbody = document.querySelector('#' + tableId + ' tbody');
        if (!tbody) return;
        var isMultiPlan = GWS_PLAN_COLS.some(function (c) { return rows[0].hasOwnProperty(c); });
        tbody.innerHTML = rows.map(function (r) {
            if (isMultiPlan) {
                return '<tr><td>' + (r.feature || '') + '</td>' +
                    GWS_PLAN_COLS.map(function (c) { return compareCell(r[c]); }).join('') +
                    '</tr>';
            }
            return '<tr><td>' + (r.feature || '') + '</td>' + compareCell(r.value) + '</tr>';
        }).join('');
    }

    // Upgrade the Way Your Team Works — floating icon cards
    var GWS_UPGRADE_COLORS = ['gws-why-blue', 'gws-why-peach', 'gws-why-purple', 'gws-why-green'];
    var GWS_UPGRADE_ICONS = ['fa-envelope', 'fa-mobile-screen-button', 'fa-people-arrows', 'fa-layer-group',
        'fa-shield-halved', 'fa-at', 'fa-wand-magic-sparkles'];
    function populateUpgrade(page) {
        if (page.upgradeTitle) setText(document, '#gws-upgrade-title', page.upgradeTitle);
        if (page.upgradeDesc) setHTML(document, '#gws-upgrade-desc', page.upgradeDesc);

        if (page.upgradeBlocks && page.upgradeBlocks.length) {
            var wrap = document.getElementById('gws-upgrade-blocks');
            if (wrap) {
                wrap.innerHTML = page.upgradeBlocks.map(function (b, i) {
                    var icon = b.icon ? resolveIcon(b.icon) :
                        '<i class="fa-solid ' + GWS_UPGRADE_ICONS[i % GWS_UPGRADE_ICONS.length] + '" aria-hidden="true"></i>';
                    return '<div class="gws-upgrade-card ' + GWS_UPGRADE_COLORS[i % GWS_UPGRADE_COLORS.length] + '">' +
                        '<div class="gws-upgrade-icon">' + icon + '</div>' +
                        '<h3>' + (b.title || '') + '</h3>' +
                        '<p>' + inlineRichText(b.desc || '') + '</p>' +
                        '</div>';
                }).join('');
                initUpgradeTilt(wrap);
            }
        }
    }

    // Subtle 3D tilt on the upgrade cards, following the cursor
    function initUpgradeTilt(wrap) {
        wrap.querySelectorAll('.gws-upgrade-card').forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                var x = (e.clientX - rect.left) / rect.width - 0.5;
                var y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = 'perspective(600px) rotateX(' + (-y * 6) + 'deg) rotateY(' + (x * 6) + 'deg) translateY(-4px)';
            });
            card.addEventListener('mouseleave', function () {
                card.style.transform = '';
            });
        });
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getGoogleWorkspacePage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.gws-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
            heroImage: page.heroImage
            });

            // Hero badges
            if (page.heroTopBadge) setHTML(document, '.gws-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.gws-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.gws-bs', page.heroStatusSubtitle);

            // 4 Pillars (why-us)
            if (page.pillars) {
                populateIconCards('.why-us .why-grid', page.pillars, 'why-card');
            }

            // Plans section (no eyebrow) — shared cloud-plan-card style
            populateSectionHeader('#gws-plans', null, page.plansTitle, page.plansSubtitle);
            populatePricingPlansCloud('#gws-plans-grid', page.plans);

            // Features section — "The Complete Suite" (no eyebrow/subtitle)
            populateSectionHeader('#features', null, page.featuresTitle, null);
            if (page.features) {
                populateIconCards('#features .cloud-power-grid', page.features, 'cloud-power-card');
            }

            // Scale Your Business — app showcase
            populateScale(page);

            // Why Choose Google Workspace (12 cards, no eyebrow)
            populateSectionHeader('#why-icsdc', null, page.whyIcsdcTitle, null);
            if (page.whyCards) {
                populateWhyIcsdc(page.whyCards);
            }

            // Plan comparison tables
            if (page.prodCompareTitle) setText(document, '#gws-prod-compare-title', page.prodCompareTitle);
            populateCompareTable('gws-prod-compare', page.prodCompareRows);
            if (page.secCompareTitle) setText(document, '#gws-sec-compare-title', page.secCompareTitle);
            populateCompareTable('gws-sec-compare', page.secCompareRows);

            // Why Choose ICSDC for Google Workspace Suite (6 reasons, no eyebrow)
            populateSectionHeader('#how-it-works', null, page.howItWorksTitle, null);
            if (page.steps) {
                populateSteps(page.steps);
            }

            // Upgrade the Way Your Team Works
            populateUpgrade(page);
            if (!page.upgradeBlocks || !page.upgradeBlocks.length) {
                var upgradeWrap = document.getElementById('gws-upgrade-blocks');
                if (upgradeWrap) initUpgradeTilt(upgradeWrap);
            }

            // Testimonials
            if (page.testimonialTitle) {
                setText(document, '#testi-heading', page.testimonialTitle);
            }
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) {
                setText(document, '#gws-faq-heading', page.faqTitle);
            }
            initFAQ(page.faq);

            // Final CTA dark band
            if (page.ctaBand2) {
                populateCtaBand('.cloud-cta-dark', page.ctaBand2);
            }

        } catch (err) {
            console.error('[google-workspace] Failed to load CMS data:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
