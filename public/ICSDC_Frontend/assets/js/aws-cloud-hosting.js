import { getAwsCloudHostingPage } from './services/contentService.js';
import { inlineRichText } from './utils/cms-helpers.js';

import {
    populateSEO,
    populateHero,
    populateIconCards,
    populateSectionHeader,
    populateCtaBand,
    populateComparisonTable,
    hidePageLoader,
    markActiveNavLink,
    setText,
    setHTML,
    initFAQ,
    initTestimonials
} from './utils/cms-helpers.js';

(function () {

    // Resolve a common.image component → absolute URL (env-aware via STRAPI_URL).
    function imgUrl(comp) {
        if (!comp || !comp.image || !comp.image.url) return '';
        var base = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : '');
        var u = comp.image.url;
        return /^https?:\/\//.test(u) ? u : base + u;
    }

    // ── Pricing plans (3-col cards) ──────────────────────────────
    function populatePlans(plans) {
        var grid = document.querySelector('#aws-plans .aws-plans-grid');
        if (!grid || !plans || !plans.length) return;
        var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isFeatured || plan.popular || false;
            var featuredClass = isFeatured ? ' aws-plan-featured' : '';
            var badgeLabel = plan.badge || (isFeatured ? 'Most Popular' : '');
            var badgeHtml = badgeLabel ? '<div class="aws-plan-badge">' + badgeLabel + '</div>' : '';
            var currency = plan.currency || '₹';
            var period = plan.period || 'mo';
            var priceHtml = plan.price
                ? '<div class="aws-plan-price">' + currency + plan.price + ' <span>/' + period + '</span></div>'
                : '';
            var taglineHtml = plan.tagline ? '<div class="aws-plan-tagline">' + plan.tagline + '</div>' : '';
            var featuresArr = plan.features || [];
            var featuresHtml = featuresArr.length
                ? '<ul class="aws-plan-features">' +
                featuresArr.map(function (f) {
                    return '<li>' + (f.label || f.text || f.name || f) + '</li>';
                }).join('') + '</ul>'
                : '';
            var ctaText = plan.ctaText || 'Get Started';
            var btnClass = isFeatured ? 'aws-plan-btn-featured' : 'aws-plan-btn';
            return '<div class="aws-plan-card' + featuredClass + '">' +
                badgeHtml +
                '<div class="aws-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
                priceHtml + taglineHtml + featuresHtml +
                '<a href="/contact-us" class="' + btnClass + '">' + ctaText + ' </a>' +
                '</div>';
        }).join('');
    }

    // ── Dedicated-hardware cross-sell band ───────────────────────
    function populateDedicated(page) {
        if (page.dedicatedTitle) setText(document, '#aws-dedicated-title', page.dedicatedTitle);
        if (page.dedicatedDesc) setText(document, '#aws-dedicated-desc', page.dedicatedDesc);
        var cta = document.getElementById('aws-dedicated-cta');
        if (cta) {
            if (page.dedicatedCtaText) cta.innerHTML = page.dedicatedCtaText + ' ';
            if (page.dedicatedCtaLink) cta.setAttribute('href', page.dedicatedCtaLink);
        }
        var url = imgUrl(page.dedicatedImage);
        if (url) {
            var img = document.getElementById('aws-dedicated-img');
            if (img) { img.src = url; img.style.display = ''; }
        }
    }

    // ── 4 layout feature blocks (title + desc + CTA each) ────────
    function populateFeatureBlocks(page) {
        if (page.featureBlocksTitle) setText(document, '#aws-blocks .title', page.featureBlocksTitle);
        var grid = document.getElementById('aws-blocks-grid');
        if (!grid || !page.featureBlocks || !page.featureBlocks.length) return;
        var arrow = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
        grid.innerHTML = page.featureBlocks.map(function (b) {
            var icon = b.icon ? 'fa-solid fa-' + b.icon : 'fa-solid fa-bolt';
            var ctaHtml = b.ctaText
                ? '<a href="' + (b.ctaLink || '/contact-us') + '" class="aws-block-cta">' + b.ctaText + ' ' + arrow + '</a>'
                : '';
            return '<div class="aws-block-card">' +
                '<div class="aws-block-icon"><i class="' + icon + '" aria-hidden="true"></i></div>' +
                '<h3 class="aws-block-title">' + (b.title || '') + '</h3>' +
                '<p class="aws-block-desc">' + inlineRichText(b.desc || b.description || '') + '</p>' +
                ctaHtml +
                '</div>';
        }).join('');
    }

    // ── Why Choose ICSDC for AWS (image + 3 paragraphs) ──────────
    function populateWhyChoose(page) {
        if (page.whyChooseTitle) setText(document, '#aws-why-title', page.whyChooseTitle);
        var parasEl = document.getElementById('aws-why-paras');
        if (parasEl && page.whyChooseParas && page.whyChooseParas.length) {
            parasEl.innerHTML = page.whyChooseParas.map(function (p) {
                return '<p>' + p + '</p>';
            }).join('');
        }
        var url = imgUrl(page.whyChooseImage);
        if (url) {
            var img = document.getElementById('aws-why-img');
            if (img) { img.src = url; img.style.display = ''; }
        }
    }

    async function init() {
        markActiveNavLink();

        try {
            var response = await getAwsCloudHostingPage();
            var page = response.data;

            populateSEO(page.seo);

            populateHero(document.querySelector('.hero-section'), {
                eyebrow: page.heroEyebrow,
                title: page.heroTitle,
                subtitle: page.heroSubtitle,
                description: page.heroDescription,
                ctaPrimary: page.heroCtaPrimary,
                ctaSecondary: page.heroCtaSecondary,
                heroImage: page.heroImage
            });

            // 4 pillars
            populateIconCards('.why-grid', page.pillars, 'why-card');

            // Pricing
            populateSectionHeader('#aws-plans', page.plansLabel, page.plansTitle, page.plansSubtitle);
            populatePlans(page.plans);

            // Who We Are (band: text left, checklist right)
            if (page.aboutTitle) setText(document, '#aws-about-title', page.aboutTitle);
            if (page.aboutDescription) setText(document, '#aws-about-desc', page.aboutDescription);
            var aboutCta = document.getElementById('aws-about-cta');
            if (aboutCta && page.aboutLink) {
                if (page.aboutLink.text) aboutCta.innerHTML = page.aboutLink.text + ' ';
                if (page.aboutLink.link) aboutCta.setAttribute('href', page.aboutLink.link);
            }
            if (page.aboutItems && page.aboutItems.length) {
                var aboutGrid = document.getElementById('aws-about-items');
                if (aboutGrid) {
                    aboutGrid.innerHTML = page.aboutItems.map(function (item) {
                        return '<li><span class="aws-whoweare-check"><i class="fa-solid fa-check" aria-hidden="true"></i></span>' +
                            (item.title || '') + '</li>';
                    }).join('');
                }
            }

            // Core Strengths (12)
            populateSectionHeader('#strengths', page.strengthsLabel, page.strengthsTitle, page.strengthsSubtitle);
            populateIconCards('#strengths .cloud-power-grid', page.strengths, 'cloud-power-card');

            // Comparison
            populateSectionHeader('#comparison', page.comparisonLabel, page.comparisonTitle, page.comparisonSubtitle);
            populateComparisonTable('.aws-comparison', page.comparisonColumns, page.comparisonRows);

            // CTA band 1
            populateCtaBand('.cloud-cta-band:not(.cloud-cta-dark)', page.ctaBand1);

            // Dedicated hardware cross-sell
            populateDedicated(page);

            // Core AWS features (10)
            populateSectionHeader('#services', page.servicesLabel, page.servicesTitle, page.servicesSubtitle);
            populateIconCards('#services .cloud-use-grid', page.services, 'cloud-use-card');

            // 4 layout feature blocks
            populateSectionHeader('#aws-blocks', page.featureBlocksLabel, page.featureBlocksTitle, null);
            populateFeatureBlocks(page);

            // Why Choose ICSDC for AWS
            populateWhyChoose(page);

            // CTA band 2 (dark)
            populateCtaBand('.cloud-cta-dark', page.ctaBand2);

            // Testimonials
            if (page.testimonialTitle) setText(document, '#testi-heading', page.testimonialTitle);
            if (page.testimonials && page.testimonials.length) {
                initTestimonials(page.testimonials);
            } else {
                var testiSection = document.querySelector('.testi-section');
                if (testiSection) testiSection.style.display = 'none';
            }

            // FAQ
            if (page.faqTitle) setText(document, '#faq-heading', page.faqTitle);
            initFAQ(page.faq);
        } catch (err) {
            console.error('[aws-cloud-hosting] CMS load failed:', err);
        }
        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
