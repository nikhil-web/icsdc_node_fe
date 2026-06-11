// ══════════════════════════════════════════════════════════
//  managed-cloud-hosting.js — ICSDC Managed Cloud Hosting Page
//  Fetches CMS data from Strapi and populates all sections.
// ══════════════════════════════════════════════════════════

import { getManagedCloudHostingPage } from './services/contentService.js';
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

    /**
     * Render the 3-column managed cloud plans grid.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#mch-plans .mch-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isFeatured || plan.popular || false;
            var featuredClass = isFeatured ? ' mch-plan-featured' : '';
            var badgeLabel = plan.badge || (isFeatured ? 'Most Popular' : '');
            var badgeHtml = badgeLabel
                ? '<div class="mch-plan-badge">' + badgeLabel + '</div>'
                : '';

            var currency = plan.currency || '₹';
            var period = plan.period || 'mo';
            var priceHtml = plan.price
                ? '<div class="mch-plan-price">' + currency + plan.price + ' <span>/' + period + '</span></div>'
                : '';

            var taglineHtml = plan.tagline
                ? '<div class="mch-plan-tagline">' + plan.tagline + '</div>'
                : '';

            var featuresArr = plan.features || [];
            var featuresHtml = featuresArr.length
                ? '<ul class="mch-plan-features">' +
                    featuresArr.map(function (f) {
                        return '<li>' + (f.label || f.text || f.name || f) + '</li>';
                    }).join('') +
                  '</ul>'
                : '';

            var ctaText = plan.ctaText || 'Get Started';
            var btnClass = isFeatured ? 'mch-plan-btn-featured' : 'mch-plan-btn';

            return '<div class="mch-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="mch-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
                priceHtml +
                taglineHtml +
                featuresHtml +
                '<a href="/contact-us" class="' + btnClass + '">' + ctaText + ' &rarr;</a>' +
                '</div>';
        }).join('');
    }

    /**
     * Who We Are — split text + image.
     * aboutDesc may contain multiple paragraphs separated by blank lines.
     */
    function populateAbout(page) {
        if (page.aboutTitle) setText(document, '#mch-about-title', page.aboutTitle);
        var descEl = document.getElementById('mch-about-desc');
        if (descEl && page.aboutDesc) {
            var paras = page.aboutDesc.split(/\n\s*\n/).filter(Boolean);
            descEl.innerHTML = paras.map(function (p) {
                return '<p>' + p.replace(/\n/g, ' ') + '</p>';
            }).join('');
        }
        if (page.aboutImage && page.aboutImage.image && page.aboutImage.image.url) {
            var strapiBase = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : '');
            var url = page.aboutImage.image.url;
            if (!/^https?:\/\//.test(url)) url = strapiBase + url;
            var img = document.getElementById('mch-about-img');
            if (img) { img.src = url; img.style.display = ''; }
        }
    }

    /**
     * Migration section — image (left) + content (right).
     * Title/desc/CTA come from ctaBand1; bullets from migrationPoints; image from migrationImage.
     * The ctaBand1.description contains intro + bullets mashed together, so we
     * truncate it at the first bullet to show only the intro paragraph.
     */
    function populateMigration(page) {
        var b = page.ctaBand1 || {};

        if (b.title) setText(document, '#mch-migration-title', b.title);

        if (b.description) {
            var desc = b.description;
            if (page.migrationPoints && page.migrationPoints.length) {
                var marker = page.migrationPoints[0].slice(0, 18);
                var idx = desc.indexOf(marker);
                if (idx > 0) desc = desc.slice(0, idx).trim();
            }
            setHTML(document, '#mch-migration-desc', desc);
        }

        var cta1 = document.getElementById('mch-migration-cta1');
        if (cta1 && b.ctaPrimary) {
            if (b.ctaPrimary.text) cta1.innerHTML = b.ctaPrimary.text + ' &rarr;';
            if (b.ctaPrimary.link) cta1.setAttribute('href', b.ctaPrimary.link);
        }
        var cta2 = document.getElementById('mch-migration-cta2');
        if (cta2) {
            if (b.ctaSecondary && b.ctaSecondary.text) {
                cta2.textContent = b.ctaSecondary.text;
                if (b.ctaSecondary.link) cta2.setAttribute('href', b.ctaSecondary.link);
            } else {
                cta2.style.display = 'none';
            }
        }

        // Bullet points
        var el = document.getElementById('mch-migration-points');
        if (el && page.migrationPoints && page.migrationPoints.length) {
            el.innerHTML = page.migrationPoints.map(function (pt) {
                return '<li>' + pt + '</li>';
            }).join('');
        }

        // Image (left column)
        if (page.migrationImage && page.migrationImage.image && page.migrationImage.image.url) {
            var strapiBase = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : '');
            var url = page.migrationImage.image.url;
            if (!/^https?:\/\//.test(url)) url = strapiBase + url;
            var img = document.getElementById('mch-migration-img');
            if (img) { img.src = url; img.style.display = ''; }
        }
    }

    /**
     * Related Services — 2 outlined cards (Managed VPS, Managed Dedicated).
     */
    function populateServices(cards) {
        var grid = document.getElementById('mch-services-grid');
        if (!grid || !cards || !cards.length) return;
        var arrowSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
        var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (card) {
            var iconClass = card.icon ? 'fa-solid fa-' + card.icon : 'fa-solid fa-server';
            var link = card.link || '#';
            var cta = /vps/i.test(card.title || '') ? 'Explore Managed VPS Hosting' : 'View Managed Dedicated Servers';
            return '<div class="mch-service-card">' +
                '<div class="mch-service-icon"><i class="' + iconClass + '" aria-hidden="true"></i></div>' +
                '<h3 class="mch-service-title">' + (card.title || '') + '</h3>' +
                '<p class="mch-service-desc">' + (card.desc || '') + '</p>' +
                '<a href="' + link + '" class="mch-service-btn">' + cta + ' ' + arrowSVG + '</a>' +
                '</div>';
        }).join('');
    }

    /**
     * Server Optimizations — 5 groups, each a title + a bullet list.
     * The bullets are stored in `description` joined by ". ".
     */
    function populateOptimizations(steps) {
        var wrap = document.getElementById('mch-optim-groups');
        if (!wrap || !steps || !steps.length) return;
        var sorted = steps.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        wrap.innerHTML = sorted.map(function (step) {
            var bullets = (step.description || '')
                .split('.')
                .map(function (s) { return s.trim(); })
                .filter(Boolean);
            var bulletsHtml = bullets.map(function (b) {
                return '<li>' + b + '</li>';
            }).join('');
            return '<div class="mch-optim-group">' +
                '<h3 class="mch-optim-group-title">' + (step.title || '') + '</h3>' +
                '<ul class="mch-optim-list">' + bulletsHtml + '</ul>' +
                '</div>';
        }).join('');
    }

    /**
     * When to Choose — centered bullet grid.
     */
    function populateWhen(page) {
        if (page.whenTitle) setText(document, '#mch-when-title', page.whenTitle);
        if (page.whenSubtitle) setText(document, '#mch-when-subtitle', page.whenSubtitle);
        var grid = document.getElementById('mch-when-grid');
        if (grid && page.whenPoints && page.whenPoints.length) {
            grid.innerHTML = page.whenPoints.map(function (pt) {
                return '<li><span class="mch-when-check"><i class="fa-solid fa-check" aria-hidden="true"></i></span>' +
                    pt + '</li>';
            }).join('');
        }
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getManagedCloudHostingPage();
            var page = response.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.mch-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
                heroImage: page.heroImage
            });

            if (page.heroTopBadge) setHTML(document, '.mch-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.mch-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.mch-bs', page.heroStatusSubtitle);

            // Why Us — 4 pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // Plans
            populateSectionHeader('#mch-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // Features (8 cards)
            populateSectionHeader('#mch-features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#mch-features .mch-features-grid', page.features, 'cloud-power-card');

            // Who We Are
            populateAbout(page);

            // Why Choose ICSDC (8 cards)
            populateSectionHeader('#mch-why', page.whyManagedLabel, page.whyManagedTitle, page.whyManagedSubtitle);
            populateIconCards('#mch-why .mch-why-grid', page.whyManagedCards, 'cloud-use-card');

            // Who Can Use (8 cards)
            populateSectionHeader('#mch-usecases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
            populateIconCards('#mch-usecases .mch-usecases-grid', page.useCases, 'cloud-power-card');

            // Migration section (image left, content right)
            populateMigration(page);

            // Related Services (2 cards)
            populateSectionHeader('#mch-services', page.servicesLabel, page.servicesTitle, page.servicesSubtitle);
            populateServices(page.servicesCards);

            // Server Optimizations (5 groups)
            populateSectionHeader('#mch-optim', null, null, null);
            populateOptimizations(page.howItWorksSteps);

            // When to Choose (8 bullets)
            populateWhen(page);

            // Testimonials
            if (page.testimonialTitle) setText(document, '#mch-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // FAQ
            if (page.faqTitle) setText(document, '#mch-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // CTA Band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[managed-cloud-hosting] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
