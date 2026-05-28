import { getWordpressHostingPage } from './services/contentService.js';
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

    function populatePlans(plans) {
        if (!plans || !plans.length) return;
        var grid = document.querySelector('#wp-plans .wp-plans-grid');
        if (!grid) return;

        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isFeatured || plan.popular || plan.isPopular || false;
            var featuredClass = isFeatured ? ' wp-plan-popular' : '';
            var badgeLabel = plan.badge || plan.badgeLabel || (isFeatured ? 'Most Popular' : '');
            var badgeHtml = badgeLabel
                ? '<div class="wp-plan-badge">' + badgeLabel + '</div>'
                : '';

            var features = (plan.features || []).map(function (f) {
                var label = typeof f === 'string' ? f : (f.text || f.label || f.name || '');
                return '<li>' + label + '</li>';
            }).join('');

            var ctaStyle = plan.ctaStyle || 'outline';
            var btnClass = ctaStyle === 'primary' ? 'wp-plan-btn wp-plan-btn-primary' : 'wp-plan-btn';

            return '<div class="wp-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="wp-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
                '<div class="wp-plan-price">' + (plan.price || '') + '<span>' + (plan.period || '/mo') + '</span></div>' +
                '<p class="wp-plan-desc">' + (plan.tagline || plan.description || '') + '</p>' +
                (features ? '<ul class="wp-plan-features">' + features + '</ul>' : '') +
                '<a href="/contact-us.html" class="' + btnClass + '">' + (plan.ctaText || plan.ctaLabel || 'Get Started') + ' &rarr;</a>' +
                '</div>';
        }).join('');
    }

    function populateRelatedHosting(cards) {
        if (!cards || !cards.length) return;
        var grid = document.querySelector('#wp-related .wp-related-grid');
        if (!grid) return;

        var sorted = cards.slice().sort(function (a, b) {
            return (a.order || 0) - (b.order || 0);
        });

        grid.innerHTML = sorted.map(function (card) {
            var parts = (card.desc || '').split('||');
            var tagline = parts[0] ? parts[0].trim() : '';
            var description = parts[1] ? parts[1].trim() : '';
            var ctaText = 'Explore ' + (card.title || 'More');
            var ctaHref = (card.link || '#').trim();

            return '<div class="wp-related-card">' +
                '<h3 class="wp-related-card-title">' + (card.title || '') + '</h3>' +
                (tagline ? '<p class="wp-related-tagline">' + tagline + '</p>' : '') +
                (description ? '<p class="wp-related-desc">' + description + '</p>' : '') +
                '<a href="' + ctaHref + '" class="wp-related-cta">' + ctaText + ' &rarr;</a>' +
                '</div>';
        }).join('');
    }

    function populateFaqContact(page) {
        var card = document.querySelector('.faq-contact-card');
        if (!card) return;

        if (page.faqContactTitle) setHTML(card, '.faq-contact-title', page.faqContactTitle);
        if (page.faqContactDesc) setHTML(card, '.faq-contact-desc', page.faqContactDesc);

        if (page.faqContactBtnLabel) {
            var btn = card.querySelector('.faq-contact-btn');
            if (btn) {
                var svg = btn.querySelector('svg');
                btn.textContent = page.faqContactBtnLabel + ' ';
                if (svg) btn.appendChild(svg);
                if (page.faqContactBtnUrl) btn.setAttribute('href', page.faqContactBtnUrl);
            }
        }
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getWordpressHostingPage();
            var page = response.data;

            // 1. SEO
            populateSEO(page.seo);

            // 2. Hero
            populateHero('.hero-section', {
                eyebrow: page.heroEyebrow,
                eyebrowSelector: '.wp-eyebrow',
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
                heroImage: page.heroImage
            });

            // 3. Hero badges
            if (page.heroTopBadge) setHTML(document, '.wp-top-badge', page.heroTopBadge);
            if (page.heroStatusTitle) setText(document, '.wp-bt', page.heroStatusTitle);
            if (page.heroStatusSubtitle) setText(document, '.wp-bs', page.heroStatusSubtitle);

            // 4. Why-us pillars
            populateIconCards('.why-us .why-grid', page.pillars, 'why-card');

            // 5. Plans
            populateSectionHeader('#wp-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // 6. Who We Are
            if (page.aboutTitle) setText(document, '#wp-about-title', page.aboutTitle);
            if (page.aboutDesc) setHTML(document, '#wp-about-desc', page.aboutDesc);
            if (page.aboutImage && page.aboutImage.image && page.aboutImage.image.url) {
                var aboutImg = document.querySelector('#wp-about-img');
                if (aboutImg) {
                    var _base = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : 'http://localhost:1337');
                    var _m = page.aboutImage.image;
                    var _url = (_m.formats && (_m.formats.large || _m.formats.medium || _m.formats.small)
                        ? (_m.formats.large || _m.formats.medium || _m.formats.small).url
                        : _m.url) || '';
                    if (_url && !_url.startsWith('http')) _url = _base + _url;
                    if (_url) { aboutImg.src = _url; aboutImg.alt = _m.alternativeText || ''; }
                }
            }

            // 7. Everything Your WP Needs (features — 12 cards)
            populateSectionHeader('#features', page.featuresLabel, page.featuresTitle, page.featuresSubtitle);
            populateIconCards('#features .cloud-power-grid', page.features, 'cloud-power-card');

            // 8. Why You Should Consider WP Hosting (performanceCards — 6 cards)
            populateSectionHeader('#wp-why-consider', page.performanceLabel, page.performanceTitle, page.performanceSubtitle);
            populateIconCards('#wp-why-consider .wp-why-consider-grid', page.performanceCards, 'cloud-use-card');

            // 9. Packed with Powerful Features
            populateSectionHeader('#wp-packed', page.packedLabel, page.packedTitle, page.packedSubtitle);
            populateIconCards('#wp-packed .wp-packed-grid', page.packedCards, 'cloud-power-card');

            // 10. Related Hosting Options
            populateSectionHeader('#wp-related', page.relatedLabel, page.relatedTitle, page.relatedSubtitle);
            populateRelatedHosting(page.relatedCards);

            // 11. Fast WP Hosting (text only)
            if (page.fastTitle) setText(document, '#wp-fast-title', page.fastTitle);
            if (page.fastDesc) setHTML(document, '#wp-fast-desc', page.fastDesc);

            // 12. One Control Center (managedFeatures — 7 cards)
            populateSectionHeader('#wp-control', page.managedLabel, page.managedTitle, page.managedSubtitle);
            populateIconCards('#wp-control .wp-control-grid', page.managedFeatures, 'cloud-power-card');

            // 13. Why Choose ICSDC WP Hosting
            populateSectionHeader('#wp-why-choose', page.whyChooseLabel, page.whyChooseTitle, page.whyChooseSubtitle);
            populateIconCards('#wp-why-choose .wp-why-choose-grid', page.whyChooseCards, 'cloud-power-card');

            // 14. Testimonials
            if (page.testimonialTitle) setText(document, '#wp-testi-heading', page.testimonialTitle);
            initTestimonials(page.testimonials);

            // 15. FAQ
            if (page.faqTitle) setText(document, '#wp-faq-heading', page.faqTitle);
            initFAQ(page.faq);

            // 16. FAQ contact card
            populateFaqContact(page);

            // 17. CTA Band (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

        } catch (err) {
            console.error('[wordpress-hosting] Failed to load CMS data:', err);
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
