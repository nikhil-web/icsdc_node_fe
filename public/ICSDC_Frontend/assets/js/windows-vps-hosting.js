import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    hidePageLoader,
    markActiveNavLink,
    initTestimonials,
    initFAQ,
    setText,
    setHTML,
    resolveIcon
} from './utils/cms-helpers.js';
import { getWindowsVpsHostingPage } from './services/contentService.js';

(function () {
    'use strict';

    /**
     * Render the Windows VPS plans grid.
     * Uses ds.vps-plan component fields: name, price, priceNote, vcpu, ram, storage, bandwidth, isPopular.
     */
    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#wvps-plans .wvps-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isPopular || false;
            var featuredClass = isFeatured ? ' wvps-plan-featured' : '';
            var badgeHtml = isFeatured
                ? '<div class="wvps-plan-badge">Most Popular</div>'
                : '';

            var priceHtml = plan.price
                ? '<div class="wvps-plan-price">&#8377;' + plan.price + ' <span>' + (plan.priceNote || '/mo') + '</span></div>'
                : '';

            var featureItems = [];
            if (plan.vcpu)      featureItems.push(plan.vcpu);
            if (plan.ram)       featureItems.push(plan.ram + ' RAM');
            if (plan.storage)   featureItems.push(plan.storage + ' Storage');
            if (plan.bandwidth) featureItems.push(plan.bandwidth + ' Bandwidth');

            var featuresHtml = featureItems.length
                ? '<ul class="wvps-plan-features">' +
                    featureItems.map(function (f) { return '<li>' + f + '</li>'; }).join('') +
                  '</ul>'
                : '';

            var btnClass = isFeatured ? 'wvps-plan-btn-featured' : 'wvps-plan-btn';

            return '<div class="wvps-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="wvps-plan-name">' + (plan.name || '') + '</div>' +
                priceHtml +
                featuresHtml +
                '<a href="/contact-us.html" class="' + btnClass + '">Get Started &rarr;</a>' +
                '</div>';
        }).join('');
    }

    /**
     * Render the tabbed technology stack.
     * techStacks = array of { category, subtitle, items: [{ text, icon }] }
     * Clicking a tab pill swaps the card content.
     */
    function populateTechStack(stacks) {
        if (!stacks || !stacks.length) return;
        var nav = document.getElementById('stack-tab-nav');
        var content = document.getElementById('stack-tab-content');
        if (!nav || !content) return;

        function renderCard(stack) {
            var itemsHtml = (stack.items || []).map(function (item) {
                var text  = typeof item === 'string' ? item : (item.text || '');
                var icon  = typeof item === 'string' ? 'circle-dot' : (item.icon || 'circle-dot');
                return '<div class="wvps-stack-item">' +
                    resolveIcon(icon) +
                    '<span>' + text + '</span>' +
                    '</div>';
            }).join('');

            return '<div class="wvps-stack-card">' +
                '<div class="wvps-stack-card-title">' + (stack.category || '') + '</div>' +
                '<div class="wvps-stack-card-subtitle">' + (stack.subtitle || '') + '</div>' +
                '<div class="wvps-stack-items">' + itemsHtml + '</div>' +
                '<div class="wvps-stack-cta">' +
                    '<a href="/contact-us.html" class="wvps-stack-cta-btn">Deploy Now &rarr;</a>' +
                '</div>' +
                '</div>';
        }

        // Build tab buttons
        nav.innerHTML = stacks.map(function (stack, i) {
            return '<button class="wvps-stack-tab-btn' + (i === 0 ? ' is-active' : '') + '" data-idx="' + i + '">' +
                (stack.category || 'Tab ' + (i + 1)) +
                '</button>';
        }).join('');

        // Show first tab's card
        content.innerHTML = renderCard(stacks[0]);

        // Tab click handler
        nav.addEventListener('click', function (e) {
            var btn = e.target.closest('.wvps-stack-tab-btn');
            if (!btn) return;
            var idx = parseInt(btn.dataset.idx, 10);
            nav.querySelectorAll('.wvps-stack-tab-btn').forEach(function (b) { b.classList.remove('is-active'); });
            btn.classList.add('is-active');
            content.innerHTML = renderCard(stacks[idx]);
        });
    }

    async function init() {
        markActiveNavLink();

        try {
            var res = await getWindowsVpsHostingPage();
            var page = res.data;

            // SEO
            populateSEO(page.seo);

            // Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.win-badge',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
                heroImage: page.heroImage
            });

            // 4 Pillars
            populateIconCards('.why-grid', page.pillars, 'why-card');

            // Plans
            populateSectionHeader('#wvps-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // Who We Are
            if (page.aboutTitle) setText(document, '#wvps-about-title', page.aboutTitle);
            if (page.aboutDesc)  setHTML(document, '#wvps-about-desc', '<p>' + page.aboutDesc + '</p>');

            // Why Businesses Choose ICSDC — sub-section inside Who We Are
            var whyBlock = document.getElementById('wvps-about-why');
            if (whyBlock && (page.aboutWhyTitle || (page.aboutPoints && page.aboutPoints.length))) {
                if (page.aboutWhyTitle) setText(document, '#wvps-about-why-title', page.aboutWhyTitle);
                if (page.aboutPoints && page.aboutPoints.length) {
                    var pointsList = document.getElementById('wvps-about-points');
                    if (pointsList) {
                        pointsList.innerHTML = page.aboutPoints.map(function (pt) {
                            return '<li class="wvps-about-point"><i class="fa-solid fa-circle-check" aria-hidden="true"></i><span>' + pt + '</span></li>';
                        }).join('');
                    }
                }
                whyBlock.style.display = '';
            }

            if (page.aboutImage && page.aboutImage.image && page.aboutImage.image.url) {
                var aboutImg = document.querySelector('#wvps-about-img');
                if (aboutImg) {
                    var _base = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : 'http://localhost:1337');
                    var _m = page.aboutImage.image;
                    var _url = (_m.formats && (_m.formats.large || _m.formats.medium || _m.formats.small)
                        ? (_m.formats.large || _m.formats.medium || _m.formats.small).url
                        : _m.url) || '';
                    if (_url && !_url.startsWith('http')) _url = _base + _url;
                    if (_url) { aboutImg.src = _url; aboutImg.alt = _m.alternativeText || 'ICSDC Windows VPS Hosting'; }
                }
            }

            // Features
            populateSectionHeader('#features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#features .cloud-power-grid', page.features, 'cloud-power-card');

            // Security
            populateSectionHeader('#security', page.securityLabel, page.securityTitle, page.securitySubtitle);
            populateIconCards('.win-security-grid', page.securityCards, 'win-security-card');

            // Why Choose Windows VPS
            populateSectionHeader('#wvps-why-choose', page.whyChooseLabel, page.whyChooseTitle, page.whyChooseSubtitle);
            populateIconCards('#wvps-why-choose .cloud-power-grid', page.whyChooseCards, 'cloud-power-card');

            // CTA Band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // Advanced Capabilities
            populateSectionHeader('#wvps-advanced', page.advancedLabel, page.advancedTitle, page.advancedSubtitle);
            populateIconCards('#wvps-advanced .cloud-power-grid', page.advancedCards, 'cloud-power-card');

            // Tech Stack — tabbed design
            populateSectionHeader('#tech-stack', page.techLabel, page.techTitle, page.techSubtitle);
            populateTechStack(page.techStacks);

            // Who Should Choose
            populateSectionHeader('#use-cases', page.useCasesLabel, page.useCasesTitle, page.useCasesSubtitle);
            populateIconCards('#use-cases .cloud-use-grid', page.useCases, 'cloud-use-card');

            // Testimonials
            if (page.testimonialTitle) setText(document, '#winvps-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // CTA Band 2
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

            // FAQ
            if (page.faqTitle) setText(document, '#winvps-faq-heading', page.faqTitle);
            initFAQ(page.faq);

        } catch (err) {
            console.error('[windows-vps-hosting] CMS load failed:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
